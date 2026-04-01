import { TRPCError } from "@trpc/server";
import axios from "axios";
import { z } from "zod";
import {
  createPayment,
  getItemById,
  getMyPayments,
  getPaymentByCheckoutId,
  getPaymentById,
  updatePaymentByCheckoutId,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

// ─── M-Pesa helpers ───────────────────────────────────────────────────────────

function getMpesaConfig() {
  return {
    consumerKey: process.env.MPESA_CONSUMER_KEY ?? "",
    consumerSecret: process.env.MPESA_CONSUMER_SECRET ?? "",
    shortCode: process.env.MPESA_SHORTCODE ?? "174379",
    passkey: process.env.MPESA_PASSKEY ?? "",
    callbackUrl: process.env.MPESA_CALLBACK_URL ?? "",
    environment: process.env.MPESA_ENVIRONMENT ?? "sandbox",
  };
}

function getMpesaBaseUrl(env: string) {
  return env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

async function getMpesaAccessToken(): Promise<string> {
  const cfg = getMpesaConfig();
  const baseUrl = getMpesaBaseUrl(cfg.environment);
  const credentials = Buffer.from(`${cfg.consumerKey}:${cfg.consumerSecret}`).toString("base64");
  const response = await axios.get(
    `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );
  return response.data.access_token;
}

function getMpesaTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
}

function getMpesaPassword(shortCode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const paymentsRouter = router({
  initiateMpesa: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
        phoneNumber: z.string().min(10).max(13),
        amount: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await getItemById(input.itemId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });

      const cfg = getMpesaConfig();

      // If M-Pesa is not configured, create a pending payment record for demo
      if (!cfg.consumerKey || !cfg.passkey) {
        const fakeCheckoutId = `DEMO_${Date.now()}`;
        await createPayment({
          userId: ctx.user.id,
          itemId: input.itemId,
          phoneNumber: input.phoneNumber,
          amount: String(input.amount),
          checkoutRequestId: fakeCheckoutId,
          merchantRequestId: `DEMO_MR_${Date.now()}`,
          status: "pending",
          resultDesc: "Demo mode - M-Pesa not configured",
        });
        return {
          success: true,
          checkoutRequestId: fakeCheckoutId,
          message: "Demo payment initiated. Configure M-Pesa keys for live payments.",
        };
      }

      try {
        const accessToken = await getMpesaAccessToken();
        const timestamp = getMpesaTimestamp();
        const password = getMpesaPassword(cfg.shortCode, cfg.passkey, timestamp);
        const baseUrl = getMpesaBaseUrl(cfg.environment);

        // Normalize phone: 07XXXXXXXX → 2547XXXXXXXX
        let phone = input.phoneNumber.replace(/\s+/g, "");
        if (phone.startsWith("0")) phone = "254" + phone.slice(1);
        if (phone.startsWith("+")) phone = phone.slice(1);

        const stkResponse = await axios.post(
          `${baseUrl}/mpesa/stkpush/v1/processrequest`,
          {
            BusinessShortCode: cfg.shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: Math.ceil(input.amount),
            PartyA: phone,
            PartyB: cfg.shortCode,
            PhoneNumber: phone,
            CallBackURL: cfg.callbackUrl,
            AccountReference: `ARTBID-${input.itemId}`,
            TransactionDesc: `Payment for ${item.title}`,
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const { CheckoutRequestID, MerchantRequestID } = stkResponse.data;

        await createPayment({
          userId: ctx.user.id,
          itemId: input.itemId,
          phoneNumber: phone,
          amount: String(input.amount),
          checkoutRequestId: CheckoutRequestID,
          merchantRequestId: MerchantRequestID,
          status: "pending",
        });

        return {
          success: true,
          checkoutRequestId: CheckoutRequestID,
          message: "STK Push sent. Enter your M-Pesa PIN to complete payment.",
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "M-Pesa request failed";
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
      }
    }),

  // Webhook called by Safaricom after payment
  mpesaCallback: publicProcedure
    .input(
      z.object({
        Body: z.object({
          stkCallback: z.object({
            MerchantRequestID: z.string(),
            CheckoutRequestID: z.string(),
            ResultCode: z.number(),
            ResultDesc: z.string(),
            CallbackMetadata: z
              .object({
                Item: z.array(z.object({ Name: z.string(), Value: z.unknown() })),
              })
              .optional(),
          }),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const cb = input.Body.stkCallback;
      const isSuccess = cb.ResultCode === 0;

      let mpesaCode: string | undefined;
      if (isSuccess && cb.CallbackMetadata) {
        const mpesaItem = cb.CallbackMetadata.Item.find((i) => i.Name === "MpesaReceiptNumber");
        mpesaCode = String(mpesaItem?.Value ?? "");
      }

      await updatePaymentByCheckoutId(cb.CheckoutRequestID, {
        status: isSuccess ? "completed" : "failed",
        mpesaCode: mpesaCode,
        resultDesc: cb.ResultDesc,
      });

      return { ResultCode: 0, ResultDesc: "Accepted" };
    }),

  checkStatus: protectedProcedure
    .input(z.object({ checkoutRequestId: z.string() }))
    .query(async ({ input }) => {
      const payment = await getPaymentByCheckoutId(input.checkoutRequestId);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
      return payment;
    }),

  myPayments: protectedProcedure.query(({ ctx }) => getMyPayments(ctx.user.id)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const payment = await getPaymentById(input.id);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
      if (payment.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return payment;
    }),

  // Simulate payment completion for demo
  simulateComplete: protectedProcedure
    .input(z.object({ checkoutRequestId: z.string() }))
    .mutation(async ({ input }) => {
      await updatePaymentByCheckoutId(input.checkoutRequestId, {
        status: "completed",
        mpesaCode: `SIM${Date.now().toString().slice(-8)}`,
        resultDesc: "Simulated payment success",
      });
      return { success: true };
    }),
});

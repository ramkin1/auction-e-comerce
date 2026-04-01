import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  banUser,
  createModerationReport,
  deleteItem,
  getAllAdminSettings,
  getAllItems,
  getAllPayments,
  getAllUsers,
  getAdminAnalytics,
  getAdminSetting,
  getItemById,
  getModerationReports,
  setAdminSetting,
  unbanUser,
  updateItem,
  updateModerationStatus,
  updatePaymentStatus,
  updateUserRole,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

// Admin-only middleware
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ─── Listing Management ────────────────────────────────────────────────────
  items: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      return getAllItems(input.limit, offset);
    }),

  updateItemStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["active", "ended", "sold", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      const item = await getItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      await updateItem(input.id, { status: input.status });
      return { success: true };
    }),

  deleteItem: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const item = await getItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      await deleteItem(input.id);
      return { success: true };
    }),

  // ─── User Management ───────────────────────────────────────────────────────
  users: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      return getAllUsers(input.limit, offset);
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input }) => {
      await updateUserRole(input.userId, input.role);
      return { success: true };
    }),

  // ─── User Moderation ──────────────────────────────────────────────────────
  banUser: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string() }))
    .mutation(async ({ input }) => {
      await banUser(input.userId, input.reason);
      return { success: true };
    }),

  unbanUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      await unbanUser(input.userId);
      return { success: true };
    }),

  // ─── Payment Management ────────────────────────────────────────────────────
  payments: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      return getAllPayments(input.limit, offset);
    }),

  updatePaymentStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "completed", "failed"]),
      })
    )
    .mutation(async ({ input }) => {
      await updatePaymentStatus(input.id, input.status);
      return { success: true };
    }),

  refundPayment: adminProcedure
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ input }) => {
      await updatePaymentStatus(input.paymentId, "failed");
      return { success: true, message: "Payment marked for refund" };
    }),

  // ─── Analytics ─────────────────────────────────────────────────────────────
  analytics: adminProcedure.query(async () => {
    return getAdminAnalytics();
  }),

  // ─── Moderation Reports ────────────────────────────────────────────────────
  moderationReports: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "reviewed", "resolved", "dismissed"]).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      return getModerationReports(input.status, input.limit, offset);
    }),

  updateModerationReport: adminProcedure
    .input(
      z.object({
        reportId: z.number(),
        status: z.enum(["pending", "reviewed", "resolved", "dismissed"]),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await updateModerationStatus(input.reportId, input.status, input.adminNotes);
      return { success: true };
    }),

  // ─── Settings ──────────────────────────────────────────────────────────────
  settings: adminProcedure.query(async () => {
    const allSettings = await getAllAdminSettings();
    const settingsMap: Record<string, string> = {};
    allSettings.forEach((s: any) => {
      settingsMap[s.key] = s.value;
    });

    return {
      minBidIncrement: Number(settingsMap.minBidIncrement ?? 100),
      auctionDurationDays: Number(settingsMap.auctionDurationDays ?? 7),
      platformFeePercent: Number(settingsMap.platformFeePercent ?? 5),
      maxImageSizeKb: Number(settingsMap.maxImageSizeKb ?? 5000),
    };
  }),

  updateSettings: adminProcedure
    .input(
      z.object({
        minBidIncrement: z.number().optional(),
        auctionDurationDays: z.number().optional(),
        platformFeePercent: z.number().optional(),
        maxImageSizeKb: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.minBidIncrement !== undefined) {
        await setAdminSetting("minBidIncrement", String(input.minBidIncrement));
      }
      if (input.auctionDurationDays !== undefined) {
        await setAdminSetting("auctionDurationDays", String(input.auctionDurationDays));
      }
      if (input.platformFeePercent !== undefined) {
        await setAdminSetting("platformFeePercent", String(input.platformFeePercent));
      }
      if (input.maxImageSizeKb !== undefined) {
        await setAdminSetting("maxImageSizeKb", String(input.maxImageSizeKb));
      }
      return { success: true };
    }),
});

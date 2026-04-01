import { z } from "zod";
import { invokeLLM, type Message as LLMMessage } from "../_core/llm";
import { getItemById } from "../db";
import { publicProcedure, router } from "../_core/trpc";

const SYSTEM_PROMPT = `You are ArtBid Assistant, an expert AI helper for the ArtBid online auction platform specializing in artwork and antiques.

You help users with:
- Understanding the bidding process (how to place bids, minimum bid increments, outbid notifications)
- M-Pesa payment guidance (STK Push flow, entering PIN, payment confirmation)
- Auction rules (auction end times, winning conditions, payment deadlines)
- Item information (artwork, antiques, jewelry, furniture, collectibles)
- Account and order tracking questions
- Seller guidance (listing items, uploading authenticity documents)

Key platform rules:
- Bids must be higher than the current price
- Payment must be completed within 24 hours of winning an auction
- M-Pesa STK Push is sent to the registered phone number
- Sellers can upload certificates of authenticity, appraisals, and provenance records
- Auctions end at the specified end time; no extensions unless the platform admin intervenes
- All prices are in Kenyan Shillings (KES)

Be concise, friendly, and professional. If asked about specific items, provide helpful guidance based on the context provided.`;

export const chatbotRouter = router({
  message: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(1000),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .max(20)
          .default([]),
        itemId: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let contextNote = "";

      // Inject item context if provided
      if (input.itemId) {
        try {
          const item = await getItemById(input.itemId);
          if (item) {
            const timeLeft = item.endTime - Date.now();
            const hoursLeft = Math.max(0, Math.floor(timeLeft / 3600000));
            contextNote = `\n\nCurrent item context: "${item.title}" (${item.category}), Current price: KES ${parseFloat(String(item.currentPrice)).toLocaleString()}, Bids: ${item.bidCount}, Time remaining: ${hoursLeft > 0 ? `${hoursLeft} hours` : "Ended"}.`;
          }
        } catch {
          // ignore
        }
      }

      const messages: LLMMessage[] = [
        { role: "system", content: SYSTEM_PROMPT + contextNote },
        ...input.history.map((h) => ({ role: h.role as "user" | "assistant", content: h.content })),
        { role: "user", content: input.message },
      ];

      const response = await invokeLLM({ messages });
      const rawContent = response.choices?.[0]?.message?.content;
      const reply = typeof rawContent === "string"
        ? rawContent
        : Array.isArray(rawContent)
        ? rawContent.map((c) => ("text" in c ? c.text : "")).join("")
        : "I'm sorry, I couldn't process your request. Please try again.";

      return { reply };
    }),

  // Quick FAQ answers (rule-based fallback)
  faq: publicProcedure.query(() => {
    return [
      {
        question: "How do I place a bid?",
        answer:
          "Navigate to any active auction item, enter your bid amount (must be higher than the current price), and click 'Place Bid'. You'll receive a confirmation notification.",
      },
      {
        question: "How do I pay via M-Pesa?",
        answer:
          "After winning an auction, go to your dashboard and click 'Pay Now'. Enter your M-Pesa phone number and an STK Push will be sent to your phone. Enter your PIN to complete payment.",
      },
      {
        question: "What happens if I'm outbid?",
        answer:
          "You'll receive a notification when someone places a higher bid. You can then place a new bid to stay in the auction.",
      },
      {
        question: "How long do I have to pay after winning?",
        answer: "You have 24 hours after the auction ends to complete payment via M-Pesa.",
      },
      {
        question: "How do I verify an item's authenticity?",
        answer:
          "Sellers can upload certificates of authenticity, appraisal documents, and provenance records. Look for the 'Documents' section on the item page.",
      },
    ];
  }),
});

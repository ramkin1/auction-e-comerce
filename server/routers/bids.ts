import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getBidsByItem,
  getHighestBidder,
  getItemById,
  getMyBids,
  getPreviousHighBidder,
  getUserById,
  placeBid,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const bidsRouter = router({
  getByItem: publicProcedure
    .input(z.object({ itemId: z.number() }))
    .query(({ input }) => getBidsByItem(input.itemId)),

  myBids: protectedProcedure.query(({ ctx }) => getMyBids(ctx.user.id)),

  place: protectedProcedure
    .input(
      z.object({
        itemId: z.number(),
        bidAmount: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await getItemById(input.itemId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      if (item.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Auction is not active" });
      }
      if (Date.now() > item.endTime) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Auction has ended" });
      }
      const currentPrice = parseFloat(String(item.currentPrice));
      if (input.bidAmount <= currentPrice) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Bid must be higher than current price of KES ${currentPrice.toLocaleString()}`,
        });
      }
      if (item.sellerId === ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot bid on your own item" });
      }

      // Get previous highest bidder before placing new bid
      const prevHighBidder = await getPreviousHighBidder(input.itemId, ctx.user.id);

      await placeBid({
        userId: ctx.user.id,
        itemId: input.itemId,
        bidAmount: String(input.bidAmount),
      });

      // Notify previous highest bidder they've been outbid
      if (prevHighBidder) {
        const prevUser = await getUserById(prevHighBidder.userId);
        if (prevUser) {
          // Use owner notification as a proxy for user notification
          await notifyOwner({
            title: `Outbid Alert: ${item.title}`,
            content: `User ${prevUser.name ?? prevUser.email} was outbid on "${item.title}". New bid: KES ${input.bidAmount.toLocaleString()}`,
          }).catch(() => {});
        }
      }

      return { success: true };
    }),
});

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createItem,
  deleteItem,
  getActiveItems,
  getItemById,
  getItemsBySeller,
  getItems,
  getWatchersForItem,
  updateItem,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const itemsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        status: z.string().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(12),
      })
    )
    .query(({ input }) => getItems(input)),

  featured: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(6) }))
    .query(({ input }) => getActiveItems(input.limit)),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await getItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      return item;
    }),

  mySelling: protectedProcedure.query(({ ctx }) => getItemsBySeller(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(255),
        description: z.string().optional(),
        category: z.enum(["artwork", "antique", "jewelry", "furniture", "collectible", "other"]),
        startingPrice: z.number().positive(),
        imageUrl: z.string().url().optional(),
        endTime: z.number().positive(), // UTC ms timestamp
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createItem({
        sellerId: ctx.user.id,
        title: input.title,
        description: input.description,
        category: input.category,
        startingPrice: String(input.startingPrice),
        currentPrice: String(input.startingPrice),
        imageUrl: input.imageUrl,
        endTime: input.endTime,
        status: "active",
      });
      return { success: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(3).max(255).optional(),
        description: z.string().optional(),
        category: z
          .enum(["artwork", "antique", "jewelry", "furniture", "collectible", "other"])
          .optional(),
        imageUrl: z.string().url().optional(),
        endTime: z.number().positive().optional(),
        status: z.enum(["active", "ended", "sold", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await getItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      if (item.sellerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { id, ...data } = input;
      await updateItem(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const item = await getItemById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Item not found" });
      if (item.sellerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to delete this item" });
      }
      if (item.bidCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete an item that has received bids",
        });
      }
      await deleteItem(input.id);
      return { success: true };
    }),

  notifyEndingSoon: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ input }) => {
      const item = await getItemById(input.itemId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });

      const watchers = await getWatchersForItem(input.itemId);
      const endDate = new Date(item.endTime).toLocaleString();

      // Notify the platform owner who can relay to users
      await notifyOwner({
        title: `⏰ Auction Ending Soon: ${item.title}`,
        content: `The auction for "${item.title}" ends at ${endDate}. Current price: KES ${item.currentPrice}. Watchers: ${watchers.length}.`,
      });

      return { success: true, watcherCount: watchers.length };
    }),
});

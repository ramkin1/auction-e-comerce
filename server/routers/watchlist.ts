import { z } from "zod";
import {
  addToWatchlist,
  getDashboardSummary,
  getMyWatchlist,
  isWatching,
  removeFromWatchlist,
} from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const watchlistRouter = router({
  myWatchlist: protectedProcedure.query(({ ctx }) => getMyWatchlist(ctx.user.id)),

  isWatching: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .query(({ ctx, input }) => isWatching(ctx.user.id, input.itemId)),

  add: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(({ ctx, input }) => addToWatchlist(ctx.user.id, input.itemId)),

  remove: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(({ ctx, input }) => removeFromWatchlist(ctx.user.id, input.itemId)),

  dashboardSummary: protectedProcedure.query(({ ctx }) => getDashboardSummary(ctx.user.id)),
});

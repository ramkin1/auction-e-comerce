import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { bidsRouter } from "./routers/bids";
import { chatbotRouter } from "./routers/chatbot";
import { documentsRouter } from "./routers/documents";
import { itemsRouter } from "./routers/items";
import { paymentsRouter } from "./routers/payments";
import { watchlistRouter } from "./routers/watchlist";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  items: itemsRouter,
  bids: bidsRouter,
  payments: paymentsRouter,
  chatbot: chatbotRouter,
  documents: documentsRouter,
  watchlist: watchlistRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;

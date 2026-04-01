import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getItems: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getItemById: vi.fn().mockResolvedValue(null),
  getActiveItems: vi.fn().mockResolvedValue([]),
  getItemsBySeller: vi.fn().mockResolvedValue([]),
  createItem: vi.fn().mockResolvedValue({}),
  updateItem: vi.fn().mockResolvedValue({}),
  getBidsByItem: vi.fn().mockResolvedValue([]),
  getMyBids: vi.fn().mockResolvedValue([]),
  placeBid: vi.fn().mockResolvedValue({}),
  getHighestBidder: vi.fn().mockResolvedValue(null),
  getPreviousHighBidder: vi.fn().mockResolvedValue(null),
  getUserById: vi.fn().mockResolvedValue(null),
  createPayment: vi.fn().mockResolvedValue({}),
  getMyPayments: vi.fn().mockResolvedValue([]),
  getPaymentByCheckoutId: vi.fn().mockResolvedValue(null),
  getPaymentById: vi.fn().mockResolvedValue(null),
  updatePaymentByCheckoutId: vi.fn().mockResolvedValue({}),
  getMyWatchlist: vi.fn().mockResolvedValue([]),
  isWatching: vi.fn().mockResolvedValue(false),
  addToWatchlist: vi.fn().mockResolvedValue({}),
  removeFromWatchlist: vi.fn().mockResolvedValue({}),
  getDashboardSummary: vi.fn().mockResolvedValue({
    activeBids: 0,
    watchlistCount: 0,
    completedPayments: 0,
    wonItemsCount: 0,
  }),
  getDocumentsByItem: vi.fn().mockResolvedValue([]),
  createDocument: vi.fn().mockResolvedValue({}),
  deleteDocument: vi.fn().mockResolvedValue({}),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(null),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/doc.pdf", key: "doc.pdf" }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "Hello! I can help you with bidding." } }],
  }),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makeAuthCtx(overrides: Partial<NonNullable<TrpcContext["user"]>> = {}): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "user-1",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      ...overrides,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.auth.me();
    expect(result?.id).toBe(1);
    expect(result?.email).toBe("test@example.com");
  });

  it("logout clears session cookie", async () => {
    const ctx = makeAuthCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});

// ─── Items tests ──────────────────────────────────────────────────────────────
describe("items", () => {
  it("list returns empty results by default", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.items.list({});
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("featured returns empty array by default", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.items.featured({ limit: 6 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getById throws NOT_FOUND when item missing", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.items.getById({ id: 999 })).rejects.toThrow("Item not found");
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.items.create({
        title: "Test Item",
        category: "artwork",
        startingPrice: 1000,
        endTime: Date.now() + 86400000,
      })
    ).rejects.toThrow();
  });

  it("create succeeds for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.items.create({
      title: "Test Artwork",
      category: "artwork",
      startingPrice: 5000,
      endTime: Date.now() + 86400000,
    });
    expect(result.success).toBe(true);
  });
});

// ─── Bids tests ───────────────────────────────────────────────────────────────
describe("bids", () => {
  it("getByItem returns empty array for unknown item", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.bids.getByItem({ itemId: 999 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("place requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.bids.place({ itemId: 1, bidAmount: 1000 })
    ).rejects.toThrow();
  });

  it("place throws NOT_FOUND for missing item", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    await expect(
      caller.bids.place({ itemId: 999, bidAmount: 1000 })
    ).rejects.toThrow("Item not found");
  });

  it("myBids requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.bids.myBids()).rejects.toThrow();
  });

  it("myBids returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.bids.myBids();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Payments tests ───────────────────────────────────────────────────────────
describe("payments", () => {
  it("initiateMpesa requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.payments.initiateMpesa({ itemId: 1, phoneNumber: "0712345678", amount: 1000 })
    ).rejects.toThrow();
  });

  it("myPayments returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.payments.myPayments();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Chatbot tests ────────────────────────────────────────────────────────────
describe("chatbot", () => {
  it("message returns LLM reply", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.chatbot.message({
      message: "How do I place a bid?",
      history: [],
    });
    expect(result.reply).toBeTruthy();
    expect(typeof result.reply).toBe("string");
  });

  it("faq returns array of questions", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.chatbot.faq();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("question");
    expect(result[0]).toHaveProperty("answer");
  });
});

// ─── Watchlist tests ──────────────────────────────────────────────────────────
describe("watchlist", () => {
  it("myWatchlist requires authentication", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.watchlist.myWatchlist()).rejects.toThrow();
  });

  it("dashboardSummary returns stats for authenticated user", async () => {
    const caller = appRouter.createCaller(makeAuthCtx());
    const result = await caller.watchlist.dashboardSummary();
    expect(result).toHaveProperty("activeBids");
    expect(result).toHaveProperty("watchlistCount");
    expect(result).toHaveProperty("wonItemsCount");
  });
});

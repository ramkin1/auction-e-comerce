import { and, desc, eq, gt, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Bid,
  Document,
  InsertBid,
  InsertDocument,
  InsertItem,
  InsertPayment,
  InsertUser,
  Item,
  Payment,
  bids,
  documents,
  items,
  payments,
  users,
  watchlist,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

// ─── Items ────────────────────────────────────────────────────────────────────

export interface ItemsFilter {
  search?: string;
  category?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export async function getItems(filter: ItemsFilter = {}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const { search, category, status, minPrice, maxPrice, page = 1, limit = 12 } = filter;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        like(items.title, `%${search}%`),
        like(items.description, `%${search}%`)
      )
    );
  }
  if (category && category !== "all") {
    conditions.push(eq(items.category, category as Item["category"]));
  }
  if (status && status !== "all") {
    conditions.push(eq(items.status, status as Item["status"]));
  }
  if (minPrice !== undefined) {
    conditions.push(gte(items.currentPrice, String(minPrice)));
  }
  if (maxPrice !== undefined) {
    conditions.push(lte(items.currentPrice, String(maxPrice)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(items)
      .where(where)
      .orderBy(desc(items.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(where),
  ]);

  return { items: rows, total: Number(countResult[0]?.count ?? 0) };
}

export async function getItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
  return result[0];
}

export async function createItem(data: InsertItem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(items).values(data);
  return result[0];
}

export async function updateItem(id: number, data: Partial<InsertItem>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(items).set(data).where(eq(items.id, id));
}

export async function getActiveItems(limit = 6) {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  return db
    .select()
    .from(items)
    .where(and(eq(items.status, "active"), gt(items.endTime, now)))
    .orderBy(desc(items.createdAt))
    .limit(limit);
}

export async function getItemsBySeller(sellerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(items).where(eq(items.sellerId, sellerId)).orderBy(desc(items.createdAt));
}

// ─── Bids ─────────────────────────────────────────────────────────────────────

export async function placeBid(data: InsertBid) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(bids).values(data);
  // update item current price and bid count
  await db
    .update(items)
    .set({
      currentPrice: String(data.bidAmount),
      bidCount: sql`${items.bidCount} + 1`,
    })
    .where(eq(items.id, data.itemId!));
}

export async function getBidsByItem(itemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: bids.id,
      userId: bids.userId,
      itemId: bids.itemId,
      bidAmount: bids.bidAmount,
      createdAt: bids.createdAt,
      userName: users.name,
    })
    .from(bids)
    .leftJoin(users, eq(bids.userId, users.id))
    .where(eq(bids.itemId, itemId))
    .orderBy(desc(bids.createdAt));
}

export async function getMyBids(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: bids.id,
      userId: bids.userId,
      itemId: bids.itemId,
      bidAmount: bids.bidAmount,
      createdAt: bids.createdAt,
      itemTitle: items.title,
      itemImageUrl: items.imageUrl,
      itemEndTime: items.endTime,
      itemStatus: items.status,
      itemCurrentPrice: items.currentPrice,
    })
    .from(bids)
    .leftJoin(items, eq(bids.itemId, items.id))
    .where(eq(bids.userId, userId))
    .orderBy(desc(bids.createdAt));
}

export async function getHighestBidder(itemId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ userId: bids.userId, bidAmount: bids.bidAmount })
    .from(bids)
    .where(eq(bids.itemId, itemId))
    .orderBy(desc(bids.bidAmount))
    .limit(1);
  return result[0];
}

export async function getPreviousHighBidder(itemId: number, excludeUserId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ userId: bids.userId, bidAmount: bids.bidAmount })
    .from(bids)
    .where(and(eq(bids.itemId, itemId), sql`${bids.userId} != ${excludeUserId}`))
    .orderBy(desc(bids.bidAmount))
    .limit(1);
  return result[0];
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(payments).values(data);
  return result[0];
}

export async function updatePaymentByCheckoutId(
  checkoutRequestId: string,
  data: Partial<Payment>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(payments)
    .set(data as Record<string, unknown>)
    .where(eq(payments.checkoutRequestId, checkoutRequestId));
}

export async function getPaymentByCheckoutId(checkoutRequestId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(payments)
    .where(eq(payments.checkoutRequestId, checkoutRequestId))
    .limit(1);
  return result[0];
}

export async function getMyPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: payments.id,
      userId: payments.userId,
      itemId: payments.itemId,
      phoneNumber: payments.phoneNumber,
      amount: payments.amount,
      mpesaCode: payments.mpesaCode,
      status: payments.status,
      resultDesc: payments.resultDesc,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      itemTitle: items.title,
      itemImageUrl: items.imageUrl,
    })
    .from(payments)
    .leftJoin(items, eq(payments.itemId, items.id))
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}

export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return result[0];
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export async function addToWatchlist(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .insert(watchlist)
    .values({ userId, itemId })
    .onDuplicateKeyUpdate({ set: { userId } });
}

export async function removeFromWatchlist(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .delete(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.itemId, itemId)));
}

export async function getMyWatchlist(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: watchlist.id,
      itemId: watchlist.itemId,
      createdAt: watchlist.createdAt,
      itemTitle: items.title,
      itemImageUrl: items.imageUrl,
      itemCurrentPrice: items.currentPrice,
      itemEndTime: items.endTime,
      itemStatus: items.status,
      itemBidCount: items.bidCount,
    })
    .from(watchlist)
    .leftJoin(items, eq(watchlist.itemId, items.id))
    .where(eq(watchlist.userId, userId))
    .orderBy(desc(watchlist.createdAt));
}

export async function isWatching(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: watchlist.id })
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.itemId, itemId)))
    .limit(1);
  return result.length > 0;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(documents).values(data);
}

export async function getDocumentsByItem(itemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(documents)
    .where(eq(documents.itemId, itemId))
    .orderBy(desc(documents.createdAt));
}

export async function deleteDocument(id: number, uploaderId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .delete(documents)
    .where(and(eq(documents.id, id), eq(documents.uploaderId, uploaderId)));
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getDashboardSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const now = Date.now();

  const [myBidsCount, myWatchlistCount, myPaymentsCount, wonItems] = await Promise.all([
    db
      .select({ count: sql<number>`count(distinct ${bids.itemId})` })
      .from(bids)
      .where(eq(bids.userId, userId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(watchlist)
      .where(eq(watchlist.userId, userId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.status, "completed"))),
    // Won items: highest bidder on ended items
    db
      .select({ itemId: bids.itemId })
      .from(bids)
      .leftJoin(items, eq(bids.itemId, items.id))
      .where(
        and(
          eq(bids.userId, userId),
          eq(items.status, "ended"),
          sql`${bids.bidAmount} = ${items.currentPrice}`
        )
      ),
  ]);

  return {
    activeBids: Number(myBidsCount[0]?.count ?? 0),
    watchlistCount: Number(myWatchlistCount[0]?.count ?? 0),
    completedPayments: Number(myPaymentsCount[0]?.count ?? 0),
    wonItemsCount: wonItems.length,
  };
}

export async function deleteItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(items).where(eq(items.id, id));
}

// ─── Watchlist watchers for a specific item ───────────────────────────────────
export async function getWatchersForItem(itemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ userId: watchlist.userId, userName: users.name, userEmail: users.email })
    .from(watchlist)
    .leftJoin(users, eq(watchlist.userId, users.id))
    .where(eq(watchlist.itemId, itemId));
}

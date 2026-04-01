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


// ─── Admin Queries ────────────────────────────────────────────────────────────

export async function getAllItems(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: items.id,
        title: items.title,
        category: items.category,
        currentPrice: items.currentPrice,
        status: items.status,
        bidCount: items.bidCount,
        endTime: items.endTime,
        createdAt: items.createdAt,
        sellerName: users.name,
        sellerId: items.sellerId,
      })
      .from(items)
      .leftJoin(users, eq(items.sellerId, users.id))
      .orderBy(desc(items.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(items),
  ]);

  return { items: rows, total: Number(countResult[0]?.count ?? 0) };
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(users),
  ]);

  return { users: rows, total: Number(countResult[0]?.count ?? 0) };
}

export async function getAllPayments(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return { payments: [], total: 0 };

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: payments.id,
        userId: payments.userId,
        itemId: payments.itemId,
        amount: payments.amount,
        status: payments.status,
        mpesaCode: payments.mpesaCode,
        createdAt: payments.createdAt,
        userName: users.name,
        itemTitle: items.title,
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .leftJoin(items, eq(payments.itemId, items.id))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(payments),
  ]);

  return { payments: rows, total: Number(countResult[0]?.count ?? 0) };
}

export async function getAdminAnalytics() {
  const db = await getDb();
  if (!db) return null;

  const now = Date.now();

  const [
    totalItems,
    activeItems,
    totalUsers,
    totalBids,
    completedPayments,
    totalRevenue,
    topItems,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(items),
    db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(and(eq(items.status, "active"), gt(items.endTime, now))),
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(bids),
    db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(eq(payments.status, "completed")),
    db
      .select({ total: sql<number>`SUM(CAST(${payments.amount} AS UNSIGNED))` })
      .from(payments)
      .where(eq(payments.status, "completed")),
    db
      .select({
        id: items.id,
        title: items.title,
        bidCount: items.bidCount,
        currentPrice: items.currentPrice,
      })
      .from(items)
      .orderBy(desc(items.bidCount))
      .limit(5),
  ]);

  return {
    totalItems: Number(totalItems[0]?.count ?? 0),
    activeItems: Number(activeItems[0]?.count ?? 0),
    totalUsers: Number(totalUsers[0]?.count ?? 0),
    totalBids: Number(totalBids[0]?.count ?? 0),
    completedPayments: Number(completedPayments[0]?.count ?? 0),
    totalRevenue: Number(totalRevenue[0]?.total ?? 0),
    topItems,
  };
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function updatePaymentStatus(
  paymentId: number,
  status: "pending" | "completed" | "failed"
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(payments)
    .set({ status, updatedAt: new Date() })
    .where(eq(payments.id, paymentId));
}

// ─── Admin Settings ───────────────────────────────────────────────────────────

export async function getAdminSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.key, key))
    .limit(1);
  return result[0];
}

export async function setAdminSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .insert(adminSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}

export async function getAllAdminSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(adminSettings);
}

// ─── User Bans ────────────────────────────────────────────────────────────────

export async function banUser(userId: number, reason: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(users)
    .set({ isBanned: "true", banReason: reason })
    .where(eq(users.id, userId));
}

export async function unbanUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(users)
    .set({ isBanned: "false", banReason: null })
    .where(eq(users.id, userId));
}

// ─── Moderation ───────────────────────────────────────────────────────────────

export async function createModerationReport(data: InsertModeration) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(moderation).values(data);
}

export async function getModerationReports(
  status?: "pending" | "reviewed" | "resolved" | "dismissed",
  limit = 50,
  offset = 0
) {
  const db = await getDb();
  if (!db) return { reports: [], total: 0 };

  const conditions = status ? [eq(moderation.status, status)] : [];
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(moderation)
      .where(where)
      .orderBy(desc(moderation.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(moderation).where(where),
  ]);

  return { reports: rows, total: Number(countResult[0]?.count ?? 0) };
}

export async function updateModerationStatus(
  reportId: number,
  status: "pending" | "reviewed" | "resolved" | "dismissed",
  adminNotes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db
    .update(moderation)
    .set({ status, adminNotes, updatedAt: new Date() })
    .where(eq(moderation.id, reportId));
}

// Import the new types
import { adminSettings, moderation, InsertModeration } from "../drizzle/schema";

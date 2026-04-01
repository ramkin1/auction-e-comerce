import {
  bigint,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  isBanned: mysqlEnum("isBanned", ["false", "true"]).default("false").notNull(),
  banReason: text("banReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const items = mysqlTable("items", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["artwork", "antique", "jewelry", "furniture", "collectible", "other"])
    .default("other")
    .notNull(),
  startingPrice: decimal("startingPrice", { precision: 12, scale: 2 }).notNull(),
  currentPrice: decimal("currentPrice", { precision: 12, scale: 2 }).notNull(),
  imageUrl: text("imageUrl"),
  endTime: bigint("endTime", { mode: "number" }).notNull(), // UTC ms timestamp
  status: mysqlEnum("status", ["active", "ended", "sold", "cancelled"]).default("active").notNull(),
  bidCount: int("bidCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;

export const bids = mysqlTable("bids", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: int("itemId").notNull(),
  bidAmount: decimal("bidAmount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Bid = typeof bids.$inferSelect;
export type InsertBid = typeof bids.$inferInsert;

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: int("itemId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  mpesaCode: varchar("mpesaCode", { length: 64 }),
  checkoutRequestId: varchar("checkoutRequestId", { length: 128 }),
  merchantRequestId: varchar("merchantRequestId", { length: 128 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "cancelled"]).default("pending").notNull(),
  resultDesc: text("resultDesc"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

export const watchlist = mysqlTable("watchlist", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: int("itemId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Watchlist = typeof watchlist.$inferSelect;

export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull(),
  uploaderId: int("uploaderId").notNull(),
  docType: mysqlEnum("docType", ["certificate_of_authenticity", "appraisal", "provenance", "other"])
    .default("other")
    .notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

export const adminSettings = mysqlTable("adminSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;

export const moderation = mysqlTable("moderation", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["item", "document", "user_report"]).notNull(),
  targetId: int("targetId").notNull(), // item/document/user id
  reason: text("reason").notNull(),
  reportedBy: int("reportedBy"),
  status: mysqlEnum("status", ["pending", "reviewed", "resolved", "dismissed"]).default("pending").notNull(),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Moderation = typeof moderation.$inferSelect;
export type InsertModeration = typeof moderation.$inferInsert;

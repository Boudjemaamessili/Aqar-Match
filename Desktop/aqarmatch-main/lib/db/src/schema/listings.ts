import { pgTable, text, serial, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const LISTING_EXPIRY_DAYS = 30;
export const EXPIRY_WARN_DAYS = 3;

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  deal_type: text("deal_type").notNull(),
  wilaya: text("wilaya").notNull(),
  municipality: text("municipality").notNull(),
  neighborhoods: text("neighborhoods").array().notNull().default([]),
  asking_price: numeric("asking_price", { precision: 15, scale: 2 }).notNull(),
  floor_price: numeric("floor_price", { precision: 15, scale: 2 }).notNull(),
  user_phone: text("user_phone").notNull(),
  property_type: text("property_type"),
  area: text("area"),
  rooms: text("rooms"),
  facades: text("facades"),
  floors: text("floors"),
  garden: text("garden"),
  pool: text("pool"),
  is_active: boolean("is_active").notNull().default(true),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({
  id: true,
  created_at: true,
  is_active: true,
  expires_at: true,
});

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  listing_id: integer("listing_id").notNull().references(() => listingsTable.id),
  buyer_phone: text("buyer_phone").notNull(),
  budget: numeric("budget", { precision: 15, scale: 2 }).notNull(),
  matched: text("matched").notNull().default("false"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  seller_phone: text("seller_phone").notNull(),
  listing_id: integer("listing_id").notNull().references(() => listingsTable.id),
  type: text("type").notNull(),
  seen: boolean("seen").notNull().default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  coins: integer("coins").default(0).notNull(),
});

// Public games
export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  thumbnail: text("thumbnail"),
  htmlPath: text("html_path").notNull(),
  gameType: text("game_type").default("html").notNull(), // 'html' or 'swf'
  createdBy: varchar("created_by").notNull(),
});

// Groups
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPrivate: text("is_private").default("false").notNull(),
  joinCode: text("join_code"),
});

// Group members
export const groupMembers = pgTable("group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("member"), // 'admin' or 'member'
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Group games - private games uploaded to a group
export const groupGames = pgTable("group_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail"),
  htmlPath: text("html_path").notNull(),
  uploadedBy: varchar("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  gameType: text("game_type").default("html").notNull(), // 'html' or 'swf'
});

// Messages for group chat
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull(),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cosmetics shop items
export const cosmetics = pgTable("cosmetics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'theme', 'badge', 'profile_frame', 'cursor'
  price: integer("price").notNull(), // coin price
  thumbnail: text("thumbnail"),
  value: text("value").notNull(), // the actual CSS or value to apply
});

// User owned cosmetics
export const userCosmetics = pgTable("user_cosmetics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  cosmeticId: varchar("cosmetic_id").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

// Currently active cosmetics per user
export const activeCosmeticsMap = pgTable("active_cosmetics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  activeCosmeticId: varchar("active_cosmetic_id"),
});

// Schema definitions
export const insertGameSchema = createInsertSchema(games).omit({ id: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertGroupGameSchema = createInsertSchema(groupGames).omit({ id: true, uploadedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCosmeticSchema = createInsertSchema(cosmetics).omit({ id: true });
export const insertUserCosmeticSchema = createInsertSchema(userCosmetics).omit({ id: true, purchasedAt: true });
export const insertActiveCosmeticSchema = createInsertSchema(activeCosmeticsMap).omit({ id: true });

// Types
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type GroupGame = typeof groupGames.$inferSelect;
export type InsertGroupGame = z.infer<typeof insertGroupGameSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type Cosmetic = typeof cosmetics.$inferSelect;
export type InsertCosmetic = z.infer<typeof insertCosmeticSchema>;
export type UserCosmetic = typeof userCosmetics.$inferSelect;
export type InsertUserCosmetic = z.infer<typeof insertUserCosmeticSchema>;
export type ActiveCosmetic = typeof activeCosmeticsMap.$inferSelect;
export type InsertActiveCosmetic = z.infer<typeof insertActiveCosmeticSchema>;

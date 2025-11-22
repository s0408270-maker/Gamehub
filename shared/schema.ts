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
  isAdmin: text("is_admin").default("false").notNull(), // 'true' or 'false' (legacy)
  role: text("role").default("user").notNull(), // 'user', 'admin', 'owner'
});

// Public games
export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  thumbnail: text("thumbnail"),
  htmlPath: text("html_path").notNull(),
  gameType: text("game_type").default("html").notNull(), // 'html' or 'swf'
  createdBy: varchar("created_by").notNull(),
  price: integer("price"), // null = free/public, number = premium price in coins
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

// Game difficulty votes - community votes on game difficulty
export const gameDifficultyVotes = pgTable("game_difficulty_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  userId: varchar("user_id").notNull(),
  difficulty: integer("difficulty").notNull(), // 1-5 scale
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User owned premium games
export const userOwnedGames = pgTable("user_owned_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  gameId: varchar("game_id").notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

// Cosmetic trades between users in the same group
export const cosmeticTrades = pgTable("cosmetic_trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  senderCosmeticIds: text("sender_cosmetic_ids").notNull(), // JSON array
  receiverCosmeticIds: text("receiver_cosmetic_ids").notNull(), // JSON array
  status: text("status").default("pending").notNull(), // 'pending', 'accepted', 'rejected'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Battle pass system - free and premium tiers
export const battlePassTiers = pgTable("battle_pass_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  season: integer("season").notNull(), // Season number
  tier: integer("tier").notNull(), // 1-50 tiers
  freeCosmeticId: varchar("free_cosmetic_id"), // Free reward
  premiumCosmeticId: varchar("premium_cosmetic_id"), // Premium reward
});

// User battle pass progress
export const userBattlePassProgress = pgTable("user_battle_pass_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  currentSeason: integer("current_season").default(1).notNull(),
  currentTier: integer("current_tier").default(0).notNull(),
  experience: integer("experience").default(0).notNull(),
  hasPremiumPass: text("has_premium_pass").default("false").notNull(), // 'true' or 'false'
});

// Global app themes/settings
export const appThemes = pgTable("app_themes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cssOverrides: text("css_overrides").notNull(), // CSS string to override colors
  description: text("description"),
  pageRoute: text("page_route").default("/").notNull(), // Page route (e.g., "/", "/admin", "/shop")
  isActive: text("is_active").default("false").notNull(), // 'true' or 'false'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Global announcements/broadcasts
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  message: text("message").notNull(),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: text("is_active").default("true").notNull(), // 'true' or 'false'
});

// Schema definitions
export const insertGameSchema = createInsertSchema(games).omit({ id: true });
export const insertUserOwnedGameSchema = createInsertSchema(userOwnedGames).omit({ id: true, purchasedAt: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertGroupGameSchema = createInsertSchema(groupGames).omit({ id: true, uploadedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCosmeticSchema = createInsertSchema(cosmetics).omit({ id: true });
export const insertUserCosmeticSchema = createInsertSchema(userCosmetics).omit({ id: true, purchasedAt: true });
export const insertActiveCosmeticSchema = createInsertSchema(activeCosmeticsMap).omit({ id: true });
export const insertGameDifficultyVoteSchema = createInsertSchema(gameDifficultyVotes).omit({ id: true, createdAt: true });
export const insertCosmeticTradeSchema = createInsertSchema(cosmeticTrades).omit({ id: true, createdAt: true });
export const insertBattlePassTierSchema = createInsertSchema(battlePassTiers).omit({ id: true });
export const insertUserBattlePassProgressSchema = createInsertSchema(userBattlePassProgress).omit({ id: true });
export const insertAppThemeSchema = createInsertSchema(appThemes).omit({ id: true, createdAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });

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
export type GameDifficultyVote = typeof gameDifficultyVotes.$inferSelect;
export type InsertGameDifficultyVote = z.infer<typeof insertGameDifficultyVoteSchema>;
export type CosmeticTrade = typeof cosmeticTrades.$inferSelect;
export type InsertCosmeticTrade = z.infer<typeof insertCosmeticTradeSchema>;
export type BattlePassTier = typeof battlePassTiers.$inferSelect;
export type InsertBattlePassTier = z.infer<typeof insertBattlePassTierSchema>;
export type UserBattlePassProgress = typeof userBattlePassProgress.$inferSelect;
export type InsertUserBattlePassProgress = z.infer<typeof insertUserBattlePassProgressSchema>;
export type AppTheme = typeof appThemes.$inferSelect;
export type InsertAppTheme = z.infer<typeof insertAppThemeSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type UserOwnedGame = typeof userOwnedGames.$inferSelect;
export type InsertUserOwnedGame = z.infer<typeof insertUserOwnedGameSchema>;

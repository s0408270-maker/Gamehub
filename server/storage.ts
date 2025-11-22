import { type Game, type InsertGame, games, groups, groupMembers, groupGames, messages, users, type Group, type InsertGroup, type GroupGame, type InsertGroupGame, type Message, type InsertMessage, type User, type InsertUser, type GroupMember, cosmetics, userCosmetics, activeCosmeticsMap, type Cosmetic, type UserCosmetic, type ActiveCosmetic, gameDifficultyVotes, type GameDifficultyVote, type InsertGameDifficultyVote, cosmeticTrades, type CosmeticTrade, type InsertCosmeticTrade, battlePassTiers, userBattlePassProgress, type BattlePassTier, type InsertBattlePassTier, type UserBattlePassProgress, type InsertUserBattlePassProgress, appThemes, type AppTheme, type InsertAppTheme, announcements, type Announcement, type InsertAnnouncement } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Games
  getAllGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  deleteGame(id: string): Promise<void>;
  
  // Users
  getOrCreateUser(username: string): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  
  // Groups
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: string): Promise<Group | undefined>;
  getAllGroups(): Promise<Group[]>;
  getUserGroups(userId: string): Promise<Group[]>;
  deleteGroup(id: string): Promise<void>;
  
  // Group members
  addGroupMember(groupId: string, userId: string, role?: string): Promise<GroupMember>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;
  getGroupMembers(groupId: string): Promise<(GroupMember & { user: User })[]>;
  isGroupMember(groupId: string, userId: string): Promise<boolean>;
  
  // Group games
  createGroupGame(game: InsertGroupGame): Promise<GroupGame>;
  getGroupGames(groupId: string): Promise<GroupGame[]>;
  deleteGroupGame(id: string): Promise<void>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  getGroupMessages(groupId: string, limit?: number): Promise<(Message & { user: User })[]>;
  
  // Coins & Cosmetics
  addCoins(userId: string, amount: number): Promise<User>;
  getLeaderboard(limit?: number): Promise<User[]>;
  getAllCosmetics(): Promise<Cosmetic[]>;
  purchaseCosmetic(userId: string, cosmeticId: string): Promise<UserCosmetic>;
  getUserCosmetics(userId: string): Promise<UserCosmetic[]>;
  setActiveCosmetic(userId: string, cosmeticId: string | null): Promise<ActiveCosmetic>;
  getActiveCosmetic(userId: string): Promise<ActiveCosmetic | undefined>;

  // Game difficulty voting
  voteGameDifficulty(gameId: string, userId: string, difficulty: number): Promise<GameDifficultyVote>;
  getGameDifficultyVotes(gameId: string): Promise<GameDifficultyVote[]>;
  getAverageDifficulty(gameId: string): Promise<number>;

  // Cosmetic trading
  proposeCosmeticTrade(groupId: string, senderId: string, receiverId: string, senderCosmeticIds: string[], receiverCosmeticIds: string[]): Promise<CosmeticTrade>;
  getUserCosmeticTrades(userId: string): Promise<CosmeticTrade[]>;
  acceptCosmeticTrade(tradeId: string): Promise<CosmeticTrade>;
  rejectCosmeticTrade(tradeId: string): Promise<CosmeticTrade>;

  // Battle pass
  getBattlePassTiers(season: number): Promise<BattlePassTier[]>;
  getUserBattlePassProgress(userId: string): Promise<UserBattlePassProgress>;
  addBattlePassExperience(userId: string, amount: number): Promise<UserBattlePassProgress>;
  purchagePremiumPass(userId: string): Promise<UserBattlePassProgress>;

  // Admin features
  setUserAdmin(username: string, isAdmin: boolean): Promise<User>;
  getAllThemes(): Promise<AppTheme[]>;
  getActiveTheme(): Promise<AppTheme | undefined>;
  getActiveThemeByPage(pageRoute: string): Promise<AppTheme | undefined>;
  createTheme(theme: InsertAppTheme): Promise<AppTheme>;
  setActiveTheme(themeId: string): Promise<void>;
  deleteTheme(themeId: string): Promise<void>;
  disableAllThemes(): Promise<void>;

  // Announcements
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getActiveAnnouncement(): Promise<Announcement | undefined>;
  dismissAnnouncement(announcementId: string): Promise<Announcement>;
}

export class DatabaseStorage implements IStorage {
  // Games
  async getAllGames(): Promise<Game[]> {
    return await db.select().from(games);
  }

  async getGame(id: string): Promise<Game | undefined> {
    const result = await db.select().from(games).where(eq(games.id, id)).limit(1);
    return result[0];
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const result = await db.insert(games).values(insertGame).returning();
    return result[0];
  }

  async deleteGame(id: string): Promise<void> {
    await db.delete(games).where(eq(games.id, id));
  }

  // Users
  async getOrCreateUser(username: string): Promise<User> {
    let user = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (user.length > 0) return user[0];
    
    const result = await db.insert(users).values({ username, password: "" }).returning();
    return result[0];
  }

  async createUser(username: string, passwordHash: string): Promise<User> {
    const result = await db.insert(users).values({ username, password: passwordHash }).returning();
    return result[0];
  }

  async authenticateUser(username: string, passwordHash: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(eq(users.username, username))
      .limit(1);
    const user = result[0];
    if (user && user.password === passwordHash) {
      return user;
    }
    return undefined;
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  // Groups
  async createGroup(group: InsertGroup & { isPrivate?: boolean }): Promise<Group> {
    const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    const groupData = {
      ...group,
      isPrivate: group.isPrivate ? "true" : "false",
      joinCode: group.isPrivate ? generateCode() : null,
    };
    const result = await db.insert(groups).values(groupData as any).returning();
    const newGroup = result[0];
    // Add creator as admin
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: group.createdBy,
      role: "admin",
    });
    return newGroup;
  }

  async joinGroupWithCode(userId: string, joinCode: string): Promise<Group | undefined> {
    const group = await db.select().from(groups).where(eq(groups.joinCode, joinCode)).limit(1);
    if (!group[0]) return undefined;
    const isMember = await this.isGroupMember(group[0].id, userId);
    if (!isMember) {
      await this.addGroupMember(group[0].id, userId);
    }
    return group[0];
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const result = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
    return result[0];
  }

  async getAllGroups(): Promise<Group[]> {
    return await db.select().from(groups);
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const userGroups = await db
      .select({ group: groups })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(eq(groupMembers.userId, userId));
    
    return userGroups.map(ug => ug.group);
  }

  async deleteGroup(id: string): Promise<void> {
    await db.delete(groups).where(eq(groups.id, id));
  }

  // Group members
  async addGroupMember(groupId: string, userId: string, role = "member"): Promise<GroupMember> {
    const result = await db.insert(groupMembers).values({ groupId, userId, role }).returning();
    return result[0];
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await db.delete(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  }

  async getGroupMembers(groupId: string): Promise<(GroupMember & { user: User })[]> {
    const members = await db
      .select()
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId));
    
    return members.map(m => ({ ...m.group_members, user: m.users }));
  }

  async isGroupMember(groupId: string, userId: string): Promise<boolean> {
    const result = await db.select().from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);
    return result.length > 0;
  }

  // Group games
  async createGroupGame(game: InsertGroupGame): Promise<GroupGame> {
    const result = await db.insert(groupGames).values(game).returning();
    return result[0];
  }

  async getGroupGames(groupId: string): Promise<GroupGame[]> {
    return await db.select().from(groupGames).where(eq(groupGames.groupId, groupId));
  }

  async deleteGroupGame(id: string): Promise<void> {
    await db.delete(groupGames).where(eq(groupGames.id, id));
  }

  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async getGroupMessages(groupId: string, limit = 50): Promise<(Message & { user: User })[]> {
    const msgs = await db
      .select()
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.groupId, groupId))
      .orderBy(messages.createdAt)
      .limit(limit);
    
    return msgs.map(m => ({ ...m.messages, user: m.users }));
  }

  // Coins & Cosmetics
  async addCoins(userId: string, amount: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const result = await db.update(users)
      .set({ coins: (user.coins || 0) + amount })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getLeaderboard(limit = 10): Promise<User[]> {
    return await db.select().from(users)
      .orderBy(desc(users.coins))
      .limit(limit);
  }

  async getAllCosmetics(): Promise<Cosmetic[]> {
    return await db.select().from(cosmetics);
  }

  async purchaseCosmetic(userId: string, cosmeticId: string): Promise<UserCosmetic> {
    const result = await db.insert(userCosmetics)
      .values({ userId, cosmeticId })
      .returning();
    return result[0];
  }

  async getUserCosmetics(userId: string): Promise<UserCosmetic[]> {
    return await db.select().from(userCosmetics)
      .where(eq(userCosmetics.userId, userId));
  }

  async setActiveCosmetic(userId: string, cosmeticId: string | null): Promise<ActiveCosmetic> {
    const existing = await db.select().from(activeCosmeticsMap)
      .where(eq(activeCosmeticsMap.userId, userId));
    
    if (existing.length > 0) {
      const result = await db.update(activeCosmeticsMap)
        .set({ activeCosmeticId: cosmeticId })
        .where(eq(activeCosmeticsMap.userId, userId))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(activeCosmeticsMap)
        .values({ userId, activeCosmeticId: cosmeticId })
        .returning();
      return result[0];
    }
  }

  async getActiveCosmetic(userId: string): Promise<ActiveCosmetic | undefined> {
    const result = await db.select().from(activeCosmeticsMap)
      .where(eq(activeCosmeticsMap.userId, userId))
      .limit(1);
    return result[0];
  }

  // Game difficulty voting
  async voteGameDifficulty(gameId: string, userId: string, difficulty: number): Promise<GameDifficultyVote> {
    const result = await db.insert(gameDifficultyVotes)
      .values({ gameId, userId, difficulty })
      .returning();
    return result[0];
  }

  async getGameDifficultyVotes(gameId: string): Promise<GameDifficultyVote[]> {
    return await db.select().from(gameDifficultyVotes)
      .where(eq(gameDifficultyVotes.gameId, gameId));
  }

  async getAverageDifficulty(gameId: string): Promise<number> {
    const votes = await this.getGameDifficultyVotes(gameId);
    if (votes.length === 0) return 0;
    const sum = votes.reduce((acc, v) => acc + v.difficulty, 0);
    return Math.round((sum / votes.length) * 10) / 10;
  }

  // Cosmetic trading
  async proposeCosmeticTrade(groupId: string, senderId: string, receiverId: string, senderCosmeticIds: string[], receiverCosmeticIds: string[]): Promise<CosmeticTrade> {
    const result = await db.insert(cosmeticTrades)
      .values({
        groupId,
        senderId,
        receiverId,
        senderCosmeticIds: JSON.stringify(senderCosmeticIds),
        receiverCosmeticIds: JSON.stringify(receiverCosmeticIds),
        status: "pending",
      })
      .returning();
    return result[0];
  }

  async getUserCosmeticTrades(userId: string): Promise<CosmeticTrade[]> {
    return await db.select().from(cosmeticTrades)
      .where(eq(cosmeticTrades.receiverId, userId));
  }

  async acceptCosmeticTrade(tradeId: string): Promise<CosmeticTrade> {
    const result = await db.update(cosmeticTrades)
      .set({ status: "accepted" })
      .where(eq(cosmeticTrades.id, tradeId))
      .returning();
    return result[0];
  }

  async rejectCosmeticTrade(tradeId: string): Promise<CosmeticTrade> {
    const result = await db.update(cosmeticTrades)
      .set({ status: "rejected" })
      .where(eq(cosmeticTrades.id, tradeId))
      .returning();
    return result[0];
  }

  // Battle pass
  async getBattlePassTiers(season: number): Promise<BattlePassTier[]> {
    return await db.select().from(battlePassTiers)
      .where(eq(battlePassTiers.season, season));
  }

  async getUserBattlePassProgress(userId: string): Promise<UserBattlePassProgress> {
    const result = await db.select().from(userBattlePassProgress)
      .where(eq(userBattlePassProgress.userId, userId))
      .limit(1);
    if (result[0]) return result[0];
    
    const newProgress = await db.insert(userBattlePassProgress)
      .values({ userId, currentSeason: 1, currentTier: 0, experience: 0, hasPremiumPass: "false" })
      .returning();
    return newProgress[0];
  }

  async addBattlePassExperience(userId: string, amount: number): Promise<UserBattlePassProgress> {
    const progress = await this.getUserBattlePassProgress(userId);
    const newExp = (progress.experience || 0) + amount;
    const newTier = Math.min(50, progress.currentTier + Math.floor(newExp / 500));
    
    const result = await db.update(userBattlePassProgress)
      .set({ experience: newExp % 500, currentTier: newTier })
      .where(eq(userBattlePassProgress.userId, userId))
      .returning();
    return result[0];
  }

  async purchagePremiumPass(userId: string): Promise<UserBattlePassProgress> {
    const result = await db.update(userBattlePassProgress)
      .set({ hasPremiumPass: "true" })
      .where(eq(userBattlePassProgress.userId, userId))
      .returning();
    return result[0];
  }

  // Admin features
  async setUserAdmin(username: string, isAdmin: boolean): Promise<User> {
    const result = await db.update(users)
      .set({ isAdmin: isAdmin ? "true" : "false" })
      .where(eq(users.username, username))
      .returning();
    return result[0];
  }

  // Owner features
  async banUser(username: string): Promise<User> {
    const result = await db.update(users)
      .set({ isBanned: "true" })
      .where(eq(users.username, username))
      .returning();
    return result[0];
  }

  async unbanUser(username: string): Promise<User> {
    const result = await db.update(users)
      .set({ isBanned: "false" })
      .where(eq(users.username, username))
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllThemes(): Promise<AppTheme[]> {
    return await db.select().from(appThemes);
  }

  async getActiveTheme(): Promise<AppTheme | undefined> {
    const result = await db.select().from(appThemes)
      .where(eq(appThemes.isActive, "true"))
      .limit(1);
    return result[0];
  }

  async getActiveThemeByPage(pageRoute: string): Promise<AppTheme | undefined> {
    const result = await db.select().from(appThemes)
      .where(and(eq(appThemes.isActive, "true"), eq(appThemes.pageRoute, pageRoute)))
      .limit(1);
    return result[0];
  }

  async createTheme(theme: InsertAppTheme): Promise<AppTheme> {
    const result = await db.insert(appThemes).values(theme).returning();
    return result[0];
  }

  async setActiveTheme(themeId: string): Promise<void> {
    await db.update(appThemes)
      .set({ isActive: "false" })
      .where(eq(appThemes.isActive, "true"));
    
    await db.update(appThemes)
      .set({ isActive: "true" })
      .where(eq(appThemes.id, themeId));
  }

  async deleteTheme(themeId: string): Promise<void> {
    await db.delete(appThemes).where(eq(appThemes.id, themeId));
  }

  async disableAllThemes(): Promise<void> {
    await db.update(appThemes)
      .set({ isActive: "false" });
  }

  // Announcements
  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const result = await db.insert(announcements).values(announcement).returning();
    return result[0];
  }

  async getActiveAnnouncement(): Promise<Announcement | undefined> {
    const result = await db.select().from(announcements)
      .where(eq(announcements.isActive, "true"))
      .orderBy(desc(announcements.createdAt))
      .limit(1);
    return result[0];
  }

  async dismissAnnouncement(announcementId: string): Promise<Announcement> {
    const result = await db.update(announcements)
      .set({ isActive: "false" })
      .where(eq(announcements.id, announcementId))
      .returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();

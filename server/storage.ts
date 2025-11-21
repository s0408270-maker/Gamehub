import { type Game, type InsertGame, games, groups, groupMembers, groupGames, messages, users, type Group, type InsertGroup, type GroupGame, type InsertGroupGame, type Message, type InsertMessage, type User, type InsertUser, type GroupMember } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Games
  getAllGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  
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
}

export const storage = new DatabaseStorage();

import { type Game, type InsertGame, games } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getAllGames(): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
}

export class DatabaseStorage implements IStorage {
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
}

export const storage = new DatabaseStorage();

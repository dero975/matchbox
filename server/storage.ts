import { 
  users, albums, figurines, userFigurines, matches, messages, tradeProposals,
  type User, type InsertUser, type Album, type InsertAlbum, 
  type Figurine, type InsertFigurine, type UserFigurine, type InsertUserFigurine,
  type Match, type InsertMatch, type Message, type InsertMessage,
  type TradeProposal, type InsertTradeProposal
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByNickname(nickname: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Album operations
  getAlbums(): Promise<Album[]>;
  getAlbum(id: number): Promise<Album | undefined>;
  createAlbum(album: InsertAlbum): Promise<Album>;

  // Figurine operations
  getFigurines(albumId?: number): Promise<Figurine[]>;
  getFigurine(id: number): Promise<Figurine | undefined>;
  createFigurine(figurine: InsertFigurine): Promise<Figurine>;

  // User figurine operations
  getUserFigurines(userId: number, albumId?: number): Promise<(UserFigurine & { figurine: Figurine })[]>;
  createUserFigurine(userFigurine: InsertUserFigurine): Promise<UserFigurine>;
  updateUserFigurine(id: number, updates: Partial<InsertUserFigurine>): Promise<UserFigurine | undefined>;
  deleteUserFigurine(id: number): Promise<boolean>;

  // Match operations
  getMatches(userId: number): Promise<(Match & { user1: User; user2: User })[]>;
  getMatch(id: number): Promise<(Match & { user1: User; user2: User }) | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, updates: Partial<InsertMatch>): Promise<Match | undefined>;
  findPotentialMatches(userId: number): Promise<{ user: User; compatibility: number; possibleTrades: number }[]>;

  // Message operations
  getMessages(matchId: number): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(matchId: number, userId: number): Promise<void>;

  // Trade proposal operations
  getTradeProposals(matchId: number): Promise<TradeProposal[]>;
  createTradeProposal(proposal: InsertTradeProposal): Promise<TradeProposal>;
  updateTradeProposal(id: number, updates: Partial<InsertTradeProposal>): Promise<TradeProposal | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database is already populated with Calciatori Panini 2024/25 data
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByNickname(nickname: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.nickname, nickname));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getAlbums(): Promise<Album[]> {
    return await db.select().from(albums);
  }

  async getAlbum(id: number): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album || undefined;
  }

  async createAlbum(insertAlbum: InsertAlbum): Promise<Album> {
    const [album] = await db.insert(albums).values(insertAlbum).returning();
    return album;
  }

  async getFigurines(albumId?: number): Promise<Figurine[]> {
    if (albumId) {
      return await db.select().from(figurines).where(eq(figurines.albumId, albumId)).orderBy(figurines.sortOrder, figurines.id);
    }
    return await db.select().from(figurines).orderBy(figurines.sortOrder, figurines.id);
  }

  async getFigurine(id: number): Promise<Figurine | undefined> {
    const [figurine] = await db.select().from(figurines).where(eq(figurines.id, id));
    return figurine || undefined;
  }

  async createFigurine(insertFigurine: InsertFigurine): Promise<Figurine> {
    const [figurine] = await db.insert(figurines).values(insertFigurine).returning();
    return figurine;
  }

  async getUserFigurines(userId: number, albumId?: number): Promise<(UserFigurine & { figurine: Figurine })[]> {
    let query = db
      .select()
      .from(userFigurines)
      .innerJoin(figurines, eq(userFigurines.figurineId, figurines.id))
      .where(eq(userFigurines.userId, userId));

    if (albumId) {
      query = query.where(eq(figurines.albumId, albumId));
    }

    const results = await query;
    return results.map(result => ({
      ...result.user_figurines,
      figurine: result.figurines,
    }));
  }

  async createUserFigurine(insertUserFigurine: InsertUserFigurine): Promise<UserFigurine> {
    const [userFigurine] = await db.insert(userFigurines).values(insertUserFigurine).returning();
    return userFigurine;
  }

  async updateUserFigurine(id: number, updates: Partial<InsertUserFigurine>): Promise<UserFigurine | undefined> {
    const [userFigurine] = await db.update(userFigurines).set(updates).where(eq(userFigurines.id, id)).returning();
    return userFigurine || undefined;
  }

  async deleteUserFigurine(id: number): Promise<boolean> {
    const result = await db.delete(userFigurines).where(eq(userFigurines.id, id));
    return result.rowCount > 0;
  }

  async getMatches(userId: number): Promise<(Match & { user1: User; user2: User })[]> {
    const results = await db
      .select({
        match: matches,
        user1: users,
        user2: users,
      })
      .from(matches)
      .innerJoin(users, eq(matches.userId1, users.id))
      .innerJoin(users, eq(matches.userId2, users.id))
      .where(or(eq(matches.userId1, userId), eq(matches.userId2, userId)));

    return results.map(result => ({
      ...result.match,
      user1: result.user1,
      user2: result.user2,
    }));
  }

  async getMatch(id: number): Promise<(Match & { user1: User; user2: User }) | undefined> {
    const [result] = await db
      .select({
        match: matches,
        user1: users,
        user2: users,
      })
      .from(matches)
      .innerJoin(users, eq(matches.userId1, users.id))
      .innerJoin(users, eq(matches.userId2, users.id))
      .where(eq(matches.id, id));

    if (!result) return undefined;

    return {
      ...result.match,
      user1: result.user1,
      user2: result.user2,
    };
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db.insert(matches).values(insertMatch).returning();
    return match;
  }

  async updateMatch(id: number, updates: Partial<InsertMatch>): Promise<Match | undefined> {
    const [match] = await db.update(matches).set(updates).where(eq(matches.id, id)).returning();
    return match || undefined;
  }

  async findPotentialMatches(userId: number): Promise<{ user: User; compatibility: number; possibleTrades: number }[]> {
    const currentUser = await this.getUser(userId);
    if (!currentUser) return [];

    const currentUserFigurines = await this.getUserFigurines(userId);
    const allUsers = await db.select().from(users).where(sql`${users.id} != ${userId}`);
    
    const potentialMatches = [];

    // Filter for Calciatori Panini 2024/25 album
    const calciatoriAlbum = await db.select().from(albums).where(eq(albums.name, "Calciatori Panini 2024/25"));
    const calciatoriAlbumId = calciatoriAlbum.length > 0 ? calciatoriAlbum[0].id : null;

    for (const otherUser of allUsers) {
      const otherUserFigurines = await this.getUserFigurines(otherUser.id, calciatoriAlbumId);
      
      // Current user's wants (figurine he doesn't have) and doubles  
      const userWants = currentUserFigurines.filter(uf => !uf.possiede && uf.figurine.albumId === calciatoriAlbumId);
      const userDoubles = currentUserFigurines.filter(uf => uf.doppione && uf.figurine.albumId === calciatoriAlbumId);
      
      // Other user's wants and doubles
      const otherUserWants = otherUserFigurines.filter(uf => !uf.possiede);
      const otherUserDoubles = otherUserFigurines.filter(uf => uf.doppione);
      
      let possibleTrades = 0;
      
      // Calculate 1:1 trading opportunities
      for (const userWant of userWants) {
        const otherUserHas = otherUserDoubles.find(uf => uf.figurineId === userWant.figurineId);
        if (otherUserHas) {
          // Check if we can give them something they want
          const canGive = otherUserWants.find(otherWant => 
            userDoubles.find(userDouble => userDouble.figurineId === otherWant.figurineId)
          );
          if (canGive) {
            possibleTrades++;
          }
        }
      }
      
      if (possibleTrades > 0) {
        // Calculate compatibility based on mutual benefit for Calciatori Panini
        const compatibility = Math.min(100, (possibleTrades / Math.max(userWants.length, otherUserWants.length, 1)) * 100);
        
        potentialMatches.push({
          user: otherUser,
          compatibility: Math.round(compatibility),
          possibleTrades
        });
      }
    }
    
    return potentialMatches.sort((a, b) => b.compatibility - a.compatibility);
  }

  async getMessages(matchId: number): Promise<(Message & { sender: User })[]> {
    const results = await db
      .select({
        message: messages,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.matchId, matchId))
      .orderBy(messages.createdAt);

    return results.map(result => ({
      ...result.message,
      sender: result.sender,
    }));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async markMessagesAsRead(matchId: number, userId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.matchId, matchId), sql`${messages.senderId} != ${userId}`));
  }

  async getTradeProposals(matchId: number): Promise<TradeProposal[]> {
    return await db.select().from(tradeProposals).where(eq(tradeProposals.matchId, matchId));
  }

  async createTradeProposal(insertTradeProposal: InsertTradeProposal): Promise<TradeProposal> {
    const [proposal] = await db.insert(tradeProposals).values(insertTradeProposal).returning();
    return proposal;
  }

  async updateTradeProposal(id: number, updates: Partial<InsertTradeProposal>): Promise<TradeProposal | undefined> {
    const [proposal] = await db.update(tradeProposals).set(updates).where(eq(tradeProposals.id, id)).returning();
    return proposal || undefined;
  }
}

export const storage = new DatabaseStorage();
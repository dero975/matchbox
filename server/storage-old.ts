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
    this.seedData();
  }

  private seedData() {
    // Create sample albums
    const pokemonAlbum: Album = {
      id: this.currentAlbumId++,
      name: "Pokémon TCG 2024",
      description: "Collezione Pokémon Trading Card Game",
      totalCards: 20,
      imageUrl: "/pokemon-album.jpg",
      createdAt: new Date(),
    };
    this.albums.set(pokemonAlbum.id, pokemonAlbum);

    const calciatoriAlbum: Album = {
      id: this.currentAlbumId++,
      name: "Calciatori Panini 2024",
      description: "Album figurine calcio Panini",
      totalCards: 15,
      imageUrl: "/panini-album.jpg",
      createdAt: new Date(),
    };
    this.albums.set(calciatoriAlbum.id, calciatoriAlbum);

    // Create sample figurines for Pokemon
    const pokemonFigurines = [
      { albumId: pokemonAlbum.id, number: "001", name: "Bulbasaur", rarity: "common" },
      { albumId: pokemonAlbum.id, number: "002", name: "Ivysaur", rarity: "common" },
      { albumId: pokemonAlbum.id, number: "003", name: "Venusaur", rarity: "uncommon" },
      { albumId: pokemonAlbum.id, number: "004", name: "Charmander", rarity: "common" },
      { albumId: pokemonAlbum.id, number: "005", name: "Charmeleon", rarity: "common" },
      { albumId: pokemonAlbum.id, number: "006", name: "Charizard", rarity: "rare" },
      { albumId: pokemonAlbum.id, number: "007", name: "Squirtle", rarity: "common" },
      { albumId: pokemonAlbum.id, number: "008", name: "Wartortle", rarity: "common" },
      { albumId: pokemonAlbum.id, number: "009", name: "Blastoise", rarity: "uncommon" },
      { albumId: pokemonAlbum.id, number: "025", name: "Pikachu", rarity: "uncommon" },
      { albumId: pokemonAlbum.id, number: "026", name: "Raichu", rarity: "uncommon" },
      { albumId: pokemonAlbum.id, number: "039", name: "Jigglypuff", rarity: "common" },
      { albumId: pokemonAlbum.id, number: "054", name: "Psyduck", rarity: "common" },
      { albumId: pokemonAlbum.id, number: "104", name: "Cubone", rarity: "common" },
      { albumId: pokemonAlbum.id, number: "131", name: "Lapras", rarity: "rare" },
      { albumId: pokemonAlbum.id, number: "132", name: "Ditto", rarity: "rare" },
      { albumId: pokemonAlbum.id, number: "144", name: "Articuno", rarity: "legendary" },
      { albumId: pokemonAlbum.id, number: "145", name: "Zapdos", rarity: "legendary" },
      { albumId: pokemonAlbum.id, number: "150", name: "Mewtwo", rarity: "legendary" },
      { albumId: pokemonAlbum.id, number: "151", name: "Mew", rarity: "legendary" },
    ];

    // Create sample figurines for Calciatori
    const calciFigurines = [
      { albumId: calciatoriAlbum.id, number: "001", name: "Donnarumma", rarity: "uncommon" },
      { albumId: calciatoriAlbum.id, number: "002", name: "Verratti", rarity: "rare" },
      { albumId: calciatoriAlbum.id, number: "003", name: "Barella", rarity: "uncommon" },
      { albumId: calciatoriAlbum.id, number: "004", name: "Chiesa", rarity: "rare" },
      { albumId: calciatoriAlbum.id, number: "005", name: "Insigne", rarity: "uncommon" },
      { albumId: calciatoriAlbum.id, number: "006", name: "Immobile", rarity: "rare" },
      { albumId: calciatoriAlbum.id, number: "007", name: "Ronaldo", rarity: "legendary" },
      { albumId: calciatoriAlbum.id, number: "008", name: "Messi", rarity: "legendary" },
      { albumId: calciatoriAlbum.id, number: "009", name: "Neymar", rarity: "rare" },
      { albumId: calciatoriAlbum.id, number: "010", name: "Mbappé", rarity: "rare" },
      { albumId: calciatoriAlbum.id, number: "011", name: "Haaland", rarity: "rare" },
      { albumId: calciatoriAlbum.id, number: "012", name: "De Bruyne", rarity: "uncommon" },
      { albumId: calciatoriAlbum.id, number: "013", name: "Salah", rarity: "rare" },
      { albumId: calciatoriAlbum.id, number: "014", name: "Kane", rarity: "uncommon" },
      { albumId: calciatoriAlbum.id, number: "015", name: "Benzema", rarity: "rare" },
    ];

    // Add all figurines
    [...pokemonFigurines, ...calciFigurines].forEach(fig => {
      const figurine: Figurine = {
        id: this.currentFigurineId++,
        albumId: fig.albumId,
        number: fig.number,
        name: fig.name,
        rarity: fig.rarity || null,
        imageUrl: `/figurines/${fig.name.toLowerCase()}.jpg`,
      };
      this.figurines.set(figurine.id, figurine);
    });

    // Create 10 sample users with diverse collections
    const sampleUsers = [
      { nickname: "MarioCollector", password: "password123", location: "Milano" },
      { nickname: "LucaTrader", password: "password123", location: "Roma" },
      { nickname: "GiuliaCards", password: "password123", location: "Napoli" },
      { nickname: "FrancescoPoke", password: "password123", location: "Torino" },
      { nickname: "AlessandroFan", password: "password123", location: "Firenze" },
      { nickname: "ChiaraCollect", password: "password123", location: "Bologna" },
      { nickname: "MatteoPanini", password: "password123", location: "Genova" },
      { nickname: "SofiaCards", password: "password123", location: "Palermo" },
      { nickname: "DavideTrader", password: "password123", location: "Venezia" },
      { nickname: "ElenaFigurine", password: "password123", location: "Bari" },
    ];

    // Create users and their collections
    sampleUsers.forEach((userData, userIndex) => {
      const user: User = {
        id: this.currentUserId++,
        nickname: userData.nickname,
        password: userData.password, // In reality this would be hashed
        location: userData.location,
        createdAt: new Date(),
      };
      this.users.set(user.id, user);

      // Create diverse collections for each user
      const allFigurines = Array.from(this.figurines.values());
      
      // Each user has different collection patterns
      allFigurines.forEach((figurine, figIndex) => {
        const shouldHave = Math.random() > 0.6; // 40% chance to have each card
        
        if (shouldHave) {
          let status: string;
          let quantity = 1;
          
          const rand = Math.random();
          if (rand > 0.8) {
            status = 'double';
            quantity = Math.floor(Math.random() * 3) + 2; // 2-4 copies
          } else if (rand > 0.3) {
            status = 'owned';
          } else {
            status = 'wanted';
          }

          const userFigurine: UserFigurine = {
            id: this.currentUserFigurineId++,
            userId: user.id,
            figurineId: figurine.id,
            status,
            quantity,
            createdAt: new Date(),
          };
          this.userFigurines.set(userFigurine.id, userFigurine);
        }
      });
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByNickname(nickname: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.nickname === nickname);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentUserId++,
      nickname: insertUser.nickname,
      password: insertUser.password,
      location: insertUser.location || null,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Album operations
  async getAlbums(): Promise<Album[]> {
    return Array.from(this.albums.values());
  }

  async getAlbum(id: number): Promise<Album | undefined> {
    return this.albums.get(id);
  }

  async createAlbum(insertAlbum: InsertAlbum): Promise<Album> {
    const album: Album = {
      id: this.currentAlbumId++,
      name: insertAlbum.name,
      description: insertAlbum.description || null,
      totalCards: insertAlbum.totalCards,
      imageUrl: insertAlbum.imageUrl || null,
      createdAt: new Date(),
    };
    this.albums.set(album.id, album);
    return album;
  }

  // Figurine operations
  async getFigurines(albumId?: number): Promise<Figurine[]> {
    const allFigurines = Array.from(this.figurines.values());
    return albumId ? allFigurines.filter(f => f.albumId === albumId) : allFigurines;
  }

  async getFigurine(id: number): Promise<Figurine | undefined> {
    return this.figurines.get(id);
  }

  async createFigurine(insertFigurine: InsertFigurine): Promise<Figurine> {
    const figurine: Figurine = {
      id: this.currentFigurineId++,
      number: insertFigurine.number,
      name: insertFigurine.name,
      albumId: insertFigurine.albumId,
      imageUrl: insertFigurine.imageUrl || null,
      rarity: insertFigurine.rarity || null,
    };
    this.figurines.set(figurine.id, figurine);
    return figurine;
  }

  // User figurine operations
  async getUserFigurines(userId: number, albumId?: number): Promise<(UserFigurine & { figurine: Figurine })[]> {
    const userFigs = Array.from(this.userFigurines.values())
      .filter(uf => uf.userId === userId);
    
    const result = [];
    for (const userFig of userFigs) {
      const figurine = this.figurines.get(userFig.figurineId);
      if (figurine && (!albumId || figurine.albumId === albumId)) {
        result.push({ ...userFig, figurine });
      }
    }
    return result;
  }

  async createUserFigurine(insertUserFigurine: InsertUserFigurine): Promise<UserFigurine> {
    const userFigurine: UserFigurine = {
      id: this.currentUserFigurineId++,
      userId: insertUserFigurine.userId,
      figurineId: insertUserFigurine.figurineId,
      status: insertUserFigurine.status,
      quantity: insertUserFigurine.quantity || 1,
      createdAt: new Date(),
    };
    this.userFigurines.set(userFigurine.id, userFigurine);
    return userFigurine;
  }

  async updateUserFigurine(id: number, updates: Partial<InsertUserFigurine>): Promise<UserFigurine | undefined> {
    const userFig = this.userFigurines.get(id);
    if (!userFig) return undefined;
    
    const updated = { ...userFig, ...updates };
    this.userFigurines.set(id, updated);
    return updated;
  }

  async deleteUserFigurine(id: number): Promise<boolean> {
    return this.userFigurines.delete(id);
  }

  // Match operations
  async getMatches(userId: number): Promise<(Match & { user1: User; user2: User })[]> {
    const userMatches = Array.from(this.matches.values())
      .filter(m => m.userId1 === userId || m.userId2 === userId);
    
    const result = [];
    for (const match of userMatches) {
      const user1 = this.users.get(match.userId1);
      const user2 = this.users.get(match.userId2);
      if (user1 && user2) {
        result.push({ ...match, user1, user2 });
      }
    }
    return result;
  }

  async getMatch(id: number): Promise<(Match & { user1: User; user2: User }) | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;
    
    const user1 = this.users.get(match.userId1);
    const user2 = this.users.get(match.userId2);
    if (!user1 || !user2) return undefined;
    
    return { ...match, user1, user2 };
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const match: Match = {
      id: this.currentMatchId++,
      userId1: insertMatch.userId1,
      userId2: insertMatch.userId2,
      compatibility: insertMatch.compatibility,
      status: insertMatch.status || 'pending',
      createdAt: new Date(),
    };
    this.matches.set(match.id, match);
    return match;
  }

  async updateMatch(id: number, updates: Partial<InsertMatch>): Promise<Match | undefined> {
    const match = this.matches.get(id);
    if (!match) return undefined;
    
    const updated = { ...match, ...updates };
    this.matches.set(id, updated);
    return updated;
  }

  async findPotentialMatches(userId: number): Promise<{ user: User; compatibility: number; possibleTrades: number }[]> {
    const userFigurines = await this.getUserFigurines(userId);
    const userWants = userFigurines.filter(uf => uf.status === 'wanted');
    const userDoubles = userFigurines.filter(uf => uf.status === 'double');
    
    const otherUsers = Array.from(this.users.values()).filter(u => u.id !== userId);
    const potentialMatches = [];
    
    for (const otherUser of otherUsers) {
      const otherUserFigurines = await this.getUserFigurines(otherUser.id);
      const otherUserWants = otherUserFigurines.filter(uf => uf.status === 'wanted');
      const otherUserDoubles = otherUserFigurines.filter(uf => uf.status === 'double');
      
      // Calculate compatibility based on mutual interests
      let matches = 0;
      let total = 0;
      
      // Check if user has what other user wants
      for (const want of otherUserWants) {
        const hasCard = userDoubles.find(d => d.figurineId === want.figurineId);
        if (hasCard) matches++;
        total++;
      }
      
      // Check if other user has what user wants
      for (const want of userWants) {
        const hasCard = otherUserDoubles.find(d => d.figurineId === want.figurineId);
        if (hasCard) matches++;
        total++;
      }
      
      if (total > 0) {
        const compatibility = Math.round((matches / total) * 100);
        if (compatibility > 0) {
          potentialMatches.push({
            user: otherUser,
            compatibility,
            possibleTrades: matches
          });
        }
      }
    }
    
    return potentialMatches.sort((a, b) => b.compatibility - a.compatibility);
  }

  // Message operations
  async getMessages(matchId: number): Promise<(Message & { sender: User })[]> {
    const matchMessages = Array.from(this.messages.values())
      .filter(m => m.matchId === matchId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const result = [];
    for (const message of matchMessages) {
      const sender = this.users.get(message.senderId);
      if (sender) {
        result.push({ ...message, sender });
      }
    }
    return result;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      id: this.currentMessageId++,
      matchId: insertMessage.matchId,
      senderId: insertMessage.senderId,
      content: insertMessage.content,
      messageType: insertMessage.messageType || 'text',
      isRead: insertMessage.isRead || false,
      createdAt: new Date(),
    };
    this.messages.set(message.id, message);
    return message;
  }

  async markMessagesAsRead(matchId: number, userId: number): Promise<void> {
    Array.from(this.messages.values())
      .filter(m => m.matchId === matchId && m.senderId !== userId)
      .forEach(m => {
        m.isRead = true;
        this.messages.set(m.id, m);
      });
  }

  // Trade proposal operations
  async getTradeProposals(matchId: number): Promise<TradeProposal[]> {
    return Array.from(this.tradeProposals.values())
      .filter(tp => tp.matchId === matchId);
  }

  async createTradeProposal(insertTradeProposal: InsertTradeProposal): Promise<TradeProposal> {
    const proposal: TradeProposal = {
      id: this.currentTradeProposalId++,
      matchId: insertTradeProposal.matchId,
      proposerId: insertTradeProposal.proposerId,
      offeredCards: insertTradeProposal.offeredCards,
      requestedCards: insertTradeProposal.requestedCards,
      status: insertTradeProposal.status || 'pending',
      createdAt: new Date(),
    };
    this.tradeProposals.set(proposal.id, proposal);
    return proposal;
  }

  async updateTradeProposal(id: number, updates: Partial<InsertTradeProposal>): Promise<TradeProposal | undefined> {
    const proposal = this.tradeProposals.get(id);
    if (!proposal) return undefined;
    
    const updated = { ...proposal, ...updates };
    this.tradeProposals.set(id, updated);
    return updated;
  }
}

export const storage = new DatabaseStorage();

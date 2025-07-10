import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  nickname: text("nickname").notNull().unique(),
  password: text("password").notNull(),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  totalCards: integer("total_cards").notNull(),
  imageUrl: text("image_url"),
  year: integer("year"),
  publisher: text("publisher"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const figurines = pgTable("figurines", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").references(() => albums.id).notNull(),
  idFig: text("id_fig").notNull(), // "A1", "B20" etc.
  name: text("name").notNull(),
  team: text("team"), // "Inter", "Napoli" etc.
  category: text("category"), // "Serie A", "Allenatori", "Speciali"
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const userFigurines = pgTable("user_figurines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  figurineId: integer("figurine_id").references(() => figurines.id).notNull(),
  possiede: boolean("possiede").default(false).notNull(),
  doppione: boolean("doppione").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  userId1: integer("user_id_1").references(() => users.id).notNull(),
  userId2: integer("user_id_2").references(() => users.id).notNull(),
  compatibility: integer("compatibility").notNull(), // percentage 0-100
  status: text("status").default("pending").notNull(), // 'pending', 'accepted', 'declined'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text").notNull(), // 'text', 'predefined', 'trade_proposal'
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tradeProposals = pgTable("trade_proposals", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").references(() => matches.id).notNull(),
  proposerId: integer("proposer_id").references(() => users.id).notNull(),
  offeredCards: jsonb("offered_cards").notNull(), // array of figurine IDs
  requestedCards: jsonb("requested_cards").notNull(), // array of figurine IDs
  status: text("status").default("pending").notNull(), // 'pending', 'accepted', 'declined'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertAlbumSchema = createInsertSchema(albums).omit({
  id: true,
  createdAt: true,
});

export const insertFigurineSchema = createInsertSchema(figurines).omit({
  id: true,
});

export const insertUserFigurineSchema = createInsertSchema(userFigurines).omit({
  id: true,
  createdAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertTradeProposalSchema = createInsertSchema(tradeProposals).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  nickname: z.string().min(3, "Nickname deve essere almeno 3 caratteri"),
  password: z.string().min(6, "Password deve essere almeno 6 caratteri"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  userFigurines: many(userFigurines),
  sentMatches: many(matches, { relationName: "user1" }),
  receivedMatches: many(matches, { relationName: "user2" }),
  sentMessages: many(messages),
  tradeProposals: many(tradeProposals),
}));

export const albumsRelations = relations(albums, ({ many }) => ({
  figurines: many(figurines),
}));

export const figurinesRelations = relations(figurines, ({ one, many }) => ({
  album: one(albums, {
    fields: [figurines.albumId],
    references: [albums.id],
  }),
  userFigurines: many(userFigurines),
}));

export const userFigurinesRelations = relations(userFigurines, ({ one }) => ({
  user: one(users, {
    fields: [userFigurines.userId],
    references: [users.id],
  }),
  figurine: one(figurines, {
    fields: [userFigurines.figurineId],
    references: [figurines.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  user1: one(users, {
    fields: [matches.userId1],
    references: [users.id],
    relationName: "user1",
  }),
  user2: one(users, {
    fields: [matches.userId2],
    references: [users.id],
    relationName: "user2",
  }),
  messages: many(messages),
  tradeProposals: many(tradeProposals),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, {
    fields: [messages.matchId],
    references: [matches.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const tradeProposalsRelations = relations(tradeProposals, ({ one }) => ({
  match: one(matches, {
    fields: [tradeProposals.matchId],
    references: [matches.id],
  }),
  proposer: one(users, {
    fields: [tradeProposals.proposerId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Album = typeof albums.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Figurine = typeof figurines.$inferSelect;
export type InsertFigurine = z.infer<typeof insertFigurineSchema>;
export type UserFigurine = typeof userFigurines.$inferSelect;
export type InsertUserFigurine = z.infer<typeof insertUserFigurineSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type TradeProposal = typeof tradeProposals.$inferSelect;
export type InsertTradeProposal = z.infer<typeof insertTradeProposalSchema>;
export type LoginData = z.infer<typeof loginSchema>;

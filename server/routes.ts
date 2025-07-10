import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema } from "@shared/schema";
import bcrypt from "bcryptjs";
import express from "express";
import path from "path";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve PWA files from client/public
  const publicPath = path.resolve(import.meta.dirname, "..", "client", "public");
  app.use(express.static(publicPath));

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if nickname already exists
      const existingUser = await storage.getUserByNickname(validatedData.nickname);
      if (existingUser) {
        return res.status(400).json({ error: "Nickname già in uso" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Set session
      req.session.userId = user.id;
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ error: "Errore sessione" });
        }
        
        res.json({ 
          user: { 
            id: user.id, 
            nickname: user.nickname, 
            location: user.location 
          } 
        });
      });
    } catch (error) {
      res.status(400).json({ error: "Dati di registrazione non validi" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      const user = await storage.getUserByNickname(validatedData.nickname);
      if (!user) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      const validPassword = await bcrypt.compare(validatedData.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Credenziali non valide" });
      }

      req.session.userId = user.id;
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ error: "Errore sessione" });
        }
        
        res.json({ 
          user: { 
            id: user.id, 
            nickname: user.nickname, 
            location: user.location 
          } 
        });
      });
    } catch (error) {
      res.status(400).json({ error: "Dati di login non validi" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Errore durante il logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "Utente non trovato" });
    }

    res.json({ 
      user: { 
        id: user.id, 
        nickname: user.nickname, 
        location: user.location 
      } 
    });
  });

  // Albums routes
  app.get("/api/albums", async (req, res) => {
    try {
      const albums = await storage.getAlbums();
      res.json(albums);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero degli album" });
    }
  });

  app.get("/api/albums/:id/figurines", async (req, res) => {
    try {
      const albumId = parseInt(req.params.id);
      const figurines = await storage.getFigurines(albumId);
      res.json(figurines);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero delle figurine" });
    }
  });

  // User figurines routes
  app.get("/api/user/figurines", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const albumId = req.query.albumId ? parseInt(req.query.albumId as string) : undefined;
      const userFigurines = await storage.getUserFigurines(req.session.userId, albumId);
      res.json(userFigurines);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero delle figurine utente" });
    }
  });

  app.post("/api/user/figurines", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const userFigurine = await storage.createUserFigurine({
        ...req.body,
        userId: req.session.userId,
      });
      res.json(userFigurine);
    } catch (error) {
      res.status(400).json({ error: "Errore nell'aggiunta della figurina" });
    }
  });

  app.put("/api/user/figurines/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateUserFigurine(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Figurina non trovata" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Errore nell'aggiornamento della figurina" });
    }
  });

  app.delete("/api/user/figurines/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUserFigurine(id);
      if (!deleted) {
        return res.status(404).json({ error: "Figurina non trovata" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Errore nella rimozione della figurina" });
    }
  });

  // Matches routes
  app.get("/api/matches", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const matches = await storage.getMatches(req.session.userId);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei match" });
    }
  });

  app.get("/api/matches/potential", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const potentialMatches = await storage.findPotentialMatches(req.session.userId);
      res.json(potentialMatches);
    } catch (error) {
      res.status(500).json({ error: "Errore nella ricerca di match" });
    }
  });

  app.post("/api/matches", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const match = await storage.createMatch({
        userId1: req.session.userId,
        userId2: req.body.userId2,
        compatibility: req.body.compatibility,
      });
      res.json(match);
    } catch (error) {
      res.status(400).json({ error: "Errore nella creazione del match" });
    }
  });

  // Messages routes
  app.get("/api/matches/:matchId/messages", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const matchId = parseInt(req.params.matchId);
      const messages = await storage.getMessages(matchId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(matchId, req.session.userId);
      
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero dei messaggi" });
    }
  });

  app.post("/api/matches/:matchId/messages", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const matchId = parseInt(req.params.matchId);
      const message = await storage.createMessage({
        matchId,
        senderId: req.session.userId,
        content: req.body.content,
        messageType: req.body.messageType || "text",
      });
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Errore nell'invio del messaggio" });
    }
  });

  // Trade proposals routes
  app.get("/api/matches/:matchId/trade-proposals", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const matchId = parseInt(req.params.matchId);
      const proposals = await storage.getTradeProposals(matchId);
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ error: "Errore nel recupero delle proposte" });
    }
  });

  app.post("/api/matches/:matchId/trade-proposals", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const matchId = parseInt(req.params.matchId);
      const proposal = await storage.createTradeProposal({
        matchId,
        proposerId: req.session.userId,
        offeredCards: req.body.offeredCards,
        requestedCards: req.body.requestedCards,
      });
      res.json(proposal);
    } catch (error) {
      res.status(400).json({ error: "Errore nella creazione della proposta" });
    }
  });

  app.put("/api/trade-proposals/:id", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateTradeProposal(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Proposta non trovata" });
      }
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Errore nell'aggiornamento della proposta" });
    }
  });

  // User profile routes
  app.put("/api/user/profile", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Non autenticato" });
    }

    try {
      const updated = await storage.updateUser(req.session.userId, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Utente non trovato" });
      }
      res.json({ 
        user: { 
          id: updated.id, 
          nickname: updated.nickname, 
          location: updated.location 
        } 
      });
    } catch (error) {
      res.status(400).json({ error: "Errore nell'aggiornamento del profilo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

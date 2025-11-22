import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { cache } from "./cache";
import { insertGameSchema, insertGroupSchema, insertGroupGameSchema, insertMessageSchema } from "@shared/schema";

const uploadDir = path.join(process.cwd(), "uploads");
const gamesDir = path.join(uploadDir, "games");
const thumbnailsDir = path.join(uploadDir, "thumbnails");

// Ensure upload directories exist
async function ensureUploadDirs() {
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.mkdir(gamesDir, { recursive: true });
  await fs.mkdir(thumbnailsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      await ensureUploadDirs();
      if (file.fieldname === "gameFile") {
        cb(null, gamesDir);
      } else if (file.fieldname === "thumbnail") {
        cb(null, thumbnailsDir);
      } else {
        cb(new Error("Unexpected field"), "");
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "gameFile") {
      const isHtml = file.originalname.endsWith(".html") || file.mimetype === "text/html" || file.mimetype === "text/plain";
      const isSwf = file.originalname.endsWith(".swf") || file.mimetype === "application/x-shockwave-flash" || file.mimetype === "application/octet-stream";
      
      if (isHtml || isSwf) {
        cb(null, true);
      } else {
        cb(new Error("Only HTML or SWF files are allowed"));
      }
    } else if (file.fieldname === "thumbnail") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"));
      }
    } else {
      cb(new Error("Unexpected field"));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure upload directories exist on startup
  await ensureUploadDirs();

  // Simple hash function for demo (use bcrypt in production)
  const hashPassword = (pwd: string) => Buffer.from(pwd).toString("base64");
  
  // AUTH ENDPOINTS
  
  // POST /api/auth/register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const passwordHash = hashPassword(password);
      const user = await storage.createUser(username, passwordHash);
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(400).json({ message: "Failed to register" });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const passwordHash = hashPassword(password);
      const user = await storage.authenticateUser(username, passwordHash);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(400).json({ message: "Failed to login" });
    }
  });

  // Serve thumbnails and other assets (but not HTML files)
  app.use("/uploads/thumbnails", async (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  app.use("/uploads/thumbnails", (await import("express")).static(thumbnailsDir));

  // Dedicated endpoint to serve game HTML files with CSP sandbox isolation
  // This forces uploaded HTML into a unique origin even when accessed directly
  app.get("/api/play/:gameId", async (req, res) => {
    try {
      const game = await storage.getGame(req.params.gameId);
      if (!game) {
        return res.status(404).send("Game not found");
      }

      const htmlPath = path.join(process.cwd(), game.htmlPath.replace("/uploads/", "uploads/"));
      
      // Allow games to load external content and run scripts
      // Removed restrictive COEP/COOP headers to allow external iframes
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Disposition", "inline");
      
      res.sendFile(htmlPath);
    } catch (error) {
      console.error("Error serving game:", error);
      res.status(500).send("Failed to load game");
    }
  });

  // GET /api/games - Get all games
  app.get("/api/games", async (req, res) => {
    try {
      const cached = cache.get("games:all");
      if (cached) {
        return res.json(cached);
      }
      const games = await storage.getAllGames();
      cache.set("games:all", games);
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // GET /api/games/:id - Get a specific game
  app.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGame(req.params.id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      console.error("Error fetching game:", error);
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  // POST /api/games - Upload a new game
  app.post(
    "/api/games",
    upload.fields([
      { name: "gameFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        if (!files.gameFile || !files.thumbnail) {
          return res.status(400).json({ 
            message: "Both game file and thumbnail are required" 
          });
        }

        const gameFile = files.gameFile[0];
        const thumbnailFile = files.thumbnail[0];
        const { title, username } = req.body;

        if (!title || !username) {
          return res.status(400).json({ message: "Game title and username are required" });
        }

        const user = await storage.getOrCreateUser(username);

        // Determine game type
        const gameType = gameFile.originalname.endsWith(".swf") ? "swf" : "html";

        // Create paths relative to the uploads directory
        const htmlPath = `/uploads/games/${gameFile.filename}`;
        const thumbnailPath = `/uploads/thumbnails/${thumbnailFile.filename}`;

        const gameData = insertGameSchema.parse({
          title,
          htmlPath,
          thumbnail: thumbnailPath,
          gameType,
          createdBy: user.id,
        });

        const game = await storage.createGame(gameData);
        cache.invalidatePattern("games:");
        res.status(201).json(game);
      } catch (error) {
        console.error("Error uploading game:", error);
        if (error instanceof Error) {
          res.status(400).json({ message: error.message });
        } else {
          res.status(500).json({ message: "Failed to upload game" });
        }
      }
    }
  );

  // DELETE /api/games/:id - Delete a game
  app.delete("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGame(req.params.id);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const username = req.body.username;
      const user = await storage.getUserByUsername(username);
      
      if (!user || game.createdBy !== user.id) {
        return res.status(403).json({ message: "You can only delete games you created" });
      }

      await storage.deleteGame(req.params.id);
      cache.invalidatePattern("games:");
      res.json({ message: "Game deleted" });
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  // POST /api/games/paste-code - Create a game from pasted HTML code
  app.post(
    "/api/games/paste-code",
    upload.single("thumbnail"),
    async (req, res) => {
      try {
        const { title, username, htmlCode } = req.body;
        const thumbnailFile = req.file;

        if (!title || !username || !htmlCode) {
          return res.status(400).json({ message: "Title, username, and HTML code are required" });
        }

        if (!thumbnailFile) {
          return res.status(400).json({ message: "Thumbnail is required" });
        }

        const user = await storage.getOrCreateUser(username);

        // Save HTML code to file
        await ensureUploadDirs();
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const htmlFilename = `gameFile-${uniqueSuffix}.html`;
        const htmlFilePath = path.join(gamesDir, htmlFilename);
        
        await fs.writeFile(htmlFilePath, htmlCode, "utf-8");

        // Create paths relative to the uploads directory
        const htmlPath = `/uploads/games/${htmlFilename}`;
        const thumbnailPath = `/uploads/thumbnails/${thumbnailFile.filename}`;

        const gameData = insertGameSchema.parse({
          title,
          htmlPath,
          thumbnail: thumbnailPath,
          gameType: "html",
          createdBy: user.id,
        });

        const game = await storage.createGame(gameData);
        cache.invalidatePattern("games:");
        res.status(201).json(game);
      } catch (error) {
        console.error("Error creating game from code:", error);
        if (error instanceof Error) {
          res.status(400).json({ message: error.message });
        } else {
          res.status(500).json({ message: "Failed to create game" });
        }
      }
    }
  );

  // GROUP ENDPOINTS

  // GET /api/groups - Get all groups
  app.get("/api/groups", async (req, res) => {
    try {
      const cached = cache.get("groups:all");
      if (cached) {
        return res.json(cached);
      }
      const groups = await storage.getAllGroups();
      cache.set("groups:all", groups);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  // GET /api/users/:username/groups - Get groups for a user
  app.get("/api/users/:username/groups", async (req, res) => {
    try {
      const cacheKey = `user:${req.params.username}:groups`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) return res.json([]);
      const groups = await storage.getUserGroups(user.id);
      cache.set(cacheKey, groups);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  // POST /api/groups - Create a new group
  app.post("/api/groups", async (req, res) => {
    try {
      const { name, description, username, isPrivate } = req.body;
      if (!name || !username) {
        return res.status(400).json({ message: "Name and username required" });
      }

      const user = await storage.getOrCreateUser(username);
      const groupData = {
        name,
        description: description || "",
        createdBy: user.id,
        isPrivate: isPrivate || false,
      };

      const group = await storage.createGroup(groupData);
      cache.invalidate("groups:all");
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(400).json({ message: "Failed to create group" });
    }
  });

  // POST /api/groups/join-code - Join group with code
  app.post("/api/groups/join-code", async (req, res) => {
    try {
      const { joinCode, username } = req.body;
      if (!joinCode || !username) {
        return res.status(400).json({ message: "Join code and username required" });
      }

      const user = await storage.getOrCreateUser(username);
      const group = await storage.joinGroupWithCode(user.id, joinCode);
      if (!group) {
        return res.status(404).json({ message: "Invalid join code" });
      }

      res.json({ message: "Joined group", group });
    } catch (error) {
      console.error("Error joining with code:", error);
      res.status(400).json({ message: "Failed to join group" });
    }
  });

  // GET /api/groups/:groupId - Get group details
  app.get("/api/groups/:groupId", async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });
      res.json(group);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  // GET /api/groups/:groupId/members - Get group members
  app.get("/api/groups/:groupId/members", async (req, res) => {
    try {
      const members = await storage.getGroupMembers(req.params.groupId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // POST /api/groups/:groupId/join - Join a group
  app.post("/api/groups/:groupId/join", async (req, res) => {
    try {
      const { username } = req.body;
      if (!username) return res.status(400).json({ message: "Username required" });

      const user = await storage.getOrCreateUser(username);
      const isMember = await storage.isGroupMember(req.params.groupId, user.id);
      
      if (isMember) return res.status(400).json({ message: "Already a member" });

      await storage.addGroupMember(req.params.groupId, user.id);
      res.json({ message: "Joined group" });
    } catch (error) {
      res.status(400).json({ message: "Failed to join group" });
    }
  });

  // GET /api/groups/:groupId/games - Get group games
  app.get("/api/groups/:groupId/games", async (req, res) => {
    try {
      const games = await storage.getGroupGames(req.params.groupId);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch group games" });
    }
  });

  // POST /api/groups/:groupId/games - Upload game to group
  app.post(
    "/api/groups/:groupId/games",
    upload.fields([
      { name: "htmlFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const { title, username } = req.body;

        if (!files.htmlFile || !files.thumbnail) {
          return res.status(400).json({ message: "Both files required" });
        }
        if (!title || !username) {
          return res.status(400).json({ message: "Title and username required" });
        }

        const user = await storage.getOrCreateUser(username);
        const htmlPath = `/uploads/games/${files.htmlFile[0].filename}`;
        const thumbnailPath = `/uploads/thumbnails/${files.thumbnail[0].filename}`;

        const gameData = insertGroupGameSchema.parse({
          groupId: req.params.groupId,
          title,
          htmlPath,
          thumbnail: thumbnailPath,
          uploadedBy: user.id,
        });

        const game = await storage.createGroupGame(gameData);
        res.status(201).json(game);
      } catch (error) {
        console.error("Error uploading group game:", error);
        res.status(400).json({ message: "Failed to upload game" });
      }
    }
  );

  // GET /api/groups/:groupId/messages - Get group messages
  app.get("/api/groups/:groupId/messages", async (req, res) => {
    try {
      const messages = await storage.getGroupMessages(req.params.groupId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // POST /api/groups/:groupId/messages - Send message
  app.post("/api/groups/:groupId/messages", async (req, res) => {
    try {
      const { content, username } = req.body;
      if (!content || !username) {
        return res.status(400).json({ message: "Content and username required" });
      }

      const user = await storage.getOrCreateUser(username);
      const messageData = insertMessageSchema.parse({
        groupId: req.params.groupId,
        userId: user.id,
        content,
      });

      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // COINS & COSMETICS ENDPOINTS

  // GET /api/leaderboard - Get top 10 users by coins
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const cached = cache.get("leaderboard:top10");
      if (cached) {
        return res.json(cached);
      }
      const leaderboard = await storage.getLeaderboard(10);
      cache.set("leaderboard:top10", leaderboard);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // GET /api/cosmetics - Get all cosmetics
  app.get("/api/cosmetics", async (req, res) => {
    try {
      const cached = cache.get("cosmetics:all");
      if (cached) {
        return res.json(cached);
      }
      const allCosmetics = await storage.getAllCosmetics();
      cache.set("cosmetics:all", allCosmetics);
      res.json(allCosmetics);
    } catch (error) {
      console.error("Error fetching cosmetics:", error);
      res.status(500).json({ message: "Failed to fetch cosmetics" });
    }
  });

  // GET /api/users/:username/cosmetics - Get user owned cosmetics
  app.get("/api/users/:username/cosmetics", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const userCosmetics = await storage.getUserCosmetics(user.id);
      const activeCosmetic = await storage.getActiveCosmetic(user.id);
      res.json({ owned: userCosmetics, active: activeCosmetic });
    } catch (error) {
      console.error("Error fetching user cosmetics:", error);
      res.status(500).json({ message: "Failed to fetch cosmetics" });
    }
  });

  // POST /api/cosmetics/purchase - Purchase a cosmetic
  app.post("/api/cosmetics/purchase", async (req, res) => {
    try {
      const { username, cosmeticId } = req.body;
      if (!username || !cosmeticId) {
        return res.status(400).json({ message: "Username and cosmetic ID required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const cosmetic = await storage.getAllCosmetics();
      const item = cosmetic.find(c => c.id === cosmeticId);
      if (!item) {
        return res.status(404).json({ message: "Cosmetic not found" });
      }

      if (user.coins < item.price) {
        return res.status(400).json({ message: "Not enough coins" });
      }

      // Deduct coins
      await storage.addCoins(user.id, -item.price);
      
      // Purchase cosmetic
      const purchased = await storage.purchaseCosmetic(user.id, cosmeticId);
      cache.invalidate(`user:${username}:cosmetics`);
      cache.invalidate("leaderboard:top10");
      res.status(201).json(purchased);
    } catch (error) {
      console.error("Error purchasing cosmetic:", error);
      res.status(400).json({ message: "Failed to purchase cosmetic" });
    }
  });

  // POST /api/cosmetics/activate - Activate a cosmetic
  app.post("/api/cosmetics/activate", async (req, res) => {
    try {
      const { username, cosmeticId } = req.body;
      if (!username) {
        return res.status(400).json({ message: "Username required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const active = await storage.setActiveCosmetic(user.id, cosmeticId || null);
      res.json(active);
    } catch (error) {
      console.error("Error activating cosmetic:", error);
      res.status(400).json({ message: "Failed to activate cosmetic" });
    }
  });

  // POST /api/coins/add - Add coins to user (called when playing games)
  app.post("/api/coins/add", async (req, res) => {
    try {
      const { username, amount } = req.body;
      if (!username || !amount) {
        return res.status(400).json({ message: "Username and amount required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updated = await storage.addCoins(user.id, amount);
      cache.invalidate(`user:${username}`);
      cache.invalidate("leaderboard:top10");
      res.json(updated);
    } catch (error) {
      console.error("Error adding coins:", error);
      res.status(400).json({ message: "Failed to add coins" });
    }
  });

  // GET /api/users/:username - Get user with coins
  app.get("/api/users/:username", async (req, res) => {
    try {
      const cacheKey = `user:${req.params.username}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      cache.set(cacheKey, user);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

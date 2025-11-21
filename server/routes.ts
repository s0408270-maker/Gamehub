import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { insertGameSchema } from "@shared/schema";

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
      if (file.fieldname === "htmlFile") {
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
    if (file.fieldname === "htmlFile") {
      if (file.mimetype === "text/html" || file.originalname.endsWith(".html")) {
        cb(null, true);
      } else {
        cb(new Error("Only HTML files are allowed"));
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
      
      // CSP sandbox header forces unique origin isolation for uploaded HTML
      // This prevents XSS even when the endpoint is accessed directly
      res.setHeader(
        "Content-Security-Policy", 
        "sandbox allow-scripts allow-forms allow-pointer-lock; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob:; child-src 'none';"
      );
      
      // Additional security headers
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Content-Type", "text/html");
      
      res.sendFile(htmlPath);
    } catch (error) {
      console.error("Error serving game:", error);
      res.status(500).send("Failed to load game");
    }
  });

  // GET /api/games - Get all games
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getAllGames();
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
      { name: "htmlFile", maxCount: 1 },
      { name: "thumbnail", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        if (!files.htmlFile || !files.thumbnail) {
          return res.status(400).json({ 
            message: "Both HTML file and thumbnail are required" 
          });
        }

        const htmlFile = files.htmlFile[0];
        const thumbnailFile = files.thumbnail[0];
        const { title } = req.body;

        if (!title) {
          return res.status(400).json({ message: "Game title is required" });
        }

        // Create paths relative to the uploads directory
        // Store the file system path for HTML (to be served via /api/play/:gameId)
        const htmlPath = `/uploads/games/${htmlFile.filename}`;
        const thumbnailPath = `/uploads/thumbnails/${thumbnailFile.filename}`;

        const gameData = insertGameSchema.parse({
          title,
          htmlPath,
          thumbnail: thumbnailPath,
        });

        const game = await storage.createGame(gameData);
        
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

  const httpServer = createServer(app);

  return httpServer;
}

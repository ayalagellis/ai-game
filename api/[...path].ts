import type { VercelRequest, VercelResponse } from "@vercel/node";
import "../server/src/config/env.js";
import app from "../server/src/app.js";
import { DatabaseService } from "../server/src/db/databaseService.js";

let dbInitialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Initialize DB once on cold start
  if (!dbInitialized && process.env["DATABASE_URL"] && process.env["DISABLE_DB"] !== "true") {
    try {
      const db = new DatabaseService();
      await db.initialize();
      dbInitialized = true;
      console.log("✓ Database initialized");
    } catch (err) {
      console.error("✗ DB init failed:", err);
    }
  }

  // Pass request directly to Express (no Promise wrapper needed)
  app(req as any, res as any);
}
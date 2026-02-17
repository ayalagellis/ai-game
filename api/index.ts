import type { VercelRequest, VercelResponse } from "@vercel/node";
import "../server/src/config/env.js";
import app from "../server/src/app.js";
import { DatabaseService } from "../server/src/db/databaseService.js";

let dbInitialized = false;

const handler = async (req: VercelRequest, res: VercelResponse) => {
  // Initialize DB on first request
  if (!dbInitialized && process.env["DATABASE_URL"] && process.env["DISABLE_DB"] !== "true") {
    try {
      const db = new DatabaseService();
      await db.initialize();
      dbInitialized = true;
    } catch (err) {
      console.error("DB init failed:", err);
    }
  }

  // Let Express handle the request
  return new Promise((resolve, reject) => {
    app(req as any, res as any, (err: any) => {
      if (err) reject(err);
      else resolve(undefined);
    });
  });
};

export default handler;
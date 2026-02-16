import "./config/env.js";

import express from "express";
import cors from "cors";
import helmet from "helmet";

import { gameRoutes } from "./routes/gameRoutes.js";
import { errorHandler } from "./utils/errorHandler.js";
import { logger } from "./utils/logger.js";
import { mcpRouter } from "./mcp/mcp-server.js";

const app = express();

/* -------------------- Middleware -------------------- */
app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* -------------------- Request Logging -------------------- */
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

/* -------------------- Routes -------------------- */
app.use("/api", gameRoutes);

/* MCP router — MUST be before 404 */
app.use(mcpRouter);

/* -------------------- Health Check -------------------- */
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    database:
      process.env["DISABLE_DB"] === "true" ? "disabled" : "enabled",
  });
});

/* -------------------- 404 Handler -------------------- */
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

/* -------------------- Error Handler -------------------- */
app.use(errorHandler);

export default app;

import app from "./app.js";
import { DatabaseService } from "./db/databaseService.js";
import { logger } from "./utils/logger.js";

const PORT = process.env["PORT"] || 3000;

let server: any = null;

/* -------------------- Server Bootstrap -------------------- */
async function startServer() {
  try {
    const dbDisabled = process.env["DISABLE_DB"] === "true";

    if (dbDisabled) {
      logger.warn(
        "Database is DISABLED via DISABLE_DB flag - running without database"
      );
    } else if (process.env["DATABASE_URL"]) {
      const dbService = new DatabaseService();
      await dbService.initialize();
      logger.info("Database initialized successfully");
    } else {
      logger.warn(
        "DATABASE_URL not set - database features will be unavailable"
      );
    }

    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(
        `MCP Server available at http://localhost:${PORT}/mcp`
      );
      logger.info(`Environment: ${process.env["NODE_ENV"]}`);
      logger.info(`Database: ${dbDisabled ? "DISABLED" : "enabled"}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

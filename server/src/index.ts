// IMPORTANT: Load environment variables FIRST before any other imports
import "./config/env.js";

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { gameRoutes } from './routes/gameRoutes.js';
import { errorHandler } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';
import { DatabaseService } from './db/databaseService.js';
import { mcpRouter } from './mcp/mcp-server.js';

const app = express();
const PORT = process.env['PORT'] || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env['CORS_ORIGIN'] || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Routes
app.use('/api', gameRoutes);

// Mount MCP router - MUST be before 404 handler
app.use(mcpRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: process.env['DISABLE_DB'] === 'true' ? 'disabled' : 'enabled'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handling
app.use(errorHandler);

let server: any = null;

// Initialize database and start server
async function startServer() {
  try {
    // Check if database should be disabled
    const dbDisabled = process.env['DISABLE_DB'] === 'true';
    
    if (dbDisabled) {
      logger.warn('Database is DISABLED via DISABLE_DB flag - running without database');
    } else if (process.env['DATABASE_URL']) {
      // Initialize database tables only if DATABASE_URL is set AND database is not disabled
      const dbService = new DatabaseService();
      await dbService.initialize();
      logger.info('Database initialized successfully');
    } else {
      logger.warn('DATABASE_URL not set - database features will be unavailable');
    }
    
    // Start server
    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`MCP Server available at http://localhost:${PORT}/mcp`);
      logger.info(`Environment: ${process.env['NODE_ENV']}`);
      logger.info(`Database: ${dbDisabled ? 'DISABLED' : 'enabled'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown handler for ECS deployments
process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM received - starting graceful shutdown...');
  
  if (server) {
    // Stop accepting new connections
    server.close(() => {
      logger.info('✅ Server closed - all connections finished');
      process.exit(0);
    });
    
    // Force shutdown after 30 seconds if still running
    setTimeout(() => {
      logger.error('⚠️ Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
});

// Also handle SIGINT for local development (Ctrl+C)
process.on('SIGINT', async () => {
  logger.info('🛑 SIGINT received - shutting down...');
  if (server) {
    server.close(() => {
      logger.info('✅ Server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

export default app;

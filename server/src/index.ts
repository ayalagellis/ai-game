// IMPORTANT: Load environment variables FIRST before any other imports
import './config/env';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { gameRoutes } from './routes/gameRoutes';
import { errorHandler } from './utils/errorHandler';
import { logger } from './utils/logger';
import { DatabaseService } from './db/databaseService';

const app = express();
const PORT = process.env['PORT'] || 3001;

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
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

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database tables if DATABASE_URL is set
    if (process.env['DATABASE_URL']) {
      const dbService = new DatabaseService();
      await dbService.initialize();
      logger.info('Database initialized successfully');
    } else {
      logger.warn('DATABASE_URL not set - database features will be unavailable');
    }
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env['NODE_ENV']}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;

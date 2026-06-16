import express from 'express';
import cors from 'cors';
import gatewayRouter from './api/routes.js';
import { getCompressionMiddleware } from './shared/performance/compression.js';
import logger from './shared/logger/logger.js';
import { initDashboardListeners } from './domains/dashboard/service/dashboard.service.js';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize Payload Compression dynamically
const compressionMiddleware = await getCompressionMiddleware();
app.use(compressionMiddleware);

// Initialize Dashboard event handlers
initDashboardListeners();

// Centralized Request logging middleware
app.use((req, res, next) => {
  logger.info(`[HTTP] ${req.method} ${req.url}`, { ip: req.ip });
  next();
});

// Mount Unified API Router Gateway
app.use('/api', gatewayRouter);

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  logger.error("Unhandled Exception caught in Express server gate:", err);

  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  return res.status(statusCode).json({
    status,
    message: err.message || "An internal server error occurred.",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;

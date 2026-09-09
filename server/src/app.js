import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import gatewayRouter from './api/routes.js';
import { getCompressionMiddleware } from './shared/performance/compression.js';
import logger from './shared/logger/logger.js';
import { initDashboardListeners } from './domains/dashboard/service/dashboard.service.js';
import passport from 'passport';
import './domains/auth/passport.js';

import { rateLimiter } from './middlewares/rateLimiter.js';
import { metricsMiddleware, metricsRoute } from './middlewares/metrics.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: false, // In development, can be restrictive for React
}));

app.use(passport.initialize());

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Metrics middleware (before other routes)
app.use(metricsMiddleware);

// Expose metrics endpoint
app.get('/metrics', metricsRoute);

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

// Health check endpoint (unauthenticated)
app.get('/health', (req, res) => {
  return res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Swagger Documentation setup
try {
  const swaggerPath = path.join(__dirname, '../../swagger.json');
  if (fs.existsSync(swaggerPath)) {
    const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  }
} catch (e) {
  logger.warn('Could not load swagger.json', { error: e.message });
}

// Mount Unified API Router Gateway with global rate limiting (100 req per 15 min per IP)
app.use('/api', rateLimiter(100, 15 * 60 * 1000), gatewayRouter);

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

// Serve static assets from public (e.g. PDFs)
app.use(express.static(path.join(__dirname, '../../public')));

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

export default app;

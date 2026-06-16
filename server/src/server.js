import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import { initDb } from './infrastructure/db/mongo.js';
import { initSocketServer } from './infrastructure/realtime/socket.server.js';
import logger from './shared/logger/logger.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    logger.info("Initializing database connections & path alignments...");
    await initDb();

    logger.info("Creating server wrapper for HTTP and WebSockets connections...");
    const server = http.createServer(app);

    logger.info("Initializing WebSockets layer...");
    await initSocketServer(server);

    server.listen(PORT, () => {
      logger.info(`====================================================`);
      logger.info(`🚀 CareerPilot AI Domain Monolith booted successfully!`);
      logger.info(`📡 API Gate Listening on: http://localhost:${PORT}`);
      logger.info(`====================================================`);
    });
  } catch (err) {
    logger.error("CRITICAL: Failed to bootstrap Domain Monolith server:", err);
    process.exit(1);
  }
}

bootstrap();

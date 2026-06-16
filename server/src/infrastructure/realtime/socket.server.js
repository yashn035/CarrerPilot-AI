import logger from '../../shared/logger/logger.js';

let ioInstance = null;

class MockSocket {
  constructor(id) {
    this.id = id;
    this.rooms = new Set();
  }

  join(room) {
    this.rooms.add(room);
    logger.info(`[MockSocket] Socket ${this.id} joined room: ${room}`);
  }

  leave(room) {
    this.rooms.delete(room);
    logger.info(`[MockSocket] Socket ${this.id} left room: ${room}`);
  }

  emit(event, data) {
    logger.info(`[MockSocket Emit] Event: '${event}' to Client ${this.id}`, data);
  }
}

class MockSocketServer {
  constructor() {
    logger.info("Initializing WebSocket Simulation Server (Mock Socket.io).");
  }

  to(room) {
    return {
      emit: (event, data) => {
        logger.info(`[MockSocket Broadcast] Room '${room}' -> '${event}':`, data);
      }
    };
  }

  emit(event, data) {
    logger.info(`[MockSocket Broadcast All] -> '${event}':`, data);
  }

  on(event, callback) {
    logger.info(`[MockSocket Server] Registered event listener for: '${event}'`);
  }
}

/**
 * Initializes socket.io or fallback mock server
 * @param {Object} httpServer 
 * @returns {Object}
 */
export async function initSocketServer(httpServer) {
  try {
    const { Server } = await import('socket.io');
    ioInstance = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    ioInstance.on('connection', (socket) => {
      logger.info(`Client connected: Socket ID = ${socket.id}`);

      socket.on('join_room', (room) => {
        socket.join(room);
        logger.info(`Client ${socket.id} joined room: ${room}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: Socket ID = ${socket.id}`);
      });
    });

    logger.info("Successfully initialized production Socket.io Server.");
  } catch (err) {
    logger.warn("Could not load 'socket.io' dependency. Activating Mock WebSockets layer.", { error: err.message });
    ioInstance = new MockSocketServer();
  }

  return ioInstance;
}

/**
 * Retrieves global WebSockets server instance
 * @returns {Object}
 */
export function getSocketServer() {
  if (!ioInstance) {
    ioInstance = new MockSocketServer();
  }
  return ioInstance;
}

export default {
  initSocketServer,
  getSocketServer
};

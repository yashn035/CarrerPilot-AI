import { EventEmitter } from 'events';
import logger from '../logger/logger.js';

class CentralEventBus extends EventEmitter {
  constructor() {
    super();
    logger.info("Central Event Bus successfully initialized.");
  }

  /**
   * Publishes an event internally and forwards it to active Socket connections.
   * @param {string} event 
   * @param {Object} data 
   * @returns {boolean}
   */
  emit(event, data) {
    logger.info(`[EventBus] Publishing event: '${event}'`, { userId: data?.userId });
    
    const result = super.emit(event, data);

    // Forward the event to the WebSockets server for real-time client sync
    try {
      import('../../infrastructure/realtime/socket.server.js')
        .then(({ getSocketServer }) => {
          const io = getSocketServer();
          if (io) {
            // Emits general events and targeted notifications based on userId
            if (data && data.userId) {
              // Emit user-specific channel and general state_update
              io.to(`user:${data.userId}`).emit(event, data);
              io.to(`user:${data.userId}`).emit('state_update', data);
              
              // Fallback: emit global event for simple client connections
              io.emit(event, data);
              io.emit('state_update', data);
            } else {
              io.emit(event, data);
            }
          }
        })
        .catch(err => {
          logger.warn("WebSocket forwarding skipped in EventBus.", { error: err.message });
        });
    } catch (err) {
      logger.error("Circular/Dynamic WebSocket resolution error in EventBus:", err);
    }

    return result;
  }
}

const eventBus = new CentralEventBus();
export default eventBus;

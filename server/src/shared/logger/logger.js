const LogLevels = {
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  debug: 'DEBUG'
};

class Logger {
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length ? ` | Meta: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  info(message, meta = {}) {
    console.log(this.formatMessage(LogLevels.info, message, meta));
  }

  warn(message, meta = {}) {
    console.warn(this.formatMessage(LogLevels.warn, message, meta));
  }

  error(message, errorObject = {}, meta = {}) {
    const errorDetails = errorObject.stack ? { stack: errorObject.stack, ...meta } : { ...errorObject, ...meta };
    console.error(this.formatMessage(LogLevels.error, message, errorDetails));
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatMessage(LogLevels.debug, message, meta));
    }
  }
}

const logger = new Logger();

export default logger;

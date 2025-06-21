// src/utils/logger.js

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  };
  
  // Set default log level based on environment
  const DEFAULT_LOG_LEVEL = process.env.NODE_ENV === 'development' ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
  
  class Logger {
    constructor() {
      this.logLevel = DEFAULT_LOG_LEVEL;
    }
  
    setLogLevel(level) {
      if (LOG_LEVELS[level] !== undefined) {
        this.logLevel = LOG_LEVELS[level];
      }
    }
  
    formatMessage(level, message, ...args) {
      const timestamp = new Date().toISOString();
      const formattedArgs = args.map(arg => {
        if (arg instanceof Error) {
          return arg.stack || arg.message;
        }
        if (typeof arg === 'object' && arg !== null) {
          try {
            // Check if it's a DOM element
            if (arg.nodeType) {
              return `[DOM Element: ${arg.tagName || 'Unknown'}]`;
            }
            // Check if it's a React element
            if (arg.$$typeof) {
              return '[React Element]';
            }
            // Try to stringify, with circular reference handling
            return JSON.stringify(arg, (key, value) => {
              if (typeof value === 'object' && value !== null) {
                // Skip React fibers and DOM properties
                if (key.startsWith('__react') || key.startsWith('_react') || value.nodeType) {
                  return '[Circular]';
                }
              }
              return value;
            });
          } catch (error) {
            return '[Object - Cannot stringify]';
          }
        }
        return arg;
      });
  
      return `[${timestamp}] ${level}: ${message} ${formattedArgs.join(' ')}`;
    }
  
    debug(message, ...args) {
      if (this.logLevel <= LOG_LEVELS.DEBUG) {
        console.debug(this.formatMessage('DEBUG', message, ...args));
      }
    }
  
    info(message, ...args) {
      if (this.logLevel <= LOG_LEVELS.INFO) {
        console.info(this.formatMessage('INFO', message, ...args));
      }
    }
  
    warn(message, ...args) {
      if (this.logLevel <= LOG_LEVELS.WARN) {
        console.warn(this.formatMessage('WARN', message, ...args));
      }
    }
  
    error(message, ...args) {
      if (this.logLevel <= LOG_LEVELS.ERROR) {
        console.error(this.formatMessage('ERROR', message, ...args));
      }
    }
  }
  
  // Create and export singleton instance
  const logger = new Logger();
  
  // Add development-only features
  if (process.env.NODE_ENV === 'development') {
    // Expose logger instance to window for debugging
    window.logger = logger;
    
    // Add method to change log level at runtime
    logger.setLevel = (level) => {
      logger.setLogLevel(level.toUpperCase());
      console.log(`Log level set to: ${level.toUpperCase()}`);
    };
  }
  
  export default logger;
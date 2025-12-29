// src/utils/devLog.js
// Development-only logging utility
// Use this instead of console.log for debug messages that should not appear in production

const isDev = process.env.NODE_ENV === 'development';

/**
 * Logs messages only in development environment
 * Drop-in replacement for console.log
 * @param  {...any} args - Arguments to log
 */
export const devLog = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

/**
 * Logs warnings only in development environment
 * @param  {...any} args - Arguments to log
 */
export const devWarn = (...args) => {
  if (isDev) {
    console.warn(...args);
  }
};

/**
 * Logs errors only in development environment
 * Note: For actual errors, use the logger utility instead
 * @param  {...any} args - Arguments to log
 */
export const devError = (...args) => {
  if (isDev) {
    console.error(...args);
  }
};

export default devLog;

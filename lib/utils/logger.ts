/**
 * Logger utility.
 * - log/error/warn/info: dev-only (safe for client; avoids leaking info in prod)
 * - serverError/serverInfo: always log when running on the server (no window),
 *   so production errors reach Vercel/hosting logs. Never use from client code.
 */
const isDevelopment = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  // Fallback for client-side: assume development if not explicitly production
  return typeof window !== 'undefined';
};

const isServer = () => typeof window === 'undefined';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.log(...args);
    }
  },
  error: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.error(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment()) {
      console.info(...args);
    }
  },
  serverError: (...args: unknown[]) => {
    if (isServer()) {
      console.error(...args);
    }
  },
  serverInfo: (...args: unknown[]) => {
    if (isServer()) {
      console.info(...args);
    }
  },
};


// src/middleware/logger.ts
import { Context, Next } from 'hono';
import { logInfo } from '@/utils/logger';

/**
 * Middleware for logging incoming requests.
 * Logs the HTTP method and path of each request.
 */
export const loggerMiddleware = async (c: Context, next: Next) => {
  logInfo(`Request: ${c.req.method} ${c.req.path}`);
  await next();
}; 
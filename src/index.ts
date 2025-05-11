// src/index.ts
import 'dotenv/config'; // Load environment variables
import { Hono } from 'hono';
import { logger as honoLoggerMiddleware } from 'hono/logger';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { serve } from '@hono/node-server';
import { rateLimiter } from 'hono-rate-limiter';
import { z } from 'zod';

import { logger } from './lib/logger'; // Adjusted path for direct execution context
import authRouter from './routes/auth.route'; // Adjusted path
import healthRouter from './routes/health.route'; // Adjusted path

const app = new Hono();

// --- Global Middlewares ---
app.use('*', honoLoggerMiddleware((message: string, ...rest: string[]) => {
    logger.info({ requestLog: { message, rest } }, 'Incoming request');
}));
app.use('*', cors({ origin: process.env.CORS_ORIGIN || '*' })); // Be more specific in production
app.use('*', secureHeaders()); // Review and customize options

const globalRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: 'draft-6', 
  keyGenerator: (c) => {
    // Prioritize x-forwarded-for if behind a proxy, then cf-connecting-ip, then fallback to a default
    const forwardedFor = c.req.header('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim(); // Get the first IP if multiple
    }
    const cloudflareIp = c.req.header('cf-connecting-ip');
    if (cloudflareIp) {
      return cloudflareIp;
    }
    // Fallback, though less reliable without direct socket access in a platform-agnostic way
    // For Node.js specific, c.req.raw.socket.remoteAddress could be used if Hono context typing allows direct access
    // For now, using a generic fallback or a session/API key if available for rate limiting is better
    return c.req.url + (c.req.header('user-agent') || 'unknown_agent'); // Less ideal fallback
  },
});
app.use('*', globalRateLimiter);

// --- Error Handling ---
app.onError((err, c) => {
  logger.error({ errorName: err.name, errorMessage: err.message, errorStack: err.stack, path: c.req.path, method: c.req.method }, 'Unhandled error');
  if (err instanceof z.ZodError) {
    return c.json({ error: 'Validation failed', issues: err.errors }, 400);
  }
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

// --- Routes ---
app.route('/auth', authRouter);
app.route('/', healthRouter);

// --- Server Initialization ---
const port = parseInt(process.env.PORT || '3001', 10);

logger.info(`🚀 Auth service is running on port ${port}`);

if (process.env.NODE_ENV !== 'test') { // Don't start server in test environment
    serve({
        fetch: app.fetch,
        port: port,
    });
}

export default app; // Optional: export app for testing or other purposes 
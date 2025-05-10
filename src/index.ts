// src/index.ts
import 'dotenv/config'; // Load environment variables
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { loggerMiddleware } from '@/middleware/logger';
import { logInfo, logError } from '@/utils/logger';
import exampleRoutes from '@/routes/example';

const app = new Hono();

// --- Middleware ---
app.use('*', loggerMiddleware); // Log all requests

// --- Routes ---
// Health check route
app.get('/healthz', (c: import('hono').Context) => {
  return c.json({ ok: true });
});

// Root route
app.get('/', (c: import('hono').Context) => {
  return c.json({
    serviceName: "slice-microservice-template", // Consider making this dynamic or configurable
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// Example routes
app.route('/example', exampleRoutes);

// --- Server Initialization ---
const port = parseInt(process.env.PORT || '3000', 10);

const startServer = () => {
  try {
    serve({
      fetch: app.fetch,
      port: port,
    });
    logInfo(`🚀 Server running at http://localhost:${port}`);
    logInfo(`Service name: slice-microservice-template (template)`);
    logInfo(`Try: http://localhost:${port}/healthz or http://localhost:${port}/example`);
  } catch (error) {
    logError('Failed to start server', error);
    process.exit(1);
  }
};

startServer();

export default app; // Optional: export app for testing or other purposes 
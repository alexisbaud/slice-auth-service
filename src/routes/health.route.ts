import { Hono } from 'hono';
import { logger } from '@/lib/logger';

const healthRouter = new Hono();

healthRouter.get('/healthz', (c) => {
  const startTime = Date.now();
  logger.info(
    { 
      service: 'auth-service',
      route: '/healthz', 
      method: 'GET',
      duration_ms: Date.now() - startTime 
    },
    'Health check endpoint called'
  );
  return c.json({ status: 'ok' });
});

export default healthRouter; 
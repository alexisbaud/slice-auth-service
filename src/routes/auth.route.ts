import { Hono, Context, Next } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db } from '@/db';
import { users, NewUser, User as DbUser } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { signToken, verifyToken, JwtPayload } from '@/lib/jwt';
import { publishUserRegisteredEvent, publishUserDeletedEvent } from '@/events/publish';
import { AuthCredentials, AuthTokens } from '@alexisbaud/slice-common';
import { logger } from '@/lib/logger';

const SALT_ROUNDS = 10;

// Define types for Hono context variables
type Variables = {
  user: JwtPayload;
};

const authRouter = new Hono<{ Variables: Variables }>();

// --- Schemas for Validation ---
const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// --- Middleware for JWT Auth ---
const authenticate = async (c: Context<{ Variables: Variables }>, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn({ route: c.req.path, method: c.req.method }, 'Authentication failed: Missing or malformed token');
    return c.json({ error: 'Unauthorized: Missing or malformed token' }, 401);
  }
  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    c.set('user', decoded); 
    await next();
  } catch (error: any) {
    logger.warn({ route: c.req.path, method: c.req.method, error: error.message }, 'Authentication failed: Invalid token');
    return c.json({ error: `Unauthorized: ${error.message}` }, 401);
  }
};

// --- Route Handlers ---

// POST /signup
authRouter.post('/signup', zValidator('json', signupSchema), async (c) => {
  const startTime = Date.now();
  const { email, password } = c.req.valid('json'); // zValidator infers type based on schema
  logger.info({ email, route: '/signup', method: 'POST' }, 'Signup attempt');

  try {
    const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existingUser) {
      logger.warn({ email, route: '/signup', method: 'POST' }, 'Signup failed: Email already exists');
      return c.json({ error: 'Email already exists' }, 409);
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser: NewUser = { email, hashedPassword };
    
    const result = await db.insert(users).values(newUser).returning({ id: users.id, email: users.email });
    const createdUser = result[0];

    if (!createdUser || !createdUser.id || !createdUser.email) {
        logger.error({ email, route: '/signup', method: 'POST' }, 'Signup failed: User creation returned no ID or email');
        return c.json({ error: 'User creation failed' }, 500);
    }

    // Publish event (id from createdUser.id, email from createdUser.email)
    await publishUserRegisteredEvent({ id: createdUser.id, email: createdUser.email });

    logger.info(
        { userId: createdUser.id, email, route: '/signup', method: 'POST', duration_ms: Date.now() - startTime }, 
        'User signed up successfully'
    );
    return c.json({ id: createdUser.id, email: createdUser.email }, 201);

  } catch (error: any) {
    logger.error({ email, route: '/signup', method: 'POST', error: error.message, duration_ms: Date.now() - startTime }, 'Signup failed');
    return c.json({ error: 'Signup failed', details: error.message }, 500);
  }
});

// POST /login
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const startTime = Date.now();
  const { email, password } = c.req.valid('json');
  logger.info({ email, route: '/login', method: 'POST' }, 'Login attempt');

  try {
    const user: DbUser | undefined = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (!user) {
      logger.warn({ email, route: '/login', method: 'POST' }, 'Login failed: User not found');
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatch) {
      logger.warn({ email, route: '/login', method: 'POST' }, 'Login failed: Password mismatch');
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = signToken({ id: user.id, email: user.email });
    
    // Convert JWT_EXPIRES_IN (e.g., "1h", "2 days") to seconds for AuthTokens DTO
    const expiresInString = process.env.JWT_EXPIRES_IN || '1h';
    let expiresInSeconds = 3600; // Default 1 hour
    if (expiresInString.endsWith('h')) {
      expiresInSeconds = parseInt(expiresInString.replace('h', '')) * 60 * 60;
    } else if (expiresInString.endsWith('d')) {
      expiresInSeconds = parseInt(expiresInString.replace('d', '')) * 24 * 60 * 60;
    } else if (expiresInString.endsWith('m')) {
        expiresInSeconds = parseInt(expiresInString.replace('m', '')) * 60;
    } else if (!isNaN(parseInt(expiresInString))) {
        expiresInSeconds = parseInt(expiresInString);
    }

    const response: AuthTokens = { accessToken: token, expiresIn: expiresInSeconds };
    logger.info(
        { userId: user.id, email, route: '/login', method: 'POST', duration_ms: Date.now() - startTime }, 
        'User logged in successfully'
    );
    return c.json(response, 200);

  } catch (error: any) {
    logger.error({ email, route: '/login', method: 'POST', error: error.message, duration_ms: Date.now() - startTime }, 'Login failed');
    return c.json({ error: 'Login failed', details: error.message }, 500);
  }
});

// POST /logout
authRouter.post('/logout', authenticate, async (c: Context<{ Variables: Variables }>) => {
  const startTime = Date.now();
  const user = c.get('user');
  logger.info({ userId: user.userId, route: '/logout', method: 'POST', duration_ms: Date.now() - startTime }, 'User logged out');
  c.status(204);
  return c.body(null);
});

// GET /me
authRouter.get('/me', authenticate, async (c: Context<{ Variables: Variables }>) => {
  const startTime = Date.now();
  const user = c.get('user');
  logger.info({ userId: user.userId, route: '/me', method: 'GET', duration_ms: Date.now() - startTime }, 'Get current user');
  return c.json({ userId: user.userId, email: user.email }); 
});

// DELETE /account
authRouter.delete('/account', authenticate, async (c: Context<{ Variables: Variables }>) => {
  const startTime = Date.now();
  const user = c.get('user');
  logger.info({ userId: user.userId, route: '/account', method: 'DELETE' }, 'Delete account attempt');

  try {
    const result = await db.delete(users).where(eq(users.id, user.userId)).returning({ deletedId: users.id });

    if (result.length === 0 || !result[0].deletedId) {
      logger.warn({ userId: user.userId, route: '/account', method: 'DELETE' }, 'Delete account failed: User not found or already deleted');
      return c.json({ error: 'User not found or could not be deleted' }, 404); 
    }
    
    await publishUserDeletedEvent({ id: user.userId }); // Corrected to use 'id'

    logger.info(
        { userId: user.userId, route: '/account', method: 'DELETE', duration_ms: Date.now() - startTime }, 
        'User account deleted successfully'
    );
    c.status(204);
    return c.body(null);

  } catch (error: any) {
    logger.error({ userId: user.userId, route: '/account', method: 'DELETE', error: error.message, duration_ms: Date.now() - startTime }, 'Delete account failed');
    return c.json({ error: 'Failed to delete account', details: error.message }, 500);
  }
});

export default authRouter; 
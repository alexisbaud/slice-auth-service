import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import type { User } from '@/db/schema'; // Assuming User type will have at least id and email

const secretFromEnv = process.env.JWT_SECRET;
const expiresInFromEnv = process.env.JWT_EXPIRES_IN || '1h'; // Default to 1 hour

if (!secretFromEnv) {
  // This check runs at startup. If the secret is missing, the app won't start.
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

// TypeScript now knows 'secret' is a string due to the check and process.exit above.
const JWT_SECRET_KEY: Secret = secretFromEnv;
// Explicitly casting to string, though it should already be a string or undefined then defaulted.
const SIGN_OPTIONS: SignOptions = { 
  expiresIn: expiresInFromEnv as StringValue, 
  algorithm: 'HS256' 
};

export interface JwtPayload {
  userId: string;
  email: string;
  // Add other claims as needed, e.g., roles
}

/**
 * Signs a JWT token.
 * @param user - The user object (or relevant parts) to include in the payload.
 * @returns The signed JWT.
 */
export const signToken = (user: Pick<User, 'id' | 'email'>): string => {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };
  return jwt.sign(payload, JWT_SECRET_KEY, SIGN_OPTIONS);
};

/**
 * Verifies a JWT token.
 * @param token - The JWT to verify.
 * @returns The decoded payload if the token is valid, otherwise throws an error.
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY) as JwtPayload;
    // Ensure decoded object matches JwtPayload structure if necessary
    if (typeof decoded === 'string' || !decoded.userId || !decoded.email) {
        throw new Error('Invalid token payload structure');
    }
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired.');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token.');
    } else {
      throw new Error('Could not verify token due to an unexpected error.');
    }
  }
}; 
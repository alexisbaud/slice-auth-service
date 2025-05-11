import 'dotenv/config'; // To load .env variables
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { logger } from '@/lib/logger';

if (!process.env.DATABASE_URL) {
  logger.fatal('DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;

// Configure the options for the postgres client
// See https://github.com/porsager/postgres#connection-options
const clientOptions = {
  // prepare: false, // Set to true if you want to use prepared statements by default
  // idle_timeout: 20, // Number of seconds a connection is allowed to be idle before being closed
  // max_lifetime: 60 * 30, // Number of seconds a connection is allowed to live
  // connect_timeout: 30, // Number of seconds to wait for a connection to be established
};

const client = postgres(connectionString, clientOptions);

// Alternatively, for a connection pool:
// const pool = new Pool({ connectionString });
// export const db = drizzle(pool, { schema });

export const db = drizzle(client, { schema, logger: process.env.DRIZZLE_LOGGING === 'true' }); // Enable Drizzle logger if DRIZZLE_LOGGING is true

logger.info('🗄️ Database connection configured.');

// Export the client for graceful shutdown
export { client as pgClient }; 
import 'dotenv/config';
import type { Config } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  // Spécifiez des tables spécifiques à inclure/exclure si nécessaire
  // includesTables: ['users'],
  // excludedTables: ['migrations'],
  verbose: true,
  strict: true,
} satisfies Config; 
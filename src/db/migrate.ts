import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required.');
}

const runMigrate = async () => {
  const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(migrationClient);

  console.log('⏳ Running migrations...');

  const startTime = Date.now();

  try {
    await migrate(db, { migrationsFolder: 'src/db/migrations' });
    console.log('✅ Migrations completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }

  const endTime = Date.now();
  console.log(`⏱️ Finished in ${(endTime - startTime) / 1000}s`);
  process.exit(0);
};

runMigrate(); 
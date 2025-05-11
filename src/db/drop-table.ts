import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Assurez-vous que DATABASE_URL est défini dans votre .env
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required in your .env file');
  process.exit(1);
}

async function dropTable(tableName: string) {
  // Créer une connexion à la base de données
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);

  try {
    console.log(`Tentative de suppression de la table "${tableName}"...`);
    
    // Exécuter la commande DROP TABLE
    await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`));
    
    console.log(`✅ Table "${tableName}" supprimée avec succès !`);
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression de la table "${tableName}" :`, error);
  } finally {
    // Fermer la connexion
    await client.end();
    process.exit(0);
  }
}

// Récupérer le nom de la table depuis les arguments de ligne de commande
const tableName = process.argv[2];

if (!tableName) {
  console.error('Veuillez spécifier un nom de table. Exemple : npm run db:drop-table users');
  process.exit(1);
}

dropTable(tableName); 
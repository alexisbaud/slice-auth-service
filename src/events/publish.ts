import { db } from '../db/index';
import { sql } from 'drizzle-orm';
import { AuthUserRegisteredEvent, AuthUserDeletedEvent } from '@alexisbaud/slice-common';
import { logger } from '../lib/logger';

/**
 * Publishes an event to a PostgreSQL channel using NOTIFY.
 * @param channel - The channel name (e.g., 'auth_user_registered').
 * @param payload - The event payload object.
 */
async function publishEvent<T extends object>(channel: string, payload: T): Promise<void> {
  const startTime = Date.now();
  try {
    // Convertir le payload en chaîne JSON
    const payloadJson = JSON.stringify(payload);
    
    // Échapper correctement la chaîne JSON pour PostgreSQL
    // Les apostrophes simples doivent être doublées dans les chaînes PostgreSQL
    const escapedJson = payloadJson.replace(/'/g, "''");
    
    // Construire la commande NOTIFY avec le payload échappé directement inclus
    // La syntaxe correcte est: NOTIFY channel_name, 'payload_string';
    const notifyCmd = `NOTIFY ${channel}, '${escapedJson}'`;
    
    // Exécuter la commande brute
    await db.execute(sql.raw(notifyCmd));
    
    logger.info(
      { 
        event: channel, 
        payload,
        duration_ms: Date.now() - startTime 
      },
      `Event [${channel}] published`
    );
  } catch (error) {
    logger.error(
      { 
        event: channel, 
        error,
        duration_ms: Date.now() - startTime
      },
      `Failed to publish event [${channel}]`
    );
    // Depending on the criticality, you might want to re-throw or handle differently
    throw new Error(`Failed to publish event ${channel}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const publishUserRegisteredEvent = async (payload: Omit<AuthUserRegisteredEvent, 'timestamp'>): Promise<void> => {
  const eventPayload: AuthUserRegisteredEvent = {
    ...payload,
    timestamp: new Date().toISOString(),
  };
  await publishEvent('auth_user_registered', eventPayload);
};

export const publishUserDeletedEvent = async (payload: Omit<AuthUserDeletedEvent, 'timestamp'>): Promise<void> => {
  const eventPayload: AuthUserDeletedEvent = {
    ...payload,
    timestamp: new Date().toISOString(),
  };
  await publishEvent('auth_user_deleted', eventPayload);
}; 
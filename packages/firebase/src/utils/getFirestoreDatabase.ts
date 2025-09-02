import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';

/**
 * Get the appropriate Firestore instance based on the database parameter.
 * This is the centralized function that ALL Firebase functions should use
 * to ensure they're accessing the correct database.
 * 
 * @param app - The Firebase app instance
 * @param database - The database to use: "staging" or "(default)" for production
 * @returns The Firestore database instance
 */
export function getFirestoreDatabase(app: admin.app.App, database: string = "(default)") {
  // When using emulator, always use default database
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    logger.info('Using Firestore emulator with default database');
    const { getFirestore } = require('firebase-admin/firestore');
    return getFirestore(app);
  }
  
  logger.info(`Using Firestore database: ${database}`);
  const { getFirestore } = require('firebase-admin/firestore');
  
  if (database === "(default)") {
    return getFirestore(app);
  } else {
    // Use the named database for non-default databases
    return getFirestore(app, database);
  }
}

/**
 * @deprecated Use getFirestoreDatabase with explicit database parameter instead.
 * This function relies on environment variables which don't work correctly
 * with namespace-based function exports.
 */
export function getFirestoreDatabaseLegacy(app: admin.app.App) {
  const database = process.env.DB_NAME || "(default)";
  logger.warn(`DEPRECATED: Using legacy getFirestore with DB_NAME env var: ${database}. This may not work correctly with namespace exports!`);
  return getFirestoreDatabase(app, database);
}
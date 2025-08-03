import * as SQLite from 'expo-sqlite';
import { environment } from '../config/environment';
import { DatabaseMigrationManager } from './database-migrations';
import { DatabaseOperations } from './database-operations';

/**
 * Database encryption configuration
 */
export interface DatabaseConfig {
  encryptionKey?: string;
  enableWAL?: boolean;
  enableForeignKeys?: boolean;
}

export interface DatabaseSchema {
  events: {
    id: string;
    brand: string;
    config: string;
    cached_at: number;
    created_at?: number;
    updated_at?: number;
  };
  survey_responses: {
    id: string;
    event_id: string;
    data: string;
    sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
    created_at?: number;
    updated_at?: number;
  };
  sync_queue: {
    id: string;
    type: 'firestore' | 'ford_api' | 'lincoln_api';
    payload: string;
    retry_count: number;
    last_attempt?: number;
    created_at?: number;
  };
}

export class DatabaseService {
  private static instance: DatabaseService;
  private database: SQLite.SQLiteDatabase | null = null;
  private readonly dbName = 'expanse_survey.db';
  private config: DatabaseConfig;
  private operations: DatabaseOperations | null = null;

  constructor(config: DatabaseConfig = {}) {
    if (DatabaseService.instance) {
      return DatabaseService.instance;
    }
    DatabaseService.instance = this;
    this.config = {
      enableWAL: true,
      enableForeignKeys: true,
      ...config
    };
  }

  /**
   * Create a database service with encryption configured from environment
   */
  static createEncrypted(): DatabaseService {
    const encryptionKey = environment.database?.encryptionKey || process.env.EXPO_PUBLIC_DB_ENCRYPTION_KEY;
    
    return new DatabaseService({
      encryptionKey,
      enableWAL: true,
      enableForeignKeys: true
    });
  }

  /**
   * Initialize the database and create all required tables
   */
  async initialize(): Promise<void> {
    try {
      this.database = await SQLite.openDatabaseAsync(this.dbName);
      await this.configureDatabase();
      await this.runMigrations();
      await this.createIndexes();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Run database migrations to current version
   */
  private async runMigrations(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }
    
    const migrationManager = new DatabaseMigrationManager(this.database);
    await migrationManager.runMigrations();
  }

  /**
   * Configure database settings including encryption, WAL mode, and foreign keys
   */
  private async configureDatabase(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    // Set encryption key if provided (requires SQLCipher)
    if (this.config.encryptionKey) {
      try {
        await this.database.execAsync(`PRAGMA key = '${this.config.encryptionKey}'`);
      } catch (error) {
        console.warn('SQLCipher encryption not available, continuing without encryption:', error);
      }
    }

    // Enable WAL mode for better performance
    if (this.config.enableWAL) {
      try {
        await this.database.execAsync('PRAGMA journal_mode = WAL');
      } catch (error) {
        console.warn('WAL mode not available:', error);
      }
    }

    // Enable foreign key constraints
    if (this.config.enableForeignKeys) {
      await this.database.execAsync('PRAGMA foreign_keys = ON');
    }

    // Set additional performance settings
    await this.database.execAsync('PRAGMA synchronous = NORMAL');
    await this.database.execAsync('PRAGMA cache_size = 10000');
    await this.database.execAsync('PRAGMA temp_store = MEMORY');
  }

  /**
   * Get the database instance, initializing if necessary
   */
  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (!this.database) {
      await this.initialize();
    }
    return this.database!;
  }

  /**
   * Get database operations instance
   */
  async getOperations(): Promise<DatabaseOperations> {
    if (!this.operations) {
      const db = await this.getDatabase();
      this.operations = new DatabaseOperations(db);
    }
    return this.operations;
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.database) {
      await this.database.closeAsync();
      this.database = null;
    }
  }

  /**
   * Create all required database tables
   */
  private async createTables(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const eventsTable = `
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        brand TEXT NOT NULL,
        config TEXT NOT NULL,
        cached_at INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `;

    const surveyResponsesTable = `
      CREATE TABLE IF NOT EXISTS survey_responses (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        data TEXT NOT NULL,
        sync_status TEXT DEFAULT 'pending',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (event_id) REFERENCES events(id)
      )
    `;

    const syncQueueTable = `
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        last_attempt INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `;

    await this.database.execAsync(eventsTable);
    await this.database.execAsync(surveyResponsesTable);
    await this.database.execAsync(syncQueueTable);
  }

  /**
   * Create database indexes for performance optimization
   */
  private async createIndexes(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_events_brand ON events(brand)',
      'CREATE INDEX IF NOT EXISTS idx_events_cached_at ON events(cached_at)',
      'CREATE INDEX IF NOT EXISTS idx_survey_responses_event_id ON survey_responses(event_id)',
      'CREATE INDEX IF NOT EXISTS idx_survey_responses_sync_status ON survey_responses(sync_status)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_type ON sync_queue(type)',
      'CREATE INDEX IF NOT EXISTS idx_sync_queue_retry_count ON sync_queue(retry_count)',
    ];

    for (const index of indexes) {
      await this.database.execAsync(index);
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  async executeTransaction<T>(callback: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
    const db = await this.getDatabase();
    
    try {
      await db.execAsync('BEGIN TRANSACTION');
      const result = await callback(db);
      await db.execAsync('COMMIT');
      return result;
    } catch (error) {
      try {
        await db.execAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('Transaction rollback failed:', rollbackError);
      }
      throw error;
    }
  }

  /**
   * Check if the database is properly initialized
   */
  async isInitialized(): Promise<boolean> {
    try {
      const db = await this.getDatabase();
      const result = await db.getAllAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('events', 'survey_responses', 'sync_queue')"
      );
      return result.length === 3;
    } catch (error) {
      console.error('Database initialization check failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics for debugging
   */
  async getStats(): Promise<{
    eventsCount: number;
    surveyResponsesCount: number;
    syncQueueCount: number;
  }> {
    const db = await this.getDatabase();
    
    const [eventsResult, responsesResult, queueResult] = await Promise.all([
      db.getAllAsync('SELECT COUNT(*) as count FROM events'),
      db.getAllAsync('SELECT COUNT(*) as count FROM survey_responses'),
      db.getAllAsync('SELECT COUNT(*) as count FROM sync_queue'),
    ]);

    return {
      eventsCount: (eventsResult[0] as any)?.count || 0,
      surveyResponsesCount: (responsesResult[0] as any)?.count || 0,
      syncQueueCount: (queueResult[0] as any)?.count || 0,
    };
  }
}
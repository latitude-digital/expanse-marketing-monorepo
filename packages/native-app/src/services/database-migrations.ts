import * as SQLite from 'expo-sqlite';

export interface Migration {
  version: number;
  name: string;
  up: string[];
  down?: string[];
}

export class DatabaseMigrationManager {
  private database: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.database = database;
  }

  private migrations: Migration[] = [
    {
      version: 1,
      name: 'initial_schema',
      up: [
        `CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          brand TEXT NOT NULL,
          config TEXT NOT NULL,
          cached_at INTEGER NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )`,
        `CREATE TABLE IF NOT EXISTS survey_responses (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          data TEXT NOT NULL,
          sync_status TEXT DEFAULT 'pending',
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now')),
          FOREIGN KEY (event_id) REFERENCES events(id)
        )`,
        `CREATE TABLE IF NOT EXISTS sync_queue (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          payload TEXT NOT NULL,
          retry_count INTEGER DEFAULT 0,
          last_attempt INTEGER,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )`,
      ],
    },
  ];

  async runMigrations(): Promise<void> {
    await this.createMigrationsTable();
    const currentVersion = await this.getCurrentVersion();
    
    for (const migration of this.migrations) {
      if (migration.version > currentVersion) {
        await this.runMigration(migration);
      }
    }
  }

  private async createMigrationsTable(): Promise<void> {
    await this.database.execAsync(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
  }

  private async getCurrentVersion(): Promise<number> {
    const result = await this.database.getAllAsync(
      'SELECT version FROM migrations ORDER BY version DESC LIMIT 1'
    );
    return result.length > 0 ? (result[0] as any).version : 0;
  }

  private async runMigration(migration: Migration): Promise<void> {
    try {
      await this.database.execAsync('BEGIN TRANSACTION');
      
      for (const statement of migration.up) {
        await this.database.execAsync(statement);
      }
      
      await this.database.runAsync(
        'INSERT INTO migrations (version, name) VALUES (?, ?)',
        [migration.version, migration.name]
      );
      
      await this.database.execAsync('COMMIT');
      console.log(`Applied migration ${migration.version}: ${migration.name}`);
    } catch (error) {
      await this.database.execAsync('ROLLBACK');
      throw new Error(`Migration ${migration.version} failed: ${error}`);
    }
  }
}
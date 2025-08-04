import * as SQLite from 'expo-sqlite';
import { DatabaseSchema } from './database';
import { v4 as uuidv4 } from 'uuid';

export class DatabaseOperations {
  private database: SQLite.SQLiteDatabase;

  constructor(database: SQLite.SQLiteDatabase) {
    this.database = database;
  }

  // Events CRUD Operations
  async createEvent(event: Omit<DatabaseSchema['events'], 'created_at' | 'updated_at'>): Promise<string> {
    const id = event.id || uuidv4();
    await this.database.runAsync(
      'INSERT OR REPLACE INTO events (id, brand, config, cached_at) VALUES (?, ?, ?, ?)',
      [id, event.brand, event.config, event.cached_at]
    );
    return id;
  }

  async getEvent(id: string): Promise<DatabaseSchema['events'] | null> {
    const result = await this.database.getAllAsync(
      'SELECT * FROM events WHERE id = ?',
      [id]
    );
    return result.length > 0 ? result[0] as DatabaseSchema['events'] : null;
  }

  async getEventsByBrand(brand: string): Promise<DatabaseSchema['events'][]> {
    const result = await this.database.getAllAsync(
      'SELECT * FROM events WHERE brand = ? ORDER BY cached_at DESC',
      [brand]
    );
    return result as DatabaseSchema['events'][];
  }

  async updateEvent(id: string, updates: Partial<Omit<DatabaseSchema['events'], 'id' | 'created_at'>>): Promise<void> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), Date.now(), id];
    
    await this.database.runAsync(
      `UPDATE events SET ${fields}, updated_at = ? WHERE id = ?`,
      values
    );
  }

  async deleteEvent(id: string): Promise<void> {
    await this.database.runAsync('DELETE FROM events WHERE id = ?', [id]);
  }

  // Survey Responses CRUD Operations
  async createSurveyResponse(response: Omit<DatabaseSchema['survey_responses'], 'created_at' | 'updated_at'>): Promise<string> {
    const id = response.id || uuidv4();
    await this.database.runAsync(
      'INSERT INTO survey_responses (id, event_id, data, sync_status) VALUES (?, ?, ?, ?)',
      [id, response.event_id, response.data, response.sync_status || 'pending']
    );
    return id;
  }

  async getSurveyResponse(id: string): Promise<DatabaseSchema['survey_responses'] | null> {
    const result = await this.database.getAllAsync(
      'SELECT * FROM survey_responses WHERE id = ?',
      [id]
    );
    return result.length > 0 ? result[0] as DatabaseSchema['survey_responses'] : null;
  }

  async getSurveyResponsesByStatus(status: DatabaseSchema['survey_responses']['sync_status']): Promise<DatabaseSchema['survey_responses'][]> {
    const result = await this.database.getAllAsync(
      'SELECT * FROM survey_responses WHERE sync_status = ? ORDER BY created_at ASC',
      [status]
    );
    return result as DatabaseSchema['survey_responses'][];
  }

  async updateSurveyResponseStatus(id: string, status: DatabaseSchema['survey_responses']['sync_status']): Promise<void> {
    await this.database.runAsync(
      'UPDATE survey_responses SET sync_status = ?, updated_at = ? WHERE id = ?',
      [status, Date.now(), id]
    );
  }

  async deleteSurveyResponse(id: string): Promise<void> {
    await this.database.runAsync('DELETE FROM survey_responses WHERE id = ?', [id]);
  }

  // Sync Queue CRUD Operations
  async addToSyncQueue(item: Omit<DatabaseSchema['sync_queue'], 'id' | 'created_at'>): Promise<string> {
    const id = uuidv4();
    await this.database.runAsync(
      'INSERT INTO sync_queue (id, type, payload, retry_count, last_attempt) VALUES (?, ?, ?, ?, ?)',
      [id, item.type, item.payload, item.retry_count || 0, item.last_attempt || null]
    );
    return id;
  }

  // Alias for sync-manager compatibility
  async createSyncQueueItem(item: { id: string; type: string; payload: string; retry_count: number; last_attempt?: number; created_at?: number; }): Promise<string> {
    await this.database.runAsync(
      'INSERT INTO sync_queue (id, type, payload, retry_count, last_attempt) VALUES (?, ?, ?, ?, ?)',
      [item.id, item.type, item.payload, item.retry_count || 0, item.last_attempt || null]
    );
    return item.id;
  }

  async getSyncQueueItems(type?: DatabaseSchema['sync_queue']['type']): Promise<DatabaseSchema['sync_queue'][]> {
    const query = type 
      ? 'SELECT * FROM sync_queue WHERE type = ? ORDER BY created_at ASC'
      : 'SELECT * FROM sync_queue ORDER BY created_at ASC';
    const params = type ? [type] : [];
    
    const result = await this.database.getAllAsync(query, params);
    return result as DatabaseSchema['sync_queue'][];
  }

  // Alias for sync-manager compatibility
  async getPendingSyncItems(): Promise<DatabaseSchema['sync_queue'][]> {
    return this.getSyncQueueItems();
  }

  // Alias for sync-manager compatibility
  async getPendingSyncItemCount(): Promise<number> {
    const result = await this.database.getAllAsync('SELECT COUNT(*) as count FROM sync_queue');
    return (result[0] as any)?.count || 0;
  }

  async updateSyncQueueItem(id: string, updates: Partial<Omit<DatabaseSchema['sync_queue'], 'id' | 'created_at'>>): Promise<void> {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updates), id];
    
    await this.database.runAsync(
      `UPDATE sync_queue SET ${fields} WHERE id = ?`,
      values
    );
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    await this.database.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  // Alias for sync-manager compatibility
  async deleteSyncQueueItem(id: string): Promise<void> {
    return this.removeSyncQueueItem(id);
  }

  // Clear all sync queue items
  async clearSyncQueue(): Promise<void> {
    await this.database.runAsync('DELETE FROM sync_queue');
  }

  // Utility Operations
  async clearAllData(): Promise<void> {
    await this.executeTransaction(async (db) => {
      await db.runAsync('DELETE FROM sync_queue');
      await db.runAsync('DELETE FROM survey_responses'); 
      await db.runAsync('DELETE FROM events');
    });
  }

  async executeTransaction<T>(callback: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> {
    try {
      await this.database.execAsync('BEGIN TRANSACTION');
      const result = await callback(this.database);
      await this.database.execAsync('COMMIT');
      return result;
    } catch (error) {
      try {
        await this.database.execAsync('ROLLBACK');
      } catch (rollbackError) {
        console.error('Transaction rollback failed:', rollbackError);
      }
      throw error;
    }
  }
}
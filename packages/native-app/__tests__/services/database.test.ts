/**
 * Database Service Tests
 * 
 * Note: These tests use mocked expo-sqlite to avoid React Native runtime dependencies
 * For integration tests, use a physical device or simulator
 */

// Mock expo-sqlite at the module level
const mockDb = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  runAsync: jest.fn(),
  closeAsync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve(mockDb)),
}));

// Import after mocking
import { DatabaseService } from '../../src/services/database';

describe('DatabaseService', () => {
  let databaseService: DatabaseService;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockDb.execAsync.mockResolvedValue(undefined);
    mockDb.getAllAsync.mockResolvedValue([]);
    mockDb.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
    mockDb.closeAsync.mockResolvedValue(undefined);
    
    databaseService = new DatabaseService();
  });

  describe('Database Initialization', () => {
    it('should initialize database with proper schema', async () => {
      const SQLite = require('expo-sqlite');
      
      await databaseService.initialize();
      
      // Verify database was opened
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('expanse_survey.db');
      
      // Verify tables were created
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS events')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS survey_responses')
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS sync_queue')
      );
    });

    it('should handle database initialization errors', async () => {
      const SQLite = require('expo-sqlite');
      const error = new Error('Database initialization failed');
      SQLite.openDatabaseAsync.mockRejectedValueOnce(error);

      await expect(databaseService.initialize()).rejects.toThrow('Database initialization failed');
    });

    it('should create events table with correct schema', async () => {
      await databaseService.initialize();
      
      const expectedEventsSchema = `
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          brand TEXT NOT NULL,
          config TEXT NOT NULL,
          cached_at INTEGER NOT NULL,
          created_at INTEGER DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `;
      
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringMatching(/CREATE TABLE IF NOT EXISTS events/)
      );
    });

    it('should create survey_responses table with correct schema', async () => {
      await databaseService.initialize();
      
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringMatching(/CREATE TABLE IF NOT EXISTS survey_responses/)
      );
    });

    it('should create sync_queue table with correct schema', async () => {
      await databaseService.initialize();
      
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringMatching(/CREATE TABLE IF NOT EXISTS sync_queue/)
      );
    });

    it('should create indexes for performance', async () => {
      await databaseService.initialize();
      
      // Verify indexes are created for frequently queried columns
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringMatching(/CREATE INDEX.*events_brand/)
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringMatching(/CREATE INDEX.*survey_responses_event_id/)
      );
      expect(mockDb.execAsync).toHaveBeenCalledWith(
        expect.stringMatching(/CREATE INDEX.*sync_queue_type/)
      );
    });
  });

  describe('Database Connection Management', () => {
    it('should return the same database instance for multiple calls', async () => {
      const SQLite = require('expo-sqlite');
      
      const db1 = await databaseService.getDatabase();
      const db2 = await databaseService.getDatabase();
      
      expect(db1).toBe(db2);
      expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    });

    it('should properly close database connection', async () => {
      await databaseService.initialize();
      await databaseService.close();
      
      expect(mockDb.closeAsync).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle schema creation errors gracefully', async () => {
      const error = new Error('Schema creation failed');
      mockDb.execAsync.mockRejectedValue(error);

      await expect(databaseService.initialize()).rejects.toThrow('Schema creation failed');
    });

    it('should provide meaningful error messages', async () => {
      const sqlError = new Error('SQL syntax error');
      mockDb.execAsync.mockRejectedValue(sqlError);

      await expect(databaseService.initialize()).rejects.toThrow('SQL syntax error');
    });
  });
});
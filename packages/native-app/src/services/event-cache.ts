import { DatabaseService } from './database';
import { DatabaseOperations } from './database-operations';
import type { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';

export class EventCacheService {
  private dbService: DatabaseService;
  private operations: DatabaseOperations | null = null;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  private async getOperations(): Promise<DatabaseOperations> {
    if (!this.operations) {
      this.operations = await this.dbService.getOperations();
    }
    return this.operations;
  }

  async cacheEvent(event: ExpanseEvent): Promise<void> {
    const ops = await this.getOperations();
    await ops.createEvent({
      id: event.id,
      brand: event.brand || 'Other',
      config: JSON.stringify(event),
      cached_at: Date.now(),
    });
  }

  async getCachedEvents(brand?: string): Promise<ExpanseEvent[]> {
    const ops = await this.getOperations();
    const cachedEvents = brand 
      ? await ops.getEventsByBrand(brand)
      : await ops.getEventsByBrand('Ford').then(ford => 
          ops.getEventsByBrand('Lincoln').then(lincoln => 
            ops.getEventsByBrand('Other').then(other => [...ford, ...lincoln, ...other])
          )
        );

    return cachedEvents.map(cached => JSON.parse(cached.config) as ExpanseEvent);
  }

  async updateEventCache(eventId: string, event: ExpanseEvent): Promise<void> {
    const ops = await this.getOperations();
    await ops.updateEvent(eventId, {
      config: JSON.stringify(event),
      cached_at: Date.now(),
    });
  }

  async clearCache(): Promise<void> {
    const ops = await this.getOperations();
    const db = await this.dbService.getDatabase();
    await db.runAsync('DELETE FROM events');
  }

  async isCacheExpired(maxAgeMs: number = 300000): Promise<boolean> {
    const ops = await this.getOperations();
    const stats = await this.dbService.getStats();
    
    if (stats.eventsCount === 0) return true;

    const db = await this.dbService.getDatabase();
    const result = await db.getAllAsync(
      'SELECT MAX(cached_at) as latest FROM events'
    );
    
    const latestCache = (result[0] as any)?.latest || 0;
    return Date.now() - latestCache > maxAgeMs;
  }
}

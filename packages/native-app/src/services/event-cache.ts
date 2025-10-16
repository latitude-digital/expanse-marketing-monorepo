import { DatabaseService } from './database';
import { DatabaseOperations } from './database-operations';
import type { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';

export type CachedMeridianEvent = ExpanseEvent & {
  assetMap?: Record<string, string>;
};

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

  async cacheEvent(event: CachedMeridianEvent): Promise<void> {
    const ops = await this.getOperations();
    await ops.createEvent({
      id: event.id,
      brand: event.brand || 'Other',
      config: JSON.stringify(event),
      cached_at: Date.now(),
    });
  }

  async getCachedEvents(brand?: string): Promise<CachedMeridianEvent[]> {
    const ops = await this.getOperations();
    const cachedEvents = brand 
      ? await ops.getEventsByBrand(brand)
      : await ops.getEventsByBrand('Ford').then(ford => 
          ops.getEventsByBrand('Lincoln').then(lincoln => 
            ops.getEventsByBrand('Other').then(other => [...ford, ...lincoln, ...other])
          )
        );

    return cachedEvents.map((cached) => this.hydrateEvent(JSON.parse(cached.config)));
  }

  async updateEventCache(eventId: string, event: CachedMeridianEvent): Promise<void> {
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

  private hydrateEvent(raw: any): CachedMeridianEvent {
    const event = raw as CachedMeridianEvent;

    const toDate = (value: any): Date | undefined => {
      if (!value) return undefined;
      if (value instanceof Date) return value;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    };

    event.startDate = toDate(event.startDate) || new Date();
    event.endDate = toDate(event.endDate) || new Date();

    if (event.preRegDate) {
      event.preRegDate = toDate(event.preRegDate);
    }
    if (event.surveyJSTheme && typeof event.surveyJSTheme === 'string') {
      try {
        event.surveyJSTheme = JSON.parse(event.surveyJSTheme);
      } catch (error) {
        // ignore invalid JSON, leave string representation
      }
    }
    if (event.theme && typeof event.theme === 'string') {
      try {
        event.theme = JSON.parse(event.theme);
      } catch (error) {
        // ignore
      }
    }

    return event;
  }
}

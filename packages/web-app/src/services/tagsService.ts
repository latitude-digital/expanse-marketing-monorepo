import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import db from './firestore';

interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
}

class TagsService {
  private tagsCache: Map<string, Tag> = new Map();
  private cachePromise: Promise<void> | null = null;

  // Load all tags into cache
  async loadTags(): Promise<void> {
    if (this.cachePromise) {
      return this.cachePromise;
    }

    this.cachePromise = (async () => {
      try {
        const tagsSnapshot = await getDocs(collection(db, 'tags'));
        this.tagsCache.clear();
        
        tagsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          this.tagsCache.set(doc.id, {
            id: doc.id,
            name: data.name || doc.id,
            color: data.color,
            description: data.description
          });
        });
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    })();

    return this.cachePromise;
  }

  // Get tag by ID
  async getTag(tagId: string): Promise<Tag | null> {
    // Ensure cache is loaded
    await this.loadTags();
    
    // Try cache first
    if (this.tagsCache.has(tagId)) {
      return this.tagsCache.get(tagId)!;
    }

    // If not in cache, try to fetch directly
    try {
      const tagDoc = await getDoc(doc(db, 'tags', tagId));
      if (tagDoc.exists()) {
        const data = tagDoc.data();
        const tag: Tag = {
          id: tagDoc.id,
          name: data.name || tagDoc.id,
          color: data.color,
          description: data.description
        };
        this.tagsCache.set(tagId, tag);
        return tag;
      }
    } catch (error) {
      console.error(`Error fetching tag ${tagId}:`, error);
    }

    return null;
  }

  // Get multiple tags by IDs
  async getTags(tagIds: string[]): Promise<Map<string, Tag>> {
    await this.loadTags();
    
    const result = new Map<string, Tag>();
    for (const tagId of tagIds) {
      const tag = await this.getTag(tagId);
      if (tag) {
        result.set(tagId, tag);
      }
    }
    return result;
  }

  // Get all tags
  async getAllTags(): Promise<Tag[]> {
    await this.loadTags();
    return Array.from(this.tagsCache.values());
  }

  // Clear cache (useful when tags are updated)
  clearCache(): void {
    this.tagsCache.clear();
    this.cachePromise = null;
  }
}

// Export singleton instance
export const tagsService = new TagsService();
export default tagsService;
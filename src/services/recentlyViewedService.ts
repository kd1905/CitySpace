import { Property, ListingType } from '@/types/property';

const STORAGE_KEY = 'cityspace_recently_viewed_v1';
const MAX_ITEMS = 10;

export interface RecentlyViewedItem {
  id: string;
  title: string;
  price: number;
  currency?: string;
  type: ListingType;
  categoryLabel: string;
  images: string[];
  location: {
    neighborhood: string;
    city: string;
  };
  specs: {
    bedrooms: number;
    bathrooms: number;
    areaSqFt: number;
  };
  viewedAt: string;
}

class RecentlyViewedService {
  private items: RecentlyViewedItem[];
  private listeners: (() => void)[] = [];

  constructor() {
    this.items = this.loadFromStorage();
  }

  private loadFromStorage(): RecentlyViewedItem[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return [];
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
      } catch {
        // ignore
      }
    }
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  trackView(property: Property): void {
    this.items = this.items.filter((i) => i.id !== property.id);
    const item: RecentlyViewedItem = {
      id: property.id,
      title: property.title,
      price: property.price,
      currency: property.currency,
      type: property.type,
      categoryLabel: property.categoryLabel,
      images: property.images?.slice(0, 1) || [],
      location: {
        neighborhood: property.location?.neighborhood || '',
        city: property.location?.city || '',
      },
      specs: {
        bedrooms: property.specs?.bedrooms || 0,
        bathrooms: property.specs?.bathrooms || 0,
        areaSqFt: property.specs?.areaSqFt || 0,
      },
      viewedAt: new Date().toISOString(),
    };
    this.items = [item, ...this.items].slice(0, MAX_ITEMS);
    this.saveToStorage();
  }

  getAll(): RecentlyViewedItem[] {
    return [...this.items];
  }

  getRecent(limit = 5): RecentlyViewedItem[] {
    return this.items.slice(0, limit);
  }

  clear(): void {
    this.items = [];
    this.saveToStorage();
  }
}

export const recentlyViewedService = new RecentlyViewedService();

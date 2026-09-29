import { Property, ListingType, PropertyCategoryType, PropertyStatus, PropertyAgent } from '@/types/property';
import { PropertyFilterState } from '@/types/filter';
import { apiClient } from './apiClient';

const STORAGE_KEY = 'cityspace_admin_properties_v1';

class PropertyService {
  private properties: Property[];
  private isSyncing = false;

  constructor() {
    this.properties = this.loadInitialProperties();
    // Asynchronously fetch latest properties from SQL database
    this.refreshFromBackend();
  }

  private loadInitialProperties(): Property[] {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load stored properties from localStorage:', err);
      }
    }
    return [];
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.properties));
      } catch (err) {
        console.warn('Failed to save properties to localStorage:', err);
      }
    }
  }

  /**
   * Sync latest properties from SQL Database backend
   */
  async refreshFromBackend(): Promise<Property[]> {
    if (this.isSyncing) return this.properties;
    this.isSyncing = true;
    try {
      const res = await apiClient.get<Property[]>('/properties/admin');
      if (res.success && Array.isArray(res.data)) {
        this.properties = res.data;
        this.saveToStorage();
      }
    } catch (err) {
      console.warn('[PropertyService] Backend sync failed, using cached data:', err);
    } finally {
      this.isSyncing = false;
    }
    return this.properties;
  }

  /**
   * Clear all properties from storage & database
   */
  clearAllProperties(): Property[] {
    this.properties = [];
    this.saveToStorage();
    return [];
  }

  /**
   * PUBLIC: Get all published properties
   */
  getAll(): Property[] {
    return this.properties.filter((p) => p.status === 'published');
  }

  /**
   * PUBLIC: Get featured published properties
   */
  getFeatured(): Property[] {
    return this.properties.filter(
      (p) => p.status === 'published' && p.featured
    );
  }

  /**
   * PUBLIC: Get newest published listings
   */
  getLatest(): Property[] {
    return this.properties
      .filter((p) => p.status === 'published')
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  /**
   * PUBLIC: Get published properties by listing type (buy / rent)
   */
  getByType(type: ListingType): Property[] {
    return this.properties.filter(
      (p) => p.status === 'published' && p.type === type
    );
  }

  /**
   * PUBLIC: Get single property by ID or Slug
   */
  getById(idOrSlug: string): Property | undefined {
    return this.properties.find(
      (p) => p.id === idOrSlug || p.slug === idOrSlug
    );
  }

  /**
   * PUBLIC: Filter and sort published properties
   */
  search(filter: Partial<PropertyFilterState>): Property[] {
    // Strictly filter only PUBLISHED properties for public search
    let results = this.properties.filter((p) => p.status === 'published');

    // Filter by type (buy/rent)
    if (filter.type) {
      results = results.filter((p) => p.type === filter.type);
    }

    // Filter by category
    if (filter.category && filter.category !== 'all') {
      const catLower = filter.category.toLowerCase();
      results = results.filter((p) => {
        const pCat = (p.category || '').toLowerCase();
        const pLabel = (p.categoryLabel || '').toLowerCase();

        if (catLower === 'commercial') {
          return (
            pCat === 'commercial' ||
            pCat === 'offices' ||
            pCat === 'retail' ||
            pLabel.includes('commercial') ||
            pLabel.includes('office')
          );
        }

        if (catLower === 'plots' || catLower === 'land') {
          return (
            pCat === 'plots' ||
            pCat === 'land' ||
            pLabel.includes('plot') ||
            pLabel.includes('land')
          );
        }

        return (
          pCat === catLower ||
          pLabel === catLower ||
          pLabel.includes(catLower)
        );
      });
    }

    // Filter by city
    if (filter.city) {
      const cityLower = filter.city.toLowerCase();
      results = results.filter((p) =>
        p.location.city.toLowerCase().includes(cityLower)
      );
    }

    // Filter by general query keyword (title, city, neighborhood, description)
    if (filter.query && filter.query.trim() !== '') {
      const q = filter.query.toLowerCase().trim();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.city.toLowerCase().includes(q) ||
          p.location.neighborhood.toLowerCase().includes(q) ||
          p.location.address.toLowerCase().includes(q) ||
          p.tagline.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    // Filter by price range
    if (filter.minPrice !== undefined) {
      results = results.filter((p) => p.price >= filter.minPrice!);
    }
    if (filter.maxPrice !== undefined) {
      results = results.filter((p) => p.price <= filter.maxPrice!);
    }

    // Filter by bedrooms
    if (filter.bedrooms !== undefined && filter.bedrooms !== 'any') {
      results = results.filter((p) => p.specs.bedrooms >= (filter.bedrooms as number));
    }

    // Filter by bathrooms
    if (filter.bathrooms !== undefined && filter.bathrooms !== 'any') {
      results = results.filter((p) => p.specs.bathrooms >= (filter.bathrooms as number));
    }

    // Filter by area (sq ft)
    if (filter.minArea !== undefined) {
      results = results.filter((p) => p.specs.areaSqFt >= filter.minArea!);
    }
    if (filter.maxArea !== undefined) {
      results = results.filter((p) => p.specs.areaSqFt <= filter.maxArea!);
    }

    // Filter by furnishing
    if (filter.furnishing && filter.furnishing !== 'any') {
      results = results.filter((p) => p.specs.furnishing === filter.furnishing);
    }

    // Filter by parking
    if (filter.parking !== undefined && filter.parking !== 'any') {
      results = results.filter((p) => p.specs.parkingSpaces >= (filter.parking as number));
    }

    // Filter by verified
    if (filter.verified !== undefined && filter.verified !== 'all') {
      results = results.filter((p) => p.verified === filter.verified);
    }

    // Filter by featured
    if (filter.featured !== undefined && filter.featured !== 'all') {
      results = results.filter((p) => p.featured === filter.featured);
    }

    // Filter by amenities
    if (filter.amenities && filter.amenities.length > 0) {
      results = results.filter((p) => {
        const propAmenityIds = p.amenities.map((a) => a.id);
        return filter.amenities!.every((aId) => propAmenityIds.includes(aId));
      });
    }

    // Sort results
    switch (filter.sortBy) {
      case 'price-asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        results.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'size-desc':
        results.sort((a, b) => b.specs.areaSqFt - a.specs.areaSqFt);
        break;
      case 'featured':
      default:
        results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return results;
  }

  // ==========================================
  // ADMIN ONLY METHODS (RBAC Protected)
  // ==========================================

  /**
   * ADMIN: Get all properties including drafts and unpublished
   */
  getAllAdmin(statusFilter?: PropertyStatus | 'all'): Property[] {
    if (!statusFilter || statusFilter === 'all') {
      return [...this.properties];
    }
    return this.properties.filter((p) => p.status === statusFilter);
  }

  /**
   * ADMIN: Create a new property listing
   */
  createProperty(
    data: Omit<Property, 'id' | 'slug' | 'createdAt'>
  ): Property {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const newProperty: Property = {
      ...data,
      id: `cs-adm-${Date.now()}`,
      slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };

    this.properties.unshift(newProperty);
    this.saveToStorage();

    // Persist to SQL database via Backend API
    apiClient.post('/properties', newProperty).catch((err) => {
      console.warn('[PropertyService] Failed to persist new property to backend:', err);
    });

    return newProperty;
  }

  /**
   * ADMIN: Update property details or pricing
   */
  updateProperty(id: string, updates: Partial<Property>): Property | null {
    const property = this.properties.find((p) => p.id === id);
    if (!property) return null;

    Object.assign(property, updates);
    this.saveToStorage();

    // Persist update to SQL database
    apiClient.put(`/properties/${id}`, updates).catch((err) => {
      console.warn(`[PropertyService] Failed to update property ${id} on backend:`, err);
    });

    return property;
  }

  /**
   * ADMIN: Publish, unpublish, or set to draft
   */
  setPublishStatus(id: string, status: PropertyStatus): boolean {
    const property = this.properties.find((p) => p.id === id);
    if (!property) return false;
    property.status = status;
    this.saveToStorage();

    // Persist status to SQL database
    apiClient.patch(`/properties/${id}/status`, { status }).catch((err) => {
      console.warn(`[PropertyService] Failed to update status on backend:`, err);
    });

    return true;
  }

  /**
   * ADMIN: Toggle verified badge
   */
  toggleVerified(id: string): boolean {
    const property = this.properties.find((p) => p.id === id);
    if (!property) return false;
    property.verified = !property.verified;
    this.saveToStorage();

    // Persist toggle to SQL database
    apiClient.patch(`/properties/${id}/toggle-verified`).catch((err) => {
      console.warn(`[PropertyService] Failed to toggle verified on backend:`, err);
    });

    return true;
  }

  /**
   * ADMIN: Toggle featured status
   */
  toggleFeatured(id: string): boolean {
    const property = this.properties.find((p) => p.id === id);
    if (!property) return false;
    property.featured = !property.featured;
    this.saveToStorage();

    // Persist toggle to SQL database
    apiClient.patch(`/properties/${id}/toggle-featured`).catch((err) => {
      console.warn(`[PropertyService] Failed to toggle featured on backend:`, err);
    });

    return true;
  }

  /**
   * ADMIN: Delete property from inventory
   */
  deleteProperty(id: string): boolean {
    const idx = this.properties.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.properties.splice(idx, 1);
    this.saveToStorage();

    // Delete from SQL database
    apiClient.delete(`/properties/${id}`).catch((err) => {
      console.warn(`[PropertyService] Failed to delete property ${id} from backend:`, err);
    });

    return true;
  }

  /**
   * AGENT: Get properties assigned to this agent
   */
  getByAgent(agentId: string): Property[] {
    return this.properties.filter(
      (p) => p.assignedAgentId === agentId || p.agent?.id === agentId
    );
  }

  /**
   * ADMIN: Mark property as Sold
   */
  markSold(id: string): boolean {
    return this.setPublishStatus(id, 'sold');
  }

  /**
   * ADMIN: Mark property as Rented
   */
  markRented(id: string): boolean {
    return this.setPublishStatus(id, 'rented');
  }

  /**
   * ADMIN: Assign agent to property
   */
  assignAgent(propertyId: string, agentData: PropertyAgent): boolean {
    const property = this.properties.find((p) => p.id === propertyId);
    if (!property) return false;
    property.agent = agentData;
    property.assignedAgentId = agentData.id;
    this.saveToStorage();

    // Persist agent assignment to SQL database
    apiClient.put(`/properties/${propertyId}`, { assignedAgentId: agentData.id }).catch((err) => {
      console.warn(`[PropertyService] Failed to assign agent on backend:`, err);
    });

    return true;
  }

  /**
   * ADMIN: Duplicate an existing property listing
   */
  async duplicateProperty(id: string): Promise<Property | null> {
    try {
      const res = await apiClient.post<Property>(`/properties/${id}/duplicate`);
      if (res.success && res.data) {
        this.properties.unshift(res.data);
        this.saveToStorage();
        return res.data;
      }
    } catch (err) {
      console.warn('[PropertyService] Error duplicating property:', err);
    }
    return null;
  }

  /**
   * ADMIN: Update property verification desk review
   */
  async updateVerification(
    id: string,
    verificationStatus: 'draft' | 'submitted' | 'under_review' | 'verified' | 'rejected',
    verificationNotes?: string,
    rejectionReason?: string
  ): Promise<Property | null> {
    try {
      const res = await apiClient.patch<Property>(`/properties/${id}/verification`, {
        verificationStatus,
        verificationNotes,
        rejectionReason,
      });
      if (res.success && res.data) {
        const idx = this.properties.findIndex((p) => p.id === id);
        if (idx !== -1) {
          this.properties[idx] = res.data;
        } else {
          this.properties.unshift(res.data);
        }
        this.saveToStorage();
        return res.data;
      }
    } catch (err) {
      console.warn('[PropertyService] Error updating verification:', err);
    }
    return null;
  }

  /**
   * ADMIN: Bulk update status
   */
  async bulkUpdateStatus(ids: string[], status: PropertyStatus): Promise<boolean> {
    try {
      const res = await apiClient.post('/properties/bulk-status', { ids, status });
      if (res.success) {
        this.properties.forEach((p) => {
          if (ids.includes(p.id)) {
            p.status = status;
          }
        });
        this.saveToStorage();
        return true;
      }
    } catch (err) {
      console.warn('[PropertyService] Error bulk updating status:', err);
    }
    return false;
  }

  /**
   * ADMIN: Bulk delete
   */
  async bulkDelete(ids: string[]): Promise<boolean> {
    try {
      const res = await apiClient.post('/properties/bulk-delete', { ids });
      if (res.success) {
        this.properties = this.properties.filter((p) => !ids.includes(p.id));
        this.saveToStorage();
        return true;
      }
    } catch (err) {
      console.warn('[PropertyService] Error bulk deleting properties:', err);
    }
    return false;
  }

  /**
   * ADMIN: Metrics summary
   */
  getAdminMetrics() {
    return {
      total: this.properties.length,
      published: this.properties.filter((p) => p.status === 'published').length,
      drafts: this.properties.filter((p) => p.status === 'draft').length,
      pendingApproval: this.properties.filter((p) => p.status === 'pending_approval' || p.verificationStatus === 'submitted' || p.verificationStatus === 'under_review').length,
      unpublished: this.properties.filter((p) => p.status === 'unpublished').length,
      sold: this.properties.filter((p) => p.status === 'sold').length,
      rented: this.properties.filter((p) => p.status === 'rented').length,
      verified: this.properties.filter((p) => p.verified || p.verificationStatus === 'verified').length,
      featured: this.properties.filter((p) => p.featured).length,
    };
  }
}

export const propertyService = new PropertyService();

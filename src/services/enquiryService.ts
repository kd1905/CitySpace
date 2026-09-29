import { PropertyEnquiry, EnquiryStatus, PreferredContactMethod } from '@/types/enquiry';
import { apiClient } from './apiClient';

const STORAGE_KEY = 'cityspace_enquiries_v1';

class EnquiryService {
  private enquiries: PropertyEnquiry[];
  private isSyncing = false;

  constructor() {
    this.enquiries = this.loadInitialEnquiries();
    this.refreshFromBackend();
  }

  private loadInitialEnquiries(): PropertyEnquiry[] {
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
        console.warn('Failed to load stored enquiries from localStorage:', err);
      }
    }
    return [];
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.enquiries));
      } catch (err) {
        console.warn('Failed to save enquiries to localStorage:', err);
      }
    }
  }

  /**
   * Sync enquiries from SQL Database backend
   */
  async refreshFromBackend(): Promise<PropertyEnquiry[]> {
    if (this.isSyncing) return this.enquiries;
    this.isSyncing = true;
    try {
      const res = await apiClient.get<PropertyEnquiry[]>('/enquiries');
      if (res.success && Array.isArray(res.data)) {
        this.enquiries = res.data;
        this.saveToStorage();
      }
    } catch (err) {
      console.warn('[EnquiryService] Backend sync failed, using cached data:', err);
    } finally {
      this.isSyncing = false;
    }
    return this.enquiries;
  }

  /**
   * Get all enquiries (Admin can view all)
   */
  getAll(): PropertyEnquiry[] {
    return [...this.enquiries].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  /**
   * Get enquiries assigned to a specific Agent
   */
  getByAgent(agentId: string): PropertyEnquiry[] {
    return this.enquiries
      .filter((e) => e.assignedAgentId === agentId)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  /**
   * Get enquiries filtered by status
   */
  getByStatus(status: EnquiryStatus): PropertyEnquiry[] {
    return this.enquiries
      .filter((e) => e.status === status)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  /**
   * Submit new enquiry from property page
   */
  submitPublicEnquiry(data: {
    propertyId: string;
    propertyTitle: string;
    propertyPrice?: number;
    propertyCity?: string;
    visitorName: string;
    phone: string;
    email?: string;
    message: string;
    preferredContactMethod?: PreferredContactMethod;
    assignedAgentId?: string;
    assignedAgentName?: string;
    assignedAgentPhone?: string;
  }): PropertyEnquiry {
    return this.submitEnquiry(data);
  }

  submitEnquiry(data: {
    propertyId: string;
    propertyTitle: string;
    propertyPrice?: number;
    propertyCity?: string;
    visitorName: string;
    phone: string;
    email?: string;
    message: string;
    preferredContactMethod?: PreferredContactMethod;
    assignedAgentId?: string;
    assignedAgentName?: string;
    assignedAgentPhone?: string;
  }): PropertyEnquiry {
    const newEnquiry: PropertyEnquiry = {
      id: `enq-${Date.now()}`,
      propertyId: data.propertyId,
      propertyTitle: data.propertyTitle,
      propertyPrice: data.propertyPrice,
      propertyCity: data.propertyCity,
      visitorName: data.visitorName.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim(),
      message: data.message.trim(),
      preferredContactMethod: data.preferredContactMethod || 'phone',
      assignedAgentId: data.assignedAgentId,
      assignedAgentName: data.assignedAgentName,
      assignedAgentPhone: data.assignedAgentPhone,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    this.enquiries.unshift(newEnquiry);
    this.saveToStorage();

    // Persist to SQL database
    apiClient.post('/enquiries', {
      id: newEnquiry.id,
      propertyId: newEnquiry.propertyId,
      visitorName: newEnquiry.visitorName,
      email: newEnquiry.email,
      phone: newEnquiry.phone,
      message: newEnquiry.message,
      status: newEnquiry.status,
      agentId: newEnquiry.assignedAgentId,
    }).catch((err) => {
      console.warn('[EnquiryService] Failed to persist enquiry to backend:', err);
    });

    return newEnquiry;
  }

  /**
   * Submit Sell / Valuation lead
   */
  submitSellEnquiry(data: {
    propertyType: string;
    city: string;
    locality?: string;
    visitorName: string;
    phone: string;
    email?: string;
    message: string;
    preferredContactMethod?: PreferredContactMethod;
  }): PropertyEnquiry {
    const newEnquiry: PropertyEnquiry = {
      id: `sell-${Date.now()}`,
      propertyId: 'sell-request',
      propertyTitle: `Sell Request: ${data.propertyType} in ${data.city}`,
      visitorName: data.visitorName.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim(),
      message: `Property Type: ${data.propertyType}. Location: ${data.locality || data.city}. Note: ${data.message}`,
      preferredContactMethod: data.preferredContactMethod || 'phone',
      assignedAgentName: 'Cityspace Concierge',
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    this.enquiries.unshift(newEnquiry);
    this.saveToStorage();

    // Persist to SQL database
    apiClient.post('/enquiries', {
      id: newEnquiry.id,
      propertyId: newEnquiry.propertyId,
      visitorName: newEnquiry.visitorName,
      email: newEnquiry.email,
      phone: newEnquiry.phone,
      message: newEnquiry.message,
      status: newEnquiry.status,
    }).catch((err) => {
      console.warn('[EnquiryService] Failed to persist sell enquiry to backend:', err);
    });

    return newEnquiry;
  }

  /**
   * Update enquiry status (Admin and Agent action)
   */
  updateStatus(id: string, status: EnquiryStatus): boolean {
    const enquiry = this.enquiries.find((e) => e.id === id);
    if (!enquiry) return false;
    enquiry.status = status;
    enquiry.updatedAt = new Date().toISOString();
    this.saveToStorage();

    // Persist status to SQL database
    apiClient.patch(`/enquiries/${id}/status`, { status }).catch((err) => {
      console.warn(`[EnquiryService] Failed to update enquiry status on backend:`, err);
    });

    return true;
  }

  /**
   * Assign an enquiry to an agent (Admin action)
   */
  assignAgent(id: string, agentId: string, agentName: string, agentPhone?: string): boolean {
    const enquiry = this.enquiries.find((e) => e.id === id);
    if (!enquiry) return false;
    enquiry.assignedAgentId = agentId;
    enquiry.assignedAgentName = agentName;
    if (agentPhone) enquiry.assignedAgentPhone = agentPhone;
    enquiry.updatedAt = new Date().toISOString();
    this.saveToStorage();

    // Persist agent assignment to SQL database
    apiClient.patch(`/enquiries/${id}/assign`, { agentId }).catch((err) => {
      console.warn(`[EnquiryService] Failed to assign agent on backend:`, err);
    });

    return true;
  }

  /**
   * Update CRM pipeline stage
   */
  async updatePipelineStage(id: string, pipelineStage: import('@/types/enquiry').PipelineStage): Promise<boolean> {
    const enquiry = this.enquiries.find((e) => e.id === id);
    if (enquiry) {
      enquiry.pipelineStage = pipelineStage;
      enquiry.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
    try {
      const res = await apiClient.patch(`/enquiries/${id}/stage`, { pipelineStage });
      return Boolean(res.success);
    } catch (err) {
      console.warn(`[EnquiryService] Error updating pipeline stage:`, err);
      return false;
    }
  }

  /**
   * Update full CRM lead details (budget, location, notes, follow-up, agent)
   */
  async updateCRMDetails(id: string, updates: Partial<PropertyEnquiry>): Promise<PropertyEnquiry | null> {
    const enquiry = this.enquiries.find((e) => e.id === id);
    if (enquiry) {
      Object.assign(enquiry, updates);
      enquiry.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
    try {
      const res = await apiClient.patch<PropertyEnquiry>(`/enquiries/${id}`, updates);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn(`[EnquiryService] Error updating CRM details:`, err);
    }
    return enquiry || null;
  }

  /**
   * Delete an enquiry (Admin action)
   */
  delete(id: string): boolean {
    const idx = this.enquiries.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.enquiries.splice(idx, 1);
    this.saveToStorage();

    // Delete from SQL database
    apiClient.delete(`/enquiries/${id}`).catch((err) => {
      console.warn(`[EnquiryService] Failed to delete enquiry from backend:`, err);
    });

    return true;
  }
}

export const enquiryService = new EnquiryService();

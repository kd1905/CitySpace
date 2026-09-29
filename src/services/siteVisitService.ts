import { apiClient } from './apiClient';

export type SiteVisitStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export interface SiteVisit {
  id: string;
  propertyId?: string;
  propertyTitle?: string;
  propertySlug?: string;
  propertyPrice?: number;
  propertyCity?: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  agentId?: string;
  agentName?: string;
  agentPhone?: string;
  visitDate: string; // YYYY-MM-DD
  visitTime: string; // HH:MM or 10:00 AM
  status: SiteVisitStatus;
  notes?: string;
  feedback?: string;
  createdAt: string;
  updatedAt?: string;
}

class SiteVisitService {
  async getAll(params?: { status?: string; agentId?: string; date?: string; upcomingOnly?: boolean }): Promise<SiteVisit[]> {
    try {
      const res = await apiClient.get<SiteVisit[]>('/site-visits', params);
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[SiteVisitService] Error fetching site visits:', err);
    }
    return [];
  }

  async getById(id: string): Promise<SiteVisit | null> {
    try {
      const res = await apiClient.get<SiteVisit>(`/site-visits/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[SiteVisitService] Error fetching visit by id:', err);
    }
    return null;
  }

  async create(data: Partial<SiteVisit>): Promise<SiteVisit | null> {
    try {
      const res = await apiClient.post<SiteVisit>('/site-visits', data);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[SiteVisitService] Error creating site visit:', err);
    }
    return null;
  }

  async update(id: string, data: Partial<SiteVisit>): Promise<SiteVisit | null> {
    try {
      const res = await apiClient.put<SiteVisit>(`/site-visits/${id}`, data);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[SiteVisitService] Error updating site visit:', err);
    }
    return null;
  }

  async updateStatus(id: string, status: SiteVisitStatus, feedback?: string): Promise<SiteVisit | null> {
    try {
      const res = await apiClient.patch<SiteVisit>(`/site-visits/${id}/status`, { status, feedback });
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[SiteVisitService] Error updating status:', err);
    }
    return null;
  }

  async reschedule(id: string, visitDate: string, visitTime: string, notes?: string): Promise<SiteVisit | null> {
    try {
      const res = await apiClient.patch<SiteVisit>(`/site-visits/${id}/reschedule`, { visitDate, visitTime, notes });
      if (res.success && res.data) {
        return res.data;
      }
    } catch (err) {
      console.warn('[SiteVisitService] Error rescheduling visit:', err);
    }
    return null;
  }

  async delete(id: string): Promise<boolean> {
    try {
      const res = await apiClient.delete(`/site-visits/${id}`);
      return Boolean(res.success);
    } catch (err) {
      console.warn('[SiteVisitService] Error deleting site visit:', err);
      return false;
    }
  }
}

export const siteVisitService = new SiteVisitService();

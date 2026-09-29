import { apiClient } from './apiClient';

export type VisitStatus =
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'rescheduled'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'scheduled'; // legacy

export interface PropertyVisit {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyCity: string;
  propertyNeighborhood: string;
  propertyPrice: number;
  propertyImage: string;
  // Client
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  // Agent
  agentId: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentAvatar: string;
  // Requested time
  visitDate: string;
  visitTime: string;
  // Alternative slots
  altSlot1Date: string;
  altSlot1Time: string;
  altSlot2Date: string;
  altSlot2Time: string;
  // Confirmed time (set by admin)
  confirmedDate: string;
  confirmedTime: string;
  // Status & reasons
  status: VisitStatus;
  rejectionReason: string;
  rescheduleReason: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitRequest {
  propertyId: string;
  agentId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  visitDate: string;
  visitTime: string;
  altSlot1Date?: string;
  altSlot1Time?: string;
  altSlot2Date?: string;
  altSlot2Time?: string;
  notes?: string;
}

class PropertyVisitService {
  // ── Read ──────────────────────────────────────────────────────────────────

  async getAll(params?: {
    status?: string;
    agentId?: string;
    userPhone?: string;
    propertyId?: string;
    search?: string;
  }): Promise<PropertyVisit[]> {
    try {
      const res = await apiClient.get<PropertyVisit[]>('/site-visits', params);
      if (res.success && Array.isArray(res.data)) return res.data;
    } catch (err) {
      console.warn('[VisitService] getAll error:', err);
    }
    return [];
  }

  async getById(id: string): Promise<PropertyVisit | null> {
    try {
      const res = await apiClient.get<PropertyVisit>(`/site-visits/${id}`);
      if (res.success && res.data) return res.data;
    } catch (err) {
      console.warn('[VisitService] getById error:', err);
    }
    return null;
  }

  async getPendingCount(): Promise<number> {
    try {
      const res = await apiClient.get<number>('/site-visits/pending-count');
      return (res as any).count || 0;
    } catch {
      return 0;
    }
  }

  // ── Agent Actions ─────────────────────────────────────────────────────────

  async createVisitRequest(data: CreateVisitRequest): Promise<{ id: string } | null> {
    try {
      const res = await apiClient.post<{ id: string }>('/site-visits', data);
      if (res.success && res.data) return res.data;
    } catch (err) {
      console.warn('[VisitService] createVisitRequest error:', err);
    }
    return null;
  }

  async complete(id: string, notes?: string): Promise<boolean> {
    try {
      const res = await apiClient.patch(`/site-visits/${id}/complete`, { notes });
      return Boolean(res.success);
    } catch {
      return false;
    }
  }

  async cancel(id: string, reason?: string): Promise<boolean> {
    try {
      const res = await apiClient.patch(`/site-visits/${id}/cancel`, { reason });
      return Boolean(res.success);
    } catch {
      return false;
    }
  }

  async markNoShow(id: string): Promise<boolean> {
    try {
      const res = await apiClient.patch(`/site-visits/${id}/no-show`, {});
      return Boolean(res.success);
    } catch {
      return false;
    }
  }

  // ── Admin Actions ─────────────────────────────────────────────────────────

  async approve(id: string, confirmedDate?: string, confirmedTime?: string): Promise<boolean> {
    try {
      const res = await apiClient.patch(`/site-visits/${id}/approve`, { confirmedDate, confirmedTime });
      return Boolean(res.success);
    } catch {
      return false;
    }
  }

  async reject(id: string, rejectionReason: string): Promise<boolean> {
    try {
      const res = await apiClient.patch(`/site-visits/${id}/reject`, { rejectionReason });
      return Boolean(res.success);
    } catch {
      return false;
    }
  }

  async adminReschedule(
    id: string,
    newDate: string,
    newTime: string,
    rescheduleReason?: string
  ): Promise<boolean> {
    try {
      const res = await apiClient.patch(`/site-visits/${id}/reschedule`, {
        newDate,
        newTime,
        rescheduleReason,
      });
      return Boolean(res.success);
    } catch {
      return false;
    }
  }

  // ── Legacy ────────────────────────────────────────────────────────────────

  async delete(id: string): Promise<boolean> {
    try {
      const res = await apiClient.delete(`/site-visits/${id}`);
      return Boolean(res.success);
    } catch {
      return false;
    }
  }

  // ── Status helpers ────────────────────────────────────────────────────────

  getStatusLabel(status: VisitStatus): string {
    const map: Record<VisitStatus, string> = {
      pending_approval: 'Pending Approval',
      approved: 'Approved',
      rejected: 'Rejected',
      rescheduled: 'Rescheduled',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show',
      scheduled: 'Scheduled',
    };
    return map[status] || status;
  }

  getStatusColor(status: VisitStatus): { text: string; bg: string } {
    const map: Record<VisitStatus, { text: string; bg: string }> = {
      pending_approval: { text: '#D97706', bg: '#FEF3C7' },
      approved: { text: '#059669', bg: '#D1FAE5' },
      rejected: { text: '#DC2626', bg: '#FEE2E2' },
      rescheduled: { text: '#2563EB', bg: '#DBEAFE' },
      completed: { text: '#065F46', bg: '#A7F3D0' },
      cancelled: { text: '#64748B', bg: '#F1F5F9' },
      no_show: { text: '#EA580C', bg: '#FFEDD5' },
      scheduled: { text: '#0284C7', bg: '#E0F2FE' },
    };
    return map[status] || { text: '#64748B', bg: '#F1F5F9' };
  }
}

export const propertyVisitService = new PropertyVisitService();

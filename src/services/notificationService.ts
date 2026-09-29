import { apiClient } from './apiClient';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  recipientRole: 'admin' | 'agent' | 'user' | 'all';
  recipientId: string | null;
  visitId: string | null;
  createdAt: string;
}

class NotificationService {
  async getAll(params: {
    role: 'admin' | 'agent' | 'user';
    recipientId?: string;
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<AppNotification[]> {
    try {
      const res = await apiClient.get<AppNotification[]>('/notifications', {
        role: params.role,
        recipientId: params.recipientId,
        unreadOnly: params.unreadOnly ? 'true' : undefined,
        limit: params.limit || 50,
      });
      if (res.success && Array.isArray(res.data)) return res.data;
    } catch (err) {
      console.warn('[NotificationService] getAll error:', err);
    }
    return [];
  }

  async getUnreadCount(params: {
    role: 'admin' | 'agent' | 'user';
    recipientId?: string;
  }): Promise<number> {
    try {
      const res = await apiClient.get('/notifications/unread-count', {
        role: params.role,
        recipientId: params.recipientId,
      });
      return (res as any).count || 0;
    } catch {
      return 0;
    }
  }

  async markRead(id: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${id}/read`, {});
    } catch (err) {
      console.warn('[NotificationService] markRead error:', err);
    }
  }

  async markAllRead(params: {
    role: 'admin' | 'agent' | 'user';
    recipientId?: string;
  }): Promise<void> {
    try {
      await apiClient.patch('/notifications/read-all', params);
    } catch (err) {
      console.warn('[NotificationService] markAllRead error:', err);
    }
  }

  formatTimeAgo(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  }

  getTypeIcon(type: string): string {
    const map: Record<string, string> = {
      visit_request: 'calendar',
      visit_approved: 'check-circle',
      visit_rejected: 'x-circle',
      visit_rescheduled: 'refresh-cw',
      visit_completed: 'check-square',
      visit_cancelled: 'slash',
      visit_no_show: 'alert-triangle',
      site_visit: 'calendar',
    };
    return map[type] || 'bell';
  }

  getTypeColor(type: string): string {
    const map: Record<string, string> = {
      visit_request: '#D97706',
      visit_approved: '#059669',
      visit_rejected: '#DC2626',
      visit_rescheduled: '#2563EB',
      visit_completed: '#065F46',
      visit_cancelled: '#64748B',
      visit_no_show: '#EA580C',
    };
    return map[type] || '#6366F1';
  }
}

export const notificationService = new NotificationService();

import { apiClient } from './apiClient';

export interface ActivityLog {
  id: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: string;
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

class ActivityService {
  async getRecentActivity(limit = 20): Promise<ActivityLog[]> {
    try {
      const res = await apiClient.get<ActivityLog[]>('/activity', { limit });
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[ActivityService] Error fetching activity:', err);
    }
    return [];
  }

  async logActivity(data: {
    userName?: string;
    action: string;
    entityType: string;
    entityId?: string;
    entityName?: string;
    details?: string;
  }): Promise<void> {
    try {
      await apiClient.post('/activity', data);
    } catch (err) {
      console.warn('[ActivityService] Error logging activity:', err);
    }
  }

  async getNotifications(unreadOnly = false): Promise<AdminNotification[]> {
    try {
      const res = await apiClient.get<AdminNotification[]>('/activity/notifications', { unread: unreadOnly });
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch (err) {
      console.warn('[ActivityService] Error fetching notifications:', err);
    }
    return [];
  }

  async markNotificationRead(id: string): Promise<boolean> {
    try {
      const res = await apiClient.patch(`/activity/notifications/${id}/read`);
      return Boolean(res.success);
    } catch (err) {
      console.warn('[ActivityService] Error marking notification read:', err);
      return false;
    }
  }

  async markAllNotificationsRead(): Promise<boolean> {
    try {
      const res = await apiClient.post('/activity/notifications/mark-all-read');
      return Boolean(res.success);
    } catch (err) {
      console.warn('[ActivityService] Error marking all notifications read:', err);
      return false;
    }
  }
}

export const activityService = new ActivityService();

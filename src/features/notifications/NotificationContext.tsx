import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, AppNotification } from '@/services/notificationService';
import { useAuth } from '@/features/auth/AuthContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const POLL_INTERVAL_MS = 20000; // 20 seconds

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authenticatedRole, isAuthenticatedAgent, isAuthenticatedAdmin, user } = useAuth();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getParams = useCallback(() => {
    if (isAuthenticatedAdmin) {
      return { role: 'admin' as const, recipientId: undefined };
    }
    if (isAuthenticatedAgent && user?.id) {
      return { role: 'agent' as const, recipientId: user.id };
    }
    return null;
  }, [isAuthenticatedAdmin, isAuthenticatedAgent, user?.id]);

  const refresh = useCallback(async () => {
    const params = getParams();
    if (!params) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const [list, count] = await Promise.all([
        notificationService.getAll({ ...params, limit: 30 }),
        notificationService.getUnreadCount(params),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      console.warn('[NotificationContext] refresh error:', err);
    }
  }, [getParams]);

  const markRead = useCallback(async (id: string) => {
    await notificationService.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    const params = getParams();
    if (!params) return;
    await notificationService.markAllRead(params);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, [getParams]);

  // Initial load + polling
  useEffect(() => {
    if (authenticatedRole === 'PUBLIC') {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    refresh().finally(() => setLoading(false));

    intervalRef.current = setInterval(refresh, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [authenticatedRole, user?.id, refresh]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markRead, markAllRead, refresh }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}

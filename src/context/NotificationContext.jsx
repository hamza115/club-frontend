import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';
import { useSocket } from './SocketContext';
import { useAuth } from './useAuth';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const { socket, connected, on, off } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0, unreadCount: 0 });
  const socketHandlerRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch unread count:', err?.response?.data?.message || err.message);
    }
  }, []);

  const fetchNotifications = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params.page) query.set('page', params.page);
      if (params.limit) query.set('limit', params.limit);
      if (params.isRead !== undefined) query.set('isRead', params.isRead);
      if (params.category) query.set('category', params.category);
      if (params.priority) query.set('priority', params.priority);
      if (params.type) query.set('type', params.type);

      const res = await api.get(`/notifications?${query.toString()}`);
      setNotifications(res.data.data);
      setMeta(res.data.meta);
      if (res.data.meta?.unreadCount != null) {
        setUnreadCount(res.data.meta.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true, readAt: new Date() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err?.response?.data?.message || err.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date() })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err?.response?.data?.message || err.message);
    }
  }, []);

  const archiveNotification = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/archive`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to archive notification:', err?.response?.data?.message || err.message);
    }
  }, []);

  const archiveAllRead = useCallback(async () => {
    try {
      await api.put('/notifications/archive-all-read');
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch (err) {
      console.error('Failed to archive read notifications:', err?.response?.data?.message || err.message);
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err?.response?.data?.message || err.message);
    }
  }, []);

  const deleteAllArchived = useCallback(async () => {
    try {
      await api.delete('/notifications/archived');
    } catch (err) {
      console.error('Failed to delete archived notifications:', err?.response?.data?.message || err.message);
    }
  }, []);

  // Socket listener for real-time notifications
  useEffect(() => {
    if (!user) return;

    const handleNewNotification = (data) => {
      if (data?.notification) {
        setNotifications((prev) => {
          // Prevent duplicates
          const exists = prev.some((n) => n._id === data.notification._id);
          if (exists) return prev;
          return [data.notification, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
      }
    };

    // Remove previous handler if exists
    if (socketHandlerRef.current) {
      off('notification:new', socketHandlerRef.current);
    }

    socketHandlerRef.current = handleNewNotification;
    on('notification:new', handleNewNotification);

    return () => {
      off('notification:new', handleNewNotification);
      socketHandlerRef.current = null;
    };
  }, [user, on, off]);

  // Fetch unread count on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        loading,
        meta,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        archiveNotification,
        archiveAllRead,
        deleteNotification,
        deleteAllArchived,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}

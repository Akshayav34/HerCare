import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppNotification } from '../types';
import { dataService } from '../services/dataService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  browserPermission: NotificationPermission;
  requestBrowserPermission: () => Promise<NotificationPermission>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendLocalNotification: (title: string, message: string, type?: AppNotification['type']) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const list = await dataService.getNotifications(user.id);
      setNotifications(list);
    } catch (e) {
      console.warn('Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const requestBrowserPermission = async (): Promise<NotificationPermission> => {
    if (typeof Notification === 'undefined') {
      return 'denied';
    }
    try {
      const perm = await Notification.requestPermission();
      setBrowserPermission(perm);
      return perm;
    } catch {
      return 'denied';
    }
  };

  const markAsRead = async (id: string) => {
    await dataService.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await dataService.markAllNotificationsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const sendLocalNotification = (title: string, message: string, type: AppNotification['type'] = 'system') => {
    // 1. In-app notification
    const newNotif: AppNotification = {
      id: 'notif-' + Date.now(),
      user_id: user?.id || 'guest',
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [newNotif, ...prev]);

    // 2. Browser native notification if permission granted
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification(`HerCare: ${title}`, {
          body: message,
          icon: '/vite.svg',
        });
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        browserPermission,
        requestBrowserPermission,
        markAsRead,
        markAllAsRead,
        sendLocalNotification,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

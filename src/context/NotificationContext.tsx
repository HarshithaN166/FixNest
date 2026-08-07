import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotifType = 'booking' | 'ai' | 'system' | 'rating';

export interface AppNotification {
  id: string;
  targetUserId?: string; // Recipient user ID or pro ID
  type: NotifType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionPayload?: {
    proId?: string;
    bookingId?: string;
    proName?: string;
  };
}

const NOTIF_KEY = '@fixnest_notifications';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  sendTargetedNotification: (targetUserId: string, notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
  markAllRead: () => void;
  clearAll: () => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIF_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('[NotificationContext] Error loading notifications:', e);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const saveNotifications = async (list: AppNotification[]) => {
    try {
      await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('[NotificationContext] Error saving notifications:', e);
    }
  };

  const addNotification = useCallback(
    (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
      const newNotif: AppNotification = {
        ...notif,
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      setNotifications((prev) => {
        const updated = [newNotif, ...prev];
        saveNotifications(updated);
        return updated;
      });
    },
    []
  );

  const sendTargetedNotification = useCallback(
    async (targetUserId: string, notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
      const newNotif: AppNotification = {
        ...notif,
        targetUserId,
        id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };
      try {
        const stored = await AsyncStorage.getItem(NOTIF_KEY);
        const existing: AppNotification[] = stored ? JSON.parse(stored) : [];
        const updated = [newNotif, ...existing];
        await saveNotifications(updated);
        setNotifications(updated);
      } catch (e) {
        console.warn('[NotificationContext] Error sending targeted notification:', e);
      }
    },
    []
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    AsyncStorage.removeItem(NOTIF_KEY);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        sendTargetedNotification,
        markAllRead,
        clearAll,
        refreshNotifications: loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

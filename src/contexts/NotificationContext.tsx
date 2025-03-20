'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import api, { repositoryApi } from '../services/api';

export interface Notification {
  id: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  timestamp: string;
  read: boolean;
  details?: {
    repoId?: string;
    repoName?: string;
    [key: string]: any;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationIds: string[]) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  getRepositoryNotifications: (repoId: string) => Promise<Notification[]>;
  addRepositoryNotification: (repoId: string, message: string, type: 'error' | 'warning' | 'info' | 'success', details?: any) => Promise<void>;
  subscribeToRepository: (repoId: string) => Promise<void>;
  unsubscribeFromRepository: (repoId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriberId, setSubscriberId] = useState<string>('');

  // Generate a unique subscriber ID for this session
  useEffect(() => {
    const generateSubscriberId = () => {
      const storedId = localStorage.getItem('subscriberId');
      if (storedId) {
        setSubscriberId(storedId);
      } else {
        const newId = `client-${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('subscriberId', newId);
        setSubscriberId(newId);
      }
    };

    generateSubscriberId();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/api/notifications`);

      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread || 0);
      setTotalCount(response.data.total || 0);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.patch(`${apiUrl}/api/notifications/mark-as-read`, { notificationIds });

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (err: any) {
      console.error('Error marking notifications as read:', err);
      setError(err.message || 'Error marking notifications as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(notification => !notification.read)
        .map(notification => notification.id);

      if (unreadIds.length > 0) {
        await markAsRead(unreadIds);
      }
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      setError(err.message || 'Error marking all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.delete(`${apiUrl}/api/notifications/${notificationId}`);

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setTotalCount(prev => prev - 1);
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => prev - 1);
      }
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      setError(err.message || 'Error deleting notification');
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      await axios.delete(`${apiUrl}/api/notifications`);

      // Clear local state
      setNotifications([]);
      setTotalCount(0);
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error deleting all notifications:', err);
      setError(err.message || 'Error deleting all notifications');
    }
  };

  const getRepositoryNotifications = async (repoId: string): Promise<Notification[]> => {
    try {
      const result = await repositoryApi.getRepositoryNotifications(repoId);
      return result.notifications || [];
    } catch (err: any) {
      console.error('Error fetching repository notifications:', err);
      setError(err.message || 'Error fetching repository notifications');
      return [];
    }
  };

  const addRepositoryNotification = async (
    repoId: string, 
    message: string, 
    type: 'error' | 'warning' | 'info' | 'success', 
    details?: any
  ) => {
    try {
      await repositoryApi.addRepositoryNotification(repoId, { message, type, details });
      // Optionally refetch notifications if needed
      fetchNotifications();
    } catch (err: any) {
      console.error('Error adding repository notification:', err);
      setError(err.message || 'Error adding repository notification');
    }
  };

  const subscribeToRepository = async (repoId: string) => {
    if (!subscriberId) return;
    try {
      await repositoryApi.subscribeToRepository(repoId, subscriberId);
    } catch (err: any) {
      console.error('Error subscribing to repository:', err);
      setError(err.message || 'Error subscribing to repository');
    }
  };

  const unsubscribeFromRepository = async (repoId: string) => {
    if (!subscriberId) return;
    try {
      await repositoryApi.unsubscribeFromRepository(repoId, subscriberId);
    } catch (err: any) {
      console.error('Error unsubscribing from repository:', err);
      setError(err.message || 'Error unsubscribing from repository');
    }
  };

  // Fetch notifications on initial load
  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        totalCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        getRepositoryNotifications,
        addRepositoryNotification,
        subscribeToRepository,
        unsubscribeFromRepository
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Define the notification interface
export interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: string;
  read: boolean;
  details?: Record<string, any>;
}

// Define notification input for creating new notifications
export interface NotificationInput {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  details?: Record<string, any>;
}

// Define the context interface
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  addNotification: (notification: NotificationInput) => Promise<void>;
}

// Create the context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  totalCount: 0,
  loading: false,
  error: null,
  fetchNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  deleteAllNotifications: async () => {},
  addNotification: async () => {},
});

// Provider component
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Fetch notifications from the API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/notifications`);
      
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unread);
      setTotalCount(response.data.total);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Add a new notification
  const addNotification = async (notification: NotificationInput) => {
    try {
      const response = await axios.post(`${API_URL}/api/notifications`, notification);
      
      if (response.data) {
        // Add the new notification to the state
        const newNotification: Notification = response.data;
        setNotifications([newNotification, ...notifications]);
        setUnreadCount(prev => prev + 1);
        setTotalCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error adding notification:', err);
      setError('Failed to add notification');
      
      // For testing purposes, create a client-side notification if the API call fails
      const timestamp = new Date().toISOString();
      const id = `local-${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
      
      const newNotification: Notification = {
        id,
        ...notification,
        timestamp,
        read: false
      };
      
      setNotifications([newNotification, ...notifications]);
      setUnreadCount(prev => prev + 1);
      setTotalCount(prev => prev + 1);
    }
  };

  // Mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      const response = await axios.patch(`${API_URL}/api/notifications/mark-as-read`, {
        notificationIds: [id]
      });
      
      if (response.data.success) {
        setNotifications(notifications.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
      
      // For testing purposes, update the state even if the API call fails
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(notification => !notification.read)
        .map(notification => notification.id);
      
      if (unreadIds.length === 0) return;
      
      const response = await axios.patch(`${API_URL}/api/notifications/mark-as-read`, {
        notificationIds: unreadIds
      });
      
      if (response.data.success) {
        setNotifications(notifications.map(notification => ({ ...notification, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
      
      // For testing purposes, update the state even if the API call fails
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
    }
  };

  // Delete a notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await axios.delete(`${API_URL}/api/notifications/${id}`);
      
      if (response.data.success) {
        const deletedNotification = notifications.find(n => n.id === id);
        const wasUnread = deletedNotification && !deletedNotification.read;
        
        setNotifications(notifications.filter(notification => notification.id !== id));
        setTotalCount(prev => prev - 1);
        
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
      
      // For testing purposes, update the state even if the API call fails
      const deletedNotification = notifications.find(n => n.id === id);
      const wasUnread = deletedNotification && !deletedNotification.read;
      
      setNotifications(notifications.filter(notification => notification.id !== id));
      setTotalCount(prev => prev - 1);
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      const response = await axios.delete(`${API_URL}/api/notifications`);
      
      if (response.data.success) {
        setNotifications([]);
        setTotalCount(0);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      setError('Failed to delete all notifications');
      
      // For testing purposes, update the state even if the API call fails
      setNotifications([]);
      setTotalCount(0);
      setUnreadCount(0);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
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
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use the notification context
export function useNotifications() {
  return useContext(NotificationContext);
} 
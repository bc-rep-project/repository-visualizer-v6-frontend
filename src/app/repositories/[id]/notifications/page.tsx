'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaCheck, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTrash, FaBell, FaBellSlash } from 'react-icons/fa';
import { useNotifications } from '@/contexts/NotificationContext';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import { repositoryApi } from '@/services/api';
import Link from 'next/link';

interface Repository {
  _id: string;
  repo_name?: string;
  name?: string;
  repo_url: string;
  description?: string;
  owner?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
}

export default function RepositoryNotifications() {
  const params = useParams();
  const router = useRouter();
  const repoId = params.id as string;
  
  const { 
    markAsRead, 
    getRepositoryNotifications, 
    addRepositoryNotification,
    subscribeToRepository,
    unsubscribeFromRepository
  } = useNotifications();
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [newNotification, setNewNotification] = useState({
    message: '',
    type: 'info' as 'error' | 'warning' | 'info' | 'success',
    details: {}
  });
  const [showNotificationForm, setShowNotificationForm] = useState(false);

  // Fetch repository details and notifications
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch repository details
        const repo = await repositoryApi.getRepository(repoId);
        setRepository(repo as Repository);
        
        // Subscribe to notifications
        await subscribeToRepository(repoId);
        setIsSubscribed(true);
        
        // Fetch repository notifications
        await fetchNotifications();
      } catch (err: any) {
        console.error('Error fetching repository or notifications:', err);
        setError(err.message || 'Failed to load repository notifications');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribeFromRepository(repoId).catch(console.error);
    };
  }, [repoId]);

  const fetchNotifications = async () => {
    try {
      const result = await repositoryApi.getRepositoryNotifications(repoId, {
        status: filter !== 'all' ? filter : undefined
      });
      
      setNotifications(result.notifications || []);
      setUnreadCount(result.unread || 0);
      setTotalCount(result.total || 0);
    } catch (err: any) {
      console.error('Error fetching repository notifications:', err);
      setError(err.message || 'Failed to load notifications');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead([notificationId]);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(notification => !notification.read)
        .map(notification => notification.id);
      
      if (unreadIds.length > 0) {
        await markAsRead(unreadIds);
        
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        
        setUnreadCount(0);
      }
    } catch (err: any) {
      console.error('Error marking all notifications as read:', err);
      setError(err.message || 'Failed to mark all notifications as read');
    }
  };

  const handleToggleSubscription = async () => {
    try {
      if (isSubscribed) {
        await unsubscribeFromRepository(repoId);
        setIsSubscribed(false);
      } else {
        await subscribeToRepository(repoId);
        setIsSubscribed(true);
      }
    } catch (err: any) {
      console.error('Error toggling subscription:', err);
      setError(err.message || 'Failed to update subscription');
    }
  };

  const handleAddNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newNotification.message.trim()) {
      setError('Notification message is required');
      return;
    }
    
    try {
      await addRepositoryNotification(
        repoId,
        newNotification.message,
        newNotification.type,
        newNotification.details
      );
      
      // Reset form
      setNewNotification({
        message: '',
        type: 'info',
        details: {}
      });
      
      setShowNotificationForm(false);
      
      // Refresh notifications
      await fetchNotifications();
    } catch (err: any) {
      console.error('Error adding notification:', err);
      setError(err.message || 'Failed to add notification');
    }
  };

  // Format timestamp
  const formatDate = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'info':
        return <FaInfoCircle className="text-blue-500" />;
      case 'success':
        return <FaCheckCircle className="text-green-500" />;
      default:
        return <FaInfoCircle className="text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {repository && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                  {repository.repo_name || repository.name || 'Unknown Repository'}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {repository.description || 'No description available'}
                </p>
              </div>
              
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <Link 
                  href={`/repositories/${repoId}`}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Back to Repository
                </Link>
                
                <button
                  onClick={handleToggleSubscription}
                  className={`flex items-center px-4 py-2 rounded ${
                    isSubscribed
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <FaBellSlash className="mr-2" /> Unsubscribe
                    </>
                  ) : (
                    <>
                      <FaBell className="mr-2" /> Subscribe
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">FILTER</h2>
              
              <div className="space-y-2 mb-6">
                <button
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    filter === 'all' 
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                  }`}
                  onClick={() => {
                    setFilter('all');
                    fetchNotifications();
                  }}
                >
                  All
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    filter === 'unread' 
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                  }`}
                  onClick={() => {
                    setFilter('unread');
                    fetchNotifications();
                  }}
                >
                  Unread
                </button>
                <button
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    filter === 'read' 
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                  }`}
                  onClick={() => {
                    setFilter('read');
                    fetchNotifications();
                  }}
                >
                  Read
                </button>
              </div>
              
              {unreadCount > 0 && (
                <div className="mt-6">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
                  >
                    Mark All as Read
                  </button>
                </div>
              )}
              
              <div className="mt-6">
                <button
                  onClick={() => setShowNotificationForm(!showNotificationForm)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md"
                >
                  {showNotificationForm ? 'Cancel' : 'Add Notification'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Main content */}
          <div className="md:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h1 className="text-xl font-semibold dark:text-white">Repository Notifications</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {totalCount} total, {unreadCount} unread
                </p>
              </div>
              
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border-b border-red-100 dark:border-red-900/20">
                  {error}
                </div>
              )}
              
              {showNotificationForm && (
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold mb-4 dark:text-white">Add New Notification</h2>
                  <form onSubmit={handleAddNotification}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Message
                      </label>
                      <input
                        type="text"
                        value={newNotification.message}
                        onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Enter notification message"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <select
                        value={newNotification.type}
                        onChange={(e) => setNewNotification({
                          ...newNotification, 
                          type: e.target.value as 'error' | 'warning' | 'info' | 'success'
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Add Notification
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No notifications found for this repository.</p>
                </div>
              ) : (
                <ul className="divide-y dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <li 
                      key={notification.id} 
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.message}
                            </p>
                            <div className="flex space-x-2">
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
                                  title="Mark as read"
                                >
                                  <FaCheck />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(notification.timestamp)}
                          </p>
                          {notification.details && Object.keys(notification.details).length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Additional Details:
                              </p>
                              <pre className="mt-1 text-xs overflow-x-auto">
                                {JSON.stringify(notification.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
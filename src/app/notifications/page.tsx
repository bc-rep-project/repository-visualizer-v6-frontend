'use client';

import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'error' | 'warning' | 'info' | 'success'>('all');
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchNotifications();
  }, [filter, typeFilter, currentPage]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let url = `http://localhost:8000/api/notifications?page=${currentPage}&limit=${itemsPerPage}`;
      
      if (filter === 'unread') {
        url += '&unread=true';
      } else if (filter === 'read') {
        url += '&read=true';
      }
      
      if (typeFilter !== 'all') {
        url += `&type=${typeFilter}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data.notifications);
      setTotalCount(data.total);
      setUnreadCount(data.unread_count);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
      setError(null);
    } catch (err) {
      setError('Error loading notifications. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/notifications/${id}/read`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update the notification in the state
      setNotifications(notifications.map(notification => 
        notification._id === id ? { ...notification, read: true } : notification
      ));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError('Error marking notification as read. Please try again.');
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/notifications/read-all', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update all notifications in the state
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
      
      // Update unread count
      setUnreadCount(0);
    } catch (err) {
      setError('Error marking all notifications as read. Please try again.');
      console.error(err);
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <FaBell className="text-2xl mr-2 text-gray-700 dark:text-gray-300" />
        <h1 className="text-2xl font-bold dark:text-white">Notifications</h1>
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">STATISTICS</h2>
            
            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{totalCount}</h3>
                <p className="text-gray-500 dark:text-gray-400">Total Notifications</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{unreadCount}</h3>
                <p className="text-gray-500 dark:text-gray-400">Unread</p>
              </div>
            </div>
            
            <h2 className="text-lg font-semibold mb-4 dark:text-white">QUICK FILTERS</h2>
            
            <div className="space-y-2 mb-6">
              <button
                className={`w-full text-left px-3 py-2 rounded-md ${
                  filter === 'all' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`w-full text-left px-3 py-2 rounded-md ${
                  filter === 'unread' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => setFilter('unread')}
              >
                Unread
              </button>
              <button
                className={`w-full text-left px-3 py-2 rounded-md ${
                  filter === 'read' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => setFilter('read')}
              >
                Read
              </button>
            </div>
            
            <h2 className="text-lg font-semibold mb-4 dark:text-white">TYPE</h2>
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={typeFilter === 'all' || typeFilter === 'error'} 
                  onChange={() => setTypeFilter(typeFilter === 'error' ? 'all' : 'error')}
                  className="rounded text-red-600 focus:ring-red-500 mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Error</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={typeFilter === 'all' || typeFilter === 'warning'} 
                  onChange={() => setTypeFilter(typeFilter === 'warning' ? 'all' : 'warning')}
                  className="rounded text-yellow-600 focus:ring-yellow-500 mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Warning</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={typeFilter === 'all' || typeFilter === 'info'} 
                  onChange={() => setTypeFilter(typeFilter === 'info' ? 'all' : 'info')}
                  className="rounded text-blue-600 focus:ring-blue-500 mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Info</span>
              </label>
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  checked={typeFilter === 'all' || typeFilter === 'success'} 
                  onChange={() => setTypeFilter(typeFilter === 'success' ? 'all' : 'success')}
                  className="rounded text-green-600 focus:ring-green-500 mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">Success</span>
              </label>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white">
                {filter === 'all' ? 'All Notifications' : 
                 filter === 'unread' ? 'Unread Notifications' : 'Read Notifications'}
              </h2>
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md ${
                  unreadCount === 0 && 'opacity-50 cursor-not-allowed'
                }`}
              >
                Mark All as Read
              </button>
            </div>
      
      {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="medium" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No notifications found.</p>
              </div>
            ) : (
              <div>
                <ul className="divide-y dark:divide-gray-700">
          {notifications.map((notification) => (
                    <li 
                      key={notification._id} 
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {notification.title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <button
                            onClick={() => markAsRead(notification._id)}
                            className="ml-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Mark as read"
                  >
                            <FaCheck />
                  </button>
                )}
                      </div>
                    </li>
                  ))}
                </ul>
                
                {/* Pagination */}
                <div className="flex justify-between items-center p-4 border-t dark:border-gray-700">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="px-1 py-1 text-gray-500 dark:text-gray-400">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === totalPages
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
        </div>
        </div>
    </div>
  );
} 
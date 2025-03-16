'use client';

import React, { useState } from 'react';
import { FaCheck, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTrash } from 'react-icons/fa';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    totalCount, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    deleteAllNotifications 
  } = useNotifications();
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'error' | 'warning' | 'info' | 'success'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter notifications based on read status and type
  const filteredNotifications = notifications.filter(notification => {
    // Filter by read status
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;
    
    // Filter by type
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    
    return true;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
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
                  setCurrentPage(1);
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
                  setCurrentPage(1);
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
                  setCurrentPage(1);
                }}
              >
                Read
              </button>
            </div>
            
            <h2 className="text-lg font-semibold mb-4 dark:text-white">TYPE</h2>
            
            <div className="space-y-2">
              <button
                className={`w-full text-left px-3 py-2 rounded-md ${
                  typeFilter === 'all' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => {
                  setTypeFilter('all');
                  setCurrentPage(1);
                }}
              >
                All Types
              </button>
              <button
                className={`w-full text-left px-3 py-2 rounded-md ${
                  typeFilter === 'error' 
                    ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => {
                  setTypeFilter('error');
                  setCurrentPage(1);
                }}
              >
                Error
              </button>
              <button
                className={`w-full text-left px-3 py-2 rounded-md ${
                  typeFilter === 'warning' 
                    ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => {
                  setTypeFilter('warning');
                  setCurrentPage(1);
                }}
              >
                Warning
              </button>
              <button
                className={`w-full text-left px-3 py-2 rounded-md ${
                  typeFilter === 'info' 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => {
                  setTypeFilter('info');
                  setCurrentPage(1);
                }}
              >
                Info
              </button>
              <button
                className={`w-full text-left px-3 py-2 rounded-md ${
                  typeFilter === 'success' 
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => {
                  setTypeFilter('success');
                  setCurrentPage(1);
                }}
              >
                Success
              </button>
            </div>
            
            {unreadCount > 0 && (
              <div className="mt-6">
                <button
                  onClick={markAllAsRead}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
                >
                  Mark All as Read
                </button>
              </div>
            )}
            
            {totalCount > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete all notifications?')) {
                      deleteAllNotifications();
                    }
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
                >
                  Delete All
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-semibold dark:text-white">Notifications</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {totalCount} total, {unreadCount} unread
              </p>
            </div>
            
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border-b border-red-100 dark:border-red-900/20">
                {error}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="medium" />
              </div>
            ) : paginatedNotifications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No notifications found.</p>
              </div>
            ) : (
              <div>
                <ul className="divide-y dark:divide-gray-700">
                  {paginatedNotifications.map((notification) => (
                    <li 
                      key={notification.id} 
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
                              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(notification.timestamp)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {notification.message}
                          </p>
                          {notification.details && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs text-gray-600 dark:text-gray-400">
                              {Object.entries(notification.details).map(([key, value]) => (
                                <div key={key} className="flex">
                                  <span className="font-medium mr-2">{key}:</span>
                                  <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-shrink-0 flex space-x-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Mark as read"
                            >
                              <FaCheck />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete notification"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 flex justify-center">
                    <nav className="flex items-center space-x-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
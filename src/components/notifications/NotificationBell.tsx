'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { BellIcon, CheckIcon, TrashIcon } from 'lucide-react';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, deleteNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <div className="w-2 h-2 rounded-full bg-red-500"></div>;
      case 'warning':
        return <div className="w-2 h-2 rounded-full bg-yellow-500"></div>;
      case 'info':
        return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
      case 'success':
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
            <Link 
              href="/notifications" 
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => setIsOpen(false)}
            >
              View all
            </Link>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.slice(0, 5).map((notification) => (
                  <li 
                    key={notification.id} 
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Mark as read"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete notification"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href="/notifications" 
                className="block w-full py-2 px-3 text-center text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-800 dark:text-gray-200"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
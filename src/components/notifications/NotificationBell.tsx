'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch unread notifications count (mock implementation)
  useEffect(() => {
    // In a real implementation, you would fetch from your API
    const mockUnreadCount = Math.floor(Math.random() * 5); // 0-4 notifications
    setUnreadCount(mockUnreadCount);
    
    // You could set up polling here
    const interval = setInterval(() => {
      const newCount = Math.floor(Math.random() * 5);
      setUnreadCount(newCount);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <button
        className={`p-2 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-100 focus:outline-none ${className || ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-xs text-white font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {showDropdown && (
        <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm border-b border-gray-200 dark:border-gray-600 font-medium">
              Notifications
            </div>
            {unreadCount === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No new notifications
              </div>
            ) : (
              <>
                {/* Example notification items - in real app, loop through actual notifications */}
                <Link href="/notifications/1" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div className="font-medium">Repository analysis complete</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</div>
                </Link>
                {unreadCount > 1 && (
                  <Link href="/notifications/2" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">
                    <div className="font-medium">New commit detected</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</div>
                  </Link>
                )}
              </>
            )}
            <div className="border-t border-gray-200 dark:border-gray-600">
              <Link href="/notifications" className="block px-4 py-2 text-sm text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-600">
                View all notifications
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
} 
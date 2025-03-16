'use client';

import React from 'react';
import { NotificationProvider } from '@/contexts/NotificationContext';
import NotificationButtons from './NotificationButtons';

export default function ClientNotificationTest() {
  return (
    <NotificationProvider>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Notification System Test (Client)</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          This is a client-side only version of the notification test page.
          Use the buttons below to create test notifications and observe how they appear in the notification bell
          in the top navigation bar.
        </p>
        
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Notification Test</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Use the buttons below to create test notifications of different types.
          </p>
          
          <NotificationButtons />
        </div>
      </div>
    </NotificationProvider>
  );
} 
'use client';

import React from 'react';
import Layout from '@/components/layout/Layout';
import NotificationTest from '@/components/notifications/NotificationTest';

export default function NotificationTestPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Notification System Test</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          This page allows you to test the notification system by creating different types of notifications.
          Use the buttons below to create test notifications and observe how they appear in the notification bell
          in the top navigation bar.
        </p>
        
        <NotificationTest />
      </div>
    </Layout>
  );
} 
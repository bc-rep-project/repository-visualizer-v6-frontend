'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

export default function NotificationButtons() {
  const [message, setMessage] = useState<string | null>(null);
  const notificationContext = useNotifications();

  const createSuccessNotification = () => {
    try {
      notificationContext.addNotification({
        type: 'success',
        message: 'Repository cloned successfully',
        details: { repository: 'repository-visualizer-v6-frontend' }
      });
      setMessage('Success notification created!');
    } catch (error) {
      console.error('Error creating notification:', error);
      setMessage('Error creating notification. See console for details.');
    }
  };

  const createErrorNotification = () => {
    try {
      notificationContext.addNotification({
        type: 'error',
        message: 'Failed to analyze repository',
        details: { repository: 'unknown-repo', error_code: 'REPO_NOT_FOUND' }
      });
      setMessage('Error notification created!');
    } catch (error) {
      console.error('Error creating notification:', error);
      setMessage('Error creating notification. See console for details.');
    }
  };

  const createWarningNotification = () => {
    try {
      notificationContext.addNotification({
        type: 'warning',
        message: 'Repository has potential security vulnerabilities',
        details: { repository: 'repository-visualizer-v6-backend', vulnerability_count: 3 }
      });
      setMessage('Warning notification created!');
    } catch (error) {
      console.error('Error creating notification:', error);
      setMessage('Error creating notification. See console for details.');
    }
  };

  const createInfoNotification = () => {
    try {
      notificationContext.addNotification({
        type: 'info',
        message: 'New version of the application is available',
        details: { version: '2.0.0', release_notes: 'https://example.com/release-notes' }
      });
      setMessage('Info notification created!');
    } catch (error) {
      console.error('Error creating notification:', error);
      setMessage('Error creating notification. See console for details.');
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={createSuccessNotification}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          Create Success Notification
        </button>
        
        <button 
          onClick={createErrorNotification}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
        >
          Create Error Notification
        </button>
        
        <button 
          onClick={createWarningNotification}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md"
        >
          Create Warning Notification
        </button>
        
        <button 
          onClick={createInfoNotification}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Create Info Notification
        </button>
      </div>
      
      {message && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-center">
          {message}
        </div>
      )}
    </div>
  );
} 
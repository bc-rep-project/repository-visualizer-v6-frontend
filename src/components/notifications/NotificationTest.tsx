'use client';

import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/common/Button';

export default function NotificationTest() {
  const { addNotification } = useNotifications();

  const createSuccessNotification = () => {
    addNotification({
      type: 'success',
      message: 'Repository cloned successfully',
      details: { repository: 'repository-visualizer-v6-frontend' }
    });
  };

  const createErrorNotification = () => {
    addNotification({
      type: 'error',
      message: 'Failed to analyze repository',
      details: { repository: 'unknown-repo', error_code: 'REPO_NOT_FOUND' }
    });
  };

  const createWarningNotification = () => {
    addNotification({
      type: 'warning',
      message: 'Repository has potential security vulnerabilities',
      details: { repository: 'repository-visualizer-v6-backend', vulnerability_count: 3 }
    });
  };

  const createInfoNotification = () => {
    addNotification({
      type: 'info',
      message: 'New version of the application is available',
      details: { version: '2.0.0', release_notes: 'https://example.com/release-notes' }
    });
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Notification Test</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Use the buttons below to create test notifications of different types.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          onClick={createSuccessNotification}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Create Success Notification
        </Button>
        
        <Button 
          onClick={createErrorNotification}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Create Error Notification
        </Button>
        
        <Button 
          onClick={createWarningNotification}
          className="bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          Create Warning Notification
        </Button>
        
        <Button 
          onClick={createInfoNotification}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Create Info Notification
        </Button>
      </div>
    </div>
  );
} 
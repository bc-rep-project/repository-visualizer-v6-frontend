'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function NotificationTestError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Notification test error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Notification System Error</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          There was an error loading the notification test page. This might be due to issues with the notification system.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Try Again
          </button>
          <Link 
            href="/"
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
} 
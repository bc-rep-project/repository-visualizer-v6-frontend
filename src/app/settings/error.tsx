'use client';

import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';

export default function SettingsErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the console
    console.error('Settings page error:', error);
  }, [error]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-red-800 dark:text-red-400 mb-4">
            Error Loading Settings
          </h2>
          <p className="text-red-700 dark:text-red-300 mb-4">
            There was a problem loading the settings page. This might be due to a network issue or a problem with the application.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </Layout>
  );
} 
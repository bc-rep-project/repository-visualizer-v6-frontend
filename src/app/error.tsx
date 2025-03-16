'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">Error</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-6">Something went wrong</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          An unexpected error has occurred. Please try again later.
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
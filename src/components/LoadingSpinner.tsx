import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
  message?: string;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  fullPage = false,
  message = 'Loading...'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-3',
  };

  const spinner = (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent dark:border-t-blue-400 dark:border-b-blue-400`}></div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex flex-col items-center justify-center z-50">
        {spinner}
        {message && <p className="mt-4 text-gray-600 dark:text-gray-300">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {spinner}
      {message && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{message}</p>}
    </div>
  );
} 
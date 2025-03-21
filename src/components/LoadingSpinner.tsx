import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
  message?: string;
  className?: string;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}

export default function LoadingSpinner({ 
  size = 'medium', 
  fullPage = false,
  message = 'Loading...',
  className = '',
  color = 'blue'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-3',
  };

  const colorClasses = {
    blue: 'border-t-blue-500 border-b-blue-500 dark:border-t-blue-400 dark:border-b-blue-400',
    green: 'border-t-green-500 border-b-green-500 dark:border-t-green-400 dark:border-b-green-400',
    red: 'border-t-red-500 border-b-red-500 dark:border-t-red-400 dark:border-b-red-400',
    purple: 'border-t-purple-500 border-b-purple-500 dark:border-t-purple-400 dark:border-b-purple-400',
    yellow: 'border-t-yellow-500 border-b-yellow-500 dark:border-t-yellow-400 dark:border-b-yellow-400',
  };

  const spinner = (
    <div className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} border-r-transparent border-l-transparent ${className}`}></div>
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
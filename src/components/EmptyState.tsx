import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  message: string;
  actionText?: string;
  actionLink?: string;
}

export default function EmptyState({ title, message, actionText, actionLink }: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
      <h2 className="text-xl font-bold mb-2 dark:text-white">{title}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
      
      {actionText && actionLink && (
        <Link 
          href={actionLink}
          className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium py-2 px-4 rounded inline-block"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
} 
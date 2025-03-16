// Force static generation for this page
export const dynamic = 'force-static';

import Link from 'next/link';

export default function NotificationTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Notification System Test</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        This page allows you to test the notification system by creating different types of notifications.
        Use the buttons below to create test notifications and observe how they appear in the notification bell
        in the top navigation bar.
      </p>
      
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Notification Test</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This is a static page. For the interactive version with working notification buttons, please visit:
        </p>
        
        <Link 
          href="/notification-test/client"
          className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Go to Interactive Notification Test
        </Link>
      </div>
    </div>
  );
} 
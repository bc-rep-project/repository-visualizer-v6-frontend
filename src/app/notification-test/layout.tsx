import Link from 'next/link';
import { NotificationProviderWrapper } from './NotificationProviderWrapper';

// Force static generation for this layout
export const dynamic = 'force-static';

export default function NotificationTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-xl font-bold text-gray-900 dark:text-white">Repository Visualizer</span>
              </Link>
            </div>
            <nav className="flex space-x-4">
              <Link 
                href="/"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link 
                href="/repositories"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Repositories
              </Link>
            </nav>
          </div>
        </div>
      </header>
      
      <NotificationProviderWrapper>
        <main>
          {children}
        </main>
      </NotificationProviderWrapper>
    </div>
  );
} 
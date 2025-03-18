import Layout from '@/components/layout/Layout';

export default function SettingsLoading() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          
          <div className="h-4 w-full max-w-2xl bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          
          <div className="flex gap-4 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            ))}
          </div>
          
          <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="h-4 w-full max-w-md bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            
            <div className="space-y-6 mt-6">
              <div className="flex flex-col gap-2">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                <div className="h-6 w-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              </div>
            </div>
            
            <div className="h-10 w-36 bg-gray-200 dark:bg-gray-700 rounded-md mt-4"></div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 
'use client';

import Navigation from '@/components/Navigation';
import RepositoryList from '@/components/RepositoryList';

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Repository Manager</h1>
        </div>
        <RepositoryList />
      </main>
    </>
  );
} 
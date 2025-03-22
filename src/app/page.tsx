'use client';

import Navigation from '@/components/Navigation';
import RepositoryList from '@/components/RepositoryList';

export default function Home() {
  return (
    <>
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        <RepositoryList />
      </main>
    </>
  );
} 
'use client';

import Navigation from '@/components/Navigation';
import RepositoryList from '@/components/RepositoryList';
import Footer from '@/components/Footer';

export default function RepositoriesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-6 flex-grow">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Repositories</h1>
        <RepositoryList />
      </main>
      <Footer />
    </div>
  );
} 
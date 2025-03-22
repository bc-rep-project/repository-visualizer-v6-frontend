'use client';

import Navigation from '@/components/Navigation';
import RepositoryList from '@/components/RepositoryList';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-6 flex-grow">
        <RepositoryList />
      </main>
      <Footer />
    </div>
  );
} 
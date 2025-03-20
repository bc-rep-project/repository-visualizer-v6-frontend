'use client';

import React from 'react';
import EnhancedRepositoryView from '@/components/EnhancedRepositoryView';
import { PageHeader } from '@/components/PageHeader';
import { useParams } from 'next/navigation';

export default function RepositoryAnalyzePage() {
  const params = useParams();
  const repositoryId = params.id as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Enhanced Repository Analysis"
        description="Explore your repository's code structure, functions, classes, and dependencies"
      />
      
      <div className="mt-6">
        <EnhancedRepositoryView repositoryId={repositoryId} />
      </div>
    </div>
  );
} 
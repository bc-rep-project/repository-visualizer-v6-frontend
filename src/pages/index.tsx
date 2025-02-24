import React from 'react';
import Layout from '@/components/layout/Layout';
import { RepositoryList } from '@/components/features/repositories/RepositoryList';

export default function Home() {
    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-semibold tracking-tight">Repositories</h1>
                </div>
                <div className="p-6 bg-card rounded-lg border">
                    <RepositoryList />
                </div>
            </div>
        </Layout>
    );
} 
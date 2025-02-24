import React from 'react';
import { RepositoryList } from '../components/features/repositories/RepositoryList';

const Home: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-sky-100 to-blue-200">
            <header className="bg-white/80 backdrop-blur-sm shadow-sm">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-light text-gray-800">
                        Repository Visualizer
                    </h1>
                </div>
            </header>

            <main className="relative">
                <div className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0 bg-white/60 backdrop-blur-md rounded-xl shadow-lg">
                        <RepositoryList />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home; 
import React, { useState } from 'react';
import { Repository } from '../../../types/repository.types';
import { Button } from '../../common/Button';
import { useRepositories } from '../../../hooks/useRepositories';

export const RepositoryList: React.FC = () => {
    const { repositories, loading, error, cloneRepository, deleteRepository } = useRepositories();
    const [newRepoUrl, setNewRepoUrl] = useState('');
    const [isCloning, setIsCloning] = useState(false);

    const handleClone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRepoUrl.trim()) return;

        try {
            setIsCloning(true);
            await cloneRepository(newRepoUrl);
            setNewRepoUrl('');
        } catch (err) {
            console.error('Failed to clone repository:', err);
        } finally {
            setIsCloning(false);
        }
    };

    const formatSize = (bytes: number): string => {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    };

    if (error) {
        return (
            <div className="text-red-600 p-4 rounded-md bg-red-50">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleClone} className="space-y-4">
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={newRepoUrl}
                        onChange={(e) => setNewRepoUrl(e.target.value)}
                        placeholder="Enter GitHub repository URL"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button type="submit" isLoading={isCloning} disabled={!newRepoUrl.trim()}>
                        Clone Repository
                    </Button>
                </div>
            </form>

            {loading && !isCloning ? (
                <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {repositories.map((repo: Repository) => (
                        <div
                            key={repo.repo_id}
                            className="p-6 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-xl shadow-sm 
                                hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                        >
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-light text-gray-800">
                                    {repo.repo_url.split('/').pop()?.replace('.git', '')}
                                </h3>
                                <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                    repo.status === 'completed' ? 'bg-green-50 text-green-700' :
                                    repo.status === 'failed' ? 'bg-red-50 text-red-700' :
                                    'bg-blue-50 text-blue-700'
                                }`}>
                                    {repo.status}
                                </span>
                            </div>
                            
                            <p className="mt-2 text-sm text-gray-600 truncate">{repo.repo_url}</p>
                            
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Files:</span>
                                    <span className="text-gray-900">{repo.file_count}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Size:</span>
                                    <span className="text-gray-900">{formatSize(repo.total_size)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Created:</span>
                                    <span className="text-gray-900">
                                        {new Date(repo.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {Object.keys(repo.languages).length > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Languages:</span>
                                        <span className="text-gray-900">
                                            {Object.entries(repo.languages)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 3)
                                                .map(([lang]) => lang.replace('.', ''))
                                                .join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4">
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => deleteRepository(repo.repo_id)}
                                    className="w-full"
                                >
                                    Delete Repository
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}; 
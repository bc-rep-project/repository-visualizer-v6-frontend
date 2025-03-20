import React, { useState } from 'react';
import { Repository } from '@/types/repository.types';
import { Button } from '@/components/common/Button';
import { useRepositories } from '@/hooks/useRepositories';
import Link from 'next/link';
import { FiEye } from 'react-icons/fi';
import { BiAnalyse } from 'react-icons/bi';

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
            <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 rounded-lg">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleClone} className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        value={newRepoUrl}
                        onChange={(e) => setNewRepoUrl(e.target.value)}
                        placeholder="Enter GitHub repository URL"
                        className="input flex-1"
                    />
                    <Button 
                        type="submit" 
                        isLoading={isCloning} 
                        disabled={!newRepoUrl.trim()}
                        className="w-full sm:w-auto"
                    >
                        Clone Repository
                    </Button>
                </div>
            </form>

            {loading && !isCloning ? (
                <div className="flex justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
            ) : (
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {repositories.map((repo: Repository) => (
                        <div key={repo.repo_id} className="card">
                            <div className="card-header">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                    <h3 className="card-title">
                                        {repo.repo_url.split('/').pop()?.replace('.git', '')}
                                    </h3>
                                    <span className={`self-start px-3 py-1 text-xs rounded-full font-medium ${
                                        repo.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        repo.status === 'failed' ? 'bg-destructive/10 text-destructive-foreground' :
                                        'bg-primary/10 text-primary-foreground'
                                    }`}>
                                        {repo.status}
                                    </span>
                                </div>
                                <p className="card-description truncate">{repo.repo_url}</p>
                            </div>
                            
                            <div className="card-content space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Files</p>
                                        <p className="font-medium">{repo.file_count}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Size</p>
                                        <p className="font-medium">{formatSize(repo.total_size)}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Created</p>
                                        <p className="font-medium">
                                            {new Date(repo.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {Object.keys(repo.languages).length > 0 && (
                                        <div>
                                            <p className="text-muted-foreground">Top Languages</p>
                                            <p className="font-medium">
                                                {Object.entries(repo.languages)
                                                    .sort(([, a], [, b]) => b - a)
                                                    .slice(0, 3)
                                                    .map(([lang]) => lang.replace('.', ''))
                                                    .join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card-footer">
                                <div className="flex flex-col sm:flex-row gap-2 w-full">
                                    <Link 
                                        href={`/repositories/${repo.repo_id}/enhanced`}
                                        className="w-full sm:w-1/2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded text-center text-sm flex items-center justify-center"
                                    >
                                        <FiEye className="mr-1" /> Enhanced View
                                    </Link>
                                    <Link 
                                        href={`/repositories/${repo.repo_id}/analyze`}
                                        className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-center text-sm flex items-center justify-center"
                                    >
                                        <BiAnalyse className="mr-1" /> Analyze
                                    </Link>
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => deleteRepository(repo.repo_id)}
                                    className="w-full mt-2"
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
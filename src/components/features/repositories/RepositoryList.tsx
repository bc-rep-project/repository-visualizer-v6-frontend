import React, { useState } from 'react';
import { Repository } from '@/types/repository.types';
import { Button } from '@/components/common/Button';
import { useRepositories } from '@/hooks/useRepositories';

export const RepositoryList: React.FC = () => {
    const { repositories, pagination, loading, error, cloneRepository, deleteRepository, fetchRepositories } = useRepositories();
    const [newRepoUrl, setNewRepoUrl] = useState('');
    const [isCloning, setIsCloning] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

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

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchRepositories({ page, limit: 10 });
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
                <>
                    <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {repositories.map((repo: Repository) => (
                            <div key={repo.repo_id || repo._id} className="card">
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
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => deleteRepository(repo.repo_id || repo._id)}
                                        className="w-full"
                                    >
                                        Delete Repository
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.pages > 1 && (
                        <div className="flex justify-center mt-6">
                            <div className="flex space-x-2">
                                <Button 
                                    variant="secondary"
                                    size="sm"
                                    disabled={pagination.page <= 1}
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                >
                                    Previous
                                </Button>
                                
                                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                                    <Button
                                        key={page}
                                        variant={page === pagination.page ? "default" : "secondary"}
                                        size="sm"
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                
                                <Button 
                                    variant="secondary"
                                    size="sm"
                                    disabled={pagination.page >= pagination.pages}
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}; 
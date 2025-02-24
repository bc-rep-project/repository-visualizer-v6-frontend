import { useState, useEffect, useCallback } from 'react';
import { Repository } from '../types/repository.types';
import { repositoryApi } from '../services/api';

export const useRepositories = () => {
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRepositories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await repositoryApi.listRepositories();
            setRepositories(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
        } finally {
            setLoading(false);
        }
    }, []);

    const cloneRepository = useCallback(async (repoUrl: string) => {
        try {
            setLoading(true);
            setError(null);
            const newRepo = await repositoryApi.cloneRepository({ repo_url: repoUrl });
            setRepositories(prev => [...prev, newRepo]);
            return newRepo;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to clone repository');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteRepository = useCallback(async (repoId: string) => {
        try {
            setLoading(true);
            setError(null);
            await repositoryApi.deleteRepository(repoId);
            setRepositories(prev => prev.filter(repo => repo.repo_id !== repoId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete repository');
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRepositories();
    }, [fetchRepositories]);

    return {
        repositories,
        loading,
        error,
        fetchRepositories,
        cloneRepository,
        deleteRepository,
    };
}; 
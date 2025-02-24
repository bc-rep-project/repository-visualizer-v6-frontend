import { useState, useEffect, useCallback } from 'react';
import { Repository } from '../types/repository.types';
import { repositoryApi } from '../services/api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

export const useRepositories = () => {
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchRepositories = useCallback(async (retryCount = 0) => {
        try {
            setLoading(true);
            setError(null);
            const data = await repositoryApi.listRepositories();
            setRepositories(data);
        } catch (err) {
            console.error('Error fetching repositories:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch repositories';
            
            // Retry logic for timeout or network errors
            if (retryCount < MAX_RETRIES && 
                errorMessage.includes('timed out') || 
                errorMessage.includes('internet connection')) {
                console.log(`Retrying fetch (${retryCount + 1}/${MAX_RETRIES})...`);
                await delay(RETRY_DELAY);
                return fetchRepositories(retryCount + 1);
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const cloneRepository = useCallback(async (repoUrl: string) => {
        try {
            setError(null);
            const newRepo = await repositoryApi.cloneRepository(repoUrl);
            setRepositories(prev => [...prev, newRepo]);
            return newRepo;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to clone repository';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, []);

    const deleteRepository = useCallback(async (repoId: string) => {
        try {
            setError(null);
            await repositoryApi.deleteRepository(repoId);
            setRepositories(prev => prev.filter(repo => repo.repo_id !== repoId));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete repository';
            setError(errorMessage);
            throw new Error(errorMessage);
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
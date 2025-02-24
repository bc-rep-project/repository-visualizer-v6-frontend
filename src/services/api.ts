import axios from 'axios';
import { Repository, RepositoryResponse, CloneRepositoryRequest } from '../types/repository.types';

// Remove /api from the base URL as it's already included in the routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://repository-visualizer-v6-backend.onrender.com';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000, // Increase timeout to 60 seconds
    timeoutErrorMessage: 'Request timed out - the server is taking too long to respond',
});

// Add response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED') {
                console.error('Request timeout:', error.message);
                throw new Error('The request timed out. Please try again.');
            }
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('API Error:', error.response.data);
                throw new Error(error.response.data.error || 'An error occurred while processing your request');
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Network Error:', error.request);
                throw new Error('Unable to connect to the server. Please check your internet connection.');
            }
        }
        // Something happened in setting up the request that triggered an Error
        console.error('Request Error:', error);
        throw new Error('An unexpected error occurred. Please try again.');
    }
);

export const repositoryApi = {
    listRepositories: async (): Promise<Repository[]> => {
        const response = await api.get<RepositoryResponse>('/api/repositories');
        return response.data.repositories;
    },

    getRepository: async (repoId: string): Promise<Repository> => {
        const response = await api.get<Repository>(`/api/repositories/${repoId}/`);
        return response.data;
    },

    cloneRepository: async (repoUrl: string): Promise<Repository> => {
        const response = await api.post<Repository>('/api/repositories', { repo_url: repoUrl });
        return response.data;
    },

    deleteRepository: async (repoId: string): Promise<void> => {
        await api.delete(`/api/repositories/${repoId}`);
    },
};

export default api;
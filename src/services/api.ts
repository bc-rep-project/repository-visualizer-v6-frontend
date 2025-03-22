import axios from 'axios';
import { Repository, RepositoryResponse, CloneRepositoryRequest } from '../types/repository.types';

// Remove /api from the base URL as it's already included in the routes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://repository-visualizer-v6-backend.onrender.com';

console.log('API Base URL:', API_BASE_URL);

// Create a custom axios instance with enhanced configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 60000, // Increase timeout to 60 seconds
    timeoutErrorMessage: 'Request timed out - the server is taking too long to respond',
    withCredentials: false, // Don't send cookies with cross-origin requests
});

// Log all requests for debugging
api.interceptors.request.use(
    config => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
            headers: config.headers,
            data: config.data
        });
        return config;
    },
    error => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    response => {
        console.log(`API Response: ${response.status} ${response.config.url}`, {
            data: response.data
        });
        return response;
    },
    error => {
        if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED') {
                console.error('Request timeout:', error.message);
                throw new Error('The request timed out. Please try again.');
            }
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.error('API Error:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data,
                    url: error.config?.url
                });
                throw new Error(error.response.data.error || 'An error occurred while processing your request');
            } else if (error.request) {
                // The request was made but no response was received
                console.error('Network Error:', {
                    request: error.request,
                    url: error.config?.url,
                    method: error.config?.method
                });
                
                // Check if this might be a CORS error
                if (error.message && error.message.includes('Network Error')) {
                    console.error('Possible CORS issue detected');
                    throw new Error('Unable to connect to the server. This might be due to a CORS issue. Please check the server configuration.');
                }
                
                throw new Error('Unable to connect to the server. Please check your internet connection.');
            }
        }
        // Something happened in setting up the request that triggered an Error
        console.error('Request Error:', error);
        throw new Error('An unexpected error occurred. Please try again.');
    }
);

export const repositoryApi = {
    listRepositories: async (filters?: { 
        status?: string; 
        language?: string;
        size?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<RepositoryResponse> => {
        // Build query parameters - always sort by created_at in descending order
        // to ensure newly cloned repositories are at the top
        const queryParams = new URLSearchParams({
            sort: 'created_at',
            dir: 'desc'
        });
        
        // Add filters if provided
        if (filters) {
            if (filters.page) queryParams.append('page', filters.page.toString());
            if (filters.limit) queryParams.append('limit', filters.limit.toString());
            if (filters.status && filters.status !== 'All Status') queryParams.append('status', filters.status);
            if (filters.language && filters.language !== 'All Languages') {
                // Always pass the language without dot prefix to the backend
                // The backend will handle adding the dot as needed
                const lang = filters.language.startsWith('.') 
                    ? filters.language.substring(1) 
                    : filters.language;
                queryParams.append('language', lang);
                
                // Debug
                console.log(`Filtering by language: ${lang}`);
            }
            if (filters.size && filters.size !== 'Size Range') queryParams.append('size', filters.size);
            if (filters.search) queryParams.append('search', filters.search);
        }
        
        // Log the full URL for debugging
        const url = `/api/repositories?${queryParams.toString()}`;
        console.log(`Fetching repositories with URL: ${url}`);
        
        const response = await api.get<RepositoryResponse>(url);
        return response.data;
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

    search: async (query: string): Promise<any> => {
        const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },

    getDashboardStats: async (): Promise<any> => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },

    getCommits: async (repoId: string): Promise<any> => {
        const response = await api.get(`/repository/${repoId}/commits`);
        return response.data;
    },

    getIssues: async (repoId: string): Promise<any> => {
        const response = await api.get(`/repository/${repoId}/issues`);
        return response.data;
    },

    createIssue: async (repoId: string, issue: any): Promise<any> => {
        const response = await api.post(`/repository/${repoId}/issues`, issue);
        return response.data;
    },

    getPullRequests: async (repoId: string): Promise<any> => {
        const response = await api.get(`/repository/${repoId}/pulls`);
        return response.data;
    },

    createPullRequest: async (repoId: string, pr: any): Promise<any> => {
        const response = await api.post(`/repository/${repoId}/pulls`, pr);
        return response.data;
    },

    // File content API
    getFileContent: async (repoId: string, filePath: string): Promise<any> => {
        const response = await api.get(`/api/repositories/${repoId}/files?path=${encodeURIComponent(filePath)}`);
        return response.data;
    },

    // Settings API
    getSettings: async (): Promise<any> => {
        const response = await api.get('/api/settings');
        return response.data;
    },

    updateSettings: async (settings: any): Promise<any> => {
        const response = await api.put('/api/settings', settings);
        return response.data;
    },

    resetSettings: async (): Promise<any> => {
        const response = await api.post('/api/settings/reset');
        return response.data;
    },
    
    // Auto-save feature API
    getAutoSaveStatus: async (): Promise<any> => {
        const response = await api.get('/api/repositories/auto-save/status');
        return response.data;
    },
    
    updateAutoSaveSettings: async (settings: any): Promise<any> => {
        const response = await api.patch('/api/settings/auto-save', settings);
        return response.data;
    },
    
    startAutoSave: async (): Promise<any> => {
        const response = await api.post('/api/repositories/auto-save/start');
        return response.data;
    },
    
    stopAutoSave: async (): Promise<any> => {
        const response = await api.post('/api/repositories/auto-save/stop');
        return response.data;
    },
    
    runAutoSaveManually: async (): Promise<any> => {
        const response = await api.post('/api/repositories/auto-save/run');
        return response.data;
    },
    
    saveRepository: async (repoId: string, data: any): Promise<Repository> => {
        const response = await api.post(`/api/repositories/${repoId}/save`, data);
        return response.data;
    },
    
    saveRepositoryAnalysis: async (repoId: string, analysisData: any): Promise<any> => {
        const response = await api.post(`/api/repositories/${repoId}/analysis/save`, analysisData);
        return response.data;
    },
    
    getCachedAnalysis: async (repoId: string): Promise<any> => {
        const response = await api.get(`/api/repositories/${repoId}/analyze/cached`);
        return response.data;
    }
};

export default api;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface CloneResponse {
    message: string;
    repo_path: string;
    repo_id: string;
}

export interface ProgressResponse {
    progress: string;
}

export interface ConversionResponse {
    message: string;
    json_path: string;
    analysis: {
        repository_stats: {
            total_files: number;
            extensions: string[];
        };
        files: Array<{
            original_path: string;
            original_extension: string;
            content: string;
            lines: number;
            size: number;
        }>;
    };
}

export const api = {
    async cloneRepository(repoUrl: string): Promise<CloneResponse> {
        const response = await fetch(`${API_BASE_URL}/api/repositories/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ repo_url: repoUrl }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to clone repository');
        }

        return response.json();
    },

    async getProgress(repoId: string): Promise<ProgressResponse> {
        const response = await fetch(`${API_BASE_URL}/progress/${repoId}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch progress');
        }

        return response.json();
    },

    async convertRepository(repoPath: string): Promise<ConversionResponse> {
        const response = await fetch(`${API_BASE_URL}/convert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ repo_path: repoPath }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to convert repository');
        }

        return response.json();
    },
}; 
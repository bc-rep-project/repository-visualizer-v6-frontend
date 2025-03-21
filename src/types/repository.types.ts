export interface Repository {
    _id: string;
    repo_id: string;
    repo_url: string;
    repo_path: string;
    status: 'pending' | 'completed' | 'failed';
    created_at: string;
    updated_at: string;
    file_count: number;
    directory_count: number;
    total_size: number;
    languages: Record<string, number>;
}

export interface RepositoryResponse {
    repositories: Repository[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface CloneRepositoryRequest {
    repo_url: string;
}

export interface ApiError {
    error: string;
    details?: string;
} 
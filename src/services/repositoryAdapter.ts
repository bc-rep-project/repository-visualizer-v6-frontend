import { Repository } from '@/types/repository';

interface BackendRepository {
  _id: string;
  repo_url: string;
  repo_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  file_count?: number;
  directory_count?: number;
  total_size?: number;
  languages?: Record<string, number>;
  progress?: number;
}

interface BackendResponse {
  repositories: BackendRepository[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Converts a backend repository object to the format expected by the UI
 */
export function adaptRepository(repo: BackendRepository): Repository {
  return {
    id: repo._id,
    repo_url: repo.repo_url,
    status: (repo.status || 'pending') as 'pending' | 'completed' | 'failed',
    progress: repo.progress || (repo.status === 'completed' ? 100 : 0), 
    files: repo.file_count || 0,
    directories: repo.directory_count || 0,
    size_bytes: repo.total_size || 0,
    last_updated: repo.updated_at
  };
}

/**
 * Converts a complete backend response to the format expected by the UI
 */
export function adaptRepositoriesResponse(response: BackendResponse): {
  repositories: Repository[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
} {
  return {
    repositories: response.repositories.map(adaptRepository),
    pagination: response.pagination
  };
}

/**
 * Fallback functionality for legacy API response that returns just an array
 */
export function adaptLegacyResponse(repositories: BackendRepository[]): {
  repositories: Repository[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
} {
  return {
    repositories: repositories.map(adaptRepository),
    pagination: {
      page: 1,
      limit: repositories.length,
      total: repositories.length,
      pages: 1
    }
  };
} 
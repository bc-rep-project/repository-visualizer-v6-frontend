export interface Repository {
  id: string;
  repo_url: string;
  status: 'pending' | 'completed' | 'failed';
  progress: number;
  files: number;
  directories: number;
  size_bytes: number;
  last_updated: string;
} 
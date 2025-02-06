import axios from 'axios';
import { API_CONFIG } from '../config/api';

const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const repositoryApi = {
  clone: (repoUrl: string) => 
    apiClient.post(API_CONFIG.endpoints.clone, { repo_url: repoUrl }),
  
  checkProgress: (repoId: string) => 
    apiClient.get(API_CONFIG.endpoints.progress(repoId)),
  
  convert: (repoPath: string) => 
    apiClient.post(API_CONFIG.endpoints.convert, { repo_path: repoPath }),
  
  list: () => 
    apiClient.get(API_CONFIG.endpoints.repositories),
  
  getDetails: (repoId: string) => 
    apiClient.get(API_CONFIG.endpoints.repository(repoId)),
  
  delete: (repoId: string) => 
    apiClient.delete(API_CONFIG.endpoints.repository(repoId)),
};
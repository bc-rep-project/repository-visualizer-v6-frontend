import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Repository {
  _id: string;
  repo_url: string;
  status: 'pending' | 'completed' | 'failed';
  file_count: number;
  directory_count: number;
  total_size: number;
  languages: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export const repositoryService = {
  async listRepositories(): Promise<Repository[]> {
    try {
      const response = await axios.get(`${API_URL}/api/repositories`);
      return response.data;
    } catch (error) {
      console.error('Error listing repositories:', error);
      throw error;
    }
  },

  async createRepository(repo_url: string): Promise<Repository> {
    try {
      const response = await axios.post(
        `${API_URL}/api/repositories`, 
        { repo_url },
        { timeout: 30000 }  // 30 second timeout
      );
      return response.data;
    } catch (error) {
      console.error('Error creating repository:', error);
      throw error;
    }
  },

  async getRepository(id: string): Promise<Repository> {
    if (!id || id === 'undefined' || id === 'null' || id === 'None') {
      throw new Error(`Invalid repository ID: ${id}`);
    }
    
    try {
      const response = await axios.get(`${API_URL}/api/repositories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error getting repository ${id}:`, error);
      throw error;
    }
  },

  async deleteRepository(id: string): Promise<void> {
    try {
      // Special case for "None" ID
      if (id === "None") {
        await axios.delete(`${API_URL}/api/repositories/None`);
        return;
      }
      
      // Normal case
      if (!id || id === 'undefined' || id === 'null') {
        throw new Error(`Invalid repository ID: ${id}`);
      }
      
      await axios.delete(`${API_URL}/api/repositories/${id}`);
    } catch (error) {
      console.error(`Error deleting repository ${id}:`, error);
      throw error;
    }
  },
  
  async getAllLanguages(): Promise<Record<string, number>> {
    try {
      console.log('Fetching all languages from API...');
      console.log('API URL:', `${API_URL}/api/repositories/languages`);
      
      // Add retry logic
      let retries = 3;
      let lastError;
      
      while (retries > 0) {
        try {
          const response = await axios.get(`${API_URL}/api/repositories/languages`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Origin': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
            },
            withCredentials: false,
            timeout: 10000 // 10 second timeout
          });
          
          console.log('Languages response:', response.data);
          return response.data;
        } catch (error) {
          lastError = error;
          retries--;
          console.error(`Error getting languages (retries left: ${retries}):`, error);
          
          if (retries > 0) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, (3 - retries) * 1000));
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError;
    } catch (error) {
      console.error('Error getting all languages after all retries:', error);
      // Return empty object instead of throwing to prevent UI errors
      return {};
    }
  }
}; 
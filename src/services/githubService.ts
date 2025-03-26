import { Octokit } from "@octokit/rest";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import axios from "axios";

// Setup dayjs plugins
dayjs.extend(relativeTime);

// API URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Define interface for GitHub API responses
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  visibility: string;
  license?: {
    key: string;
    name: string;
    url: string;
  } | null;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  labels: {
    name: string;
    color: string;
  }[];
  body: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    login: string;
    avatar_url: string;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  body: string;
}

export interface GitHubContributor {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

export interface GitHubFileContent {
  name: string;
  path: string;
  content: string;
  sha: string;
  size: number;
  encoding: string;
  type: string;
}

class GitHubService {
  private octokit: Octokit;
  
  constructor() {
    // Initialize Octokit with a token if available
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN || '';
    this.octokit = new Octokit({
      auth: token,
    });
  }
  
  /**
   * Extract owner and repo name from a GitHub URL
   */
  private parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    try {
      // Handle both HTTPS and SSH formats
      // HTTPS: https://github.com/owner/repo.git
      // SSH: git@github.com:owner/repo.git
      
      let match;
      if (url.includes('github.com')) {
        if (url.startsWith('git@github.com:')) {
          // SSH format
          match = url.match(/git@github\.com:([^\/]+)\/([^\.]+)(\.git)?/);
        } else {
          // HTTPS format
          match = url.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\.\/]+)(\.git)?/);
        }
        
        if (match && match.length >= 3) {
          return {
            owner: match[1],
            repo: match[2].replace('.git', '')
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error parsing GitHub URL:', error);
      return null;
    }
  }
  
  /**
   * Extract repo ID from the repository URL pattern
   */
  private getRepoIdFromUrl(repoUrl: string): string | null {
    try {
      // Get all repositories
      return localStorage.getItem(`repo_id_${repoUrl}`);
    } catch (error) {
      console.error('Error getting repo ID:', error);
      return null;
    }
  }
  
  /**
   * Fetch repository details from GitHub
   */
  async getRepositoryDetails(repoUrl: string): Promise<GitHubRepository | null> {
    try {
      // First, try to get the repository ID
      const repoId = this.getRepoIdFromUrl(repoUrl);
      
      if (repoId) {
        // Use our backend API to get repository details
        try {
          console.log(`Making API request to ${API_URL}/api/repositories/${repoId}/github`);
          const { data } = await axios.get(`${API_URL}/api/repositories/${repoId}/github`);
          // The repository data is inside the 'repository' field in the response
          return data.repository || data;
        } catch (error: any) {
          console.error('Error from backend GitHub API:', error.response?.status, error.response?.data);
          if (error.response?.status === 403) {
            console.warn('GitHub API rate limit may have been exceeded or token might be invalid');
          }
          // Fall back to direct GitHub API call
          console.log('Falling back to direct GitHub API call...');
        }
      }
      
      // Fall back to direct GitHub API call
      const parsed = this.parseGitHubUrl(repoUrl);
      if (!parsed) {
        throw new Error(`Could not parse GitHub URL: ${repoUrl}`);
      }
      
      const { owner, repo } = parsed;
      console.log(`Making direct GitHub API request for ${owner}/${repo}`);
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      
      return data as GitHubRepository;
    } catch (error: any) {
      console.error('Error fetching repository details:', error);
      if (error.response?.status === 403) {
        console.error('GitHub API rate limit exceeded or invalid token');
      }
      return null;
    }
  }
  
  /**
   * Fetch commits from GitHub
   */
  async getCommits(repoUrl: string, perPage = 20): Promise<GitHubCommit[]> {
    try {
      // First, try to get the repository ID
      const repoId = this.getRepoIdFromUrl(repoUrl);
      
      if (repoId) {
        // Use our backend API to get commits
        const { data } = await axios.get(`${API_URL}/api/repositories/${repoId}/github/commits`);
        return data as GitHubCommit[];
      } else {
        // Fall back to direct GitHub API call
        const parsed = this.parseGitHubUrl(repoUrl);
        if (!parsed) {
          throw new Error(`Could not parse GitHub URL: ${repoUrl}`);
        }
        
        const { owner, repo } = parsed;
        const { data } = await this.octokit.repos.listCommits({
          owner,
          repo,
          per_page: perPage,
        });
        
        return data as GitHubCommit[];
      }
    } catch (error) {
      console.error('Error fetching commits:', error);
      return [];
    }
  }
  
  /**
   * Fetch issues from GitHub
   */
  async getIssues(repoUrl: string, perPage = 20): Promise<GitHubIssue[]> {
    try {
      // First, try to get the repository ID
      const repoId = this.getRepoIdFromUrl(repoUrl);
      
      if (repoId) {
        // Use our backend API to get issues
        const { data } = await axios.get(`${API_URL}/api/repositories/${repoId}/github/issues`);
        return data as GitHubIssue[];
      } else {
        // Fall back to direct GitHub API call
        const parsed = this.parseGitHubUrl(repoUrl);
        if (!parsed) {
          throw new Error(`Could not parse GitHub URL: ${repoUrl}`);
        }
        
        const { owner, repo } = parsed;
        const { data } = await this.octokit.issues.listForRepo({
          owner,
          repo,
          state: 'all',
          per_page: perPage,
        });
        
        // Filter out pull requests, as GitHub API includes PRs in the issues endpoint
        const issues = data.filter(issue => !('pull_request' in issue)) as GitHubIssue[];
        return issues;
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      return [];
    }
  }
  
  /**
   * Fetch pull requests from GitHub
   */
  async getPullRequests(repoUrl: string, perPage = 20): Promise<GitHubPullRequest[]> {
    try {
      // First, try to get the repository ID
      const repoId = this.getRepoIdFromUrl(repoUrl);
      
      if (repoId) {
        // Use our backend API to get pull requests
        const { data } = await axios.get(`${API_URL}/api/repositories/${repoId}/github/pulls`);
        return data as GitHubPullRequest[];
      } else {
        // Fall back to direct GitHub API call
        const parsed = this.parseGitHubUrl(repoUrl);
        if (!parsed) {
          throw new Error(`Could not parse GitHub URL: ${repoUrl}`);
        }
        
        const { owner, repo } = parsed;
        const { data } = await this.octokit.pulls.list({
          owner,
          repo,
          state: 'all',
          per_page: perPage,
        });
        
        return data as GitHubPullRequest[];
      }
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      return [];
    }
  }
  
  /**
   * Fetch repository languages from GitHub
   */
  async getLanguages(repoUrl: string): Promise<Record<string, number>> {
    try {
      // First, try to get the repository ID
      const repoId = this.getRepoIdFromUrl(repoUrl);
      
      if (repoId) {
        // Use our backend API to get languages
        try {
          console.log(`Making API request to ${API_URL}/api/repositories/${repoId}/github/languages`);
          const { data } = await axios.get(`${API_URL}/api/repositories/${repoId}/github/languages`);
          return data as Record<string, number>;
        } catch (error: any) {
          console.error('Error from backend GitHub languages API:', error.response?.status, error.response?.data);
          
          // Check for rate limit error
          if (error.response?.status === 403 && error.response?.data?.error === 'GitHub API rate limit exceeded') {
            const resetTime = error.response.data.rate_reset ? 
              new Date(parseInt(error.response.data.rate_reset) * 1000).toLocaleTimeString() : 
              'unknown time';
              
            console.warn(`GitHub API rate limit exceeded. Reset at ${resetTime}`);
            
            // Re-throw with enhanced error message to ensure the component can display detailed information
            throw error;
          }
          
          // Fall back to direct GitHub API call
          console.log('Falling back to direct GitHub API call for languages...');
        }
      }
      
      // Fall back to direct GitHub API call
      const parsed = this.parseGitHubUrl(repoUrl);
      if (!parsed) {
        throw new Error(`Could not parse GitHub URL: ${repoUrl}`);
      }
      
      const { owner, repo } = parsed;
      console.log(`Making direct GitHub API request for languages: ${owner}/${repo}`);
      const { data } = await this.octokit.repos.listLanguages({
        owner,
        repo,
      });
      
      return data as Record<string, number>;
    } catch (error: any) {
      console.error('Error fetching languages:', error);
      
      // Check if this is a GitHub rate limit error
      if (error.response?.status === 403) {
        if (error.response?.data?.message?.includes('API rate limit exceeded')) {
          console.error('GitHub API rate limit exceeded from direct call');
        }
      }
      
      // Re-throw to allow the component to handle the error display
      throw error;
    }
  }
  
  /**
   * Store repository ID for a given URL
   */
  storeRepoId(repoUrl: string, repoId: string): void {
    try {
      localStorage.setItem(`repo_id_${repoUrl}`, repoId);
    } catch (error) {
      console.error('Error storing repo ID:', error);
    }
  }
  
  /**
   * Format date as relative time
   */
  formatDate(dateString: string): string {
    return dayjs(dateString).fromNow();
  }
  
  /**
   * Check if GitHub token is valid
   */
  async isTokenValid(): Promise<boolean> {
    try {
      await this.octokit.users.getAuthenticated();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get rate limit information from GitHub
   */
  async getRateLimit(): Promise<{ limit: number; remaining: number; reset: Date }> {
    try {
      const { data } = await this.octokit.rateLimit.get();
      return {
        limit: data.rate.limit,
        remaining: data.rate.remaining,
        reset: new Date(data.rate.reset * 1000)
      };
    } catch (error) {
      console.error('Error fetching rate limit:', error);
      return {
        limit: 0,
        remaining: 0,
        reset: new Date()
      };
    }
  }
}

// Create and export a singleton instance of the service
const githubService = new GitHubService();
export default githubService; 
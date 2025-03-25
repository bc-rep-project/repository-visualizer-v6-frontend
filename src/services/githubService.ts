import { Octokit } from "@octokit/rest";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Setup dayjs plugins
dayjs.extend(relativeTime);

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
   * Fetch repository details from GitHub
   */
  async getRepositoryDetails(repoUrl: string): Promise<GitHubRepository | null> {
    try {
      const parsed = this.parseGitHubUrl(repoUrl);
      if (!parsed) {
        throw new Error(`Could not parse GitHub URL: ${repoUrl}`);
      }
      
      const { owner, repo } = parsed;
      const { data } = await this.octokit.repos.get({
        owner,
        repo,
      });
      
      return data as GitHubRepository;
    } catch (error) {
      console.error('Error fetching repository details:', error);
      return null;
    }
  }
  
  /**
   * Fetch commits from GitHub
   */
  async getCommits(repoUrl: string, perPage = 20): Promise<GitHubCommit[]> {
    try {
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
    } catch (error) {
      console.error('Error fetching pull requests:', error);
      return [];
    }
  }
  
  /**
   * Fetch contributors from GitHub
   */
  async getContributors(repoUrl: string, perPage = 10): Promise<GitHubContributor[]> {
    try {
      const parsed = this.parseGitHubUrl(repoUrl);
      if (!parsed) {
        throw new Error(`Could not parse GitHub URL: ${repoUrl}`);
      }
      
      const { owner, repo } = parsed;
      const { data } = await this.octokit.repos.listContributors({
        owner,
        repo,
        per_page: perPage,
      });
      
      return data as GitHubContributor[];
    } catch (error) {
      console.error('Error fetching contributors:', error);
      return [];
    }
  }
  
  /**
   * Fetch README content from GitHub
   */
  async getReadmeContent(repoUrl: string): Promise<GitHubFileContent | null> {
    try {
      const parsed = this.parseGitHubUrl(repoUrl);
      if (!parsed) {
        throw new Error(`Could not parse GitHub URL: ${repoUrl}`);
      }
      
      const { owner, repo } = parsed;
      const { data } = await this.octokit.repos.getReadme({
        owner,
        repo,
      });
      
      return data as GitHubFileContent;
    } catch (error) {
      console.error('Error fetching README:', error);
      return null;
    }
  }
  
  /**
   * Fetch a specific file's content from GitHub
   */
  async getFileContent(repoUrl: string, path: string): Promise<GitHubFileContent | null> {
    try {
      const parsed = this.parseGitHubUrl(repoUrl);
      if (!parsed) {
        throw new Error(`Could not parse GitHub URL: ${repoUrl}`);
      }
      
      const { owner, repo } = parsed;
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      
      return data as GitHubFileContent;
    } catch (error) {
      console.error(`Error fetching file content for ${path}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch languages statistics from GitHub
   */
  async getLanguages(repoUrl: string): Promise<Record<string, number>> {
    try {
      const parsed = this.parseGitHubUrl(repoUrl);
      if (!parsed) {
        throw new Error(`Could not parse GitHub URL: ${repoUrl}`);
      }
      
      const { owner, repo } = parsed;
      const { data } = await this.octokit.repos.listLanguages({
        owner,
        repo,
      });
      
      return data as Record<string, number>;
    } catch (error) {
      console.error('Error fetching language statistics:', error);
      return {};
    }
  }
  
  /**
   * Format dates in a more readable way (e.g., "2 days ago")
   */
  formatDate(dateString: string): string {
    return dayjs(dateString).fromNow();
  }
  
  /**
   * Check if the GitHub token is valid and available
   */
  async isTokenValid(): Promise<boolean> {
    try {
      // If there's no token, it's not valid
      if (!process.env.NEXT_PUBLIC_GITHUB_TOKEN) {
        return false;
      }
      
      // Try a simple API call to check if the token works
      await this.octokit.users.getAuthenticated();
      return true;
    } catch (error) {
      console.error('GitHub token validation failed:', error);
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
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { 
  GitHubCommit, 
  GitHubIssue, 
  GitHubPullRequest 
} from '@/services/githubService';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import LanguageChart from '@/components/LanguageChart';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://repository-visualizer-v6-backend.onrender.com';

interface Repository {
  _id: string;
  repo_url: string;
  status: string;
  file_count: number;
  directory_count: number;
  total_size: number;
  languages: Record<string, number>;
  created_at: string;
  updated_at: string;
}

interface Commit {
  id: string;
  message: string;
  author: {
    name: string;
    email: string;
  };
  date: string;
  hash: string;
  stats?: {
    additions: number;
    deletions: number;
    files_changed: number;
  };
}

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  author: string;
}

interface PullRequest {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'merged' | 'closed';
  created_at: string;
  updated_at: string;
  author: string;
  branch: string;
}

export default function RepositoryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  
  // Extract and validate the ID
  const rawId = params?.id;
  const repoId = typeof rawId === 'string' ? rawId : '';
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [activeTab, setActiveTab] = useState('commits');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New issue form state
  const [showNewIssueForm, setShowNewIssueForm] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueDescription, setNewIssueDescription] = useState('');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  // Add GitHub data state
  const [githubCommits, setGithubCommits] = useState<GitHubCommit[]>([]);
  const [githubIssues, setGithubIssues] = useState<GitHubIssue[]>([]);
  const [githubPullRequests, setGithubPullRequests] = useState<GitHubPullRequest[]>([]);
  const [githubLanguages, setGithubLanguages] = useState<Record<string, number>>({});
  const [showGitHubData, setShowGitHubData] = useState(false);
  const [isGitHubRepo, setIsGitHubRepo] = useState(false);
  const [loadingGitHub, setLoadingGitHub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  // Rate limit specific states
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);
  const [rateLimitReset, setRateLimitReset] = useState<string | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<string | null>(null);
  const [rateLimitTotal, setRateLimitTotal] = useState<string | null>(null);
  const [timeToReset, setTimeToReset] = useState<number | null>(null);

  // Define fetchGitHubData to refresh GitHub data on demand
  const fetchGitHubData = async (repoUrl: string) => {
    try {
      setLoadingGitHub(true);
      setGithubError(null);
      setRateLimitExceeded(false);
      
      // Debug: check if GitHub token is set
      console.log('Refreshing GitHub data...');
      
      // Validate the GitHub URL
      if (!repoUrl || !repoUrl.includes('github.com')) {
        setGithubError('Not a valid GitHub repository URL');
        setLoadingGitHub(false);
        return;
      }
      
      if (!repoId) {
        setGithubError('Repository ID is missing');
        setLoadingGitHub(false);
        return;
      }
      
      try {
        // Get GitHub data for commits, issues, pulls, and languages using our backend API
        const [commitsResponse, issuesResponse, pullsResponse, languagesResponse] = await Promise.all([
          axios.get(`${API_URL}/api/repositories/${repoId}/github/commits`),
          axios.get(`${API_URL}/api/repositories/${repoId}/github/issues`),
          axios.get(`${API_URL}/api/repositories/${repoId}/github/pulls`), 
          axios.get(`${API_URL}/api/repositories/${repoId}/github/languages`)
        ]);
        
        // Set the GitHub data
        setGithubCommits(commitsResponse.data);
        setGithubIssues(issuesResponse.data);
        setGithubPullRequests(pullsResponse.data);
        setGithubLanguages(languagesResponse.data);
        setShowGitHubData(true);
        
      } catch (error: any) {
        console.error('Error fetching GitHub data:', error);
        
        // Check if this is a rate limit error
        if (error.response?.status === 403 && error.response?.data?.error === 'GitHub API rate limit exceeded') {
          handleRateLimitError(error.response.data);
        } else {
          let errorMessage = 'Failed to fetch GitHub data. ';
          if (error.response?.status === 403) {
            errorMessage += 'GitHub API access may be forbidden. The repository might be private or the API token may be invalid.';
          } else if (error.response?.status === 404) {
            errorMessage += 'The repository could not be found.';
          } else {
            errorMessage += 'GitHub may be temporarily unavailable.';
          }
          
          setGithubError(errorMessage);
        }
      }
    } catch (err: any) {
      console.error('Error in GitHub data fetching process:', err);
      setGithubError('Failed to load GitHub data. An unexpected error occurred.');
    } finally {
      setLoadingGitHub(false);
    }
  };
  
  // Add a function to refresh GitHub data
  const refreshGitHubData = async () => {
    if (!repository?.repo_url || !isGitHubRepo || !repoId) return;
    
    try {
      await fetchGitHubData(repository.repo_url);
    } catch (err) {
      console.error('Error refreshing GitHub data:', err);
      setGithubError('Failed to refresh GitHub data');
    }
  };

  // Add a countdown timer effect for rate limit reset
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (timeToReset && timeToReset > 0) {
      intervalId = setInterval(() => {
        setTimeToReset(prevTime => {
          const newTime = prevTime ? prevTime - 1000 : null;
          if (newTime && newTime <= 0) {
            // Time's up, clear the interval and allow retrying
            if (intervalId) clearInterval(intervalId);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timeToReset]);

  useEffect(() => {
    const fetchRepositoryDetails = async () => {
      if (!repoId) {
        setError('Invalid repository ID');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch repository details
        const repoResponse = await axios.get(`${API_URL}/api/repositories/${repoId}`);
        const repoData = repoResponse.data;
        setRepository(repoData);
        
        // Check if this is a GitHub repository
        const isGitHub = repoData.repo_url && repoData.repo_url.includes('github.com');
        setIsGitHubRepo(isGitHub);
        
        // Fetch data directly from GitHub endpoints instead of mock endpoints
        if (isGitHub) {
          try {
            // Get GitHub data for commits, issues, pulls, and languages
            const [commitsResponse, issuesResponse, pullsResponse] = await Promise.all([
              axios.get(`${API_URL}/api/repositories/${repoId}/github/commits`),
              axios.get(`${API_URL}/api/repositories/${repoId}/github/issues`),
              axios.get(`${API_URL}/api/repositories/${repoId}/github/pulls`)
            ]);
            
            // Set the GitHub data
            setGithubCommits(commitsResponse.data);
            setGithubIssues(issuesResponse.data);
            setGithubPullRequests(pullsResponse.data);
            setShowGitHubData(true);
            
            // Get languages data separately to handle any rate limit issues specifically
            try {
              const languagesResponse = await axios.get(`${API_URL}/api/repositories/${repoId}/github/languages`);
              setGithubLanguages(languagesResponse.data);
            } catch (langError: any) {
              console.error('Error fetching GitHub languages:', langError);
              
              // Check if this is a rate limit error
              if (langError.response?.status === 403 && langError.response?.data?.error === 'GitHub API rate limit exceeded') {
                handleRateLimitError(langError.response.data);
              }
            }
          } catch (githubError: any) {
            console.error('Error fetching GitHub data:', githubError);
            
            // Check if this is a rate limit error
            if (githubError.response?.status === 403 && githubError.response?.data?.error === 'GitHub API rate limit exceeded') {
              handleRateLimitError(githubError.response.data);
            } else {
              setGithubError('Failed to fetch GitHub data. The repository may be private or GitHub may be temporarily unavailable.');
            }
          } finally {
            setLoadingGitHub(false);
          }
        } else {
          // For non-GitHub repos, still get mock data for demonstration purposes
          const [commitsResponse, prResponse, issuesResponse] = await Promise.all([
            axios.get(`${API_URL}/api/repositories/${repoId}/commits`),
            axios.get(`${API_URL}/api/repositories/${repoId}/pulls`),
            axios.get(`${API_URL}/api/repositories/${repoId}/issues`)
          ]);
          
          setCommits(commitsResponse.data);
          setPullRequests(prResponse.data);
          setIssues(issuesResponse.data);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching repository details:', err);
        setError('Failed to load repository details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRepositoryDetails();
  }, [repoId]);

  // Helper function to handle rate limit errors
  const handleRateLimitError = (errorData: any) => {
    setRateLimitExceeded(true);
    setRateLimitTotal(errorData.rate_limit);
    setRateLimitRemaining(errorData.rate_remaining);
    setRateLimitReset(errorData.rate_reset);
    
    // Calculate time to reset
    if (errorData.rate_reset) {
      const resetTime = parseInt(errorData.rate_reset) * 1000;
      const now = Date.now();
      setTimeToReset(Math.max(0, resetTime - now));
    }
    
    setGithubError('GitHub API rate limit exceeded. Please wait until the rate limit resets.');
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newIssueTitle.trim()) {
      return;
    }
    
    try {
      setIsSubmittingIssue(true);
      
      const response = await axios.post(`${API_URL}/api/repositories/${repoId}/issues`, {
        title: newIssueTitle,
        description: newIssueDescription
      });
      
      // Add the new issue to the list
      setIssues([response.data, ...issues]);
      
      // Reset form
      setNewIssueTitle('');
      setNewIssueDescription('');
      setShowNewIssueForm(false);
    } catch (err) {
      console.error('Error creating issue:', err);
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  // Function to format the time until rate limit reset
  const formatTimeUntilReset = () => {
    if (!timeToReset) return 'Unknown time';
    
    const totalSeconds = Math.floor(timeToReset / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Render a dedicated component for rate limit errors
  const renderRateLimitError = () => {
    // Enhanced debug logging for rate limit errors
    console.log("Rendering rate limit error component with details:", {
      rateLimitExceeded,
      rateLimitTotal,
      rateLimitRemaining,
      rateLimitReset,
      timeToReset,
      resetTime: rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toLocaleString() : 'Unknown',
      currentTime: new Date().toLocaleString()
    });
    
    if (!rateLimitExceeded) return null;
    
    return (
      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <h3 className="text-lg font-medium text-red-800 dark:text-red-300">GitHub API Rate Limit Exceeded</h3>
        <p className="mt-2 text-sm text-red-700 dark:text-red-400">
          The GitHub API rate limit has been exceeded. Please wait until the rate limit resets or try again later.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded">
            <span className="font-medium">Limit:</span> {rateLimitTotal || '60'}
          </div>
          <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded">
            <span className="font-medium">Remaining:</span> {rateLimitRemaining || '0'}
          </div>
        </div>
        <div className="mt-3 p-3 bg-red-100 dark:bg-red-800/30 rounded text-center">
          <span className="font-medium">Time until reset:</span>
          <div className="text-xl font-mono mt-1">{formatTimeUntilReset()}</div>
        </div>
        
        <div className="mt-3 p-2 border border-dashed border-red-300 dark:border-red-700 rounded text-xs">
          <div><strong>Rate Limit Debug Information:</strong></div>
          <div>Reset timestamp: {rateLimitReset || 'Unknown'}</div>
          {rateLimitReset && (
            <div>Reset time: {new Date(parseInt(rateLimitReset) * 1000).toLocaleString()}</div>
          )}
          <div>Current time: {new Date().toLocaleString()}</div>
          <div>Time remaining: {timeToReset ? Math.floor(timeToReset / 1000) + ' seconds' : 'Unknown'}</div>
        </div>
        
        {timeToReset === 0 && (
          <button 
            onClick={() => {
              console.log("Attempting to refresh GitHub data after rate limit reset");
              if (repository?.repo_url) {
                refreshGitHubData();
              }
            }}
            className="mt-3 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  };

  // Implement the deleteRepository function
  const deleteRepository = async () => {
    if (!confirm('Are you sure you want to delete this repository?')) return;

    try {
      await axios.delete(`${API_URL}/api/repositories/${repoId}`);
      router.push('/repositories');
    } catch (error) {
      console.error('Error deleting repository:', error);
      setError('Failed to delete repository. Please try again.');
    }
  };

  // Add a function to restart the time countdown if needed
  const refreshRateLimitCountdown = () => {
    if (rateLimitExceeded && rateLimitReset) {
      // Calculate new time to reset
      const resetTime = parseInt(rateLimitReset) * 1000;
      const now = Date.now();
      setTimeToReset(Math.max(0, resetTime - now));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-grow flex items-center justify-center">
          <LoadingSpinner size="large" message="Loading repository details..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-grow">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
        <button 
          className="mt-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => router.push('/repositories')}
        >
              Return to Repositories
        </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-grow">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded">
          <p>Repository not found</p>
        </div>
        <button 
          className="mt-4 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => router.push('/repositories')}
        >
              Return to Repositories
        </button>
      </div>
    </main>
    <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 flex-grow">
        {loading ? (
          <LoadingSpinner size="large" fullPage message="Loading repository details..." />
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : repository ? (
          <>
            {/* Repository Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-2 sm:mb-0">
                  {getRepoName(repository.repo_url)}
                </h1>
                <div className="w-full sm:w-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <a
                    href={repository.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md transition-colors flex items-center justify-center"
                  >
                    <span>Visit Repository</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button
                    onClick={deleteRepository}
                    className="text-sm text-center px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Repository</span>
                  </button>
        </div>
      </div>
      
              {/* Repository Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-sm font-medium text-blue-700 dark:text-blue-400">Files</h3>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-blue-800 dark:text-blue-300">{repository.file_count}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <h3 className="text-sm font-medium text-green-700 dark:text-green-400">Directories</h3>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-green-800 dark:text-green-300">{repository.directory_count}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    <h3 className="text-sm font-medium text-purple-700 dark:text-purple-400">Total Size</h3>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-purple-800 dark:text-purple-300">{formatSize(repository.total_size)}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-sm font-medium text-amber-700 dark:text-amber-400">Last Updated</h3>
            </div>
                  <p className="mt-1 text-xl font-semibold text-amber-800 dark:text-amber-300">
                    {new Date(repository.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

            {/* GitHub Section */}
            <div className="mt-6 sm:mt-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 dark:text-white">GitHub Connection</h2>
              {isGitHubRepo ? (
                <>
                  {loadingGitHub ? (
                    <LoadingSpinner size="medium" message="Loading GitHub data..." />
                  ) : showGitHubData ? (
                    <div>
                      {/* Debug info - Only show in development */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 mb-4 rounded text-xs">
                          <p className="font-bold">Debug Info:</p>
                          <p>Rate Limit Exceeded: {rateLimitExceeded ? 'Yes' : 'No'}</p>
                          <p>GitHub Error: {githubError || 'None'}</p>
                          <p>Time to Reset: {timeToReset !== null ? `${timeToReset}ms` : 'Not set'}</p>
      </div>
                      )}

                      {/* Use the renderRateLimitError function instead of duplicating code */}
                      {renderRateLimitError()}
                      
                      {/* Only render tabs if not rate limited */}
                      {!rateLimitExceeded && (
                        <Tabs defaultValue="commits" className="w-full">
                          <TabsList className="grid w-full grid-cols-4 text-xs md:text-sm">
                            <TabsTrigger value="commits">Commits</TabsTrigger>
                            <TabsTrigger value="issues">Issues</TabsTrigger>
                            <TabsTrigger value="pulls">Pull Requests</TabsTrigger>
                            <TabsTrigger value="languages">Languages</TabsTrigger>
                          </TabsList>
                          <TabsContent value="commits">
                            {githubCommits && githubCommits.length > 0 ? (
                              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4 mt-2">
                                <div className="flex justify-between items-center">
                                  <h3 className="text-lg font-medium dark:text-white">Recent Commits</h3>
                                  <a 
                                    href={`${repository.repo_url}/commits`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs md:text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                  >
                                    View on GitHub
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                </div>
                                <div className="space-y-3">
                                  {githubCommits.slice(0, 5).map((commit) => (
                                    <div key={commit.sha} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                                        <span className="text-sm font-medium dark:text-white mb-1 sm:mb-0">{commit.commit?.author?.name}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {new Date(commit.commit?.author?.date).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{commit.commit?.message}</p>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {commit.stats && (
                                          <>
                                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                                              +{commit.stats.additions}
                                            </span>
                                            <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
                                              -{commit.stats.deletions}
                                            </span>
                                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                                              {commit.stats.total} files
                                            </span>
                                          </>
                                        )}
                                      </div>
              </div>
            ))}
          </div>
        </div>
                            ) : (
                              <p className="text-gray-600 dark:text-gray-400">No commits found</p>
                            )}
                          </TabsContent>
                          <TabsContent value="issues">
                            {githubIssues && githubIssues.length > 0 ? (
                              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4 mt-2">
                                <div className="flex justify-between items-center">
                                  <h3 className="text-lg font-medium dark:text-white">Recent Issues</h3>
                                  <a 
                                    href={`${repository.repo_url}/issues`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs md:text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                  >
                                    View on GitHub
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                </div>
                                <div className="space-y-3">
                                  {githubIssues.slice(0, 5).map((issue) => (
                                    <div key={issue.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                                        <span className="text-sm font-medium dark:text-white mb-1 sm:mb-0 pr-2">
                                          {issue.title}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          issue.state === 'open' 
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                        }`}>
                                          {issue.state}
                                        </span>
      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{issue.body}</p>
                                      <div className="mt-2 flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                                        <span>By {issue.user?.login || 'Unknown'}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                                        <a 
                                          href={issue.html_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="ml-auto text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                        >
                                          View Issue
                                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </a>
                  </div>
                </div>
              ))}
                                </div>
            </div>
          ) : (
                              <p className="text-gray-600 dark:text-gray-400">No issues found</p>
                            )}
                          </TabsContent>
                          <TabsContent value="pulls">
                            {githubPullRequests && githubPullRequests.length > 0 ? (
                              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4 mt-2">
                                <div className="flex justify-between items-center">
                                  <h3 className="text-lg font-medium dark:text-white">Recent Pull Requests</h3>
                                  <a 
                                    href={`${repository.repo_url}/pulls`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs md:text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                  >
                                    View on GitHub
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
        </div>
                                <div className="space-y-3">
                                  {githubPullRequests.slice(0, 5).map((pr) => (
                                    <div key={pr.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1">
                                        <span className="text-sm font-medium dark:text-white mb-1 sm:mb-0 pr-2">
                                          {pr.title}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          pr.state === 'open' 
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                                            : pr.state === 'closed' && pr.merged_at 
                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                        }`}>
                                          {pr.merged_at ? 'merged' : pr.state}
                      </span>
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{pr.body}</p>
                                      <div className="mt-2 flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
                                        <span>By {pr.user?.login || 'Unknown'}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                                        <a 
                                          href={pr.html_url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="ml-auto text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                        >
                                          View PR
                                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                          </svg>
                                        </a>
                  </div>
                </div>
              ))}
                                </div>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No pull requests found</p>
          )}
                          </TabsContent>
                          <TabsContent value="languages">
                            {githubLanguages && Object.keys(githubLanguages).length > 0 ? (
                              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mt-2">
                                <div className="flex justify-between items-center mb-4">
                                  <h3 className="text-lg font-medium dark:text-white">Language Distribution</h3>
                                  <a 
                                    href={`${repository.repo_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs md:text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                                  >
                                    View Repository
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                </div>
                                <div className="h-64">
                                  <LanguageChart languages={githubLanguages} />
                                </div>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {Object.entries(githubLanguages).map(([language, bytes]) => (
                                    <div key={language} className="flex items-center p-2 rounded bg-gray-50 dark:bg-gray-700">
                                      <div 
                                        className="w-3 h-3 rounded-full mr-2" 
                                        style={{ backgroundColor: getLanguageColor(language) }}
                                      />
                                      <span className="text-sm font-medium dark:text-gray-200">{language}</span>
                                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                                        {formatBytes(bytes)}
                                      </span>
                                    </div>
                                  ))}
        </div>
      </div>
                            ) : (
                              <p className="text-gray-600 dark:text-gray-400">No language statistics available</p>
                            )}
                          </TabsContent>
                        </Tabs>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Loading GitHub data...</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  This is not a GitHub repository or the repository URL format is not supported.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Repository not found</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
} 

// Add the missing helper functions
const getRepoName = (url: string): string => {
  // Extract the repository name from the URL
  if (!url) return 'Unknown Repository';
  
  // Handle GitHub URL format
  if (url.includes('github.com')) {
    const parts = url.split('/');
    return parts[parts.length - 1].replace('.git', '') || parts[parts.length - 2] + '/' + parts[parts.length - 1].replace('.git', '');
  }
  
  // Default case
  const urlParts = url.split('/');
  return urlParts[urlParts.length - 1].replace('.git', '') || 'Unknown Repository';
};

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatBytes = (bytes: number): string => {
  return formatSize(bytes);
};

const getLanguageColor = (language: string): string => {
  const colors: Record<string, string> = {
    'JavaScript': '#f1e05a',
    'TypeScript': '#2b7489',
    'Python': '#3572A5',
    'Java': '#b07219',
    'C#': '#178600',
    'C++': '#f34b7d',
    'PHP': '#4F5D95',
    'Ruby': '#701516',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'Swift': '#ffac45',
    'Kotlin': '#A97BFF',
    'Dart': '#00B4AB',
    'Shell': '#89e051',
  };
  
  return colors[language] || '#8257e5'; // Default color
}; 
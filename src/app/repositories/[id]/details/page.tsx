'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  author: string;
  date: string;
  hash: string;
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
        setRepository(repoResponse.data);
        
        // Fetch commits
        const commitsResponse = await axios.get(`${API_URL}/api/repositories/${repoId}/commits`);
        setCommits(commitsResponse.data);
        
        // Fetch pull requests
        const prResponse = await axios.get(`${API_URL}/api/repositories/${repoId}/pulls`);
        setPullRequests(prResponse.data);
        
        // Fetch issues
        const issuesResponse = await axios.get(`${API_URL}/api/repositories/${repoId}/issues`);
        setIssues(issuesResponse.data);
        
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
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold dark:text-white">Repository Details</h1>
            <div className="flex space-x-4">
              <Link 
                href={`/repositories/${repoId}/analyze`}
                className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Visualize
              </Link>
              <Link 
                href="/repositories"
                className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Back to List
              </Link>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">{repository.repo_url}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded ${
                      repository.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                      repository.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {repository.status}
                    </span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    <span className="font-semibold">Files:</span> {repository.file_count}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    <span className="font-semibold">Directories:</span> {repository.directory_count}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    <span className="font-semibold">Total Size:</span> {(repository.total_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Created:</span> {new Date(repository.created_at).toLocaleString()}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    <span className="font-semibold">Last Updated:</span> {new Date(repository.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Languages */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Languages</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(repository.languages).map(([language, count]) => (
                  <div key={language} className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                    <p className="font-semibold dark:text-white">{language}</p>
                    <p className="text-gray-600 dark:text-gray-400">{count} files</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Repository Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('commits')}
                  className={`px-4 py-3 font-medium text-sm ${
                    activeTab === 'commits'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Commits ({commits.length})
                </button>
                <button
                  onClick={() => setActiveTab('issues')}
                  className={`px-4 py-3 font-medium text-sm ${
                    activeTab === 'issues'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Issues ({issues.length})
                </button>
                <button
                  onClick={() => setActiveTab('pullRequests')}
                  className={`px-4 py-3 font-medium text-sm ${
                    activeTab === 'pullRequests'
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Pull Requests ({pullRequests.length})
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {/* Commits Tab */}
              {activeTab === 'commits' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 dark:text-white">Recent Commits</h2>
                  {commits.length > 0 ? (
                    <div className="space-y-4">
                      {commits.map((commit) => (
                        <div key={commit.id} className="border-b dark:border-gray-700 pb-4">
                          <p className="font-semibold dark:text-white">{commit.message}</p>
                          <div className="flex justify-between mt-2">
                            <p className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Author:</span> {commit.author}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              {new Date(commit.date).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                            <span className="font-medium">Hash:</span> {commit.hash}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">No commits found</p>
                  )}
                </div>
              )}
              
              {/* Issues Tab */}
              {activeTab === 'issues' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold dark:text-white">Issues</h2>
                    <button
                      onClick={() => setShowNewIssueForm(!showNewIssueForm)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      {showNewIssueForm ? 'Cancel' : 'New Issue'}
                    </button>
                  </div>
                  
                  {showNewIssueForm && (
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded mb-4">
                      <form onSubmit={handleCreateIssue}>
                        <div className="mb-3">
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Title
                          </label>
                          <input
                            type="text"
                            id="title"
                            value={newIssueTitle}
                            onChange={(e) => setNewIssueTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                          </label>
                          <textarea
                            id="description"
                            value={newIssueDescription}
                            onChange={(e) => setNewIssueDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmittingIssue}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                          {isSubmittingIssue ? 'Creating...' : 'Create Issue'}
                        </button>
                      </form>
                    </div>
                  )}
                  
                  {issues.length > 0 ? (
                    <div className="space-y-4">
                      {issues.map((issue) => (
                        <div key={issue.id} className="border-b dark:border-gray-700 pb-4">
                          <p className="font-semibold dark:text-white">{issue.title}</p>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{issue.description}</p>
                          <div className="flex justify-between mt-2">
                            <p className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Author:</span> {issue.author}
                            </p>
                            <div className="flex space-x-4">
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Status:</span> 
                                <span className={`ml-1 ${
                                  issue.status === 'open' ? 'text-blue-600 dark:text-blue-400' :
                                  issue.status === 'in_progress' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-green-600 dark:text-green-400'
                                }`}>
                                  {issue.status}
                                </span>
                              </p>
                              <p className="text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Priority:</span> 
                                <span className="ml-1">
                                  {issue.priority}
                                </span>
                              </p>
                            </div>
                          </div>
                          <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                            <span className="font-medium">Created:</span> {new Date(issue.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">No issues found</p>
                  )}
                </div>
              )}
              
              {/* Pull Requests Tab */}
              {activeTab === 'pullRequests' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 dark:text-white">Pull Requests</h2>
                  {pullRequests.length > 0 ? (
                    <div className="space-y-4">
                      {pullRequests.map((pr) => (
                        <div key={pr.id} className="border-b dark:border-gray-700 pb-4">
                          <p className="font-semibold dark:text-white">{pr.title}</p>
                          <p className="text-gray-600 dark:text-gray-400 mt-1">{pr.description}</p>
                          <div className="flex justify-between mt-2">
                            <p className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Author:</span> {pr.author}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Status:</span> 
                              <span className={`ml-1 ${
                                pr.status === 'open' ? 'text-blue-600 dark:text-blue-400' :
                                pr.status === 'merged' ? 'text-purple-600 dark:text-purple-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {pr.status}
                              </span>
                            </p>
                          </div>
                          <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                            <span className="font-medium">Branch:</span> {pr.branch}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">No pull requests found</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 
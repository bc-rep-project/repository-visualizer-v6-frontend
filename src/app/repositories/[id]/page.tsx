'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaFolder, FaFile, FaCode, FaBell, FaStar, FaCodeBranch, FaExclamationCircle, FaGithub } from 'react-icons/fa';
import { BiAnalyse } from 'react-icons/bi';
import { MdDelete } from 'react-icons/md';
import LoadingSpinner from '@/components/LoadingSpinner';
import CodeViewer from '@/components/CodeViewer';
import { SettingsProvider } from '@/contexts/SettingsContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import githubService from '@/services/githubService';
import ReadmeViewer from '@/components/ReadmeViewer';
import LanguageChart from '@/components/LanguageChart';

interface Repository {
  _id: string;
  repo_url: string;
  status: 'pending' | 'completed' | 'failed';
  file_count: number;
  directory_count: number;
  total_size: number;
  updated_at: string;
  languages: Record<string, number>;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
}

interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

interface Issue {
  id: string;
  title: string;
  state: string;
  created_at: string;
  user: string;
}

interface PullRequest {
  id: string;
  title: string;
  state: string;
  created_at: string;
  user: string;
}

interface GitHubData {
  repository: {
    name: string;
    full_name: string;
    html_url: string;
    description: string;
    stargazers_count: number;
    watchers_count: number;
    forks_count: number;
    open_issues_count: number;
    language: string;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    visibility: string;
  };
  commits: any[];
  issues: any[];
  pulls: any[];
  contributors: any[];
  readme?: any;
}

export default function RepositoryDetail() {
  const params = useParams();
  const router = useRouter();
  const repoId = params.id as string;
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [fileStructure, setFileStructure] = useState<FileNode | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [activeTab, setActiveTab] = useState('structure');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [functions, setFunctions] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [githubData, setGithubData] = useState<GitHubData | null>(null);
  const [isGitHubRepo, setIsGitHubRepo] = useState<boolean>(true);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [loadingGitHub, setLoadingGitHub] = useState<boolean>(true);
  const [githubLanguages, setGithubLanguages] = useState<Record<string, number> | null>(null);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [languagesError, setLanguagesError] = useState<string | null>(null);

  useEffect(() => {
    if (repoId) {
    fetchRepositoryDetails();
      fetchGitHubData();
    }
  }, [repoId]);

  useEffect(() => {
    if (isGitHubRepo && githubData) {
      fetchGitHubLanguages();
    }
  }, [isGitHubRepo, githubData]);

  const fetchRepositoryDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/repositories/${repoId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch repository details');
      }
      const data = await response.json();
      setRepository(data);
      
      // Check if it's a GitHub repository and fetch GitHub data
      if (data.repo_url && data.repo_url.includes('github.com')) {
        await fetchGitHubData();
      } else {
        setIsGitHubRepo(false);
        setLoadingGitHub(false);
      }
      
      // Mock file structure for demo
      setFileStructure({
        name: getRepoName(data.repo_url),
        path: '/',
        type: 'directory',
        children: [
          {
            name: 'src',
            path: '/src',
            type: 'directory',
            children: [
              {
                name: 'components',
                path: '/src/components',
                type: 'directory',
                children: [
                  { name: 'Button.js', path: '/src/components/Button.js', type: 'file', size: 1024 }
                ]
              }
            ]
          },
          {
            name: 'tests',
            path: '/tests',
            type: 'directory',
            children: [
              { name: 'app.test.js', path: '/tests/app.test.js', type: 'file', size: 2048 }
            ]
          }
        ]
      });
      
      // Mock data for other tabs
      setCommits([
        { hash: 'a1b2c3d', author: 'John Doe', date: '2023-05-15', message: 'Initial commit' },
        { hash: 'e4f5g6h', author: 'Jane Smith', date: '2023-05-16', message: 'Add README' }
      ]);
      
      setIssues([
        { id: '1', title: 'Fix navigation bug', state: 'open', created_at: '2023-05-10', user: 'user1' },
        { id: '2', title: 'Update documentation', state: 'closed', created_at: '2023-05-12', user: 'user2' }
      ]);
      
      setPullRequests([
        { id: '1', title: 'Feature: Add dark mode', state: 'open', created_at: '2023-05-14', user: 'user3' },
        { id: '2', title: 'Fix: Correct typos', state: 'merged', created_at: '2023-05-13', user: 'user4' }
      ]);
      
      // Mock functions and classes
      setFunctions(['handleSubmit()', 'formatDate()', 'calculateTotal()']);
      setClasses(['UserController', 'DataService', 'ApiClient']);
      
      setError(null);
    } catch (err) {
      setError('Error loading repository details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGitHubData = async () => {
    try {
      setLoadingGitHub(true);
      // Fetch GitHub data from our backend endpoint
      const response = await fetch(`http://localhost:8000/api/repositories/${repoId}/github`);
      
      if (!response.ok) {
        if (response.status === 400) {
          // Not a GitHub repository or other client error
          setIsGitHubRepo(false);
          setGithubError('This is not a GitHub repository or the URL format is not supported.');
        } else {
          throw new Error(`Failed to fetch GitHub data: ${response.statusText}`);
        }
        return;
      }
      
      const data = await response.json();
      
      // Fetch README content
      try {
        const readmeResponse = await fetch(`http://localhost:8000/api/repositories/${repoId}/github?path=readme`);
        if (readmeResponse.ok) {
          const readmeData = await readmeResponse.json();
          data.readme = readmeData;
        }
      } catch (readmeErr) {
        console.error('Error fetching README:', readmeErr);
        // We'll continue even if README fetch fails
      }
      
      setGithubData(data);
      setIsGitHubRepo(true);
      setGithubError(null);
    } catch (err) {
      console.error('Error fetching GitHub data:', err);
      setGithubError('Failed to fetch GitHub data. Using mock data instead.');
    } finally {
      setLoadingGitHub(false);
    }
  };

  const fetchGitHubLanguages = async () => {
    if (!repoId || !isGitHubRepo) return;
    
    try {
      setLoadingLanguages(true);
      // Fetch GitHub language statistics
      const response = await fetch(`http://localhost:8000/api/repositories/${repoId}/github/languages`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GitHub language data: ${response.statusText}`);
      }
      
      const data = await response.json();
      setGithubLanguages(data);
      setLanguagesError(null);
    } catch (err) {
      console.error('Error fetching GitHub language data:', err);
      setLanguagesError('Failed to fetch GitHub language statistics.');
    } finally {
      setLoadingLanguages(false);
    }
  };

  const handleFileClick = async (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file.path);
      // Extract file extension for syntax highlighting
      const fileExtension = file.path.split('.').pop()?.toLowerCase() || '';
      
      // Mock file content for demo
      if (file.path === '/src/components/Button.js') {
        setFileContent(`export const Button = ({ children, ...props }) => {
  return (
    <button className="btn" {...props}>
      {children}
    </button>
  );
};`);
        setBreadcrumbs(['src', 'components', 'Button.js']);
      } else {
        setFileContent('// File content would be loaded here');
        setBreadcrumbs(file.path.split('/').filter(Boolean));
      }
    }
  };

  const deleteRepository = async () => {
    if (!confirm('Are you sure you want to delete this repository?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/repositories/${repoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete repository');
      }
      
      router.push('/');
    } catch (err) {
      setError('Error deleting repository. Please try again.');
      console.error(err);
    }
  };

  const getRepoName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1].replace('.git', '') || url;
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + ' MB';
  };

  const renderFileTree = (node: FileNode, level = 0) => {
    return (
      <div key={node.path} className="ml-4">
        <div 
          className={`flex items-center py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedFile === node.path ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
          onClick={() => handleFileClick(node)}
        >
          {node.type === 'directory' ? (
            <FaFolder className="text-yellow-500 mr-2" />
          ) : (
            <FaFile className="text-gray-500 mr-2" />
          )}
          <span className="dark:text-white">{node.name}</span>
          {node.size && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{(node.size / 1024).toFixed(1)} KB</span>}
        </div>
        {node.children && node.children.map(child => renderFileTree(child, level + 1))}
      </div>
    );
  };

  const renderCommits = () => {
    if (githubData && githubData.commits && githubData.commits.length > 0) {
  return (
          <div className="space-y-4">
          {githubData.commits.map((commit, index) => (
            <div key={index} className="border-b pb-4 dark:border-gray-700 last:border-0">
              <div className="flex justify-between mb-1">
                <span className="font-medium dark:text-white">{commit.commit.message}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(commit.commit.author.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="mr-2">{commit.sha.substring(0, 7)}</span>
                <span>by {commit.author ? commit.author.login : commit.commit.author.name}</span>
                {commit.author && (
                  <img 
                    src={commit.author.avatar_url} 
                    alt={commit.author.login} 
                    className="w-5 h-5 rounded-full ml-2"
                  />
                )}
              </div>
              <div className="mt-2">
                <a 
                  href={commit.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      // Fall back to mock data
      return (
                  <div className="space-y-4">
                    {commits.map((commit, index) => (
                      <div key={index} className="border-b pb-4 dark:border-gray-700 last:border-0">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium dark:text-white">{commit.message}</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">{commit.date}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span className="mr-2">{commit.hash}</span>
                          <span>by {commit.author}</span>
                        </div>
                      </div>
                    ))}
                  </div>
      );
    }
  };

  const renderIssues = () => {
    if (githubData && githubData.issues && githubData.issues.length > 0) {
      return (
        <div className="space-y-4">
          {githubData.issues.map((issue, index) => (
            <div key={index} className="border-b pb-4 dark:border-gray-700 last:border-0">
              <div className="flex justify-between mb-1">
                <span className="font-medium dark:text-white">{issue.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  issue.state === 'open' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {issue.state}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>#{issue.number}</span>
                <span className="mx-2">•</span>
                <span>Opened on {new Date(issue.created_at).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>by {issue.user.login}</span>
                <img 
                  src={issue.user.avatar_url} 
                  alt={issue.user.login} 
                  className="w-5 h-5 rounded-full ml-2"
                />
              </div>
              {issue.labels && issue.labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {issue.labels.map((label, labelIndex) => (
                    <span 
                      key={labelIndex}
                      className="px-2 py-0.5 text-xs rounded-full"
                      style={{ 
                        backgroundColor: `#${label.color}20`,
                        color: `#${label.color}`,
                        border: `1px solid #${label.color}`
                      }}
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2">
                <a 
                  href={issue.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          ))}
        </div>
      );
    } else {
      // Fall back to mock data
      return (
                  <div className="space-y-4">
                    {issues.map((issue, index) => (
                      <div key={index} className="border-b pb-4 dark:border-gray-700 last:border-0">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium dark:text-white">{issue.title}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            issue.state === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {issue.state}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span>#{issue.id}</span>
                          <span className="mx-2">•</span>
                          <span>Opened on {new Date(issue.created_at).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span>by {issue.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>
      );
    }
  };

  const renderPullRequests = () => {
    if (githubData && githubData.pulls && githubData.pulls.length > 0) {
      return (
        <div className="space-y-4">
          {githubData.pulls.map((pr, index) => (
            <div key={index} className="border-b pb-4 dark:border-gray-700 last:border-0">
              <div className="flex justify-between mb-1">
                <span className="font-medium dark:text-white">{pr.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  pr.state === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                  pr.merged_at ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {pr.merged_at ? 'merged' : pr.state}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span>#{pr.number}</span>
                <span className="mx-2">•</span>
                <span>Opened on {new Date(pr.created_at).toLocaleDateString()}</span>
                <span className="mx-2">•</span>
                <span>by {pr.user.login}</span>
                <img 
                  src={pr.user.avatar_url} 
                  alt={pr.user.login} 
                  className="w-5 h-5 rounded-full ml-2"
                />
              </div>
              <div className="flex items-center mt-2 text-xs">
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                  {pr.head.ref} → {pr.base.ref}
                </span>
              </div>
              <div className="mt-2">
                <a 
                  href={pr.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          ))}
                </div>
      );
    } else {
      // Fall back to mock data
      return (
                  <div className="space-y-4">
                    {pullRequests.map((pr, index) => (
                      <div key={index} className="border-b pb-4 dark:border-gray-700 last:border-0">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium dark:text-white">{pr.title}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            pr.state === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                            pr.state === 'merged' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {pr.state}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span>#{pr.id}</span>
                          <span className="mx-2">•</span>
                          <span>Opened on {new Date(pr.created_at).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span>by {pr.user}</span>
                        </div>
                      </div>
                    ))}
                  </div>
      );
    }
  };

  const renderGitHubInfo = () => {
    if (!isGitHubRepo) {
      return null;
    }
    
    if (loadingGitHub) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">GitHub Information</h2>
          <LoadingSpinner size="small" message="Loading GitHub data..." />
        </div>
      );
    }
    
    if (githubError) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">GitHub Information</h2>
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded">
            <p>{githubError}</p>
          </div>
        </div>
      );
    }
    
    if (githubData) {
      const repo = githubData.repository;
      
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="text-lg font-semibold mb-2 md:mb-0 dark:text-white">GitHub Information</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <FaStar className="text-yellow-400 mr-1" />
                <span className="font-medium dark:text-white">{repo.stargazers_count}</span>
              </div>
              <div className="flex items-center">
                <FaCodeBranch className="text-gray-500 mr-1" />
                <span className="font-medium dark:text-white">{repo.forks_count}</span>
              </div>
              <div className="flex items-center">
                <FaExclamationCircle className="text-red-500 mr-1" />
                <span className="font-medium dark:text-white">{repo.open_issues_count}</span>
              </div>
            </div>
          </div>
          
          {repo.description && (
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400">{repo.description}</p>
                </div>
              )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Created</h3>
              <p className="dark:text-white">{new Date(repo.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Last Updated</h3>
              <p className="dark:text-white">{new Date(repo.updated_at).toLocaleDateString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Primary Language</h3>
              <p className="dark:text-white">{repo.language || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Visibility</h3>
              <p className="dark:text-white capitalize">{repo.visibility}</p>
            </div>
          </div>
          
          <div className="mt-2">
            <a 
              href={repo.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded-md text-sm font-medium flex items-center w-fit dark:text-white"
            >
              <FaGithub className="mr-2" /> View on GitHub
            </a>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const renderContributors = () => {
    if (!githubData || !githubData.contributors || githubData.contributors.length === 0) {
      return null;
    }
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Contributors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {githubData.contributors.map((contributor, index) => (
            <div key={index} className="flex items-center p-3 border rounded-lg dark:border-gray-700">
              <img 
                src={contributor.avatar_url} 
                alt={contributor.login} 
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <div className="font-medium dark:text-white">{contributor.login}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {contributor.contributions} contributions
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Loading repository details..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded">
          <p>Repository not found</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          {repository ? (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 md:mb-0">
                    {getRepoName(repository.repo_url)}
                  </h1>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => router.push(`/repositories/${repository._id}/analyze`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                    >
                      <BiAnalyse className="mr-2" /> Analyze
                    </button>
                    <button
                      onClick={() => router.push(`/repositories/${repository._id}/enhanced`)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center"
                    >
                      <FaCode className="mr-2" /> Enhanced
                    </button>
                    <button
                      onClick={deleteRepository}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                    >
                      <MdDelete className="mr-2" /> Delete
                    </button>
                  </div>
                </div>
                
                {/* GitHub info */}
                {renderGitHubInfo()}
              </div>

              {/* Tabs for different views */}
              <div className="mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => handleTabChange('structure')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'structure'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Repository Structure
                    </button>
                    <button
                      onClick={() => handleTabChange('languages')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'languages'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Languages
                    </button>
                    <button
                      onClick={() => handleTabChange('commits')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'commits'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Commits
                    </button>
                    <button
                      onClick={() => handleTabChange('issues')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'issues'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Issues
                    </button>
                    <button
                      onClick={() => handleTabChange('readme')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'readme'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      README
                    </button>
                  </nav>
                </div>
              </div>

              {/* Tab content */}
              <div className="mb-6">
                {activeTab === 'structure' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 dark:text-white">Repository Structure</h2>
                    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 h-80 flex items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400">Interactive Repository Graph Visualization</p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'languages' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 dark:text-white">Language Distribution</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-md font-medium mb-3 dark:text-white">Repository Analysis</h3>
                        {repository.languages && Object.keys(repository.languages).length > 0 ? (
                          <LanguageChart languages={repository.languages} />
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">No language data available</p>
                        )}
                      </div>
                      <div>
                        <h3 className="text-md font-medium mb-3 dark:text-white">GitHub Analysis</h3>
                        {loadingLanguages ? (
                          <LoadingSpinner size="small" message="Loading GitHub language data..." />
                        ) : languagesError ? (
                          <div className="text-red-500 dark:text-red-400">{languagesError}</div>
                        ) : githubLanguages && Object.keys(githubLanguages).length > 0 ? (
                          <LanguageChart languages={githubLanguages} />
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400">No GitHub language data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'commits' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 dark:text-white">Commit History</h2>
                    {renderCommits()}
                  </div>
                )}
                
                {activeTab === 'issues' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 dark:text-white">Issues</h2>
                    {renderIssues()}
                  </div>
                )}
                
                {activeTab === 'readme' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 dark:text-white">README</h2>
                    {githubData && githubData.readme ? (
                      <ReadmeViewer content={githubData.readme.content} filename={githubData.readme.name} />
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No README found for this repository</p>
                    )}
                  </div>
                )}
              </div>

              {/* Contributors */}
              {githubData && githubData.contributors && githubData.contributors.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-lg font-semibold mb-4 dark:text-white">Contributors</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {githubData.contributors.map((contributor, index) => (
                      <div key={index} className="flex items-center p-3 border rounded-lg dark:border-gray-700">
                        <img 
                          src={contributor.avatar_url} 
                          alt={contributor.login} 
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <div>
                          <div className="font-medium dark:text-white">{contributor.login}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {contributor.contributions} contributions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded">
              <p>Repository not found</p>
            </div>
          )}
        </div>
        <Footer />
    </div>
    </SettingsProvider>
  );
} 
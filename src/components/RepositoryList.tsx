'use client';

import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import { BsGrid, BsList } from 'react-icons/bs';
import { BiAnalyse } from 'react-icons/bi';
import { FiEye } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/contexts/SettingsContext';
import LoadingSpinner from './LoadingSpinner';
import axios from 'axios';

interface Repository {
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
}

interface RepositoryResponse {
  repositories: Repository[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function RepositoryList() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [languageFilter, setLanguageFilter] = useState('All Languages');
  const [sizeFilter, setSizeFilter] = useState('Size Range');
  const [languages, setLanguages] = useState<string[]>([]);
  const [isAddingRepo, setIsAddingRepo] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [addingInProgress, setAddingInProgress] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRepos, setTotalRepos] = useState(0);
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);
  
  const router = useRouter();
  const { settings } = useSettings();

  // Size range options
  const sizeRanges = [
    'Size Range',
    '< 1 MB',
    '1-5 MB',
    '5-10 MB',
    '10-50 MB',
    '50-100 MB',
    '> 100 MB'
  ];

  useEffect(() => {
    fetchRepositories();
    fetchLanguages();
  }, [statusFilter, languageFilter, sizeFilter, currentPage]);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get<RepositoryResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/api/repositories?page=${currentPage}&limit=10`
      );
      
      // Check if the response has the expected structure
      if (response.data && response.data.repositories) {
        setRepositories(response.data.repositories);
        setTotalPages(response.data.pagination.pages);
        setTotalRepos(response.data.pagination.total);
      } else {
        // Handle legacy API response format (just an array)
        setRepositories(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch repositories:', err);
      setError('Failed to fetch repositories');
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/repositories/languages`);
      if (!response.ok) {
        throw new Error('Failed to fetch languages');
      }
      
      const data = await response.json();
      setLanguages(['All Languages', ...data]);
    } catch (err) {
      console.error('Error loading languages:', err);
    }
  };

  const parseSizeRange = (range: string) => {
    if (range === '< 1 MB') {
      return { min: 0, max: 1 };
    } else if (range === '1-5 MB') {
      return { min: 1, max: 5 };
    } else if (range === '5-10 MB') {
      return { min: 5, max: 10 };
    } else if (range === '10-50 MB') {
      return { min: 10, max: 50 };
    } else if (range === '50-100 MB') {
      return { min: 50, max: 100 };
    } else if (range === '> 100 MB') {
      return { min: 100, max: 10000 };
    }
    return null;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRepositories();
  };

  const addRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRepoUrl) {
      setAddError('Repository URL is required');
      return;
    }
    
    if (!newRepoUrl.startsWith('https://github.com/')) {
      setAddError('Only GitHub repositories are supported');
      return;
    }
    
    try {
      setAddingInProgress(true);
      setAddError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/repositories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repo_url: newRepoUrl }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add repository');
      }
      
      // Reset form and close modal
      setNewRepoUrl('');
      setIsAddingRepo(false);
      
      // Refresh repository list
      fetchRepositories();
    } catch (err: any) {
      setAddError(err.message || 'Error adding repository');
    } finally {
      setAddingInProgress(false);
    }
  };

  const handleDeleteRepository = async (id: string) => {
    if (!confirm('Are you sure you want to delete this repository?')) {
      return;
    }
    
    try {
      setDeleteInProgress(id);
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/repositories/${id}`);
      // Refresh the list after deletion
      fetchRepositories();
    } catch (err) {
      console.error('Failed to delete repository:', err);
      setError('Failed to delete repository');
    } finally {
      setDeleteInProgress(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const renderLanguageBar = (languages: Record<string, number>) => {
    if (!languages || Object.keys(languages).length === 0) {
      return <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>;
    }
    
    const totalSize = Object.values(languages).reduce((sum, size) => sum + size, 0);
    
    // Color mapping for common languages
    const languageColors: Record<string, string> = {
      JavaScript: 'bg-yellow-400',
      TypeScript: 'bg-blue-500',
      Python: 'bg-blue-600',
      Java: 'bg-orange-600',
      'C++': 'bg-pink-500',
      C: 'bg-gray-600',
      'C#': 'bg-green-600',
      PHP: 'bg-purple-500',
      Ruby: 'bg-red-600',
      Go: 'bg-blue-300',
      Rust: 'bg-orange-800',
      HTML: 'bg-red-500',
      CSS: 'bg-blue-400',
      SCSS: 'bg-pink-400',
      Markdown: 'bg-gray-500',
      JSON: 'bg-yellow-600',
      YAML: 'bg-green-400',
      Other: 'bg-gray-400'
    };
    
    return (
      <div className="h-2 flex rounded overflow-hidden">
        {Object.entries(languages).map(([language, size], index) => {
          const percentage = (size / totalSize) * 100;
          const color = languageColors[language] || 'bg-gray-400';
          
          return (
            <div
              key={index}
              className={`${color}`}
              style={{ width: `${percentage}%` }}
              title={`${language}: ${formatBytes(size)} (${percentage.toFixed(1)}%)`}
            ></div>
          );
        })}
      </div>
    );
  };

  const filteredRepositories = repositories.filter(repo => 
    repo.repo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.repo_url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center dark:text-white">
          <svg className="w-6 h-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
          Repository Manager
        </h1>
        <button
          onClick={() => setIsAddingRepo(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center"
        >
          <FaPlus className="mr-2" /> Add Repository
        </button>
      </div>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-grow">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
              <button type="submit" className="sr-only">Search</button>
            </form>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
              aria-label="Grid View"
            >
              <BsGrid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
              aria-label="List View"
            >
              <BsList size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="All Status">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {languages.map((language, index) => (
              <option key={index} value={language}>
                {language}
              </option>
            ))}
          </select>

          <select
            value={sizeFilter}
            onChange={(e) => setSizeFilter(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {sizeRanges.map((range, index) => (
              <option key={index} value={range}>
                {range}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900 dark:border-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : filteredRepositories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">No repositories found.</p>
        <button
            onClick={() => setIsAddingRepo(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded inline-flex items-center"
        >
            <FaPlus className="mr-2" /> Add Your First Repository
        </button>
        </div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid-cols-1 gap-2'}`}>
        {filteredRepositories.map((repo) => (
          <div
            key={repo._id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${
                viewMode === 'list' ? 'p-4' : ''
              }`}
            >
              <div className={viewMode === 'list' ? 'flex items-center' : 'p-4'}>
                <div className={`${viewMode === 'list' ? 'flex-grow' : ''}`}>
                  <div className={`flex justify-between items-start ${viewMode === 'list' ? '' : 'mb-2'}`}>
                    <div>
                      <h2 className="text-lg font-semibold dark:text-white">
                        {repo.repo_name || repo.repo_url.split('/').pop()}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {repo.repo_url}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(repo.status)}`}>
                      {repo.status.charAt(0).toUpperCase() + repo.status.slice(1)}
              </span>
            </div>

                  {viewMode === 'grid' && (
                    <>
                      <div className="mt-3 mb-2">
                        {repo.languages && renderLanguageBar(repo.languages)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Files</p>
                          <p className="text-lg font-semibold dark:text-white">{repo.file_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Directories</p>
                          <p className="text-lg font-semibold dark:text-white">{repo.directory_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Size</p>
                          <p className="text-lg font-semibold dark:text-white">{formatBytes(repo.total_size || 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</p>
                          <p className="text-lg font-semibold dark:text-white">{formatTimeAgo(repo.updated_at)}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {viewMode === 'list' && (
                    <div className="flex items-center mt-2">
                      <div className="w-1/3">
                        <div className="mr-4">
                          {repo.languages && renderLanguageBar(repo.languages)}
                        </div>
                      </div>
                      <div className="flex space-x-6">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Files</p>
                          <p className="font-medium dark:text-white">{repo.file_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Directories</p>
                          <p className="font-medium dark:text-white">{repo.directory_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Size</p>
                          <p className="font-medium dark:text-white">{formatBytes(repo.total_size || 0)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                          <p className="font-medium dark:text-white">{formatTimeAgo(repo.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {viewMode === 'list' && (
                  <div className="flex ml-4 space-x-2">
                    <Link
                      href={`/repositories/${repo._id}/analyze`}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md flex items-center text-sm"
                    >
                      <BiAnalyse className="mr-1" /> Analyze
                    </Link>
                    <Link
                      href={`/repositories/${repo._id}/enhanced`}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-md flex items-center text-sm"
                    >
                      <FiEye className="mr-1" /> Enhanced View
                    </Link>
                    <button
                      onClick={() => handleDeleteRepository(repo._id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-md flex items-center text-sm"
                      disabled={deleteInProgress === repo._id}
                    >
                      {deleteInProgress === repo._id ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <FaTrash className="mr-1" />
                      )}
                      Delete
                    </button>
                  </div>
                )}
            </div>

              {viewMode === 'grid' && (
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href={`/repositories/${repo._id}/analyze`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1 p-3 flex-1 justify-center"
                  >
                    <BiAnalyse /> Analyze
                  </Link>
                  <Link
                    href={`/repositories/${repo._id}/enhanced`}
                    className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium flex items-center gap-1 p-3 flex-1 justify-center border-l border-r border-gray-200 dark:border-gray-700"
                  >
                    <FiEye /> Enhanced
                  </Link>
                  <button
                    onClick={() => handleDeleteRepository(repo._id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1 p-3 flex-1 justify-center"
                  >
                    {deleteInProgress === repo._id ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      <FaTrash />
                    )}
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredRepositories.length} of {totalRepos} repositories
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-gray-700 dark:text-gray-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Repository Modal */}
      {isAddingRepo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Add Repository</h2>
            
            <form onSubmit={addRepository}>
              <div className="mb-4">
                <label htmlFor="repo_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  GitHub Repository URL
                </label>
                <input
                  type="text"
                  id="repo_url"
                  placeholder="https://github.com/username/repository"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Example: https://github.com/facebook/react
                </p>
              </div>
              
              {addError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm dark:bg-red-900 dark:border-red-700 dark:text-red-300">
                  {addError}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingRepo(false);
                    setNewRepoUrl('');
                    setAddError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              <button
                  type="submit"
                  disabled={addingInProgress}
                  className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center ${
                    addingInProgress ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {addingInProgress ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add Repository'
                  )}
              </button>
            </div>
            </form>
          </div>
      </div>
      )}
    </div>
  );
} 
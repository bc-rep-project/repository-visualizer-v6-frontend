'use client';

import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import { BsGrid, BsList } from 'react-icons/bs';
import { BiAnalyse } from 'react-icons/bi';
import { FiEye } from 'react-icons/fi';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Repositories
        </h2>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 w-full sm:w-auto"
            >
              <option>All Status</option>
              <option>completed</option>
              <option>pending</option>
              <option>failed</option>
            </select>
            
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="form-select rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 w-full sm:w-auto"
            >
              {languages.map((lang) => (
                <option key={lang}>{lang}</option>
              ))}
            </select>
            
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="form-select rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 w-full sm:w-auto"
            >
              {sizeRanges.map((range) => (
                <option key={range}>{range}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200'
              }`}
              aria-label="Grid view"
            >
              <BsGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200'
              }`}
              aria-label="List view"
            >
              <BsList className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsAddingRepo(true)}
              className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
            >
              <FaPlus className="mr-1" /> Add
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : repositories.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No repositories found. Try adding one!
          </p>
        <button
            onClick={() => setIsAddingRepo(true)}
            className="mt-4 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
        >
            <FaPlus className="mr-2" /> Add Repository
        </button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.map((repo) => (
          <div
            key={repo._id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                        {repo.repo_name || repo.repo_url.split('/').pop()?.replace('.git', '') || 'Unnamed Repository'}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(
                          repo.status
                        )}`}
                      >
                        {repo.status}
              </span>
            </div>

                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                      {repo.repo_url}
                    </p>
                    
                    {repo.languages && Object.keys(repo.languages).length > 0 && (
                      <div className="mb-2">
                        {renderLanguageBar(repo.languages)}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-3">
                      <span>Created: {formatTimeAgo(repo.created_at)}</span>
                      <span>
                        {repo.file_count ? `${repo.file_count} files` : ''}
                        {repo.total_size ? ` · ${formatBytes(repo.total_size)}` : ''}
                      </span>
                    </div>
                </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800 flex space-x-2">
                    <Link 
                      href={`/repositories/${repo._id}/enhanced`}
                      className="flex-1 flex justify-center items-center px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      <FiEye className="mr-1" /> Enhanced
                    </Link>
                    <Link
                      href={`/repositories/${repo._id}/analyze`}
                      className="flex-1 flex justify-center items-center px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      <BiAnalyse className="mr-1" /> Analyze
                    </Link>
                    <button
                      onClick={() => handleDeleteRepository(repo._id)}
                      disabled={deleteInProgress === repo._id}
                      className="flex items-center px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      {deleteInProgress === repo._id ? (
                        <LoadingSpinner size="small" />
                      ) : (
                        <FaTrash className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {repositories.map((repo) => (
                <div
                  key={repo._id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate mr-2">
                        {repo.repo_name || repo.repo_url.split('/').pop()?.replace('.git', '') || 'Unnamed Repository'}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(
                          repo.status
                        )}`}
                      >
                        {repo.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                      {repo.repo_url}
                    </p>
                    
                    {repo.languages && Object.keys(repo.languages).length > 0 && (
                      <div className="mb-2 max-w-md">
                        {renderLanguageBar(repo.languages)}
                  </div>
                )}
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>Created: {formatTimeAgo(repo.created_at)}</span>
                      <span className="mx-2">·</span>
                      <span>
                        {repo.file_count ? `${repo.file_count} files` : ''}
                        {repo.total_size ? ` · ${formatBytes(repo.total_size)}` : ''}
                      </span>
                    </div>
            </div>

                  <div className="flex mt-3 sm:mt-0 space-x-2">
                  <Link
                      href={`/repositories/${repo._id}/enhanced`}
                      className="flex items-center px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                      <FiEye className="mr-1" /> Enhanced
                  </Link>
                  <Link
                      href={`/repositories/${repo._id}/analyze`}
                      className="flex items-center px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                      <BiAnalyse className="mr-1" /> Analyze
                  </Link>
                  <button
                    onClick={() => handleDeleteRepository(repo._id)}
                      disabled={deleteInProgress === repo._id}
                      className="flex items-center px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    {deleteInProgress === repo._id ? (
                      <LoadingSpinner size="small" />
                    ) : (
                        <FaTrash className="h-4 w-4" />
                    )}
                  </button>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {repositories.length} of {totalRepos} repositories
          </div>
              <div className="flex space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 disabled:opacity-50"
            >
              Previous
            </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
          )}
        </>
      )}

      {/* Add repository modal */}
      {isAddingRepo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Add Repository
              </h3>
              <button
                onClick={() => setIsAddingRepo(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={addRepository}>
              <div className="mb-4">
                <label htmlFor="repo-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repository URL
                </label>
                <input
                  id="repo-url"
                  type="text"
                  placeholder="https://github.com/username/repo.git"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  required
                />
                {addError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{addError}</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingRepo(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                >
                  Cancel
                </button>
              <button
                  type="submit"
                  disabled={addingInProgress}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50 flex items-center"
                >
                  {addingInProgress ? (
                    <>
                      <LoadingSpinner size="small" className="mr-2" />
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
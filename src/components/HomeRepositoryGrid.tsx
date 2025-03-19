'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Repository } from '@/types/repository';
import RepositoryCard from './RepositoryCard';
import LoadingSpinner from './LoadingSpinner';
import { adaptRepositoriesResponse, adaptLegacyResponse } from '@/services/repositoryAdapter';
import { FaPlus } from 'react-icons/fa';

interface RepositoryResponse {
  repositories: Repository[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function HomeRepositoryGrid() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingRepo, setIsAddingRepo] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [addingInProgress, setAddingInProgress] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState<string | null>(null);
  
  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/repositories`
      );
      
      // Check if the response has the expected structure
      if (response.data && response.data.repositories) {
        const adaptedData = adaptRepositoriesResponse(response.data);
        setRepositories(adaptedData.repositories);
      } else {
        // Handle legacy API response format (just an array)
        const adaptedData = adaptLegacyResponse(Array.isArray(response.data) ? response.data : []);
        setRepositories(adaptedData.repositories);
      }
    } catch (err) {
      console.error('Failed to fetch repositories:', err);
      setError('Failed to fetch repositories');
      setRepositories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRepository = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this repository?')) {
      try {
        setDeleteInProgress(id);
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/repositories/${id}`);
        setRepositories(repositories.filter(repo => repo.id !== id));
      } catch (err) {
        console.error('Failed to delete repository:', err);
        alert('Failed to delete repository');
      } finally {
        setDeleteInProgress(null);
      }
    }
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
      
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/repositories`, {
        repo_url: newRepoUrl
      });
      
      // Add the new repository to the list
      const newRepo = response.data;
      
      // Convert to Repository format
      const adaptedRepo: Repository = {
        id: newRepo._id,
        repo_url: newRepo.repo_url,
        status: newRepo.status as 'pending' | 'completed' | 'failed',
        progress: 0,
        files: 0,
        directories: 0,
        size_bytes: 0,
        last_updated: newRepo.updated_at
      };
      
      setRepositories([adaptedRepo, ...repositories]);
      
      // Reset form
      setNewRepoUrl('');
      setIsAddingRepo(false);
    } catch (err) {
      console.error('Failed to add repository:', err);
      setAddError('Failed to add repository');
    } finally {
      setAddingInProgress(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsAddingRepo(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center"
        >
          <FaPlus className="mr-2" /> Add Repository
        </button>
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
      ) : repositories.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repositories.map((repo) => (
            <RepositoryCard
              key={repo.id}
              repository={repo}
              onDelete={handleDeleteRepository}
              isDeleting={deleteInProgress === repo.id}
            />
          ))}
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
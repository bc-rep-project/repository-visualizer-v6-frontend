'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaSearch, FaCode, FaFile, FaFolder, FaChevronRight } from 'react-icons/fa';
import LoadingSpinner from '@/components/LoadingSpinner';

interface SearchResult {
  id: string;
  type: 'repository' | 'file' | 'function';
    name: string;
  path?: string;
  repository?: string;
  language?: string;
  content?: string;
  matches?: {
    line: number;
    text: string;
  }[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams?.get('q') || '';
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(['repositories', 'files', 'functions']);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTime, setSearchTime] = useState(0);
  const [repositoryCount, setRepositoryCount] = useState(0);
  const [fileCount, setFileCount] = useState(0);
  const [functionCount, setFunctionCount] = useState(0);
  const resultsPerPage = 10;

  useEffect(() => {
    if (query) {
      performSearch();
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [query, activeFilters, currentPage]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const startTime = performance.now();
      
      let url = `http://localhost:8000/api/search?q=${encodeURIComponent(query)}&page=${currentPage}&limit=${resultsPerPage}`;
      
      if (activeFilters.length < 3) {
        url += `&types=${activeFilters.join(',')}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setResults(data.results);
      setTotalResults(data.total);
      setTotalPages(Math.ceil(data.total / resultsPerPage));
      setRepositoryCount(data.counts.repositories || 0);
      setFileCount(data.counts.files || 0);
      setFunctionCount(data.counts.functions || 0);
      
      const endTime = performance.now();
      setSearchTime((endTime - startTime) / 1000);
      
      setError(null);
    } catch (err) {
      setError('Error performing search. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      // Don't allow removing the last filter
      if (activeFilters.length > 1) {
        setActiveFilters(activeFilters.filter(f => f !== filter));
      }
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
    setCurrentPage(1); // Reset to first page when changing filters
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchQuery = formData.get('search') as string;
    
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const highlightMatches = (text: string) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'repository':
        return <FaFolder className="text-blue-500" />;
      case 'file':
        return <FaFile className="text-green-500" />;
      case 'function':
        return <FaCode className="text-purple-500" />;
      default:
        return <FaFile className="text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex w-full">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
          <input
              type="search"
              name="search"
              defaultValue={query}
              className="block w-full p-4 pl-10 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              placeholder="Search across repositories, files and functions..."
            />
          </div>
          <button
            type="submit"
            className="ml-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            Search
          </button>
        </form>
        </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {query && !loading && !error && (
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Found {totalResults.toLocaleString()} results ({searchTime.toFixed(2)} seconds)
          </p>
          <div className="flex space-x-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Repositories: {repositoryCount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Files: {fileCount.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Functions: {functionCount.toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">Filters</h2>
            
            <div className="space-y-2">
              <button
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                  activeFilters.includes('repositories') 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => toggleFilter('repositories')}
              >
                <span className="flex items-center">
                  <FaFolder className="mr-2" /> Repositories
                </span>
                <span className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {repositoryCount}
                </span>
              </button>
              
              <button
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                  activeFilters.includes('files') 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => toggleFilter('files')}
              >
                <span className="flex items-center">
                  <FaFile className="mr-2" /> Files
                </span>
                <span className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {fileCount}
                </span>
              </button>
              
              <button
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md ${
                  activeFilters.includes('functions') 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => toggleFilter('functions')}
              >
                <span className="flex items-center">
                  <FaCode className="mr-2" /> Functions
                </span>
                <span className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                  {functionCount}
                </span>
              </button>
                    </div>
            
            <div className="mt-6">
              <h3 className="text-md font-medium mb-2 dark:text-white">Documentation</h3>
              <button
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50"
              >
                <span className="flex items-center">
                  <FaFile className="mr-2" /> Documentation
                </span>
              </button>
            </div>
                    </div>
                  </div>

        {/* Results */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="medium" />
              </div>
          ) : results.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
              {query ? (
                <p className="text-gray-500 dark:text-gray-400">No results found for "{query}".</p>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">Enter a search term to find results.</p>
            )}
          </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Repositories</h2>
              
              {activeFilters.includes('repositories') && results.some(r => r.type === 'repository') && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
                  <ul className="divide-y dark:divide-gray-700">
                    {results.filter(r => r.type === 'repository').map((result) => (
                      <li key={result.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-1">
                            {getResultIcon(result.type)}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                {result.name}
                              </h3>
                            </div>
                            <p 
                              className="text-sm text-gray-500 dark:text-gray-400 mt-1"
                              dangerouslySetInnerHTML={{ __html: highlightMatches(result.content || '') }}
                            ></p>
                            <div className="flex items-center mt-2">
                              <button
                                onClick={() => router.push(`/repositories/${result.id}`)}
                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                              >
                                View Repository <FaChevronRight className="ml-1" size={10} />
                              </button>
                            </div>
                    </div>
                  </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Files</h2>
              
              {activeFilters.includes('files') && results.some(r => r.type === 'file') && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
                  <ul className="divide-y dark:divide-gray-700">
                    {results.filter(r => r.type === 'file').map((result) => (
                      <li key={result.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-1">
                            {getResultIcon(result.type)}
              </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                {result.name}
                              </h3>
                              {result.language && (
                                <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                  {result.language}
                                </span>
            )}
          </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {result.repository} &gt; {result.path}
                            </p>
                            {result.matches && result.matches.length > 0 && (
                              <div className="mt-2 bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs overflow-x-auto">
                                {result.matches.map((match, idx) => (
                                  <div key={idx} className="flex">
                                    <span className="text-gray-500 dark:text-gray-400 mr-2 select-none w-7 text-right">
                                      {match.line}
                                    </span>
                                    <span 
                                      dangerouslySetInnerHTML={{ __html: highlightMatches(match.text) }}
                                      className="text-gray-800 dark:text-gray-200"
                                    ></span>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center mt-2">
                              <button
                                onClick={() => router.push(`/repositories/${result.id.split(':')[0]}`)}
                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                              >
                                Open File <FaChevronRight className="ml-1" size={10} />
                              </button>
                            </div>
                    </div>
                  </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <h2 className="text-xl font-semibold mb-4 dark:text-white">Functions</h2>
              
              {activeFilters.includes('functions') && results.some(r => r.type === 'function') && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden mb-6">
                  <ul className="divide-y dark:divide-gray-700">
                    {results.filter(r => r.type === 'function').map((result) => (
                      <li key={result.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-1">
                            {getResultIcon(result.type)}
              </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center">
                              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                {result.name}
                              </h3>
                              {result.language && (
                                <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                  {result.language}
                                </span>
            )}
          </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {result.repository} &gt; {result.path}
                            </p>
                            {result.content && (
                              <div className="mt-2 bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs overflow-x-auto">
                                <pre 
                                  dangerouslySetInnerHTML={{ __html: highlightMatches(result.content) }}
                                  className="text-gray-800 dark:text-gray-200"
                                ></pre>
                              </div>
                            )}
                            <div className="flex items-center mt-2">
                              <button
                                onClick={() => router.push(`/repositories/${result.id.split(':')[0]}`)}
                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                              >
                                Jump to Definition <FaChevronRight className="ml-1" size={10} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
        </div>
      )}
      
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * resultsPerPage + 1}-
                    {Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="px-1 py-1 text-gray-500 dark:text-gray-400">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`px-3 py-1 rounded-md ${
                            currentPage === totalPages
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
        </div>
      )}
    </div>
      </div>
    </div>
  );
} 
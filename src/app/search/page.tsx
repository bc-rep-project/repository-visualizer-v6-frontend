'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FaSearch, FaCode, FaFile, FaFolder, FaChevronRight } from 'react-icons/fa';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

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
  const query = searchParams.get('q') || '';
  
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
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="flex-grow">
    <div className="container mx-auto px-4 py-6">
          {/* Search form */}
      <div className="mb-6">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row w-full gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
          <input
              type="search"
              name="search"
              defaultValue={query}
                  className="block w-full p-3 sm:p-4 pl-10 text-sm border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Search repositories, files and functions..."
            />
          </div>
          <button
            type="submit"
                className="px-4 py-3 sm:py-0 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Found {totalResults.toLocaleString()} results ({searchTime.toFixed(2)} seconds)
          </p>
              <div className="flex flex-wrap gap-4">
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
            <div className="order-2 md:order-1 md:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sticky top-4">
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
            <div className="order-1 md:order-2 md:col-span-3">
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
                          <li key={result.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-1">
                            {getResultIcon(result.type)}
                          </div>
                          <div className="ml-3 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                {result.name}
                              </h3>
                                  {result.language && (
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                      {result.language}
                                    </span>
                                  )}
                            </div>
                            <p 
                                  className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: highlightMatches(result.content || '') }}
                            ></p>
                                <div className="flex items-center mt-3">
                              <button
                                onClick={() => router.push(`/repositories/${result.id}`)}
                                    className="text-xs py-1 px-3 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded flex items-center transition-colors"
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
                          <li key={result.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-1">
                            {getResultIcon(result.type)}
              </div>
                          <div className="ml-3 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                {result.name}
                              </h3>
                              {result.language && (
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                  {result.language}
                                </span>
            )}
          </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {result.repository} &gt; {result.path}
                            </p>
                            {result.matches && result.matches.length > 0 && (
                              <div className="mt-2 bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs overflow-x-auto">
                                    {result.matches.slice(0, 3).map((match, idx) => (
                                  <div key={idx} className="flex">
                                        <span className="text-gray-500 dark:text-gray-400 mr-2 select-none w-5 text-right flex-shrink-0">
                                      {match.line}
                                    </span>
                                    <span 
                                      dangerouslySetInnerHTML={{ __html: highlightMatches(match.text) }}
                                          className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all"
                                    ></span>
                                  </div>
                                ))}
                                    {result.matches.length > 3 && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-7">
                                        ... and {result.matches.length - 3} more matches
                                      </div>
                                    )}
                              </div>
                            )}
                                <div className="flex items-center mt-3">
                              <button
                                onClick={() => router.push(`/repositories/${result.id.split(':')[0]}`)}
                                    className="text-xs py-1 px-3 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded flex items-center transition-colors"
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
                          <li key={result.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition duration-150">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-1">
                            {getResultIcon(result.type)}
              </div>
                          <div className="ml-3 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-md font-medium text-gray-900 dark:text-white">
                                {result.name}
                              </h3>
                              {result.language && (
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                                  {result.language}
                                </span>
            )}
          </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {result.repository} &gt; {result.path}
                            </p>
                            {result.content && (
                              <div className="mt-2 bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700 font-mono text-xs overflow-x-auto">
                                <pre 
                                      dangerouslySetInnerHTML={{ __html: highlightMatches(result.content.length > 500 ? result.content.substring(0, 500) + '...' : result.content) }}
                                      className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all"
                                ></pre>
                              </div>
                            )}
                                <div className="flex items-center mt-3">
                              <button
                                onClick={() => router.push(`/repositories/${result.id.split(':')[0]}`)}
                                    className="text-xs py-1 px-3 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded flex items-center transition-colors"
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
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3">
                      <div className="text-sm text-gray-500 dark:text-gray-400 w-full sm:w-auto text-center sm:text-left">
                    Showing {(currentPage - 1) * resultsPerPage + 1}-
                    {Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults}
                  </div>
                      <div className="flex flex-wrap justify-center sm:justify-end gap-1 w-full sm:w-auto">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                          className="px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 disabled:opacity-50"
                    >
                      Previous
                    </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          // Only show a few pages on mobile to prevent overflow
                          .filter(page => {
                            // On mobile, only show current page, first page, last page, and adjacent pages
                            if (window.innerWidth < 640) {
                              return page === 1 || page === totalPages || 
                                Math.abs(page - currentPage) <= 1;
                            }
                            // On desktop, show more pages
                            return Math.abs(page - currentPage) <= 2 || page === 1 || page === totalPages;
                          })
                          // Add ellipsis markers
                          .reduce((acc, page, i, arr) => {
                            if (i > 0 && arr[i - 1] !== page - 1) {
                              acc.push('ellipsis' + page);
                            }
                            acc.push(page);
                            return acc;
                          }, [] as (number | string)[])
                          .map((page, i) => {
                            if (typeof page === 'string' && page.startsWith('ellipsis')) {
                              return (
                                <span key={page} className="px-2 py-1 text-gray-500 dark:text-gray-400">
                                  ...
                                </span>
                              );
                            }
                            
                      return (
                        <button
                                key={i}
                                onClick={() => setCurrentPage(page as number)}
                                className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium ${
                                  currentPage === page
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200'
                                }`}
                              >
                                {page}
                        </button>
                      );
                    })}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 disabled:opacity-50"
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
      </div>
      <Footer />
    </div>
  );
} 
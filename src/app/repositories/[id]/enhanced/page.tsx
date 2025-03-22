'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaFolder, FaCode, FaSearch, FaFilter, FaDownload, FaShare, FaFile, FaCubes } from 'react-icons/fa';
import { BiZoomIn, BiZoomOut } from 'react-icons/bi';
import { MdOutlineFullscreen } from 'react-icons/md';
import LoadingSpinner from '@/components/LoadingSpinner';
import VisualizationWrapper from '@/components/VisualizationWrapper';
import FileTypesChart from '@/components/FileTypesChart';
import DirectoryStructure from '@/components/DirectoryStructure';
import CodeMetrics from '@/components/CodeMetrics';
import FunctionsClassesList from '@/components/FunctionsClassesList';
import RepositoryOverview from '@/components/RepositoryOverview';
import Navigation from '@/components/Navigation';
import { SettingsProvider } from '@/contexts/SettingsContext';
import axios from 'axios';
import { transformAnalysisData } from '@/services/analysisService';
import { FileNode, AnalysisData } from '@/types/types';

interface Repository {
  _id: string;
  name: string;
  url: string;
  description: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

interface FilterOptions {
  showFiles: boolean;
  showDirectories: boolean;
  showFunctions: boolean;
  showClasses: boolean;
  searchQuery: string;
}

export default function RepositoryAnalyze() {
  const params = useParams();
  const router = useRouter();
  const [repository, setRepository] = useState<Repository | null>(null);
  const [rawData, setRawData] = useState<any>(null);
  const [processedData, setProcessedData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [visualizationType, setVisualizationType] = useState<'packed' | 'graph' | 'sunburst' | 'tree'>('packed');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'functions' | 'directory'>('overview');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    showFiles: true,
    showDirectories: true,
    showFunctions: true,
    showClasses: true,
    searchQuery: '',
  });
  const [filtersChanged, setFiltersChanged] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (params.id) {
      fetchRepositoryDetails();
      fetchGraphData();
    }
  }, [params.id]);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Debug rawData when it changes
  useEffect(() => {
    if (rawData) {
      console.log('Enhanced view rawData:', rawData);
      console.log('Enhanced view rawData type:', typeof rawData);
      console.log('Enhanced view rawData is array?', Array.isArray(rawData));
      
      if (typeof rawData === 'object') {
        console.log('Enhanced view rawData keys:', Object.keys(rawData));
        if ('children' in rawData) {
          console.log('Enhanced view rawData.children is array?', Array.isArray((rawData as any).children));
          console.log('Enhanced view rawData.children length:', ((rawData as any).children || []).length);
        }
      }
    }
  }, [rawData]);

  // Reprocess data when filters change
  useEffect(() => {
    if (rawData) {
      console.log('Filters changed, reprocessing data with options:', filterOptions);
      setFiltersChanged(true);
      
      // Use a small timeout to ensure the loading UI is visible
      // This makes the user experience better by showing feedback
      setTimeout(() => {
        const processed = transformAnalysisData(rawData, {
          showFiles: filterOptions.showFiles,
          showDirectories: filterOptions.showDirectories,
          showFunctions: filterOptions.showFunctions,
          showClasses: filterOptions.showClasses,
          searchQuery: filterOptions.searchQuery
        });
        setProcessedData(processed);
        
        // Small delay before hiding the loading state for better UX
        setTimeout(() => {
          setFiltersChanged(false);
        }, 300);
      }, 300);
    }
  }, [filterOptions, rawData]);

  const fetchRepositoryDetails = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/api/repositories/${params.id}`);
      setRepository(response.data);
    } catch (err) {
      console.error('Error fetching repository details:', err);
      setError('Failed to fetch repository details');
    }
  };

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/api/repositories/${params.id}/analyze`);
      setRawData(response.data);
      
      // Process the data for visualization
      const processed = transformAnalysisData(response.data, {
        showFiles: filterOptions.showFiles,
        showDirectories: filterOptions.showDirectories,
        showFunctions: filterOptions.showFunctions,
        showClasses: filterOptions.showClasses,
        searchQuery: searchQuery
      });
      setProcessedData(processed);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError('Failed to fetch repository analysis data');
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchQuery = e.target.value;
    setSearchQuery(newSearchQuery);
    // Update the filter options with the new search query
    setFilterOptions(prev => ({
      ...prev,
      searchQuery: newSearchQuery
    }));
  };

  const toggleFilter = (filter: keyof Omit<FilterOptions, 'searchQuery'>) => {
    console.log(`Toggle filter called for: ${filter}, current value: ${filterOptions[filter]}`);
    setFilterOptions(prev => {
      const newOptions = {
        ...prev,
        [filter]: !prev[filter]
      };
      console.log(`Filter updated: ${filter} => ${newOptions[filter]}`);
      return newOptions;
    });
  };

  const handleVisualizationTypeChange = (type: 'packed' | 'graph' | 'sunburst' | 'tree') => {
    setVisualizationType(type);
    // Re-apply the current filters to ensure the visualization is consistent
    if (rawData) {
      const processed = transformAnalysisData(rawData, filterOptions);
      setProcessedData(processed);
    }
  };

  const handleDownloadGraph = () => {
    if (!processedData) return;
    
    const dataStr = JSON.stringify(processedData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `${repository?.name || 'repository'}-analysis.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleShareGraph = () => {
    if (navigator.share) {
      navigator.share({
        title: `${repository?.name || 'Repository'} Analysis`,
        text: `Check out this analysis of ${repository?.name || 'this repository'}`,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch((err) => console.error('Could not copy text: ', err));
    }
  };

  const renderVisualization = () => {
    if (!processedData) return null;
    
    if (filtersChanged) {
      return (
        <div className="flex flex-col justify-center items-center" style={{ 
          minHeight: isMobile ? '450px' : '600px' 
        }}>
          <LoadingSpinner size="large" />
          <p className="mt-4 text-blue-600 dark:text-blue-400 font-medium">
            Applying filters...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md text-center">
            Updating visualization to show
            {filterOptions.showFiles ? ' files,' : ''} 
            {filterOptions.showDirectories ? ' directories,' : ''} 
            {filterOptions.showFunctions ? ' functions,' : ''} 
            {filterOptions.showClasses ? ' classes' : ''}
          </p>
        </div>
      );
    }
    
    return (
      <VisualizationWrapper
        data={rawData}
        graphData={processedData.graph}
        visualizationType={visualizationType}
        width={1200}
        height={isMobile ? 450 : 600}
      />
    );
  };

  const pulseStyle = filtersChanged ? {
    animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  } : {};

  useEffect(() => {
    // Add keyframes for pulse animation if not already present
    if (!document.querySelector('#pulse-keyframes')) {
      const style = document.createElement('style');
      style.id = 'pulse-keyframes';
      style.innerHTML = `
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Clean up on unmount
      const style = document.querySelector('#pulse-keyframes');
      if (style) style.remove();
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-8 space-y-6">
        {/* Repository header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
        </div>
        
        {/* Filter controls skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="w-full sm:w-64 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="flex space-x-2 mt-2 sm:mt-0">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* Visualization container skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
          <div className="flex justify-center items-center" 
            style={{ height: isMobile ? '450px' : '600px' }}
          >
            <LoadingSpinner message="Loading repository visualization..." />
          </div>
        </div>
        
        {/* Tabs skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 animate-pulse">
          <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6">
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-gray-700">{error}</p>
        <button
          onClick={() => router.push('/repositories')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Repositories
        </button>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
          {repository && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-white break-words">{repository.name}</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1 sm:mt-2 break-words">{repository.description || 'No description available'}</p>
              <div className="flex flex-col sm:flex-row sm:items-center mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <span className="mb-1 sm:mb-0 sm:mr-4">Owner: {repository.owner}</span>
                <span>Last updated: {new Date(repository.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md ${
                    visualizationType === 'packed' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => handleVisualizationTypeChange('packed')}
                  title="Packed Circles View"
                >
                  <MdOutlineFullscreen className="inline-block mr-0.5 sm:mr-1" /> Packed
                </button>
                <button
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md ${
                    visualizationType === 'graph' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => handleVisualizationTypeChange('graph')}
                  title="Force Graph View"
                >
                  <BiZoomIn className="inline-block mr-0.5 sm:mr-1" /> Graph
                </button>
                <button
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md ${
                    visualizationType === 'sunburst' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => handleVisualizationTypeChange('sunburst')}
                  title="Sunburst View"
                >
                  <BiZoomOut className="inline-block mr-0.5 sm:mr-1" /> Sunburst
                </button>
                <button
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md ${
                    visualizationType === 'tree' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => handleVisualizationTypeChange('tree')}
                  title="Tree View"
                >
                  <FaFolder className="inline-block mr-0.5 sm:mr-1" /> Tree
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md flex items-center"
                  onClick={handleDownloadGraph}
                  title="Download Analysis Data"
                >
                  <FaDownload className="mr-0.5 sm:mr-1" /> Export
                </button>
                <button
                  className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md flex items-center"
                  onClick={handleShareGraph}
                  title="Share Analysis"
                >
                  <FaShare className="mr-0.5 sm:mr-1" /> Share
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search files, functions..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <FaSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleFilter('showFiles')}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md flex items-center transition-all duration-200 ease-in-out ${filterOptions.showFiles ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  aria-pressed={filterOptions.showFiles}
                >
                  <FaFile className="mr-0.5 sm:mr-1 flex-shrink-0" /> Files
                </button>
                <button
                  onClick={() => toggleFilter('showDirectories')}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md flex items-center transition-all duration-200 ease-in-out ${filterOptions.showDirectories ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  aria-pressed={filterOptions.showDirectories}
                >
                  <FaFolder className="mr-0.5 sm:mr-1 flex-shrink-0" /> Dirs
                </button>
                <button
                  onClick={() => toggleFilter('showFunctions')}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md flex items-center transition-all duration-200 ease-in-out ${filterOptions.showFunctions ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  aria-pressed={filterOptions.showFunctions}
                >
                  <FaCode className="mr-0.5 sm:mr-1 flex-shrink-0" /> Funcs
                </button>
                <button
                  onClick={() => toggleFilter('showClasses')}
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-md flex items-center transition-all duration-200 ease-in-out ${filterOptions.showClasses ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  aria-pressed={filterOptions.showClasses}
                >
                  <FaCubes className="mr-0.5 sm:mr-1 flex-shrink-0" /> Classes
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-4 overflow-hidden">
            <div className="visualization-container w-full" style={{ 
              minHeight: isMobile ? '450px' : '600px', 
              maxHeight: isMobile ? '550px' : '700px',
              ...pulseStyle 
            }}>
              {renderVisualization()}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium ${activeTab === 'overview' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium ${activeTab === 'metrics' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Code Metrics
              </button>
              <button
                onClick={() => setActiveTab('functions')}
                className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium ${activeTab === 'functions' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Functions & Classes
              </button>
              <button
                onClick={() => setActiveTab('directory')}
                className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium ${activeTab === 'directory' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Directory Structure
              </button>
            </div>
            
            <div className="tab-content overflow-x-auto">
              {activeTab === 'overview' && rawData && (
                <div className="w-full px-0">
                  <RepositoryOverview data={rawData} />
                </div>
              )}
              
              {activeTab === 'metrics' && rawData && (
                <div className="w-full px-0">
                  {processedData && processedData.tree ? (
                    <CodeMetrics data={processedData.tree} repoId={params.id as string} />
                  ) : (
                    <div className="text-center p-4 sm:p-8 text-gray-500 dark:text-gray-400">
                      No metrics data available.
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'functions' && rawData && (
                <div className="w-full px-0">
                  {/* 
                    FunctionsClassesList expects an array of FileNode objects.
                    Ensure we're passing the correct structure by checking the 
                    shape of rawData and normalizing it properly.
                  */}
                  <FunctionsClassesList 
                    data={(() => {
                      // Debug the actual structure
                      console.log('Raw data structure for functions tab:', rawData);
                      console.log('Raw data is array?', Array.isArray(rawData));
                      
                      // Handle different possible data structures
                      if (Array.isArray(rawData)) {
                        return rawData;
                      } else if (rawData && typeof rawData === 'object') {
                        if ('children' in rawData && Array.isArray(rawData.children)) {
                          return rawData.children;
                        } else {
                          return [rawData];
                        }
                      }
                      return [];
                    })()} 
                    searchQuery={searchQuery} 
                    repoId={params.id as string} 
                  />
                </div>
              )}
              
              {activeTab === 'directory' && rawData && (
                <div className="w-full px-0">
                  <DirectoryStructure 
                    data={(() => {
                      // Handle different possible data structures
                      if (rawData && typeof rawData === 'object') {
                        // DirectoryStructure expects a single root node
                        return rawData;
                      }
                      return { name: 'root', path: '/', type: 'directory', children: [] };
                    })()} 
                    searchQuery={searchQuery} 
                    repoId={params.id as string} 
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SettingsProvider>
  );
} 
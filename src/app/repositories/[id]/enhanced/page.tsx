'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaFolder, FaCode, FaSearch, FaFilter, FaDownload, FaShare } from 'react-icons/fa';
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

  useEffect(() => {
    if (params.id) {
      fetchRepositoryDetails();
      fetchGraphData();
    }
  }, [params.id]);

  // Reprocess data when filters change
  useEffect(() => {
    if (rawData) {
      const processed = transformAnalysisData(rawData, {
        showFiles: filterOptions.showFiles,
        showDirectories: filterOptions.showDirectories,
        showFunctions: filterOptions.showFunctions,
        showClasses: filterOptions.showClasses,
        searchQuery: filterOptions.searchQuery
      });
      setProcessedData(processed);
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
    setSearchQuery(e.target.value);
    // Update the filter options with the new search query
    setFilterOptions(prev => ({
      ...prev,
      searchQuery: e.target.value
    }));
  };

  const toggleFilter = (filter: keyof Omit<FilterOptions, 'searchQuery'>) => {
    setFilterOptions(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
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
    
    return (
      <VisualizationWrapper
        data={rawData}
        graphData={processedData}
        visualizationType={visualizationType}
        width={1200}
        height={600}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
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
        
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {repository && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{repository.name}</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">{repository.description || 'No description available'}</p>
              <div className="flex items-center mt-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="mr-4">Owner: {repository.owner}</span>
                <span>Last updated: {new Date(repository.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 space-y-4 md:space-y-0">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setVisualizationType('packed')}
                  className={`px-3 py-2 rounded ${visualizationType === 'packed' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  title="Packed Circles View"
                >
                  <MdOutlineFullscreen className="inline mr-1" /> Packed
                </button>
                <button
                  onClick={() => setVisualizationType('graph')}
                  className={`px-3 py-2 rounded ${visualizationType === 'graph' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  title="Force Graph View"
                >
                  <BiZoomIn className="inline mr-1" /> Graph
                </button>
                <button
                  onClick={() => setVisualizationType('sunburst')}
                  className={`px-3 py-2 rounded ${visualizationType === 'sunburst' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  title="Sunburst View"
                >
                  <BiZoomOut className="inline mr-1" /> Sunburst
                </button>
                <button
                  onClick={() => setVisualizationType('tree')}
                  className={`px-3 py-2 rounded ${visualizationType === 'tree' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  title="Tree View"
                >
                  <FaFolder className="inline mr-1" /> Tree
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleDownloadGraph}
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  title="Download Analysis Data"
                >
                  <FaDownload className="inline mr-1" /> Download
                </button>
                <button
                  onClick={handleShareGraph}
                  className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                  title="Share Analysis"
                >
                  <FaShare className="inline mr-1" /> Share
                </button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 space-y-4 md:space-y-0">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search files, functions..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <FaSearch className="absolute right-3 top-3 text-gray-400" />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => toggleFilter('showFiles')}
                  className={`px-3 py-2 rounded ${filterOptions.showFiles ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Files
                </button>
                <button
                  onClick={() => toggleFilter('showDirectories')}
                  className={`px-3 py-2 rounded ${filterOptions.showDirectories ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Directories
                </button>
                <button
                  onClick={() => toggleFilter('showFunctions')}
                  className={`px-3 py-2 rounded ${filterOptions.showFunctions ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Functions
                </button>
                <button
                  onClick={() => toggleFilter('showClasses')}
                  className={`px-3 py-2 rounded ${filterOptions.showClasses ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                >
                  Classes
                </button>
              </div>
            </div>
            
            <div className="visualization-container w-full" style={{ height: '600px', overflow: 'hidden' }}>
              {renderVisualization()}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-4 py-2 font-medium ${activeTab === 'metrics' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Code Metrics
              </button>
              <button
                onClick={() => setActiveTab('functions')}
                className={`px-4 py-2 font-medium ${activeTab === 'functions' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Functions & Classes
              </button>
              <button
                onClick={() => setActiveTab('directory')}
                className={`px-4 py-2 font-medium ${activeTab === 'directory' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Directory Structure
              </button>
            </div>
            
            <div className="tab-content overflow-x-auto">
              {activeTab === 'overview' && rawData && (
                <div className="max-w-full">
                  <RepositoryOverview data={rawData} />
                </div>
              )}
              
              {activeTab === 'metrics' && rawData && (
                <div className="max-w-full">
                  <CodeMetrics data={rawData} />
                </div>
              )}
              
              {activeTab === 'functions' && rawData && (
                <div className="max-w-full">
                  <FunctionsClassesList data={rawData} searchQuery={searchQuery} />
                </div>
              )}
              
              {activeTab === 'directory' && rawData && (
                <div className="max-w-full">
                  <DirectoryStructure data={rawData} searchQuery={searchQuery} repoId={params.id as string} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SettingsProvider>
  );
} 
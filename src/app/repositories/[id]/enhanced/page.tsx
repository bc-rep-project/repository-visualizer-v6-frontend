'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaFolder, FaCode, FaSearch, FaFilter, FaDownload, FaShare, FaChartBar, FaCodeBranch, FaFileCode } from 'react-icons/fa';
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
import axios from 'axios';
import { transformAnalysisData } from '@/services/analysisService';
import { FileNode, AnalysisData } from '@/types/types';
import { repositoryApi } from '@/services/api';

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

// New component to display enhanced metrics
interface CodeMetrics {
  lines_of_code: number;
  comment_lines: number;
  blank_lines: number;
  function_count: number;
  class_count: number;
  file_types: Record<string, number>;
  complexity: {
    average: number;
    highest: number;
    lowest: number;
    by_file: Record<string, number>;
  };
  dependencies: {
    internal: number;
    external: number;
    most_dependent: string | null;
    most_dependencies: string | null;
  };
  language_distribution: Record<string, number>;
  code_to_comment_ratio: number;
  generated_at: string;
}

interface EnhancedRepositoryData {
  repository: Repository;
  tree_structure: FileNode;
  metrics: CodeMetrics;
  visualization_ready: boolean;
  last_updated: string;
}

interface EnhancedMetricsProps {
  metrics: CodeMetrics;
}

const EnhancedMetrics: React.FC<EnhancedMetricsProps> = ({ metrics }) => {
  if (!metrics) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <FaChartBar className="mr-2" /> Enhanced Code Metrics
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Code Statistics */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-700 mb-2">Code Statistics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Lines of Code:</span>
              <span className="font-semibold">{metrics.lines_of_code.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Comment Lines:</span>
              <span className="font-semibold">{metrics.comment_lines.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Blank Lines:</span>
              <span className="font-semibold">{metrics.blank_lines.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Code/Comment Ratio:</span>
              <span className="font-semibold">
                {metrics.code_to_comment_ratio === Infinity 
                  ? '∞' 
                  : metrics.code_to_comment_ratio.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Code Structure */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-700 mb-2">Code Structure</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Functions:</span>
              <span className="font-semibold">{metrics.function_count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Classes:</span>
              <span className="font-semibold">{metrics.class_count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">File Types:</span>
              <span className="font-semibold">{Object.keys(metrics.file_types).length}</span>
            </div>
          </div>
        </div>
        
        {/* Complexity */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-medium text-purple-700 mb-2">Code Complexity</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Average:</span>
              <span className="font-semibold">{metrics.complexity.average.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Highest:</span>
              <span className="font-semibold">{metrics.complexity.highest}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Lowest:</span>
              <span className="font-semibold">{metrics.complexity.lowest}</span>
            </div>
          </div>
        </div>
        
        {/* Dependencies */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-medium text-yellow-700 mb-2">Dependencies</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Internal:</span>
              <span className="font-semibold">{metrics.dependencies.internal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">External:</span>
              <span className="font-semibold">{metrics.dependencies.external}</span>
            </div>
            {metrics.dependencies.most_dependencies && (
              <div className="flex justify-between">
                <span className="text-gray-600">Most Dependencies:</span>
                <span className="font-semibold text-xs truncate max-w-[200px]" title={metrics.dependencies.most_dependencies}>
                  {metrics.dependencies.most_dependencies}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Language Distribution */}
        <div className="bg-red-50 p-4 rounded-lg col-span-1 md:col-span-2">
          <h3 className="font-medium text-red-700 mb-2">Top Languages</h3>
          <div className="space-y-2">
            {Object.entries(metrics.language_distribution)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 5)
              .map(([language, count]) => (
                <div key={language} className="flex justify-between">
                  <span className="text-gray-600">{language}:</span>
                  <span className="font-semibold">{count as React.ReactNode}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [metrics, setMetrics] = useState<any>(null);

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
      
      // Use the repositoryApi to fetch enhanced view data
      const enhancedData = await repositoryApi.getEnhancedRepositoryView(params.id as string);
      
      // Set repository data if not already set
      if (!repository && enhancedData.repository) {
        setRepository(enhancedData.repository);
      }
      
      // The enhanced data includes the tree structure and metrics
      setRawData(enhancedData.tree_structure);
      
      // Process the data for visualization
      const processed = transformAnalysisData(enhancedData.tree_structure, {
        showFiles: filterOptions.showFiles,
        showDirectories: filterOptions.showDirectories,
        showFunctions: filterOptions.showFunctions,
        showClasses: filterOptions.showClasses,
        searchQuery: searchQuery
      });
      setProcessedData(processed);
      
      // Store the metrics for display
      setMetrics(enhancedData.metrics);
      
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
        width={1000}
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {repository && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800">{repository.name}</h1>
            <p className="text-gray-600 mt-2">{repository.description || 'No description available'}</p>
            <div className="flex items-center mt-4 text-sm text-gray-500">
              <span className="mr-4">Owner: {repository.owner}</span>
              <span>Last updated: {new Date(repository.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
        
        {/* Add Enhanced Metrics Component */}
        {metrics && <EnhancedMetrics metrics={metrics} />}
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setVisualizationType('packed')}
                className={`px-3 py-2 rounded ${visualizationType === 'packed' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                title="Packed Circles View"
              >
                <MdOutlineFullscreen className="inline mr-1" /> Packed
              </button>
              <button
                onClick={() => setVisualizationType('graph')}
                className={`px-3 py-2 rounded ${visualizationType === 'graph' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                title="Force Graph View"
              >
                <BiZoomIn className="inline mr-1" /> Graph
              </button>
              <button
                onClick={() => setVisualizationType('sunburst')}
                className={`px-3 py-2 rounded ${visualizationType === 'sunburst' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                title="Sunburst View"
              >
                <BiZoomOut className="inline mr-1" /> Sunburst
              </button>
              <button
                onClick={() => setVisualizationType('tree')}
                className={`px-3 py-2 rounded ${visualizationType === 'tree' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                title="Tree View"
              >
                <FaFolder className="inline mr-1" /> Tree
              </button>
            </div>
            
            <div className="flex space-x-2">
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
          
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search files, functions..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FaSearch className="absolute right-3 top-3 text-gray-400" />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => toggleFilter('showFiles')}
                className={`px-3 py-2 rounded ${filterOptions.showFiles ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Files
              </button>
              <button
                onClick={() => toggleFilter('showDirectories')}
                className={`px-3 py-2 rounded ${filterOptions.showDirectories ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Directories
              </button>
              <button
                onClick={() => toggleFilter('showFunctions')}
                className={`px-3 py-2 rounded ${filterOptions.showFunctions ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Functions
              </button>
              <button
                onClick={() => toggleFilter('showClasses')}
                className={`px-3 py-2 rounded ${filterOptions.showClasses ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Classes
              </button>
            </div>
          </div>
          
          <div className="visualization-container" style={{ height: '600px', width: '100%' }}>
            {renderVisualization()}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2 font-medium ${activeTab === 'metrics' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
            >
              Code Metrics
            </button>
            <button
              onClick={() => setActiveTab('functions')}
              className={`px-4 py-2 font-medium ${activeTab === 'functions' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
            >
              Functions & Classes
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 font-medium ${activeTab === 'directory' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
            >
              Directory Structure
            </button>
          </div>
          
          <div className="tab-content">
            {activeTab === 'overview' && rawData && (
              <RepositoryOverview data={rawData} />
            )}
            
            {activeTab === 'metrics' && rawData && (
              <CodeMetrics data={rawData} />
            )}
            
            {activeTab === 'functions' && rawData && (
              <FunctionsClassesList data={rawData} searchQuery={searchQuery} />
            )}
            
            {activeTab === 'directory' && rawData && (
              <DirectoryStructure data={rawData} searchQuery={searchQuery} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
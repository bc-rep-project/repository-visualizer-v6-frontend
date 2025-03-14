'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaFolder, FaCode, FaSearch, FaFilter, FaDownload, FaShare } from 'react-icons/fa';
import { BiZoomIn, BiZoomOut } from 'react-icons/bi';
import { MdOutlineFullscreen } from 'react-icons/md';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RepositoryGraph } from '@/components/RepositoryGraph';
import { RepositoryTree } from '@/components/RepositoryTree';
import { SimpleSunburst } from '@/components/SimpleSunburst';
import { RepositoryPackedCircles } from '@/components/RepositoryPackedCircles';
import FileTypesChart from '@/components/FileTypesChart';
import DirectoryStructure from '@/components/DirectoryStructure';
import CodeMetrics from '@/components/CodeMetrics';
import FunctionsClassesList from '@/components/FunctionsClassesList';
import RepositoryOverview from '@/components/RepositoryOverview';
import Navigation from '@/components/Navigation';
import axios from 'axios';
import { transformAnalysisData } from '@/services/analysisService';
import { FileNode, AnalysisData } from '@/types/types';

interface Repository {
  _id: string;
  repo_url: string;
  repo_name: string;
}

interface FilterOptions {
  showFiles: boolean;
  showDirectories: boolean;
  showFunctions: boolean;
  showClasses: boolean;
  searchQuery: string;
  minSize?: number;
  maxSize?: number;
}

export default function EnhancedRepositoryAnalyze() {
  const params = useParams();
  const router = useRouter();
  const repoId = params.id as string;
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [rawData, setRawData] = useState<FileNode | null>(null);
  const [processedData, setProcessedData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visualizationType, setVisualizationType] = useState<'graph' | 'tree' | 'sunburst' | 'packed'>('packed');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'file-explorer' | 'commits' | 'issues' | 'pull-requests'>('overview');
  const [filters, setFilters] = useState<FilterOptions>({
    showFiles: true,
    showDirectories: true,
    showFunctions: true,
    showClasses: true,
    searchQuery: '',
    minSize: 0,
    maxSize: Infinity,
  });

  useEffect(() => {
    fetchRepositoryDetails();
    fetchGraphData();
  }, [repoId]);
  
  const fetchRepositoryDetails = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/repositories/${repoId}`);
      setRepository(response.data);
    } catch (err) {
      setError('Error loading repository details');
      console.error(err);
    }
  };
  
  const fetchGraphData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/repositories/${repoId}/analyze`);
      
      if (response.data) {
        const data = response.data as FileNode;
        setRawData(data);
        
        // Process the data for visualization
        const processed = transformAnalysisData(data, {
          ...filters,
          searchQuery
        });
        
        setProcessedData(processed);
        setError(null);
      } else {
        setError('Invalid graph data received from server');
      }
    } catch (err: any) {
      console.error('Error analyzing repository:', err);
      setError(`Error analyzing repository: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (rawData) {
      const processed = transformAnalysisData(rawData, {
        ...filters,
        searchQuery: e.target.value
      });
      setProcessedData(processed);
    }
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };
  
  const toggleFilter = (filter: keyof Omit<FilterOptions, 'searchQuery' | 'minSize' | 'maxSize'>) => {
    const newFilters = {
      ...filters,
      [filter]: !filters[filter]
    };
    setFilters(newFilters);
    
    // Re-process data with new filters
    if (rawData) {
      const processed = transformAnalysisData(rawData, {
        ...newFilters,
        searchQuery
      });
      setProcessedData(processed);
    }
  };
  
  const handleDownloadGraph = () => {
    if (!processedData) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(processedData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${repository?.repo_name || 'repository'}-graph.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  const handleShareGraph = () => {
    if (!repository) return;
    
    const url = `${window.location.origin}/repositories/${repoId}/enhanced`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link: ', err);
    });
  };

  // Render the appropriate visualization based on the selected type
  const renderVisualization = () => {
    if (!processedData || !rawData) return null;
    
    switch (visualizationType) {
      case 'graph':
        return <RepositoryGraph data={processedData.graph} width={900} height={700} />;
      case 'tree':
        return <RepositoryTree data={rawData} width={900} height={700} />;
      case 'sunburst':
        return <SimpleSunburst data={rawData} width={900} height={700} />;
      case 'packed':
        return <RepositoryPackedCircles data={rawData} width={900} height={700} />;
      default:
        return <RepositoryPackedCircles data={rawData} width={900} height={700} />;
    }
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="mr-4 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              &larr; Back
            </button>
            <h1 className="text-2xl font-bold dark:text-white">
              <FaFolder className="inline-block mr-2 text-yellow-400" />
              {repository?.repo_name || 'Repository Analysis'} (Enhanced View)
            </h1>
          </div>
          <div className="flex space-x-2">
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center"
              onClick={() => fetchGraphData()}
            >
              <FaCode className="mr-2" /> Analyze
            </button>
            <button 
              className="px-4 py-2 bg-green-500 text-white rounded-md flex items-center"
              onClick={handleShareGraph}
            >
              <FaShare className="mr-2" /> Share
            </button>
            <button 
              className="px-4 py-2 bg-purple-500 text-white rounded-md flex items-center"
              onClick={handleDownloadGraph}
            >
              <FaDownload className="mr-2" /> Download
            </button>
          </div>
        </div>
      
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
      
        {loading && !processedData ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" message="Analyzing repository..." />
          </div>
        ) : (
          <>
            {/* Repository Structure Visualization */}
            <div className="bg-gray-900 rounded-lg shadow-lg p-4 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Repository Structure</h2>
              <div className="h-[500px] relative">
                {renderVisualization()}
                
                {/* Visualization Type Selector */}
                <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 rounded-md shadow-md p-1 flex space-x-1">
                  <button
                    className={`p-2 rounded ${visualizationType === 'packed' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                    onClick={() => setVisualizationType('packed')}
                    title="Packed Circles"
                  >
                    <MdOutlineFullscreen />
                  </button>
                  <button
                    className={`p-2 rounded ${visualizationType === 'graph' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                    onClick={() => setVisualizationType('graph')}
                    title="Force Graph"
                  >
                    <BiZoomIn />
                  </button>
                  <button
                    className={`p-2 rounded ${visualizationType === 'sunburst' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                    onClick={() => setVisualizationType('sunburst')}
                    title="Sunburst"
                  >
                    <BiZoomOut />
                  </button>
                  <button
                    className={`p-2 rounded ${visualizationType === 'tree' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                    onClick={() => setVisualizationType('tree')}
                    title="Tree View"
                  >
                    <FaFolder />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <FileTypesChart data={rawData!} />
              <DirectoryStructure data={rawData!} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <CodeMetrics data={rawData!} />
              <FunctionsClassesList data={rawData!} />
            </div>
            
            {/* Tabs */}
            <div className="mb-4 border-b border-gray-200">
              <div className="flex -mb-px">
                <button
                  className={`mr-1 py-2 px-4 text-center ${
                    activeTab === 'overview'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`mr-1 py-2 px-4 text-center ${
                    activeTab === 'file-explorer'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveTab('file-explorer')}
                >
                  File Explorer
                </button>
                <button
                  className={`mr-1 py-2 px-4 text-center ${
                    activeTab === 'commits'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveTab('commits')}
                >
                  Commits
                </button>
                <button
                  className={`mr-1 py-2 px-4 text-center ${
                    activeTab === 'issues'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveTab('issues')}
                >
                  Issues
                </button>
                <button
                  className={`mr-1 py-2 px-4 text-center ${
                    activeTab === 'pull-requests'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveTab('pull-requests')}
                >
                  Pull Requests
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="mb-6">
              {activeTab === 'overview' && rawData && (
                <RepositoryOverview data={rawData} />
              )}
              
              {activeTab === 'file-explorer' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-4 dark:text-white">File Explorer</h2>
                  <p className="text-gray-500 dark:text-gray-400">File explorer view coming soon...</p>
                </div>
              )}
              
              {activeTab === 'commits' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-4 dark:text-white">Commits</h2>
                  <p className="text-gray-500 dark:text-gray-400">Commit history coming soon...</p>
                </div>
              )}
              
              {activeTab === 'issues' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-4 dark:text-white">Issues</h2>
                  <p className="text-gray-500 dark:text-gray-400">Issues list coming soon...</p>
                </div>
              )}
              
              {activeTab === 'pull-requests' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-bold mb-4 dark:text-white">Pull Requests</h2>
                  <p className="text-gray-500 dark:text-gray-400">Pull requests list coming soon...</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
} 
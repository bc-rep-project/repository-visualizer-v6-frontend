'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaFolder, FaCode, FaSearch, FaFilter, FaDownload, FaShare, FaSync } from 'react-icons/fa';
import { BiZoomIn, BiZoomOut } from 'react-icons/bi';
import { MdOutlineFullscreen } from 'react-icons/md';
import LoadingSpinner from '@/components/LoadingSpinner';
import { RepositoryGraph } from '@/components/RepositoryGraph';
import { RepositoryTree } from '@/components/RepositoryTree';
import { SimpleSunburst } from '@/components/SimpleSunburst';
import Navigation from '@/components/Navigation';
import axios from 'axios';
import { transformAnalysisData, analysisService } from '@/services/analysisService';
import { FileNode, AnalysisData } from '@/types/types';
import Link from 'next/link';

interface Repository {
  _id: string;
  repo_url: string;
  repo_name: string;
}

interface AnalysisStatus {
  repository_id: string;
  standard_analysis_available: boolean;
  enhanced_analysis_available: boolean;
  standard_analysis_date: string | null;
  enhanced_analysis_date: string | null;
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

export default function RepositoryAnalyze() {
  const params = useParams();
  const router = useRouter();
  const repoId = params.id as string;
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [rawData, setRawData] = useState<FileNode | null>(null);
  const [processedData, setProcessedData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visualizationType, setVisualizationType] = useState<'graph' | 'tree' | 'sunburst'>('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
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
    fetchAnalysisStatus();
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
  
  const fetchAnalysisStatus = async () => {
    try {
      const status = await analysisService.getAnalysisStatus(repoId);
      setAnalysisStatus(status);
    } catch (err) {
      console.error('Error fetching analysis status:', err);
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
  
  const handleRefreshAnalysis = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      await analysisService.refreshAnalysis(repoId);
      
      // Fetch updated data
      await fetchGraphData();
      await fetchAnalysisStatus();
      
      setRefreshing(false);
    } catch (err: any) {
      console.error('Error refreshing analysis:', err);
      setError(`Error refreshing analysis: ${err.message}`);
      setRefreshing(false);
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
    
    const url = `${window.location.origin}/repositories/${repoId}/analyze`;
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
      default:
        return <RepositoryGraph data={processedData.graph} width={900} height={700} />;
    }
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="mr-4 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &larr; Back
          </button>
          <h1 className="text-2xl font-bold dark:text-white">
            {repository?.repo_name || 'Repository Analysis'}
          </h1>
          <Link
            href={`/repositories/${repoId}/dashboard`}
            className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md text-sm"
          >
            Dashboard View
          </Link>
        </div>
      
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        {analysisStatus && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
            <div>
              <p className="font-medium">Analysis Status</p>
              <p className="text-sm">
                {analysisStatus.enhanced_analysis_available 
                  ? `Enhanced analysis available (Last updated: ${new Date(analysisStatus.enhanced_analysis_date || '').toLocaleString()})` 
                  : 'No enhanced analysis available'}
              </p>
            </div>
            <button
              onClick={handleRefreshAnalysis}
              disabled={refreshing}
              className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md flex items-center"
            >
              {refreshing ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Refreshing...</span>
                </>
              ) : (
                <>
                  <FaSync className="mr-2" />
                  Refresh Analysis
                </>
              )}
            </button>
          </div>
        )}
      
        {loading && !processedData ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" message="Analyzing repository..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-6">
                {/* Search */}
                <div>
                  <h3 className="text-sm font-medium mb-2 dark:text-white">Search</h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search files, functions..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full px-3 py-2 pl-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  </div>
                </div>
                
                {/* Filters */}
                <div>
                  <h3 className="text-sm font-medium mb-2 dark:text-white">Filters</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.showDirectories}
                        onChange={() => toggleFilter('showDirectories')}
                        className="mr-2"
                      />
                      <span className="text-sm dark:text-gray-300">Directories</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.showFiles}
                        onChange={() => toggleFilter('showFiles')}
                        className="mr-2"
                      />
                      <span className="text-sm dark:text-gray-300">Files</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.showFunctions}
                        onChange={() => toggleFilter('showFunctions')}
                        className="mr-2"
                      />
                      <span className="text-sm dark:text-gray-300">Functions</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.showClasses}
                        onChange={() => toggleFilter('showClasses')}
                        className="mr-2"
                      />
                      <span className="text-sm dark:text-gray-300">Classes</span>
                    </label>
                  </div>
                </div>
                
                {/* Visualization Type */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 dark:text-white">Visualization Type</h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setVisualizationType('graph')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        visualizationType === 'graph' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Force Graph
                    </button>
                    <button
                      onClick={() => setVisualizationType('tree')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        visualizationType === 'tree' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Tree
                    </button>
                    <button
                      onClick={() => setVisualizationType('sunburst')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        visualizationType === 'sunburst' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Sunburst
                    </button>
                  </div>
                </div>
                
                {/* Repository Stats */}
                <div>
                  <h3 className="text-sm font-medium mb-2 dark:text-white">Repository Stats</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Files: {processedData?.graph.nodes.filter(n => n.type === 'file').length || 0}</p>
                    <p>Directories: {processedData?.graph.nodes.filter(n => n.type === 'directory').length || 0}</p>
                    <p>Functions: {processedData?.graph.nodes.filter(n => n.type === 'function' || n.type === 'method').length || 0}</p>
                    <p>Classes: {processedData?.graph.nodes.filter(n => n.type === 'class').length || 0}</p>
                    <p>Dependencies: {processedData?.graph.edges.filter(e => e.type === 'import').length || 0}</p>
                  </div>
                </div>
              </div>
            </div>
      
            {/* Graph Visualization */}
            <div className="md:col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 h-[800px]">
                {renderVisualization()}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 
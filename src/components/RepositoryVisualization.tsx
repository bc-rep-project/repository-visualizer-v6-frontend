'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { RepositoryGraph } from './RepositoryGraph';
import { SimpleSunburst } from './SimpleSunburst';
import { RepositoryTree } from './RepositoryTree';
import LoadingSpinner from './LoadingSpinner';
import { analysisService, transformAnalysisData } from '@/services/analysisService';
import { FileNode, AnalysisData } from '@/types/types';

interface VisualizationProps {
  repositoryId: string;
    width?: number;
    height?: number;
}

export const RepositoryVisualization: React.FC<VisualizationProps> = ({
  repositoryId,
  width = 1200,
  height = 800,
}) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'sunburst' | 'tree' | 'packed'>('packed');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<FileNode | null>(null);
  const [processedData, setProcessedData] = useState<AnalysisData | null>(null);
  const [filters, setFilters] = useState({
    showFiles: true,
    showDirectories: true,
    showFunctions: true,
    showClasses: true,
    searchQuery: '',
  });

  // Fetch repository analysis data
    useEffect(() => {
    if (!repositoryId) return;
    
    console.log(`Fetching analysis data for repository: ${repositoryId}`);
    setLoading(true);
    setError(null);
    
    analysisService.getRepositoryAnalysis(repositoryId)
      .then(data => {
        console.log('Received analysis data:', data);
        console.log('Data structure check:', {
          hasChildren: Boolean(data.children),
          childrenCount: data.children?.length || 0,
          type: data.type,
          name: data.name,
          path: data.path,
          functions: data.functions?.length || 0,
          classes: data.classes?.length || 0,
          imports: data.imports?.length || 0
        });
        
        setRawData(data);
        const processed = transformAnalysisData(data, filters);
        setProcessedData(processed);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching repository analysis:', err);
        setError(err.message || 'Failed to load repository analysis');
        setLoading(false);
      });
  }, [repositoryId]);

  // Transform data based on filters
  useEffect(() => {
    if (!rawData) return;
    
    console.log('Transforming analysis data with filters:', filters);
    const processed = transformAnalysisData(rawData, filters);
    console.log('Transformed data:', processed);
    setProcessedData(processed);
  }, [rawData, filters]);

  // Handle filter changes
  const handleFilterChange = (name: string, value: boolean | string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate mock data for testing
  const generateMockData = () => {
    console.log('Generating mock data for testing');
    
    // Create a simple file structure
    const mockData: FileNode = {
      name: 'root',
      path: '',
      type: 'directory',
      children: [
        {
          name: 'src',
          path: 'src',
          type: 'directory',
          children: [
            {
              name: 'components',
              path: 'src/components',
              type: 'directory',
              children: [
                {
                  name: 'App.js',
                  path: 'src/components/App.js',
                  type: 'file',
                  size: 2000,
                  language: 'JavaScript',
                  functions: [
                    {
                      name: 'App',
                      type: 'function',
                      dependencies: []
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
    
    setRawData(mockData);
    const processed = transformAnalysisData(mockData, filters);
    setProcessedData(processed);
    setError(null);
    };

    return (
    <div className="flex flex-col w-full h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'packed'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('packed')}
        >
          Packed Circles
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'graph'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('graph')}
        >
          Force Graph
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'sunburst'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('sunburst')}
        >
          Sunburst
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'tree'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('tree')}
        >
          Tree View
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showFiles"
            checked={filters.showFiles}
            onChange={e => handleFilterChange('showFiles', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="showFiles" className="text-sm">Files</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showDirectories"
            checked={filters.showDirectories}
            onChange={e => handleFilterChange('showDirectories', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="showDirectories" className="text-sm">Directories</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showFunctions"
            checked={filters.showFunctions}
            onChange={e => handleFilterChange('showFunctions', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="showFunctions" className="text-sm">Functions</label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showClasses"
            checked={filters.showClasses}
            onChange={e => handleFilterChange('showClasses', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="showClasses" className="text-sm">Classes</label>
        </div>
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Search..."
            value={filters.searchQuery}
            onChange={e => handleFilterChange('searchQuery', e.target.value)}
            className="w-full max-w-xs px-3 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Visualization Content */}
      <div className="flex-grow relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <LoadingSpinner />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-red-500 text-center">
              <p className="text-xl font-semibold mb-2">Error</p>
              <p>{error}</p>
              <div className="flex space-x-4 mt-4">
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
                <button 
                  className="px-4 py-2 bg-green-500 text-white rounded-md"
                  onClick={generateMockData}
                >
                  Use Demo Data
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!loading && !error && processedData && rawData && (
          <div className="w-full h-full">
            {activeTab === 'graph' && (
              <RepositoryGraph 
                data={processedData.graph} 
                width={width} 
                height={height} 
              />
            )}
            
            {activeTab === 'sunburst' && (
              <SimpleSunburst 
                data={rawData} 
                width={width} 
                height={height} 
              />
            )}
            
            {activeTab === 'tree' && (
              <RepositoryTree 
                data={rawData} 
                width={width}
                height={height}
              />
            )}
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-medium mb-2">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded-sm mr-2"></span>
            <span className="text-xs">Directory</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-sm mr-2"></span>
            <span className="text-xs">File</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-purple-100 border border-purple-300 rounded-sm mr-2"></span>
            <span className="text-xs">Function</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-pink-100 border border-pink-300 rounded-sm mr-2"></span>
            <span className="text-xs">Class</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 border-b-2 border-blue-500 mr-2"></span>
            <span className="text-xs">Import</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 border-b-2 border-red-500 mr-2"></span>
            <span className="text-xs">Function Call</span>
          </div>
        </div>
      </div>
        </div>
    );
}; 

export default RepositoryVisualization; 
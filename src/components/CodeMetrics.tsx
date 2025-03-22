'use client';

import React, { useMemo, useState } from 'react';
import { FileNode } from '@/types/types';
import { FaCode, FaFileCode, FaFolder, FaCodeBranch, FaArrowUp, FaArrowDown, FaEye } from 'react-icons/fa';
import { repositoryApi } from '@/services/api';
import CodeViewer from './CodeViewer';

interface CodeMetricsProps {
  data: FileNode;
  repoId?: string;
}

interface Metrics {
  totalFiles: number;
  totalDirectories: number;
  totalFunctions: number;
  totalClasses: number;
  totalImports: number;
  totalLines: number;
  largestFile: {
    name: string;
    path: string;
    size: number;
  } | null;
  mostComplexFile: {
    name: string;
    path: string;
    functionCount: number;
  } | null;
}

const CodeMetrics: React.FC<CodeMetricsProps> = ({ data, repoId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{name: string, path: string} | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLanguage, setFileLanguage] = useState<string>('');
  const [showCodeViewer, setShowCodeViewer] = useState(false);

  const metrics = useMemo(() => {
    const result: Metrics = {
      totalFiles: 0,
      totalDirectories: 0,
      totalFunctions: 0,
      totalClasses: 0,
      totalImports: 0,
      totalLines: 0,
      largestFile: null,
      mostComplexFile: null
    };

    const processNode = (node: FileNode) => {
      if (node.type === 'file') {
        result.totalFiles++;
        
        // Update largest file if this one is larger
        if (!result.largestFile || (node.size && result.largestFile.size < node.size)) {
          result.largestFile = {
            name: node.path.split('/').pop() || node.path,
            path: node.path,
            size: node.size || 0
          };
        }
        
        // Count functions, classes, imports if available
        const functionCount = node.functions?.length || 0;
        const classCount = node.classes?.length || 0;
        const importCount = node.imports?.length || 0;
        
        result.totalFunctions += functionCount;
        result.totalClasses += classCount;
        result.totalImports += importCount;
        
        // Update most complex file based on function count
        if (functionCount > 0 && (!result.mostComplexFile || functionCount > result.mostComplexFile.functionCount)) {
          result.mostComplexFile = {
            name: node.path.split('/').pop() || node.path,
            path: node.path,
            functionCount
          };
        }
        
        // Estimate lines based on size if actual lines count is not available
        // Assuming an average of 40 bytes per line of code
        if (node.size) {
          // This is a rough estimate
          const estimatedLines = Math.round(node.size / 40);
          result.totalLines += estimatedLines;
        }
      } else if (node.type === 'directory') {
        result.totalDirectories++;
      }
      
      // Process children recursively
      if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    processNode(data);
    return result;
  }, [data]);
  
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileClick = async (filePath: string, fileName: string) => {
    if (!repoId) {
      setError('Repository ID is required to view file content');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedFile({ name: fileName, path: filePath });
    setShowCodeViewer(true);
    
    try {
      // Extract file extension for syntax highlighting
      const fileExt = filePath.split('.').pop()?.toLowerCase() || 'txt';
      setFileLanguage(fileExt);
      
      // Fetch actual file content from the API
      const response = await repositoryApi.getFileContent(repoId, filePath);
      
      if (response.file && response.file.content) {
        setFileContent(response.file.content);
      } else {
        setFileContent('// No content available for this file');
      }
    } catch (err) {
      console.error('Error fetching file content:', err);
      setError('Failed to load file content. This might be a binary file or the file is too large.');
      setFileContent('// Error loading file content');
    } finally {
      setIsLoading(false);
    }
  };
  
  const closeCodeViewer = () => {
    setShowCodeViewer(false);
    setSelectedFile(null);
    setFileContent(null);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Code Metrics</h2>
      
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center mb-1 sm:mb-2">
            <FaFileCode className="text-blue-500 mr-2 flex-shrink-0" />
            <h3 className="text-sm sm:text-md font-semibold dark:text-white">Files</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.totalFiles}</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center mb-1 sm:mb-2">
            <FaFolder className="text-green-500 mr-2 flex-shrink-0" />
            <h3 className="text-sm sm:text-md font-semibold dark:text-white">Directories</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{metrics.totalDirectories}</p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center mb-1 sm:mb-2">
            <FaCode className="text-purple-500 mr-2 flex-shrink-0" />
            <h3 className="text-sm sm:text-md font-semibold dark:text-white">Functions</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">{metrics.totalFunctions}</p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 sm:p-4 rounded-lg">
          <div className="flex items-center mb-1 sm:mb-2">
            <FaCodeBranch className="text-yellow-500 mr-2 flex-shrink-0" />
            <h3 className="text-sm sm:text-md font-semibold dark:text-white">Classes</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{metrics.totalClasses}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-semibold mb-2 dark:text-white">Lines of Code (est.)</h3>
          <p className="text-xl sm:text-2xl font-bold text-gray-700 dark:text-gray-300">{metrics.totalLines.toLocaleString()}</p>
        </div>
        
        {metrics.largestFile && (
          <div>
            <h3 className="text-md font-semibold mb-2 dark:text-white">Largest File</h3>
            <div 
              className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md group transition-colors"
              onClick={() => handleFileClick(metrics.largestFile!.path, metrics.largestFile!.name)}
            >
              <FaArrowUp className="text-red-500 mr-2 flex-shrink-0" />
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium dark:text-white truncate">{metrics.largestFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatSize(metrics.largestFile.size)}</p>
              </div>
              <FaEye className="text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" title="View file content" />
            </div>
          </div>
        )}
        
        {metrics.mostComplexFile && (
          <div>
            <h3 className="text-md font-semibold mb-2 dark:text-white">Most Complex File</h3>
            <div 
              className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md group transition-colors"
              onClick={() => handleFileClick(metrics.mostComplexFile!.path, metrics.mostComplexFile!.name)}
            >
              <FaArrowUp className="text-orange-500 mr-2 flex-shrink-0" />
              <div className="flex-grow min-w-0">
                <p className="text-sm font-medium dark:text-white truncate">{metrics.mostComplexFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metrics.mostComplexFile.functionCount} functions
                </p>
              </div>
              <FaEye className="text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" title="View file content" />
            </div>
          </div>
        )}
      </div>

      {/* Modal for displaying code */}
      {showCodeViewer && fileContent && selectedFile && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={closeCodeViewer}></div>
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden z-10">
              <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold dark:text-white truncate">{selectedFile.name}</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1" 
                  onClick={closeCodeViewer}
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
              <div className="p-1 h-[calc(90vh-4rem)] overflow-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 text-red-500">
                    {error}
                  </div>
                ) : (
                  <CodeViewer 
                    code={fileContent} 
                    language={fileLanguage} 
                    fileName={selectedFile.name}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeMetrics; 
'use client';

import React, { useMemo } from 'react';
import { FileNode } from '@/types/types';
import { FaCode, FaFileCode, FaFolder, FaCodeBranch, FaArrowUp, FaArrowDown } from 'react-icons/fa';

interface CodeMetricsProps {
  data: FileNode;
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

const CodeMetrics: React.FC<CodeMetricsProps> = ({ data }) => {
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
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Code Metrics</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaFileCode className="text-blue-500 mr-2" />
            <h3 className="text-md font-semibold dark:text-white">Files</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.totalFiles}</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaFolder className="text-green-500 mr-2" />
            <h3 className="text-md font-semibold dark:text-white">Directories</h3>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.totalDirectories}</p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaCode className="text-purple-500 mr-2" />
            <h3 className="text-md font-semibold dark:text-white">Functions</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metrics.totalFunctions}</p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaCodeBranch className="text-yellow-500 mr-2" />
            <h3 className="text-md font-semibold dark:text-white">Classes</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{metrics.totalClasses}</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-md font-semibold mb-2 dark:text-white">Lines of Code (est.)</h3>
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{metrics.totalLines.toLocaleString()}</p>
        </div>
        
        {metrics.largestFile && (
          <div>
            <h3 className="text-md font-semibold mb-2 dark:text-white">Largest File</h3>
            <div className="flex items-center">
              <FaArrowUp className="text-red-500 mr-2" />
              <div>
                <p className="text-sm font-medium dark:text-white">{metrics.largestFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatSize(metrics.largestFile.size)}</p>
              </div>
            </div>
          </div>
        )}
        
        {metrics.mostComplexFile && (
          <div>
            <h3 className="text-md font-semibold mb-2 dark:text-white">Most Complex File</h3>
            <div className="flex items-center">
              <FaArrowUp className="text-orange-500 mr-2" />
              <div>
                <p className="text-sm font-medium dark:text-white">{metrics.mostComplexFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metrics.mostComplexFile.functionCount} functions
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeMetrics; 
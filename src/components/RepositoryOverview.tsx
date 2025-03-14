import React, { useMemo } from 'react';
import { FileNode } from '@/types/types';

interface RepositoryOverviewProps {
  data: FileNode;
}

const RepositoryOverview: React.FC<RepositoryOverviewProps> = ({ data }) => {
  // Calculate repository statistics
  const stats = useMemo(() => {
    let fileCount = 0;
    let directoryCount = 0;
    let totalSize = 0;
    
    // Helper function to recursively traverse the tree
    const calculateStats = (node: FileNode) => {
      if (node.type === 'file') {
        fileCount++;
        totalSize += node.size || 0;
      } else if (node.type === 'directory') {
        directoryCount++;
      }
      
      // Recursively process children
      if (node.children) {
        node.children.forEach(calculateStats);
      }
    };
    
    // Start calculating from the root
    calculateStats(data);
    
    return {
      fileCount,
      directoryCount,
      totalSize
    };
  }, [data]);

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Repository Overview</h2>
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
        This repository contains <span className="font-semibold">{stats.fileCount} files</span> across{' '}
        <span className="font-semibold">{stats.directoryCount} directories</span>, with a total size of{' '}
        <span className="font-semibold">{formatSize(stats.totalSize)}</span>.
      </p>
      
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{stats.fileCount}</div>
          <div className="text-sm text-blue-600 dark:text-blue-300">Files</div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-300">{stats.directoryCount}</div>
          <div className="text-sm text-green-600 dark:text-green-300">Directories</div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-300">{formatSize(stats.totalSize)}</div>
          <div className="text-sm text-purple-600 dark:text-purple-300">Total Size</div>
        </div>
      </div>
    </div>
  );
};

export default RepositoryOverview; 
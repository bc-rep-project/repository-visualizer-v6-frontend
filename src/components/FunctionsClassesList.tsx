'use client';

import React, { useState, useMemo } from 'react';
import { FileNode } from '@/types/types';
import { FaCode, FaCodeBranch, FaSearch, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';

interface FunctionsClassesListProps {
  data: FileNode;
  searchQuery?: string;
}

interface FunctionInfo {
  name: string;
  filePath: string;
  fileName: string;
  type: 'function' | 'class';
}

const FunctionsClassesList: React.FC<FunctionsClassesListProps> = ({ data, searchQuery }) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<'all' | 'function' | 'class'>('all');
  
  // Use external searchQuery if provided, otherwise use internal state
  const searchTerm = searchQuery !== undefined ? searchQuery : internalSearchTerm;
  
  // Extract all functions and classes from the repository
  const allItems = useMemo(() => {
    const items: FunctionInfo[] = [];
    
    const processNode = (node: FileNode) => {
      if (node.type === 'file') {
        const fileName = node.path.split('/').pop() || '';
        
        // Add functions
        if (node.functions) {
          node.functions.forEach(func => {
            items.push({
              name: func.name,
              filePath: node.path,
              fileName,
              type: 'function'
            });
          });
        }
        
        // Add classes
        if (node.classes) {
          node.classes.forEach(cls => {
            items.push({
              name: cls.name,
              filePath: node.path,
              fileName,
              type: 'class'
            });
          });
        }
      }
      
      // Process children recursively
      if (node.children) {
        node.children.forEach(processNode);
      }
    };
    
    processNode(data);
    return items;
  }, [data]);
  
  // Filter and sort the items
  const filteredItems = useMemo(() => {
    let result = [...allItems];
    
    // Apply type filter
    if (filter !== 'all') {
      result = result.filter(item => item.type === filter);
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        item => 
          item.name.toLowerCase().includes(lowerSearchTerm) || 
          item.fileName.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [allItems, searchTerm, sortOrder, filter]);
  
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Functions & Classes</h2>
      
      <div className="mb-4 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search functions and classes..."
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={searchQuery !== undefined ? searchQuery : internalSearchTerm}
            onChange={(e) => {
              if (searchQuery === undefined) {
                setInternalSearchTerm(e.target.value);
              }
            }}
          />
        </div>
        
        <div className="flex">
          <button
            className={`px-3 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 ${
              filter === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-3 py-2 border-t border-b border-gray-300 dark:border-gray-600 ${
              filter === 'function' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setFilter('function')}
          >
            Functions
          </button>
          <button
            className={`px-3 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 ${
              filter === 'class' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setFilter('class')}
          >
            Classes
          </button>
        </div>
        
        <button
          className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center"
          onClick={toggleSortOrder}
        >
          {sortOrder === 'asc' ? (
            <FaSortAlphaDown className="mr-1" />
          ) : (
            <FaSortAlphaUp className="mr-1" />
          )}
          Sort
        </button>
      </div>
      
      <div className="overflow-auto max-h-64 border border-gray-200 dark:border-gray-700 rounded-md">
        {filteredItems.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredItems.map((item, index) => (
              <li key={`${item.name}-${item.filePath}-${index}`} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center">
                  {item.type === 'function' ? (
                    <FaCode className="text-purple-500 mr-2" />
                  ) : (
                    <FaCodeBranch className="text-yellow-500 mr-2" />
                  )}
                  <div>
                    <p className="font-medium dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.fileName}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchTerm 
              ? 'No matching functions or classes found' 
              : 'No functions or classes available'}
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Showing {filteredItems.length} of {allItems.length} items
      </div>
    </div>
  );
};

export default FunctionsClassesList; 
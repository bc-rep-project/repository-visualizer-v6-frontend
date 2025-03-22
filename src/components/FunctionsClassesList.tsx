'use client';

import React, { useState, useMemo } from 'react';
import { FileNode } from '@/types/types';
import { FaMagnifyingGlass } from 'react-icons/fa6';
import CodeViewer from './CodeViewer';
import { repositoryApi } from '@/services/api';

// Custom Badge component
const Badge = ({ children, variant = 'default' }) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'default':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'secondary':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'outline':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${getVariantClass()}`}>
      {children}
    </span>
  );
};

// Custom Button component
const Button = ({ children, variant = 'default', size = 'md', className = '', onClick }) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'default':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'outline':
        return 'bg-transparent border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-blue-500 hover:bg-blue-600 text-white';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'md':
        return 'text-sm px-3 py-2';
      case 'lg':
        return 'text-base px-4 py-2';
      default:
        return 'text-sm px-3 py-2';
    }
  };

  return (
    <button
      className={`rounded-md transition-colors ${getVariantClass()} ${getSizeClass()} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

interface FunctionsClassesListProps {
  data: FileNode[];
  searchQuery?: string;
  repoId: string;
}

interface FunctionInfo {
  name: string;
  type: 'function' | 'class' | 'method';
  path: string;
  language?: string;
  startLine?: number;
  endLine?: number;
}

export default function FunctionsClassesList({ 
  data, 
  searchQuery = '',
  repoId
}: FunctionsClassesListProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchQuery);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<'all' | 'functions' | 'classes'>('all');
  const [selectedItem, setSelectedItem] = useState<FunctionInfo | null>(null);
  const [codeContent, setCodeContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Extract functions and classes from repository data
  const items = useMemo(() => {
    const extractItems = (nodes: FileNode[]): FunctionInfo[] => {
      const result: FunctionInfo[] = [];
      
      const processNode = (node: FileNode) => {
        if (node.type === 'file') {
          // Add functions
          if (node.functions) {
            node.functions.forEach(func => {
              result.push({
                name: func.name,
                type: 'function',
                path: node.path,
                language: node.language,
                startLine: func.start_line,
                endLine: func.end_line
              });
            });
          }
          
          // Add classes
          if (node.classes) {
            node.classes.forEach(cls => {
              result.push({
                name: cls.name,
                type: 'class',
                path: node.path,
                language: node.language,
                startLine: cls.start_line,
                endLine: cls.end_line
              });
              
              // Add methods
              if (cls.methods) {
                cls.methods.forEach(method => {
                  result.push({
                    name: `${cls.name}.${method.name}`,
                    type: 'method',
                    path: node.path,
                    language: node.language,
                    startLine: method.start_line,
                    endLine: method.end_line
                  });
                });
              }
            });
          }
        }
        
        // Process children recursively
        if (node.children) {
          node.children.forEach(processNode);
        }
      };
      
      nodes.forEach(processNode);
      return result;
    };
    
    return extractItems(data);
  }, [data]);

  // Filter and sort the items
  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
                              item.path.toLowerCase().includes(localSearchTerm.toLowerCase());
        const matchesType = filterType === 'all' || 
                           (filterType === 'functions' && (item.type === 'function' || item.type === 'method')) ||
                           (filterType === 'classes' && item.type === 'class');
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (sortOrder === 'asc') {
          return nameA.localeCompare(nameB);
        } else {
          return nameB.localeCompare(nameA);
        }
      });
  }, [items, localSearchTerm, filterType, sortOrder]);

  const handleItemClick = async (item: FunctionInfo) => {
    try {
      setSelectedItem(item);
      setIsLoading(true);
      setError(null);
      
      // Try to get the specific function or class code using the new API
      try {
        const response = await repositoryApi.getFunctionOrClassCode(repoId, {
          path: item.path,
          name: item.name.split('.').pop() || item.name, // Handle class methods
          type: item.type
        });
        
        setCodeContent(response.content);
        setIsLoading(false);
        return;
      } catch (specificError) {
        console.warn("Couldn't get specific code, falling back to file content:", specificError);
      }
      
      // Fallback: Fetch the whole file content
      const fileResponse = await repositoryApi.getFunctionOrClassContent(repoId, item.path);
      const fileContent = fileResponse.file.content;
      
      if (!fileContent) {
        throw new Error("Failed to fetch file content");
      }
      
      // Extract the specific function or class code
      if (item.startLine && item.endLine) {
        // If we have line numbers, extract based on those
        const lines = fileContent.split('\n');
        const codeLines = lines.slice(item.startLine - 1, item.endLine);
        setCodeContent(codeLines.join('\n'));
      } else {
        // Otherwise try to extract based on the name
        const extracted = extractCodeByName(fileContent, item.name, item.type);
        setCodeContent(extracted || 'Code extraction failed. Please view the entire file.');
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching function/class code:", err);
      setError("Failed to load code. Please try again.");
      setIsLoading(false);
    }
  };

  // Extract code by function/class name using regex
  const extractCodeByName = (content: string, name: string, type: string): string | null => {
    try {
      let regex;
      const simpleName = name.split('.').pop() || name; // Handle class methods
      
      if (type === 'function' || type === 'method') {
        // Match function definition - covers JS, TS, Python
        regex = new RegExp(`(function\\s+${simpleName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}|${simpleName}\\s*=\\s*function\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}|${simpleName}\\s*:\\s*function\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}|${simpleName}\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?\\}|def\\s+${simpleName}\\s*\\([^)]*\\):[\\s\\S]*?(?=\\s*def\\s+|\\s*class\\s+|$))`, 'g');
      } else {
        // Match class definition - covers JS, TS, Python
        regex = new RegExp(`(class\\s+${simpleName}[\\s\\S]*?\\{[\\s\\S]*?\\}|class\\s+${simpleName}[\\s\\S]*?(?=\\s*class\\s+|$))`, 'g');
      }
      
      const match = content.match(regex);
      return match ? match[0] : null;
    } catch (err) {
      console.error("Error extracting code:", err);
      return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      <div className="md:w-1/2 lg:w-1/3">
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              placeholder="Search functions and classes..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
            />
            <FaMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant={filterType === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterType('all')}
          >
            All
          </Button>
          <Button 
            variant={filterType === 'functions' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterType('functions')}
          >
            Functions
          </Button>
          <Button 
            variant={filterType === 'classes' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterType('classes')}
          >
            Classes
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="ml-auto"
          >
            Sort {sortOrder === 'asc' ? '↓' : '↑'}
          </Button>
        </div>
        
        <div className="border rounded-lg overflow-hidden dark:border-gray-700">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredItems.length > 0 ? (
              <ul className="divide-y dark:divide-gray-700">
                {filteredItems.map((item, index) => (
                  <li 
                    key={`${item.path}-${item.name}-${index}`}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                      selectedItem?.name === item.name && selectedItem?.path === item.path 
                        ? 'bg-blue-50 dark:bg-gray-700' 
                        : ''
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-sm truncate">{item.name}</div>
                      <Badge variant={item.type === 'function' ? 'default' : item.type === 'method' ? 'secondary' : 'outline'}>
                        {item.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                      {item.path}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No functions or classes found.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="md:w-1/2 lg:w-2/3">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 border rounded-lg dark:border-gray-700">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading code...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 border rounded-lg dark:border-gray-700">
            <div className="text-center text-red-500">
              <p>{error}</p>
              <Button variant="outline" className="mt-2" onClick={() => setError(null)}>
                Try Again
              </Button>
            </div>
          </div>
        ) : selectedItem ? (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-lg font-semibold dark:text-white">{selectedItem.name}</h3>
              <Badge variant={selectedItem.type === 'function' ? 'default' : selectedItem.type === 'method' ? 'secondary' : 'outline'}>
                {selectedItem.type}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Path: {selectedItem.path}
              {selectedItem.startLine && selectedItem.endLine && (
                <span className="ml-2">
                  (Lines: {selectedItem.startLine} - {selectedItem.endLine})
                </span>
              )}
            </p>
            <CodeViewer 
              code={codeContent} 
              language={selectedItem.language || ''} 
              fileName={`${selectedItem.name} from ${selectedItem.path.split('/').pop()}`} 
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 border rounded-lg dark:border-gray-700">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p>Select a function or class to view its code</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
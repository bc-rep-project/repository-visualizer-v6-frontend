'use client';

import React, { useState } from 'react';
import { FaFolder, FaFolderOpen, FaFile, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import { FileNode } from '@/types/types';
import CodeViewer from '@/components/CodeViewer';
import { repositoryApi } from '@/services/api';
import { useParams } from 'next/navigation';

interface DirectoryStructureProps {
  data: FileNode;
  searchQuery?: string;
  repoId?: string;
}

interface TreeNodeProps {
  node: FileNode;
  level: number;
  expanded: Record<string, boolean>;
  toggleExpand: (path: string) => void;
  onFileClick: (node: FileNode) => void;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, expanded, toggleExpand, onFileClick }) => {
  const isDirectory = node.type === 'directory';
  const isExpanded = expanded[node.path];
  const hasChildren = node.children && node.children.length > 0;
  
  // Get the name from the path
  const name = node.path.split('/').pop() || node.path;
  
  // Calculate padding based on level
  const paddingLeft = `${level * 16}px`;
  
  const handleClick = () => {
    if (isDirectory && hasChildren) {
      toggleExpand(node.path);
    } else if (!isDirectory) {
      onFileClick(node);
    }
  };
  
  return (
    <div>
      <div 
        className="flex items-center py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
        onClick={handleClick}
      >
        <div style={{ paddingLeft }} className="flex items-center flex-grow">
          {isDirectory && hasChildren ? (
            isExpanded ? <FaChevronDown className="mr-1 text-gray-500" /> : <FaChevronRight className="mr-1 text-gray-500" />
          ) : (
            <span className="w-4 mr-1"></span>
          )}
          
          {isDirectory ? (
            isExpanded ? 
              <FaFolderOpen className="mr-2 text-yellow-400" /> : 
              <FaFolder className="mr-2 text-yellow-400" />
          ) : (
            <FaFile className="mr-2 text-gray-400" />
          )}
          
          <span className="text-sm dark:text-white">{name}</span>
        </div>
        
        {node.size !== undefined && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{formatSize(node.size)}</span>
        )}
      </div>
      
      {isDirectory && isExpanded && hasChildren && (
        <div>
          {node.children!.map((child, index) => (
            <TreeNode 
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              expanded={expanded}
              toggleExpand={toggleExpand}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DirectoryStructure: React.FC<DirectoryStructureProps> = ({ data, searchQuery, repoId }) => {
  const params = useParams();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    [data.path]: true // Root is expanded by default
  });
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLanguage, setFileLanguage] = useState<string>('text');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use external searchQuery if provided, otherwise use internal state
  const searchTerm = searchQuery !== undefined ? searchQuery : internalSearchTerm;
  // Use repoId from props or from route params
  const repositoryId = repoId || (params?.id as string);
  
  const toggleExpand = (path: string) => {
    setExpanded(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (searchQuery === undefined) {
      setInternalSearchTerm(e.target.value);
    }
  };
  
  // Filter the tree based on search term
  const filterTree = (node: FileNode, term: string): FileNode | null => {
    if (!term) return node;
    
    const name = node.path.split('/').pop() || '';
    const matchesSearch = name.toLowerCase().includes(term.toLowerCase());
    
    if (node.type === 'file') {
      return matchesSearch ? node : null;
    }
    
    if (node.children) {
      const filteredChildren = node.children
        .map(child => filterTree(child, term))
        .filter(Boolean) as FileNode[];
      
      if (filteredChildren.length > 0 || matchesSearch) {
        return {
          ...node,
          children: filteredChildren
        };
      }
    }
    
    return matchesSearch ? node : null;
  };
  
  const handleFileClick = async (node: FileNode) => {
    setSelectedFile(node);
    setIsLoading(true);
    setError(null);
    
    try {
      // Extract file extension for syntax highlighting
      const fileExt = node.path.split('.').pop()?.toLowerCase() || 'txt';
      setFileLanguage(fileExt);
      
      // Fetch actual file content from the API
      const response = await repositoryApi.getFileContent(repositoryId, node.path);
      
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
  
  const filteredData = filterTree(data, searchTerm);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Directory Structure</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search files and directories..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="overflow-auto max-h-[500px] border border-gray-200 dark:border-gray-700 rounded-md">
          {filteredData ? (
            <TreeNode 
              node={filteredData} 
              level={0} 
              expanded={expanded} 
              toggleExpand={toggleExpand}
              onFileClick={handleFileClick}
            />
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No matching files or directories
            </div>
          )}
        </div>
        
        <div className="border border-gray-200 dark:border-gray-700 rounded-md">
          {isLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-red-500">
              {error}
            </div>
          ) : selectedFile && fileContent ? (
            <CodeViewer 
              code={fileContent} 
              language={fileLanguage} 
              fileName={selectedFile.path.split('/').pop() || 'file'}
            />
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Select a file to view its content
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectoryStructure; 
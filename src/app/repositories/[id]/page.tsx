'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaFolder, FaFile, FaCode, FaBell } from 'react-icons/fa';
import { BiAnalyse } from 'react-icons/bi';
import { MdDelete } from 'react-icons/md';
import LoadingSpinner from '@/components/LoadingSpinner';
import CodeViewer from '@/components/CodeViewer';

interface Repository {
  _id: string;
  repo_url: string;
  status: 'pending' | 'completed' | 'failed';
  file_count: number;
  directory_count: number;
  total_size: number;
  updated_at: string;
  languages: Record<string, number>;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNode[];
}

interface Commit {
  hash: string;
  author: string;
  date: string;
  message: string;
}

interface Issue {
  id: string;
  title: string;
  state: string;
  created_at: string;
  user: string;
}

interface PullRequest {
  id: string;
  title: string;
  state: string;
  created_at: string;
  user: string;
}

export default function RepositoryDetail() {
  const params = useParams();
  const router = useRouter();
  const repoId = params.id as string;
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [fileStructure, setFileStructure] = useState<FileNode | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);
  const [functions, setFunctions] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    fetchRepositoryDetails();
  }, [repoId]);

  const fetchRepositoryDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/repositories/${repoId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch repository details');
      }
      const data = await response.json();
      setRepository(data);
      
      // Mock file structure for demo
      setFileStructure({
        name: getRepoName(data.repo_url),
        path: '/',
        type: 'directory',
        children: [
          {
            name: 'src',
            path: '/src',
            type: 'directory',
            children: [
              {
                name: 'components',
                path: '/src/components',
                type: 'directory',
                children: [
                  { name: 'Button.js', path: '/src/components/Button.js', type: 'file', size: 1024 }
                ]
              }
            ]
          },
          {
            name: 'tests',
            path: '/tests',
            type: 'directory',
            children: [
              { name: 'app.test.js', path: '/tests/app.test.js', type: 'file', size: 2048 }
            ]
          }
        ]
      });
      
      // Mock data for other tabs
      setCommits([
        { hash: 'a1b2c3d', author: 'John Doe', date: '2023-05-15', message: 'Initial commit' },
        { hash: 'e4f5g6h', author: 'Jane Smith', date: '2023-05-16', message: 'Add README' }
      ]);
      
      setIssues([
        { id: '1', title: 'Fix navigation bug', state: 'open', created_at: '2023-05-10', user: 'user1' },
        { id: '2', title: 'Update documentation', state: 'closed', created_at: '2023-05-12', user: 'user2' }
      ]);
      
      setPullRequests([
        { id: '1', title: 'Feature: Add dark mode', state: 'open', created_at: '2023-05-14', user: 'user3' },
        { id: '2', title: 'Fix: Correct typos', state: 'merged', created_at: '2023-05-13', user: 'user4' }
      ]);
      
      // Mock functions and classes
      setFunctions(['handleSubmit()', 'formatDate()', 'calculateTotal()']);
      setClasses(['UserController', 'DataService', 'ApiClient']);
      
      setError(null);
    } catch (err) {
      setError('Error loading repository details. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = async (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file.path);
      // Mock file content for demo
      if (file.path === '/src/components/Button.js') {
        setFileContent(`export const Button = ({ children, ...props }) => {
  return (
    <button className="btn" {...props}>
      {children}
    </button>
  );
};`);
        setBreadcrumbs(['src', 'components', 'Button.js']);
      } else {
        setFileContent('// File content would be loaded here');
        setBreadcrumbs(file.path.split('/').filter(Boolean));
      }
    }
  };

  const deleteRepository = async () => {
    if (!confirm('Are you sure you want to delete this repository?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/repositories/${repoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete repository');
      }
      
      router.push('/');
    } catch (err) {
      setError('Error deleting repository. Please try again.');
      console.error(err);
    }
  };

  const getRepoName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1].replace('.git', '') || url;
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(1) + ' MB';
  };

  const renderFileTree = (node: FileNode, level = 0) => {
    return (
      <div key={node.path} className="ml-4">
        <div 
          className={`flex items-center py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedFile === node.path ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
          onClick={() => handleFileClick(node)}
        >
          {node.type === 'directory' ? (
            <FaFolder className="text-yellow-500 mr-2" />
          ) : (
            <FaFile className="text-gray-500 mr-2" />
          )}
          <span className="dark:text-white">{node.name}</span>
          {node.size && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{(node.size / 1024).toFixed(1)} KB</span>}
        </div>
        {node.children && node.children.map(child => renderFileTree(child, level + 1))}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Loading repository details..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded">
          <p>Repository not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {repository ? (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2 md:mb-0">
                  {getRepoName(repository.repo_url)}
                </h1>
                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push(`/repositories/${repository._id}/analyze`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  >
                    <BiAnalyse className="mr-2" /> Analyze
                  </button>
                  <button
                    onClick={() => router.push(`/repositories/${repository._id}/enhanced`)}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center"
                  >
                    <FaCode className="mr-2" /> Enhanced
                  </button>
                  <button
                    onClick={() => router.push(`/repositories/${repository._id}/notifications`)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
                  >
                    <FaBell className="mr-2" /> Notifications
                  </button>
                  <button
                    onClick={deleteRepository}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                  >
                    <MdDelete className="mr-2" /> Delete
                  </button>
                </div>
              </div>

              {/* Repository Structure */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 p-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Repository Structure</h2>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-6 h-80 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Interactive Repository Graph Visualization</p>
                </div>
              </div>

              {/* Stats Panels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* File Types */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 dark:text-white">File Types</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium dark:text-white">.js</span>
                        <span className="text-sm font-medium dark:text-white">45%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    {/* Add more file types here */}
                  </div>
                </div>

                {/* Directory Structure */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 dark:text-white">Directory Structure</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center dark:text-white">
                      <FaFolder className="text-yellow-500 mr-2" /> src (156 files)
                    </li>
                    <li className="flex items-center dark:text-white">
                      <FaFolder className="text-yellow-500 mr-2" /> tests (45 files)
                    </li>
                    {/* Add more directories here */}
                  </ul>
                </div>

                {/* Code Metrics */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 dark:text-white">Code Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="dark:text-white">Lines of Code</span>
                      <span className="font-semibold dark:text-white">24,567</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="dark:text-white">Functions</span>
                      <span className="font-semibold dark:text-white">342</span>
                    </div>
                    {/* Add more metrics here */}
                  </div>
                </div>
              </div>

              {/* Functions & Classes + Tabs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Functions & Classes */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold mb-4 dark:text-white">Functions & Classes</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center dark:text-white">
                        <FaCode className="mr-2" /> class UserController
                      </h4>
                      <ul className="ml-6 space-y-1">
                        <li className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> handleSubmit()
                        </li>
                        {/* Add more methods here */}
                      </ul>
                    </div>
                    {/* Add more classes here */}
                  </div>
                </div>

                {/* Tabs Content */}
                <div className="md:col-span-3">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b dark:border-gray-700">
                      <button
                        className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                        onClick={() => setActiveTab('overview')}
                      >
                        Overview
                      </button>
                      <button
                        className={`px-4 py-2 font-medium ${activeTab === 'file-explorer' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                        onClick={() => setActiveTab('file-explorer')}
                      >
                        File Explorer
                      </button>
                      <button
                        className={`px-4 py-2 font-medium ${activeTab === 'commits' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                        onClick={() => setActiveTab('commits')}
                      >
                        Commits
                      </button>
                      <button
                        className={`px-4 py-2 font-medium ${activeTab === 'issues' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                        onClick={() => setActiveTab('issues')}
                      >
                        Issues
                      </button>
                      <button
                        className={`px-4 py-2 font-medium ${activeTab === 'pull-requests' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
                        onClick={() => setActiveTab('pull-requests')}
                      >
                        Pull Requests
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                      {activeTab === 'overview' && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 dark:text-white">Repository Overview</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            This repository contains {repository.file_count} files across {repository.directory_count} directories,
                            with a total size of {formatSize(repository.total_size)}.
                          </p>
                          {/* Add more overview content here */}
                        </div>
                      )}

                      {activeTab === 'file-explorer' && (
                        <div>
                          {selectedFile ? (
                            <div>
                              <div className="flex items-center mb-4 text-sm text-gray-500 dark:text-gray-400">
                                {breadcrumbs.map((crumb, index) => (
                                  <React.Fragment key={index}>
                                    {index > 0 && <span className="mx-1">/</span>}
                                    <span>{crumb}</span>
                                  </React.Fragment>
                                ))}
                              </div>
                              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm">
                                <pre className="whitespace-pre-wrap dark:text-white">{fileContent}</pre>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h3 className="text-lg font-semibold mb-4 dark:text-white">File Explorer</h3>
                              {fileStructure && renderFileTree(fileStructure)}
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'commits' && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 dark:text-white">Commits</h3>
                          <div className="space-y-4">
                            {commits.map((commit, index) => (
                              <div key={index} className="border-b pb-4 dark:border-gray-700 last:border-0">
                                <div className="flex justify-between mb-1">
                                  <span className="font-medium dark:text-white">{commit.message}</span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">{commit.date}</span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                  <span className="mr-2">{commit.hash}</span>
                                  <span>by {commit.author}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === 'issues' && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 dark:text-white">Issues</h3>
                          <div className="space-y-4">
                            {issues.map((issue, index) => (
                              <div key={index} className="border-b pb-4 dark:border-gray-700 last:border-0">
                                <div className="flex justify-between mb-1">
                                  <span className="font-medium dark:text-white">{issue.title}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    issue.state === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                  }`}>
                                    {issue.state}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                  <span>#{issue.id}</span>
                                  <span className="mx-2">•</span>
                                  <span>Opened on {new Date(issue.created_at).toLocaleDateString()}</span>
                                  <span className="mx-2">•</span>
                                  <span>by {issue.user}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === 'pull-requests' && (
                        <div>
                          <h3 className="text-lg font-semibold mb-4 dark:text-white">Pull Requests</h3>
                          <div className="space-y-4">
                            {pullRequests.map((pr, index) => (
                              <div key={index} className="border-b pb-4 dark:border-gray-700 last:border-0">
                                <div className="flex justify-between mb-1">
                                  <span className="font-medium dark:text-white">{pr.title}</span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    pr.state === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                                    pr.state === 'merged' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                  }`}>
                                    {pr.state}
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                  <span>#{pr.id}</span>
                                  <span className="mx-2">•</span>
                                  <span>Opened on {new Date(pr.created_at).toLocaleDateString()}</span>
                                  <span className="mx-2">•</span>
                                  <span>by {pr.user}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
} 
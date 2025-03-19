'use client';

import React from 'react';
import Link from 'next/link';
import { BiAnalyse } from 'react-icons/bi';
import { FiEye } from 'react-icons/fi';
import { FaTrash } from 'react-icons/fa';

interface Repository {
  id: string;
  repo_url: string;
  status: 'pending' | 'completed' | 'failed';
  progress: number;
  files: number;
  directories: number;
  size_bytes: number;
  last_updated: string;
}

interface RepositoryCardProps {
  repository: Repository;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  
  // Less than an hour
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  // Less than a day
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  // Less than a month
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }
  
  // Less than a year
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }
  
  // Years
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500';
    case 'completed':
      return 'bg-green-500';
    case 'failed':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const RepositoryCard: React.FC<RepositoryCardProps> = ({ repository, onDelete, isDeleting }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-xl font-bold text-white">
              {repository.id}
            </h2>
            <a href={repository.repo_url} className="text-blue-400 text-sm hover:underline">
              {repository.repo_url}
            </a>
          </div>
          <span className={`${getStatusColor(repository.status)} text-white text-xs px-2 py-1 rounded`}>
            {repository.status.charAt(0).toUpperCase() + repository.status.slice(1)}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2 mb-4">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${repository.progress}%` }}
          />
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="text-gray-400">Files</h3>
            <p className="text-white">{repository.files}</p>
          </div>
          <div>
            <h3 className="text-gray-400">Directories</h3>
            <p className="text-white">{repository.directories}</p>
          </div>
          <div>
            <h3 className="text-gray-400">Size</h3>
            <p className="text-white">{formatBytes(repository.size_bytes)}</p>
          </div>
          <div>
            <h3 className="text-gray-400">Last Updated</h3>
            <p className="text-white">{formatTimeAgo(repository.last_updated)}</p>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-between border-t border-gray-700">
        <Link
          href={`/repositories/${repository.id}/analyze`}
          className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 p-3 flex-1 justify-center"
        >
          <BiAnalyse /> Analyze
        </Link>
        <Link
          href={`/repositories/${repository.id}/enhanced`}
          className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 p-3 flex-1 justify-center border-l border-r border-gray-700"
        >
          <FiEye /> Enhanced
        </Link>
        <button
          onClick={() => onDelete(repository.id)}
          disabled={isDeleting}
          className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1 p-3 flex-1 justify-center"
        >
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );
};

export default RepositoryCard; 
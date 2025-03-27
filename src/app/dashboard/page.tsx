'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaFolder, FaExclamationTriangle, FaCheckCircle, FaClock, FaSync } from 'react-icons/fa';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DashboardStats {
  repository_stats: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
  };
  language_distribution: {
    language: string;
    count: number;
    percentage: number;
  }[];
  recent_activity: {
    type: string;
    repository: string;
    timestamp: string;
    details: string;
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/dashboard/stats`);
      setStats(response.data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.error || 
        'Failed to load dashboard statistics. Please try again later.'
      );
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStats();
  };

  const navigateToRepositories = (status: 'completed' | 'failed' | 'pending') => {
    router.push(`/repositories?status=${status}`);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 60) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffInDays < 30) {
        return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (e) {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8 flex-grow">
          <LoadingSpinner size="large" message="Loading dashboard..." />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold dark:text-white">Dashboard</h1>
          <button 
            onClick={handleRefresh} 
            className={`flex items-center justify-center text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md transition-colors hover:bg-blue-200 dark:hover:bg-blue-800/50 ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isRefreshing}
          >
            <FaSync className={`mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {error ? (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
            <p>{error}</p>
            <button 
              onClick={fetchStats} 
              className="mt-2 text-sm px-3 py-1 bg-red-200 dark:bg-red-800/50 rounded hover:bg-red-300 dark:hover:bg-red-700/50"
            >
              Try Again
            </button>
          </div>
        ) : !stats ? (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded mb-6">
            <p>No dashboard data available</p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
              <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 cursor-pointer transition-all hover:shadow-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                onClick={() => router.push('/repositories')}
              >
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Total Repositories</h2>
                <div className="flex items-center">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                    <FaFolder className="text-indigo-600 dark:text-indigo-400 text-lg sm:text-xl" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold dark:text-white">{stats.repository_stats.total}</p>
                  </div>
                </div>
              </div>
              
              <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 cursor-pointer transition-all hover:shadow-lg hover:bg-green-50 dark:hover:bg-green-900/30"
                onClick={() => navigateToRepositories('completed')}
              >
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Completed</h2>
                <div className="flex items-center">
                  <div className="bg-green-100 dark:bg-green-900/30 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                    <FaCheckCircle className="text-green-600 dark:text-green-400 text-lg sm:text-xl" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold dark:text-white">{stats.repository_stats.completed}</p>
                    {stats.repository_stats.total > 0 && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {Math.round((stats.repository_stats.completed / stats.repository_stats.total) * 100)}% of total
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 cursor-pointer transition-all hover:shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                onClick={() => navigateToRepositories('failed')}
              >
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Failed</h2>
                <div className="flex items-center">
                  <div className="bg-red-100 dark:bg-red-900/30 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                    <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-lg sm:text-xl" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold dark:text-white">{stats.repository_stats.failed}</p>
                    {stats.repository_stats.total > 0 && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {Math.round((stats.repository_stats.failed / stats.repository_stats.total) * 100)}% of total
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 cursor-pointer transition-all hover:shadow-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                onClick={() => navigateToRepositories('pending')}
              >
                <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Pending</h2>
                <div className="flex items-center">
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                    <FaClock className="text-yellow-600 dark:text-yellow-400 text-lg sm:text-xl" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold dark:text-white">{stats.repository_stats.pending}</p>
                    {stats.repository_stats.total > 0 && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {Math.round((stats.repository_stats.pending / stats.repository_stats.total) * 100)}% of total
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Language Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold dark:text-white">Language Distribution</h2>
                  {stats.language_distribution.length > 5 && (
                    <button 
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={() => setShowAllLanguages(!showAllLanguages)}
                    >
                      {showAllLanguages ? 'Show Less' : 'View All'}
                    </button>
                  )}
                </div>
                
                {stats.language_distribution.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    No language data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(showAllLanguages 
                      ? stats.language_distribution 
                      : stats.language_distribution.slice(0, 5)
                    ).map((lang, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium dark:text-white truncate max-w-[70%]">{lang.language || 'Unknown'}</span>
                          <span className="text-sm font-medium dark:text-white">{lang.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${Math.min(lang.percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {!showAllLanguages && stats.language_distribution.length > 5 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                        +{stats.language_distribution.length - 5} more languages
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Activity Timeline */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-4 dark:text-white">Recent Activity</h2>
                
                {stats.recent_activity.length === 0 ? (
                  <div className="text-gray-500 dark:text-gray-400 text-sm p-4 text-center bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    No recent activity
                  </div>
                ) : (
                  <div className="space-y-4 overflow-y-auto max-h-96">
                    {stats.recent_activity.map((activity, index) => (
                      <div key={index} className="flex">
                        <div className="flex-shrink-0 mr-3">
                          <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                            <FaFolder className="text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium dark:text-white">{activity.type}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {activity.repository} • {formatTimestamp(activity.timestamp)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{activity.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => router.push('/repositories')}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View All Repositories
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
} 
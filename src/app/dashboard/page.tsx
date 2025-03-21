'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FaFolder, FaExclamationTriangle, FaCheckCircle, FaClock } from 'react-icons/fa';

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/dashboard/stats`);
        setStats(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner size="large" message="Loading dashboard..." />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
      </>
    );
  }

  if (!stats) {
    return (
      <>
        <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded">
          <p>No dashboard data available</p>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Completed Analyses</h2>
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-4">
              <FaCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <div>
              <p className="text-3xl font-bold dark:text-white">{stats.repository_stats.completed}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">+12% from last month</p>
        </div>
        </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Failed Analyses</h2>
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mr-4">
              <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl" />
        </div>
            <div>
              <p className="text-3xl font-bold dark:text-white">{stats.repository_stats.failed}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">-3% from last month</p>
        </div>
      </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Pending Analyses</h2>
          <div className="flex items-center">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full mr-4">
              <FaClock className="text-yellow-600 dark:text-yellow-400 text-xl" />
            </div>
            <div>
              <p className="text-3xl font-bold dark:text-white">{stats.repository_stats.pending}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">5 queued today</p>
        </div>
        </div>
      </div>
      
      {/* Language Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Language Distribution</h2>
          <div className="space-y-4">
            {stats.language_distribution.map((lang, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium dark:text-white">{lang.language}</span>
                  <span className="text-sm font-medium dark:text-white">{lang.percentage.toFixed(1)}%</span>
                </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${lang.percentage}%` }}
                        ></div>
                      </div>
              </div>
            ))}
        </div>
      </div>
      
        {/* Activity Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Activity Timeline</h2>
          <div className="space-y-4">
            {stats.recent_activity.map((activity, index) => (
              <div key={index} className="flex">
                <div className="flex-shrink-0 mr-3">
                  <div className="mt-1 bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                    <FaFolder className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium dark:text-white">{activity.type}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{activity.repository} • {new Date(activity.timestamp).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{activity.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
} 
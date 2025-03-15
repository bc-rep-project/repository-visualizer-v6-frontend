'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaSync } from 'react-icons/fa';
import Navigation from '@/components/Navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { analysisService } from '@/services/analysisService';
import { FileNode } from '@/types/types';

interface Repository {
  _id: string;
  repo_url: string;
  repo_name: string;
  updated_at?: string;
}

interface AnalysisStatus {
  repository_id: string;
  standard_analysis_available: boolean;
  enhanced_analysis_available: boolean;
  standard_analysis_date: string | null;
  enhanced_analysis_date: string | null;
}

export default function RepositoryDashboard() {
  const params = useParams();
  const router = useRouter();
  const repoId = params.id as string;
  
  const [repository, setRepository] = useState<Repository | null>(null);
  const [rawData, setRawData] = useState<FileNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  
  useEffect(() => {
    fetchRepositoryDetails();
    fetchAnalysisStatus();
    fetchAnalysisData();
  }, [repoId]);
  
  const fetchRepositoryDetails = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/repositories/${repoId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch repository details');
      }
      const data = await response.json();
      setRepository(data);
    } catch (err) {
      console.error('Error fetching repository details:', err);
      setError('Error loading repository details');
    }
  };
  
  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const data = await analysisService.getRepositoryAnalysis(repoId);
      setRawData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analysis data:', err);
      setError('Error loading analysis data');
      setLoading(false);
    }
  };
  
  const fetchAnalysisStatus = async () => {
    try {
      const status = await analysisService.getAnalysisStatus(repoId);
      setAnalysisStatus(status);
    } catch (err) {
      console.error('Error fetching analysis status:', err);
    }
  };
  
  const handleRefreshAnalysis = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      await analysisService.refreshAnalysis(repoId);
      
      // Fetch updated data
      await fetchAnalysisData();
      await fetchAnalysisStatus();
      
      setRefreshing(false);
    } catch (err: any) {
      console.error('Error refreshing analysis:', err);
      setError(`Error refreshing analysis: ${err.message}`);
      setRefreshing(false);
    }
  };
  
  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="mr-4 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              &larr; Back
            </button>
            <h1 className="text-2xl font-bold dark:text-white">
              {repository?.repo_name || 'Repository Dashboard'}
            </h1>
            <Link
              href={`/repositories/${repoId}/analyze`}
              className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-md text-sm"
            >
              Analysis View
            </Link>
          </div>
          
          {analysisStatus && (
            <button
              onClick={handleRefreshAnalysis}
              disabled={refreshing}
              className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md flex items-center"
            >
              {refreshing ? (
                <>
                  <LoadingSpinner size="small" />
                  <span className="ml-2">Refreshing...</span>
                </>
              ) : (
                <>
                  <FaSync className="mr-2" />
                  Refresh Analysis
                </>
              )}
            </button>
          )}
        </div>
        
        {analysisStatus && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Analysis Status</p>
            <p className="text-sm">
              {analysisStatus.enhanced_analysis_available 
                ? `Enhanced analysis available (Last updated: ${new Date(analysisStatus.enhanced_analysis_date || '').toLocaleString()})` 
                : 'No enhanced analysis available'}
            </p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="large" message="Loading repository data..." />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Content will be added here */}
          </div>
        )}
      </div>
    </>
  );
} 
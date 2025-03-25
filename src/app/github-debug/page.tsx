'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import githubService from '@/services/githubService';

export default function GitHubDebugPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [apiResponse, setApiResponse] = useState<any>(null);
  
  useEffect(() => {
    const checkGitHub = async () => {
      try {
        setLoading(true);
        
        // Check if GitHub token is available
        console.log('GitHub Token available:', Boolean(process.env.NEXT_PUBLIC_GITHUB_TOKEN));
        
        // Try to get API rate limit
        const isTokenValid = await githubService.isTokenValid();
        console.log('GitHub Token valid:', isTokenValid);
        
        if (isTokenValid) {
          const rateLimit = await githubService.getRateLimit();
          
          // Get repository details
          const repoDetails = await githubService.getRepositoryDetails('https://github.com/bc-rep-project/repository-visualizer-v6-frontend');
          
          setData({
            tokenAvailable: Boolean(process.env.NEXT_PUBLIC_GITHUB_TOKEN),
            tokenValid: isTokenValid,
            rateLimit,
            repoDetails
          });
        } else {
          setData({
            tokenAvailable: Boolean(process.env.NEXT_PUBLIC_GITHUB_TOKEN),
            tokenValid: isTokenValid,
            error: 'GitHub token is not valid'
          });
        }
      } catch (err: any) {
        console.error('Error checking GitHub:', err);
        setError(err.message || 'Unknown error');
        setData({
          tokenAvailable: Boolean(process.env.NEXT_PUBLIC_GITHUB_TOKEN),
          tokenValid: false,
          error: err.message
        });
      } finally {
        setLoading(false);
      }
    };
    
    const checkApiEndpoint = async () => {
      try {
        setApiStatus('loading');
        const response = await fetch('/api/debug-github');
        const data = await response.json();
        setApiResponse(data);
        setApiStatus('success');
      } catch (err: any) {
        console.error('Error checking API endpoint:', err);
        setApiStatus('error');
        setApiResponse({
          error: err.message
        });
      }
    };
    
    checkGitHub();
    checkApiEndpoint();
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-2xl font-bold mb-4 dark:text-white">GitHub API Debug</h1>
        
        {loading ? (
          <div className="flex justify-center">
            <LoadingSpinner size="large" message="Checking GitHub API access..." />
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">GitHub Client Integration</h2>
              <div className="space-y-2">
                <p className="dark:text-white">
                  <span className="font-semibold">GitHub Token Available:</span> 
                  <span className={data?.tokenAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {data?.tokenAvailable ? 'Yes' : 'No'}
                  </span>
                </p>
                <p className="dark:text-white">
                  <span className="font-semibold">GitHub Token Valid:</span> 
                  <span className={data?.tokenValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {data?.tokenValid ? 'Yes' : 'No'}
                  </span>
                </p>
                
                {data?.rateLimit && (
                  <div>
                    <p className="dark:text-white">
                      <span className="font-semibold">Rate Limit:</span> {data.rateLimit.limit}
                    </p>
                    <p className="dark:text-white">
                      <span className="font-semibold">Remaining:</span> {data.rateLimit.remaining}
                    </p>
                    <p className="dark:text-white">
                      <span className="font-semibold">Reset:</span> {data.rateLimit.reset.toString()}
                    </p>
                  </div>
                )}
                
                {data?.repoDetails && (
                  <div className="mt-4">
                    <h3 className="text-lg font-bold dark:text-white">Repository Details</h3>
                    <p className="dark:text-white">
                      <span className="font-semibold">Name:</span> {data.repoDetails.name}
                    </p>
                    <p className="dark:text-white">
                      <span className="font-semibold">Full Name:</span> {data.repoDetails.full_name}
                    </p>
                    <p className="dark:text-white">
                      <span className="font-semibold">URL:</span> {data.repoDetails.html_url}
                    </p>
                  </div>
                )}
                
                {data?.error && (
                  <div className="mt-4 text-red-600 dark:text-red-400">
                    <p><span className="font-semibold">Error:</span> {data.error}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">GitHub API Route</h2>
              
              {apiStatus === 'loading' ? (
                <div className="flex justify-center">
                  <LoadingSpinner size="small" message="Checking API route..." />
                </div>
              ) : apiStatus === 'error' ? (
                <div className="text-red-600 dark:text-red-400">
                  <p><span className="font-semibold">Error:</span> {apiResponse?.error}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="dark:text-white">
                    <span className="font-semibold">Success:</span> 
                    <span className={apiResponse?.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {apiResponse?.success ? 'Yes' : 'No'}
                    </span>
                  </p>
                  
                  <p className="dark:text-white">
                    <span className="font-semibold">Token Available:</span> 
                    <span className={apiResponse?.token_available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {apiResponse?.token_available ? 'Yes' : 'No'}
                    </span>
                  </p>
                  
                  {apiResponse?.repo_info && (
                    <div className="mt-4">
                      <h3 className="text-lg font-bold dark:text-white">Repository Info</h3>
                      <p className="dark:text-white">
                        <span className="font-semibold">Name:</span> {apiResponse.repo_info.name}
                      </p>
                      <p className="dark:text-white">
                        <span className="font-semibold">Full Name:</span> {apiResponse.repo_info.full_name}
                      </p>
                      <p className="dark:text-white">
                        <span className="font-semibold">URL:</span> {apiResponse.repo_info.url}
                      </p>
                    </div>
                  )}
                  
                  {apiResponse?.error && (
                    <div className="mt-4 text-red-600 dark:text-red-400">
                      <p><span className="font-semibold">Error:</span> {apiResponse.error}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Environment Variables</h2>
              <p className="dark:text-white">
                <span className="font-semibold">NEXT_PUBLIC_GITHUB_TOKEN:</span> 
                {process.env.NEXT_PUBLIC_GITHUB_TOKEN 
                  ? `${process.env.NEXT_PUBLIC_GITHUB_TOKEN.substring(0, 4)}...${process.env.NEXT_PUBLIC_GITHUB_TOKEN.substring(process.env.NEXT_PUBLIC_GITHUB_TOKEN.length - 4)}` 
                  : 'Not set'}
              </p>
              <p className="dark:text-white">
                <span className="font-semibold">NEXT_PUBLIC_API_URL:</span> {process.env.NEXT_PUBLIC_API_URL}
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
} 
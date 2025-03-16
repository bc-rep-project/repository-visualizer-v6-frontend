'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/common/Button';

export default function SettingsTestPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/settings`);
      setSettings(response.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Error loading settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateTheme = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const newMode = settings?.theme?.mode === 'light' ? 'dark' : 'light';
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/settings`,
        { theme: { mode: newMode } }
      );
      setSettings(response.data);
      setSuccessMessage(`Theme updated to ${newMode} mode!`);
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/settings/reset`
      );
      setSettings(response.data);
      setSuccessMessage('All settings reset to defaults!');
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError('Failed to reset settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">Settings API Test</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}
        
        <div className="flex space-x-4 mb-6">
          <Button onClick={fetchSettings} disabled={loading}>
            Refresh Settings
          </Button>
          <Button onClick={updateTheme} disabled={loading}>
            Toggle Theme
          </Button>
          <Button onClick={resetSettings} disabled={loading} variant="secondary">
            Reset All Settings
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Current Settings</h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(settings, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Layout>
  );
} 
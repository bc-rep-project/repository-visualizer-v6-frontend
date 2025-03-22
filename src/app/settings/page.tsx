'use client';

import React, { useEffect, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { repositoryApi } from '@/services/api';
import { FaSync, FaSun, FaMoon, FaDesktop, FaCode, FaProjectDiagram, FaTree, FaSitemap, FaDotCircle, FaSave, FaPlayCircle, FaStopCircle, FaClock, FaCheck } from 'react-icons/fa';
import LoadingSpinner from '@/components/LoadingSpinner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function SettingsPage() {
  const { settings, loading, error, updateSettings, updateAutoSave, resetSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [autoSaveStats, setAutoSaveStats] = useState<any>(null);
  const [backupsData, setBackupsData] = useState<{
    total: number;
    firstBackup: string | null;
    lastBackup: string | null;
  } | null>(null);
  const [autoSaveServiceStatus, setAutoSaveServiceStatus] = useState<{
    running: boolean;
    interval: number;
    enabled: boolean;
    last_run: string;
    next_run: string;
    repositories_saved?: number;
    analyses_saved?: number;
  } | null>(null);
  const [serviceOperation, setServiceOperation] = useState<'idle' | 'starting' | 'stopping' | 'running'>('idle');

  // Fetch auto-save statistics on load
  useEffect(() => {
    const fetchAutoSaveData = async () => {
      try {
        // Get auto-save settings
        const stats = await repositoryApi.getAutoSaveStatus();
        setAutoSaveStats(stats.statistics || {});
        setAutoSaveServiceStatus({
          running: stats.running || false,
          interval: stats.interval || 3600,
          enabled: stats.enabled || false,
          last_run: stats.last_run || '',
          next_run: stats.next_run || '',
          repositories_saved: stats.repositories_saved || 0,
          analyses_saved: stats.analyses_saved || 0,
        });
        
        // Get backup statistics
        try {
          const backups = await repositoryApi.getAutoSaveBackups(1, 1);
          setBackupsData({
            total: backups.total || 0,
            firstBackup: backups.statistics?.first_backup || null,
            lastBackup: backups.statistics?.last_backup || null,
          });
        } catch (err) {
          console.error('Error fetching backups data:', err);
        }
      } catch (err) {
        console.error('Error fetching auto-save data:', err);
      }
    };
    
    fetchAutoSaveData();
    
    // Set up a refresh interval
    const intervalId = setInterval(fetchAutoSaveData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId); // Clean up on unmount
  }, []);

  // Handle theme change
  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    try {
      setSaving(true);
      await updateSettings({ theme });
      showSaveMessage('success', 'Theme updated successfully');
    } catch (err) {
      showSaveMessage('error', 'Failed to update theme');
    } finally {
      setSaving(false);
    }
  };

  // Handle visualization change
  const handleVisualizationChange = async (visualization: 'graph' | 'tree' | 'sunburst' | 'packedCircles') => {
    try {
      setSaving(true);
      await updateSettings({ defaultVisualization: visualization });
      showSaveMessage('success', 'Default visualization updated successfully');
    } catch (err) {
      showSaveMessage('error', 'Failed to update visualization');
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle settings
  const handleToggleSetting = async (setting: 'autoAnalyze' | 'notificationsEnabled') => {
    try {
      setSaving(true);
      await updateSettings({ [setting]: !settings[setting] });
      showSaveMessage('success', `${setting} ${!settings[setting] ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      showSaveMessage('error', `Failed to update ${setting}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle auto-save settings
  const handleAutoSaveSetting = async (feature: 'repositories' | 'analysis' | 'enhancedAnalysis') => {
    try {
      setSaving(true);
      const currentValue = settings.autoSave[feature];
      await updateAutoSave(feature, !currentValue);
      
      // Refresh auto-save statistics after change
      const stats = await repositoryApi.getAutoSaveStatus();
      setAutoSaveStats(stats.statistics);
      
      showSaveMessage('success', `Auto-save for ${feature} ${!currentValue ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      showSaveMessage('error', `Failed to update auto-save for ${feature}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle auto-save interval change
  const handleAutoSaveIntervalChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      setSaving(true);
      const interval = parseInt(event.target.value, 10);
      await updateAutoSave('interval', interval);
      showSaveMessage('success', `Auto-save interval updated to ${interval} minutes`);
    } catch (err) {
      showSaveMessage('error', 'Failed to update auto-save interval');
    } finally {
      setSaving(false);
    }
  };

  // Handle code theme change
  const handleCodeThemeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      setSaving(true);
      await updateSettings({ codeHighlightTheme: event.target.value });
      showSaveMessage('success', 'Code highlight theme updated successfully');
    } catch (err) {
      showSaveMessage('error', 'Failed to update code highlight theme');
    } finally {
      setSaving(false);
    }
  };

  // Handle language change
  const handleLanguageChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      setSaving(true);
      await updateSettings({ language: event.target.value });
      showSaveMessage('success', 'Language updated successfully');
    } catch (err) {
      showSaveMessage('error', 'Failed to update language');
    } finally {
      setSaving(false);
    }
  };

  // Handle reset settings
  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      try {
        setSaving(true);
        await resetSettings();
        
        // Refresh auto-save statistics after reset
        const stats = await repositoryApi.getAutoSaveStatus();
        setAutoSaveStats(stats.statistics);
        
        showSaveMessage('success', 'Settings reset to defaults');
      } catch (err) {
        showSaveMessage('error', 'Failed to reset settings');
      } finally {
        setSaving(false);
      }
    }
  };

  // Handle start auto-save service
  const handleStartAutoSave = async () => {
    try {
      setServiceOperation('starting');
      const response = await repositoryApi.startAutoSave();
      
      if (response.status === 'started') {
        // Update service status
        const stats = await repositoryApi.getAutoSaveStatus();
        setAutoSaveServiceStatus({
          running: true,
          interval: stats.interval || 3600,
          enabled: true,
          last_run: stats.last_run || '',
          next_run: stats.next_run || '',
          repositories_saved: stats.repositories_saved || 0,
          analyses_saved: stats.analyses_saved || 0
        });
        
        showSaveMessage('success', 'Auto-save service started successfully');
      } else {
        showSaveMessage('error', response.message || 'Failed to start auto-save service');
      }
    } catch (err) {
      console.error('Error starting auto-save service:', err);
      showSaveMessage('error', 'Failed to start auto-save service');
    } finally {
      setServiceOperation('idle');
    }
  };
  
  // Handle stop auto-save service
  const handleStopAutoSave = async () => {
    try {
      setServiceOperation('stopping');
      const response = await repositoryApi.stopAutoSave();
      
      if (response.status === 'stopped') {
        // Update service status
        setAutoSaveServiceStatus({
          running: false,
          interval: autoSaveServiceStatus?.interval || 3600,
          enabled: false,
          last_run: autoSaveServiceStatus?.last_run || '',
          next_run: autoSaveServiceStatus?.next_run || '',
          repositories_saved: autoSaveServiceStatus?.repositories_saved || 0,
          analyses_saved: autoSaveServiceStatus?.analyses_saved || 0
        });
        
        showSaveMessage('success', 'Auto-save service stopped successfully');
      } else {
        showSaveMessage('error', response.message || 'Failed to stop auto-save service');
      }
    } catch (err) {
      console.error('Error stopping auto-save service:', err);
      showSaveMessage('error', 'Failed to stop auto-save service');
    } finally {
      setServiceOperation('idle');
    }
  };
  
  // Handle run auto-save manually
  const handleRunAutoSave = async () => {
    try {
      setServiceOperation('running');
      const response = await repositoryApi.runAutoSaveManually();
      
      if (response.status === 'completed') {
        // Update service status
        const stats = await repositoryApi.getAutoSaveStatus();
        setAutoSaveServiceStatus({
          running: autoSaveServiceStatus?.running || false,
          interval: autoSaveServiceStatus?.interval || 3600,
          enabled: autoSaveServiceStatus?.enabled || false,
          last_run: stats.last_run || '',
          next_run: stats.next_run || '',
          repositories_saved: (autoSaveServiceStatus?.repositories_saved || 0) + (response.saved || 0),
          analyses_saved: autoSaveServiceStatus?.analyses_saved || 0
        });
        
        // Update backups data after auto-save
        try {
          const backups = await repositoryApi.getAutoSaveBackups(1, 1);
          setBackupsData({
            total: backups.total || 0,
            firstBackup: backups.statistics?.first_backup || null,
            lastBackup: backups.statistics?.last_backup || null,
          });
        } catch (err) {
          console.error('Error updating backups data:', err);
        }
        
        showSaveMessage('success', `Auto-save completed: ${response.saved} repositories saved`);
      } else {
        showSaveMessage('error', response.message || 'Failed to run auto-save');
      }
    } catch (err) {
      console.error('Error running auto-save:', err);
      showSaveMessage('error', 'Failed to run auto-save');
    } finally {
      setServiceOperation('idle');
    }
  };

  // Show save message for 3 seconds
  const showSaveMessage = (type: 'success' | 'error', text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => {
      setSaveMessage(null);
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <button
            onClick={handleResetSettings}
            disabled={saving}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
          >
            <FaSync className={saving ? 'animate-spin' : ''} />
            <span>Reset to Defaults</span>
          </button>
        </div>

        {saveMessage && (
          <div 
            className={`mb-4 p-3 rounded ${
              saveMessage.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-400' 
                : 'bg-red-100 text-red-700 border border-red-400'
            }`}
          >
            {saveMessage.text}
          </div>
        )}
        
        <div className="space-y-8">
          {/* Theme Settings */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Theme</h2>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-4 flex flex-col items-center space-y-2 rounded-lg border-2 ${
                  settings.theme === 'light' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <FaSun className="text-2xl text-yellow-500" />
                <span>Light</span>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-4 flex flex-col items-center space-y-2 rounded-lg border-2 ${
                  settings.theme === 'dark' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <FaMoon className="text-2xl text-indigo-400" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={`p-4 flex flex-col items-center space-y-2 rounded-lg border-2 ${
                  settings.theme === 'system' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <FaDesktop className="text-2xl text-gray-500 dark:text-gray-400" />
                <span>System</span>
              </button>
            </div>
          </div>
          
          {/* Code Syntax Highlighting Theme */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Code Highlighting</h2>
            <div className="max-w-md">
              <label htmlFor="code-theme" className="block mb-2 text-sm font-medium">
                Syntax Highlighting Theme
              </label>
              <select
                id="code-theme"
                value={settings.codeHighlightTheme}
                onChange={handleCodeThemeChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="github">GitHub</option>
                <option value="vscode">VS Code</option>
                <option value="dracula">Dracula</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="solarized">Solarized</option>
              </select>
              <div className="mt-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
                <code className="text-sm">// Example code preview</code>
                <pre className="text-sm mt-1"><code>{`function example() {
  return "This is how your code will look";
}`}</code></pre>
              </div>
            </div>
          </div>
          
          {/* Default Visualization */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Default Visualization</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleVisualizationChange('graph')}
                className={`p-4 flex flex-col items-center space-y-2 rounded-lg border-2 ${
                  settings.defaultVisualization === 'graph' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <FaProjectDiagram className="text-2xl text-blue-500" />
                <span>Graph</span>
              </button>
              <button
                onClick={() => handleVisualizationChange('tree')}
                className={`p-4 flex flex-col items-center space-y-2 rounded-lg border-2 ${
                  settings.defaultVisualization === 'tree' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <FaTree className="text-2xl text-green-500" />
                <span>Tree</span>
              </button>
              <button
                onClick={() => handleVisualizationChange('sunburst')}
                className={`p-4 flex flex-col items-center space-y-2 rounded-lg border-2 ${
                  settings.defaultVisualization === 'sunburst' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <FaSitemap className="text-2xl text-yellow-500" />
                <span>Sunburst</span>
              </button>
              <button
                onClick={() => handleVisualizationChange('packedCircles')}
                className={`p-4 flex flex-col items-center space-y-2 rounded-lg border-2 ${
                  settings.defaultVisualization === 'packedCircles' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <FaDotCircle className="text-2xl text-purple-500" />
                <span>Packed Circles</span>
              </button>
            </div>
          </div>
          
          {/* Auto-Save Settings */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <FaSave className="mr-2" /> Auto-Save Settings
            </h2>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Configure automatic saving of repositories to MongoDB for backup and faster access.
              </p>
              
              {/* Auto-Save Service Controls */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Service Status</h3>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300 mr-2">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-white text-xs font-medium ${autoSaveServiceStatus?.running ? 'bg-green-500' : 'bg-gray-500'}`}>
                        {autoSaveServiceStatus?.running ? 'Running' : 'Stopped'}
                      </span>
                    </div>
                    
                    {autoSaveServiceStatus?.last_run && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Last run: {new Date(autoSaveServiceStatus.last_run).toLocaleString()}
                      </div>
                    )}
                    
                    {autoSaveServiceStatus?.next_run && autoSaveServiceStatus?.running && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Next run: {new Date(autoSaveServiceStatus.next_run).toLocaleString()}
                      </div>
                    )}
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Interval: {autoSaveServiceStatus?.interval ? Math.floor(autoSaveServiceStatus.interval / 60) : 60} minutes
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!autoSaveServiceStatus?.running ? (
                      <button
                        className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md flex items-center"
                        onClick={handleStartAutoSave}
                        disabled={serviceOperation !== 'idle'}
                      >
                        {serviceOperation === 'starting' ? (
                          <LoadingSpinner size="small" color="green" message="" className="mr-2" />
                        ) : (
                          <FaPlayCircle className="mr-2" />
                        )}
                        Start Service
                      </button>
                    ) : (
                      <button
                        className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md flex items-center"
                        onClick={handleStopAutoSave}
                        disabled={serviceOperation !== 'idle'}
                      >
                        {serviceOperation === 'stopping' ? (
                          <LoadingSpinner size="small" color="red" message="" className="mr-2" />
                        ) : (
                          <FaStopCircle className="mr-2" />
                        )}
                        Stop Service
                      </button>
                    )}
                    
                    <button
                      className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md flex items-center"
                      onClick={handleRunAutoSave}
                      disabled={serviceOperation !== 'idle'}
                    >
                      {serviceOperation === 'running' ? (
                        <LoadingSpinner size="small" color="blue" message="" className="mr-2" />
                      ) : (
                        <FaSync className="mr-2" />
                      )}
                      Run Now
                    </button>
                  </div>
                </div>
                
                {/* Auto-Save Statistics */}
                {(autoSaveStats || (autoSaveServiceStatus?.repositories_saved && autoSaveServiceStatus.repositories_saved > 0) || (backupsData && backupsData.total > 0)) && (
                  <div className="mt-4 border-t border-gray-200 dark:border-gray-600 pt-4">
                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Statistics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-100 dark:bg-gray-600 rounded-md p-3">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {backupsData?.total || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Repositories Backed Up</div>
                      </div>
                      <div className="bg-gray-100 dark:bg-gray-600 rounded-md p-3">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {autoSaveServiceStatus?.repositories_saved || autoSaveStats?.repositories_saved || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Auto-Save Operations</div>
                      </div>
                    </div>
                    
                    {backupsData?.lastBackup && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        Last backup: {new Date(backupsData.lastBackup).toLocaleString()}
                      </div>
                    )}
                    
                    {backupsData?.firstBackup && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        First backup: {new Date(backupsData.firstBackup).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Auto-Save Interval Settings */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="auto-save-interval">
                  Auto-Save Interval
                </label>
                <select
                  id="auto-save-interval"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                  value={autoSaveServiceStatus?.interval ? Math.floor(autoSaveServiceStatus.interval / 60) : 60}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value, 10);
                    const seconds = minutes * 60;
                    updateAutoSave('interval', seconds);
                  }}
                >
                  <option value="5">Every 5 minutes</option>
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Every 1 hour</option>
                  <option value="120">Every 2 hours</option>
                  <option value="360">Every 6 hours</option>
                  <option value="720">Every 12 hours</option>
                  <option value="1440">Every 24 hours</option>
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  How often should repositories be automatically saved to MongoDB
                </p>
              </div>

              {/* Auto-Save Features */}
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Auto-Save Options</h3>
                
                {/* Keep existing settings here if any */}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
} 
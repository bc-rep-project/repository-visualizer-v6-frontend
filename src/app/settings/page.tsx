'use client';

import React, { useEffect, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { repositoryApi } from '@/services/api';
import { FaSync, FaSun, FaMoon, FaDesktop, FaCode, FaProjectDiagram, FaTree, FaSitemap, FaDotCircle, FaSave, FaPlayCircle, FaStopCircle, FaClock, FaCheck } from 'react-icons/fa';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function SettingsPage() {
  const { settings, loading, error, updateSettings, updateAutoSave, resetSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [autoSaveStats, setAutoSaveStats] = useState<any>(null);
  const [autoSaveServiceStatus, setAutoSaveServiceStatus] = useState<{
    running: boolean;
    repositories_saved?: number;
    analyses_saved?: number;
    last_run_time?: string;
    next_run_time?: string;
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
          repositories_saved: stats.repositories_saved,
          analyses_saved: stats.analyses_saved,
          last_run_time: stats.last_run_time,
          next_run_time: stats.next_run_time
        });
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

  // Auto-save service operations
  const handleStartAutoSave = async () => {
    try {
      setServiceOperation('starting');
      const result = await repositoryApi.startAutoSave();
      setAutoSaveServiceStatus(result.status);
      showSaveMessage('success', 'Auto-save service started successfully');
    } catch (err) {
      console.error('Error starting auto-save service:', err);
      showSaveMessage('error', 'Failed to start auto-save service');
    } finally {
      setServiceOperation('idle');
    }
  };
  
  const handleStopAutoSave = async () => {
    try {
      setServiceOperation('stopping');
      const result = await repositoryApi.stopAutoSave();
      setAutoSaveServiceStatus(result.status);
      showSaveMessage('success', 'Auto-save service stopped successfully');
    } catch (err) {
      console.error('Error stopping auto-save service:', err);
      showSaveMessage('error', 'Failed to stop auto-save service');
    } finally {
      setServiceOperation('idle');
    }
  };
  
  const handleRunAutoSave = async () => {
    try {
      setServiceOperation('running');
      const result = await repositoryApi.runAutoSaveManually();
      setAutoSaveServiceStatus(result.status);
      setAutoSaveStats({
        repositories_saved: result.repositories_saved,
        analyses_saved: result.analyses_saved,
        ...autoSaveStats
      });
      showSaveMessage('success', `Auto-save completed: ${result.repositories_saved} repositories and ${result.analyses_saved} analyses saved`);
    } catch (err) {
      console.error('Error running auto-save manually:', err);
      showSaveMessage('error', 'Failed to run auto-save manually');
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
    <div className="p-6 max-w-4xl mx-auto">
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
        
        {/* Auto-Save Management */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Auto-Save Management</h2>
          
          {/* Current Status */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 border rounded-md">
            <h3 className="font-medium mb-2">Service Status</h3>
            {autoSaveServiceStatus === null ? (
              <div className="flex items-center">
                <LoadingSpinner size="small" message="" />
                <span className="ml-2">Loading status...</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${autoSaveServiceStatus.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{autoSaveServiceStatus.running ? 'Running' : 'Stopped'}</span>
                </div>
                
                {autoSaveServiceStatus.last_run_time && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Last run: {new Date(autoSaveServiceStatus.last_run_time).toLocaleString()}
                  </div>
                )}
                
                {autoSaveServiceStatus.next_run_time && autoSaveServiceStatus.running && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Next run: {new Date(autoSaveServiceStatus.next_run_time).toLocaleString()}
                  </div>
                )}
                
                {(autoSaveServiceStatus.repositories_saved !== undefined || autoSaveServiceStatus.analyses_saved !== undefined) && (
                  <div className="text-sm mt-2">
                    {autoSaveServiceStatus.repositories_saved !== undefined && (
                      <div>Repositories auto-saved: {autoSaveServiceStatus.repositories_saved}</div>
                    )}
                    {autoSaveServiceStatus.analyses_saved !== undefined && (
                      <div>Analyses auto-saved: {autoSaveServiceStatus.analyses_saved}</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Service Controls */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <button
              onClick={handleStartAutoSave}
              disabled={serviceOperation !== 'idle' || (autoSaveServiceStatus?.running === true)}
              className={`flex items-center justify-center p-3 rounded-md ${
                autoSaveServiceStatus?.running === true
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {serviceOperation === 'starting' ? (
                <LoadingSpinner size="small" color="green" message="" />
              ) : (
                <>
                  <FaPlayCircle className="mr-2" />
                  Start Service
                </>
              )}
            </button>
            
            <button
              onClick={handleStopAutoSave}
              disabled={serviceOperation !== 'idle' || !(autoSaveServiceStatus?.running === true)}
              className={`flex items-center justify-center p-3 rounded-md ${
                !(autoSaveServiceStatus?.running === true)
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {serviceOperation === 'stopping' ? (
                <LoadingSpinner size="small" color="red" message="" />
              ) : (
                <>
                  <FaStopCircle className="mr-2" />
                  Stop Service
                </>
              )}
            </button>
            
            <button
              onClick={handleRunAutoSave}
              disabled={serviceOperation !== 'idle'}
              className={`flex items-center justify-center p-3 rounded-md ${
                serviceOperation !== 'idle'
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {serviceOperation === 'running' ? (
                <LoadingSpinner size="small" color="blue" message="" />
              ) : (
                <>
                  <FaClock className="mr-2" />
                  Run Now
                </>
              )}
            </button>
          </div>
          
          {/* Configuration Instructions */}
          <div className="text-sm text-gray-600 dark:text-gray-400 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="mb-2 font-medium">About Auto-Save Service</p>
            <p>The auto-save service periodically saves repository data and analyses to MongoDB based on your settings.</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Use the controls above to manage the service</li>
              <li>Configure what gets saved in the Additional Options section</li>
              <li>The service runs in the background even when the UI is closed</li>
              <li>For advanced configuration, use the server's management CLI</li>
            </ul>
          </div>
        </div>
        
        {/* Additional Options */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Additional Options</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto-Analyze Repositories</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Automatically analyze repositories when they are added
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.autoAnalyze}
                  onChange={() => handleToggleSetting('autoAnalyze')}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto-Save Repositories</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Automatically save repository data to MongoDB
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.autoSave?.repositories}
                  onChange={() => handleAutoSaveSetting('repositories')}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto-Save Repository Analyses</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Automatically save analysis data to MongoDB
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.autoSave?.analysis}
                  onChange={() => handleAutoSaveSetting('analysis')}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Auto-Save Enhanced Analyses</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Automatically save enhanced analysis data to MongoDB
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.autoSave?.enhancedAnalysis}
                  onChange={() => handleAutoSaveSetting('enhancedAnalysis')}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="max-w-md">
              <label htmlFor="autoSaveInterval" className="block mb-2 text-sm font-medium">
                Auto-Save Interval (minutes)
              </label>
              <select
                id="autoSaveInterval"
                value={settings.autoSave?.interval || 30}
                onChange={handleAutoSaveIntervalChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={saving}
              >
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="1440">24 hours</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Notifications</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enable notifications for repository updates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.notificationsEnabled}
                  onChange={() => handleToggleSetting('notificationsEnabled')}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="max-w-md">
              <label htmlFor="language" className="block mb-2 text-sm font-medium">
                Language
              </label>
              <select
                id="language"
                value={settings.language}
                onChange={handleLanguageChange}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                disabled={saving}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
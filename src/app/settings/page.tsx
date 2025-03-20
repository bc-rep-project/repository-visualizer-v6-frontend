'use client';

import React, { useEffect, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { FaSync, FaSun, FaMoon, FaDesktop, FaCode, FaProjectDiagram, FaTree, FaSitemap, FaDotCircle } from 'react-icons/fa';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function SettingsPage() {
  const { settings, loading, error, updateSettings, resetSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
      showSaveMessage('success', 'Default visualization updated');
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
      showSaveMessage('success', 'Setting updated successfully');
    } catch (err) {
      showSaveMessage('error', 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  // Handle theme change
  const handleCodeThemeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    try {
      setSaving(true);
      await updateSettings({ codeHighlightTheme: event.target.value });
      showSaveMessage('success', 'Code theme updated successfully');
    } catch (err) {
      showSaveMessage('error', 'Failed to update code theme');
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
        showSaveMessage('success', 'Settings reset to defaults');
      } catch (err) {
        showSaveMessage('error', 'Failed to reset settings');
      } finally {
        setSaving(false);
      }
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
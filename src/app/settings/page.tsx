'use client';

import React, { useState, useEffect } from 'react';
import { FiSettings, FiMonitor, FiEye, FiBell, FiServer, FiCheckCircle } from 'react-icons/fi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ThemeColorOption } from '@/contexts/SettingsContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Settings {
  theme: 'light' | 'dark' | 'system';
  themeColor: ThemeColorOption;
  visualization_defaults: {
    graph_type: string;
    enable_animations: boolean;
  };
  notifications: {
    enabled: boolean;
    frequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  };
  system: {
    auto_refresh: boolean;
    refresh_interval_seconds: number;
  };
}

// Theme color options with display name and sample colors
interface ThemeColorConfig {
  id: ThemeColorOption;
  name: string;
  primary: string;
  secondary: string;
  background: string;
}

const themeColorOptions: ThemeColorConfig[] = [
  {
    id: 'default',
    name: 'Default Blue',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    background: '#111827'
  },
  {
    id: 'midnight',
    name: 'Midnight Purple',
    primary: '#6366f1',
    secondary: '#a5b4fc',
    background: '#111132'
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    primary: '#0ea5e9',
    secondary: '#7dd3fc',
    background: '#0c1929'
  },
  {
    id: 'forest',
    name: 'Forest Green',
    primary: '#10b981',
    secondary: '#6ee7b7',
    background: '#022c22'
  },
  {
    id: 'ember',
    name: 'Ember Red',
    primary: '#f43f5e',
    secondary: '#fda4af',
    background: '#4c0519'
  }
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    theme: 'system',
    themeColor: 'default',
    visualization_defaults: {
      graph_type: 'Bar Chart',
      enable_animations: true,
    },
    notifications: {
      enabled: true,
      frequency: 'real-time',
    },
    system: {
      auto_refresh: true,
      refresh_interval_seconds: 60,
    },
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('theme');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/settings`);
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      
      // If the backend doesn't have themeColor yet, add the default
      if (!data.themeColor) {
        data.themeColor = 'default';
      }
      
      setSettings(data);
      setError(null);
      
      // Apply theme immediately
      applyTheme(data.theme, data.themeColor);
    } catch (err) {
      setError('Error loading settings. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      setSuccess('Settings saved successfully!');
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Error saving settings. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      theme: 'system',
      themeColor: 'default',
      visualization_defaults: {
        graph_type: 'Bar Chart',
        enable_animations: true,
      },
      notifications: {
        enabled: true,
        frequency: 'real-time',
      },
      system: {
        auto_refresh: true,
        refresh_interval_seconds: 60,
      },
    });
    setSuccess('Settings reset to defaults!');
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
    
    // Apply default theme
    applyTheme('system', 'default');
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings({
      ...settings,
      theme,
    });
    
    // Apply theme immediately
    applyTheme(theme, settings.themeColor);
  };
  
  const handleThemeColorChange = (themeColor: ThemeColorOption) => {
    setSettings({
      ...settings,
      themeColor,
    });
    
    // Apply theme color immediately
    applyTheme(settings.theme, themeColor);
  };

  // Function to apply theme changes immediately in the UI
  const applyTheme = (theme: string, themeColor: ThemeColorOption) => {
    // Remove all theme color classes first
    document.documentElement.classList.remove(
      'theme-default',
      'theme-midnight',
      'theme-ocean',
      'theme-forest',
      'theme-ember'
    );
    
    // Add the selected theme color class
    document.documentElement.classList.add(`theme-${themeColor}`);
    
    // Apply dark/light theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (theme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleVisualizationChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      visualization_defaults: {
        ...settings.visualization_defaults,
        [key]: value,
      },
    });
  };

  const handleNotificationChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    });
  };

  const handleSystemChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      system: {
        ...settings.system,
        [key]: value,
      },
    });
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Loading settings..." />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <FiSettings className="text-2xl mr-2 text-gray-700 dark:text-gray-300" />
        <h1 className="text-2xl font-bold dark:text-white">Settings</h1>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded mb-6">
          <p>{success}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <nav className="space-y-1">
              <button
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'theme'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => setActiveSection('theme')}
              >
                <FiMonitor className="mr-3 text-lg" />
              Theme
              </button>
              <button
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'visualization'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => setActiveSection('visualization')}
              >
                <FiEye className="mr-3 text-lg" />
                Visualization
              </button>
              <button
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'notifications'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => setActiveSection('notifications')}
              >
                <FiBell className="mr-3 text-lg" />
                Notifications
              </button>
              <button
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  activeSection === 'system'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => setActiveSection('system')}
              >
                <FiServer className="mr-3 text-lg" />
                System
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            {/* Theme Preferences */}
            {activeSection === 'theme' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 dark:text-white">Theme Preferences</h2>
                
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Theme Mode
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Choose between light and dark mode
                  </p>
                  <div className="flex space-x-2">
                    <button
                      className={`px-4 py-2 rounded-md ${
                        settings.theme === 'light'
                          ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
                          : 'bg-white text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                      }`}
                      onClick={() => handleThemeChange('light')}
                    >
                      Light
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md ${
                        settings.theme === 'dark'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                      }`}
                      onClick={() => handleThemeChange('dark')}
                    >
                      Dark
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md ${
                        settings.theme === 'system'
                          ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
                          : 'bg-white text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                      }`}
                      onClick={() => handleThemeChange('system')}
                    >
                      System
                    </button>
                  </div>
                </div>
                
                {(settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dark Theme Variant
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Choose a color scheme for dark mode
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {themeColorOptions.map((option) => (
                        <div 
                          key={option.id}
                          className={`
                            p-4 rounded-lg cursor-pointer border-2 transition-all
                            ${settings.themeColor === option.id 
                              ? 'border-blue-500 dark:border-blue-400 shadow-md' 
                              : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}
                          `}
                          onClick={() => handleThemeColorChange(option.id)}
                          style={{
                            background: option.background,
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium text-white">{option.name}</span>
                            {settings.themeColor === option.id && (
                              <FiCheckCircle className="text-blue-400" />
                            )}
                          </div>
                          
                          <div className="flex space-x-2 mt-2">
                            <div 
                              className="w-8 h-8 rounded-full" 
                              style={{ backgroundColor: option.primary }}
                            ></div>
                            <div 
                              className="w-8 h-8 rounded-full" 
                              style={{ backgroundColor: option.secondary }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Visualization Defaults */}
            {activeSection === 'visualization' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 dark:text-white">Visualization Defaults</h2>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Default Graph Type
            </label>
            <select
                    value={settings.visualization_defaults.graph_type}
                    onChange={(e) => handleVisualizationChange('graph_type', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  >
                    <option>Bar Chart</option>
                    <option>Line Chart</option>
                    <option>Pie Chart</option>
                    <option>Force Graph</option>
                    <option>Tree View</option>
            </select>
          </div>
          
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable Animations
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Show animations in visualizations
                      </p>
                    </div>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none">
              <input
                type="checkbox"
                        id="toggle-animations"
                        checked={settings.visualization_defaults.enable_animations}
                        onChange={(e) => handleVisualizationChange('enable_animations', e.target.checked)}
                        className="sr-only"
                      />
                      <label
                        htmlFor="toggle-animations"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                          settings.visualization_defaults.enable_animations
                            ? 'bg-blue-500'
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                            settings.visualization_defaults.enable_animations ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        ></span>
            </label>
          </div>
        </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeSection === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 dark:text-white">Notification Settings</h2>
        
        <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable Notifications
            </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive updates and alerts
                      </p>
          </div>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none">
              <input
                type="checkbox"
                        id="toggle-notifications"
                        checked={settings.notifications.enabled}
                        onChange={(e) => handleNotificationChange('enabled', e.target.checked)}
                        className="sr-only"
                      />
                      <label
                        htmlFor="toggle-notifications"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                          settings.notifications.enabled
                            ? 'bg-blue-500'
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                            settings.notifications.enabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        ></span>
            </label>
          </div>
            </div>
        </div>
        
        <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notification Frequency
                  </label>
                  <select
                    value={settings.notifications.frequency}
                    onChange={(e) => handleNotificationChange('frequency', e.target.value)}
                    disabled={!settings.notifications.enabled}
                    className={`w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md ${
                      settings.notifications.enabled
                        ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <option value="real-time">Real-time</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            )}

            {/* System Settings */}
            {activeSection === 'system' && (
              <div>
                <h2 className="text-xl font-semibold mb-6 dark:text-white">System Settings</h2>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Auto-refresh
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Automatically refresh data
                      </p>
                    </div>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none">
              <input
                type="checkbox"
                        id="toggle-auto-refresh"
                        checked={settings.system.auto_refresh}
                        onChange={(e) => handleSystemChange('auto_refresh', e.target.checked)}
                        className="sr-only"
                      />
                      <label
                        htmlFor="toggle-auto-refresh"
                        className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                          settings.system.auto_refresh
                            ? 'bg-blue-500'
                            : 'bg-gray-300 dark:bg-gray-700'
                        }`}
                      >
                        <span
                          className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
                            settings.system.auto_refresh ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        ></span>
            </label>
          </div>
        </div>
        
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Auto-refresh Interval
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="900"
                    step="30"
                    value={settings.system.refresh_interval_seconds}
                    onChange={(e) => handleSystemChange('refresh_interval_seconds', parseInt(e.target.value))}
                    disabled={!settings.system.auto_refresh}
                    className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 ${
                      !settings.system.auto_refresh && 'opacity-50 cursor-not-allowed'
                    }`}
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>Off</span>
                    <span>30s</span>
                    <span>1m</span>
                    <span>5m</span>
                    <span>15m</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={resetToDefaults}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-400"
              >
                Reset to Defaults
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className={`px-4 py-2 bg-theme-primary hover:bg-theme-hover text-white font-medium rounded-md ${
                  saving && 'opacity-75 cursor-not-allowed'
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
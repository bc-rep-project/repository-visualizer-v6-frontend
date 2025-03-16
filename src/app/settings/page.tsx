'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/common/Button';

interface Settings {
  theme: {
    mode: string;
  };
  visualization: {
    defaultView: string;
    showLabels: boolean;
    labelFontSize: number;
  };
  notifications: {
    enableSound: boolean;
    showDesktopNotifications: boolean;
    notificationTypes: string[];
  };
  system: {
    autoUpdate: boolean;
    language: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('theme');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch settings on component mount
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

  const updateSettings = async (updatedSettings: Partial<Settings>) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/settings`,
        updatedSettings
      );
      setSettings(response.data);
      setSuccessMessage('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async (category?: string) => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const url = category 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/settings/reset?category=${category}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/settings/reset`;
      
      const response = await axios.post(url);
      setSettings(response.data);
      setSuccessMessage(category 
        ? `${category.charAt(0).toUpperCase() + category.slice(1)} settings reset to defaults!`
        : 'All settings reset to defaults!');
    
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError('Failed to reset settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (mode: string) => {
    if (!settings) return;
    
    const updatedSettings = {
      ...settings,
      theme: {
        ...settings.theme,
        mode
      }
    };
    
    setSettings(updatedSettings);
    updateSettings({ theme: { mode } });
  };

  const handleVisualizationChange = (key: string, value: any) => {
    if (!settings) return;
    
    const updatedSettings = {
      ...settings,
      visualization: {
        ...settings.visualization,
        [key]: value
      }
    };
    
    setSettings(updatedSettings);
    updateSettings({ 
      visualization: {
        ...settings.visualization,
        [key]: value 
      } 
    });
  };

  const handleNotificationChange = (key: string, value: any) => {
    if (!settings) return;
    
    const updatedSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    };
    
    setSettings(updatedSettings);
    updateSettings({ 
      notifications: {
        ...settings.notifications,
        [key]: value 
      } 
    });
  };

  const handleSystemChange = (key: string, value: any) => {
    if (!settings) return;
    
    const updatedSettings = {
      ...settings,
      system: {
        ...settings.system,
        [key]: value
      }
    };
    
    setSettings(updatedSettings);
    updateSettings({ 
      system: {
        ...settings.system,
        [key]: value 
      } 
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 dark:text-white">Settings</h1>

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
        
        {settings && (
          <div className="space-y-8">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'theme' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('theme')}
              >
                Theme
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'visualization' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('visualization')}
              >
                Visualization
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'notifications' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('notifications')}
              >
                Notifications
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeTab === 'system' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                onClick={() => setActiveTab('system')}
              >
                System
              </button>
            </div>
            
            {/* Theme Settings */}
            {activeTab === 'theme' && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2 dark:text-white">Theme Preferences</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Customize the appearance of the application.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="theme-mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Theme Mode
                    </label>
                    <select
                      id="theme-mode"
                      value={settings.theme.mode}
                      onChange={(e) => handleThemeChange(e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button 
                    variant="secondary" 
                    onClick={() => resetSettings('theme')}
                    disabled={saving}
                  >
                    Reset Theme Settings
                  </Button>
                </div>
              </div>
            )}
            
            {/* Visualization Settings */}
            {activeTab === 'visualization' && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2 dark:text-white">Visualization Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Customize how repository visualizations are displayed.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="default-view" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Default View
                    </label>
                    <select
                      id="default-view"
                      value={settings.visualization.defaultView}
                      onChange={(e) => handleVisualizationChange('defaultView', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="forceGraph">Force Graph</option>
                      <option value="treeMap">Tree Map</option>
                      <option value="sunburst">Sunburst</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="show-labels" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Show Labels
                      </label>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          id="show-labels"
                          checked={settings.visualization.showLabels}
                          onChange={(e) => handleVisualizationChange('showLabels', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`block w-14 h-8 rounded-full ${settings.visualization.showLabels ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.visualization.showLabels ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="label-font-size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Label Font Size: {settings.visualization.labelFontSize}px
                    </label>
                    <input
                      type="range"
                      id="label-font-size"
                      min="8"
                      max="24"
                      value={settings.visualization.labelFontSize}
                      onChange={(e) => handleVisualizationChange('labelFontSize', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button 
                    variant="secondary" 
                    onClick={() => resetSettings('visualization')}
                    disabled={saving}
                  >
                    Reset Visualization Settings
                  </Button>
                </div>
              </div>
            )}
            
            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2 dark:text-white">Notification Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Configure how you receive notifications.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="enable-sound" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable Sound
                      </label>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          id="enable-sound"
                          checked={settings.notifications.enableSound}
                          onChange={(e) => handleNotificationChange('enableSound', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`block w-14 h-8 rounded-full ${settings.notifications.enableSound ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.notifications.enableSound ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="show-desktop" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Show Desktop Notifications
                      </label>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          id="show-desktop"
                          checked={settings.notifications.showDesktopNotifications}
                          onChange={(e) => handleNotificationChange('showDesktopNotifications', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`block w-14 h-8 rounded-full ${settings.notifications.showDesktopNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.notifications.showDesktopNotifications ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notification Types
                    </label>
                    <div className="space-y-2">
                      {['error', 'warning', 'info', 'success'].map((type) => (
                        <div key={type} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`notification-type-${type}`}
                            checked={settings.notifications.notificationTypes.includes(type)}
                            onChange={(e) => {
                              const updatedTypes = e.target.checked
                                ? [...settings.notifications.notificationTypes, type]
                                : settings.notifications.notificationTypes.filter(t => t !== type);
                              handleNotificationChange('notificationTypes', updatedTypes);
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label htmlFor={`notification-type-${type}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button 
                    variant="secondary" 
                    onClick={() => resetSettings('notifications')}
                    disabled={saving}
                  >
                    Reset Notification Settings
                  </Button>
                </div>
              </div>
            )}
            
            {/* System Settings */}
            {activeTab === 'system' && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2 dark:text-white">System Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Configure general system settings.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="auto-update" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Auto Update
                      </label>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none">
                        <input
                          type="checkbox"
                          id="auto-update"
                          checked={settings.system.autoUpdate}
                          onChange={(e) => handleSystemChange('autoUpdate', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`block w-14 h-8 rounded-full ${settings.system.autoUpdate ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.system.autoUpdate ? 'transform translate-x-6' : ''}`}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Language
                    </label>
                    <select
                      id="language"
                      value={settings.system.language}
                      onChange={(e) => handleSystemChange('language', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button 
                    variant="secondary" 
                    onClick={() => resetSettings('system')}
                    disabled={saving}
                  >
                    Reset System Settings
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-8">
              <Button 
                onClick={() => resetSettings()} 
                variant="secondary" 
                className="mr-4"
                disabled={saving}
              >
                Reset All Settings
              </Button>
              <Button 
                onClick={fetchSettings}
                disabled={saving}
              >
                Refresh Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 
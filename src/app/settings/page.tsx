'use client';

// Mark page as client-side only to avoid static generation
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
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

// Define partial types for updates
type PartialSettings = Partial<Settings>;
type VisualizationUpdate = Partial<Settings['visualization']>;
type NotificationsUpdate = Partial<Settings['notifications']>;
type SystemUpdate = Partial<Settings['system']>;

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
    
    // Update the local state
    const updatedSettings = {
      ...settings,
      theme: {
        ...settings.theme,
        mode
      }
    };
    
    setSettings(updatedSettings);
    
    // Send only the updated theme object to the backend
    updateSettings({ 
      theme: { 
        mode 
      } 
    });
  };

  const handleVisualizationChange = (key: string, value: any) => {
    if (!settings) return;
    
    // Update local state
    const updatedSettings = {
      ...settings,
      visualization: {
        ...settings.visualization,
        [key]: value
      }
    };
    
    setSettings(updatedSettings);
    
    // Send only the updated visualization object to the backend
    const visualizationUpdate = {
      [key]: value
    };
    
    updateSettings({ 
      visualization: visualizationUpdate as any
    });
  };

  const handleNotificationChange = (key: string, value: any) => {
    if (!settings) return;
    
    // Update local state
    const updatedSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: value
      }
    };
    
    setSettings(updatedSettings);
    
    // Send only the updated notifications object to the backend
    const notificationsUpdate = {
      [key]: value
    };
    
    updateSettings({ 
      notifications: notificationsUpdate as any
    });
  };

  const handleSystemChange = (key: string, value: any) => {
    if (!settings) return;
    
    // Update local state
    const updatedSettings = {
      ...settings,
      system: {
        ...settings.system,
        [key]: value
      }
    };
    
    setSettings(updatedSettings);
    
    // Send only the updated system object to the backend
    const systemUpdate = {
      [key]: value
    };
    
    updateSettings({ 
      system: systemUpdate as any
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
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 mb-6 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
            <p>{successMessage}</p>
          </div>
        )}
        
        {settings && (
          <div className="space-y-6">
            {/* Tabs navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8" aria-label="Tabs">
                {['theme', 'visualization', 'notifications', 'system'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Theme settings */}
            {activeTab === 'theme' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Theme Preferences</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Customize the appearance of the application.
                  </p>
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
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <Button 
                    onClick={() => resetSettings('theme')}
                    disabled={saving}
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            )}
            
            {/* Visualization settings */}
            {activeTab === 'visualization' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Visualization Settings</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure how repository visualizations are displayed.
                  </p>
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
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="forceGraph">Force Graph</option>
                      <option value="tree">Tree</option>
                      <option value="sunburst">Sunburst</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="show-labels" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Labels
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        id="show-labels"
                        checked={settings.visualization.showLabels}
                        onChange={(e) => handleVisualizationChange('showLabels', e.target.checked)}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      />
                      <label
                        htmlFor="show-labels"
                        className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                      ></label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <label htmlFor="label-font-size" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Label Font Size: {settings.visualization.labelFontSize}px
                      </label>
                    </div>
                    <input
                      type="range"
                      id="label-font-size"
                      min={8}
                      max={24}
                      step={1}
                      value={settings.visualization.labelFontSize}
                      onChange={(e) => handleVisualizationChange('labelFontSize', parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <Button 
                    onClick={() => resetSettings('visualization')}
                    disabled={saving}
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            )}
            
            {/* Notifications settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Notification Settings</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure how you receive notifications.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label htmlFor="enable-sound" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable Sound
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        id="enable-sound"
                        checked={settings.notifications.enableSound}
                        onChange={(e) => handleNotificationChange('enableSound', e.target.checked)}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      />
                      <label
                        htmlFor="enable-sound"
                        className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                      ></label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label htmlFor="desktop-notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Show Desktop Notifications
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        id="desktop-notifications"
                        checked={settings.notifications.showDesktopNotifications}
                        onChange={(e) => handleNotificationChange('showDesktopNotifications', e.target.checked)}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      />
                      <label
                        htmlFor="desktop-notifications"
                        className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                      ></label>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notification Types
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {['error', 'warning', 'info', 'success'].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`notification-type-${type}`}
                            checked={settings.notifications.notificationTypes.includes(type)}
                            onChange={(e) => {
                              const types = e.target.checked
                                ? [...settings.notifications.notificationTypes, type]
                                : settings.notifications.notificationTypes.filter(t => t !== type);
                              handleNotificationChange('notificationTypes', types);
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label htmlFor={`notification-type-${type}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <Button 
                    onClick={() => resetSettings('notifications')}
                    disabled={saving}
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            )}
            
            {/* System settings */}
            {activeTab === 'system' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">System Settings</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure system-level settings.
                  </p>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label htmlFor="auto-update" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Auto Update
                    </label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none">
                      <input
                        type="checkbox"
                        id="auto-update"
                        checked={settings.system.autoUpdate}
                        onChange={(e) => handleSystemChange('autoUpdate', e.target.checked)}
                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                      />
                      <label
                        htmlFor="auto-update"
                        className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"
                      ></label>
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
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                    onClick={() => resetSettings('system')}
                    disabled={saving}
                  >
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={() => resetSettings()} 
            className="mr-4"
            disabled={saving}
          >
            Reset All Settings
          </Button>
        </div>
      </div>
    </Layout>
  );
} 
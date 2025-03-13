'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  max_repo_size_mb: number;
  default_visualization: 'graph' | 'treemap';
  enable_animations: boolean;
  auto_refresh: boolean;
  refresh_interval_seconds: number;
  notifications_enabled: boolean;
  last_updated: string;
}

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: 'light',
  max_repo_size_mb: 500,
  default_visualization: 'graph',
  enable_animations: true,
  auto_refresh: false,
  refresh_interval_seconds: 30,
  notifications_enabled: true,
  last_updated: new Date().toISOString()
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: false,
  error: null,
  updateSettings: async () => {}
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/settings`);
        setSettings(response.data);
        setError(null);
        
        // Apply theme immediately
        applyTheme(response.data.theme);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings');
        // Use default settings if API fails
        setSettings(defaultSettings);
        applyTheme(defaultSettings.theme);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!settings) return;
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Apply theme immediately if it changed
      if (newSettings.theme && newSettings.theme !== settings.theme) {
        applyTheme(newSettings.theme);
      }
      
      // Save to API
      await axios.put(`${API_URL}/api/settings`, updatedSettings);
    } catch (err) {
      console.error('Error updating settings:', err);
      throw new Error('Failed to update settings');
    }
  };

  const applyTheme = (theme: string) => {
    // Apply theme to document
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

  return (
    <SettingsContext.Provider value={{ settings, loading, error, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
} 
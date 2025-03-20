'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/services/api';

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  codeHighlightTheme: string;
  defaultVisualization: 'graph' | 'tree' | 'sunburst' | 'packedCircles';
  autoAnalyze: boolean;
  notificationsEnabled: boolean;
  language: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  theme: 'system',
  codeHighlightTheme: 'github',
  defaultVisualization: 'graph',
  autoAnalyze: false,
  notificationsEnabled: true,
  language: 'en',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/settings');
      setSettings({ ...defaultSettings, ...response.data });
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
      // Use default settings on error
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<Settings>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Optimistically update local state
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      // Save changes to API
      await api.put('/api/settings', newSettings);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
      
      // Restore previous settings on error
      await fetchSettings();
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/api/settings/reset');
      setSettings(response.data.settings);
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError('Failed to reset settings');
    } finally {
      setLoading(false);
    }
  };

  // Load settings on initial mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Apply theme preference
  useEffect(() => {
    if (settings.theme === 'system') {
      // Use system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Listen for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Use explicit theme preference
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}; 
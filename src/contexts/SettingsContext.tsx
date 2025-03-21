'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/services/api';
import { repositoryApi } from '@/services/api';

export interface AutoSaveSettings {
  repositories: boolean;
  analysis: boolean;
  enhancedAnalysis: boolean;
  interval: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  codeHighlightTheme: string;
  defaultVisualization: 'graph' | 'tree' | 'sunburst' | 'packedCircles';
  autoAnalyze: boolean;
  autoSave: AutoSaveSettings;
  notificationsEnabled: boolean;
  language: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  updateAutoSave: (feature: keyof AutoSaveSettings, value: boolean | number) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const defaultSettings: Settings = {
  theme: 'system',
  codeHighlightTheme: 'github',
  defaultVisualization: 'graph',
  autoAnalyze: false,
  autoSave: {
    repositories: true,
    analysis: false,
    enhancedAnalysis: false,
    interval: 30
  },
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
  
  const updateAutoSave = async (feature: keyof AutoSaveSettings, value: boolean | number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create updated auto-save settings
      const updatedAutoSave = { 
        ...settings.autoSave, 
        [feature]: value 
      };
      
      // Optimistically update local state
      const updatedSettings = { 
        ...settings, 
        autoSave: updatedAutoSave 
      };
      setSettings(updatedSettings);
      
      // Save changes to API
      await repositoryApi.updateAutoSaveSettings({ [feature]: value });
    } catch (err) {
      console.error('Error updating auto-save settings:', err);
      setError('Failed to update auto-save settings');
      
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

  // Synchronize theme with system preference
  useEffect(() => {
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Set initial theme based on system preference
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
      
      // Update theme when system preference changes
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      // Set theme based on user preference
      document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    }
  }, [settings.theme]);

  return (
    <SettingsContext.Provider 
      value={{ 
        settings, 
        loading, 
        error, 
        updateSettings, 
        updateAutoSave,
        resetSettings 
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}; 
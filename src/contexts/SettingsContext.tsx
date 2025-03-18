'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AppSettings {
  theme: {
    mode: string;
    accentColor: string;
    fontSize: string;
  };
  visualization: {
    defaultView: string;
    enableAnimations: boolean;
    nodeSize: string;
    showLabels: boolean;
  };
  notifications: {
    enableSound: boolean;
    enablePopups: boolean;
    notifyOnUpdates: boolean;
    emailNotifications: boolean;
  };
  system: {
    autoUpdate: boolean;
    updateInterval: number;
    logLevel: string;
    dataCache: boolean;
  };
  last_updated: string;
}

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
}

const defaultSettings: AppSettings = {
  theme: {
    mode: 'light',
    accentColor: '#4a90e2',
    fontSize: 'medium'
  },
  visualization: {
    defaultView: 'forceGraph',
    enableAnimations: true,
    nodeSize: 'medium',
    showLabels: true
  },
  notifications: {
    enableSound: true,
    enablePopups: true,
    notifyOnUpdates: true,
    emailNotifications: false
  },
  system: {
    autoUpdate: false,
    updateInterval: 30,
    logLevel: 'info',
    dataCache: true
  },
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
        applyTheme(response.data.theme.mode);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings');
        // Use default settings if API fails
        setSettings(defaultSettings);
        applyTheme(defaultSettings.theme.mode);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!settings) return;
    
    try {
      // Create a deep copy of current settings
      const updatedSettings = JSON.parse(JSON.stringify(settings));
      
      // Apply updates (handles nested objects correctly)
      Object.keys(newSettings).forEach(key => {
        if (key === 'last_updated') return; // Skip last_updated which is handled by backend
        
        if (typeof newSettings[key as keyof AppSettings] === 'object' && newSettings[key as keyof AppSettings] !== null) {
          // Handle nested object updates
          const categoryKey = key as keyof AppSettings;
          const currentSettings = updatedSettings[categoryKey] as Record<string, any>;
          const newCategorySettings = newSettings[categoryKey] as Record<string, any>;
          
          updatedSettings[categoryKey] = {
            ...currentSettings,
            ...newCategorySettings
          };
        } else {
          // Handle top-level primitive updates
          updatedSettings[key as keyof AppSettings] = newSettings[key as keyof AppSettings];
        }
      });
      
      // Update local state with the updated settings
      setSettings(updatedSettings);
      
      // Apply theme immediately if it changed
      if (newSettings.theme?.mode && newSettings.theme.mode !== settings.theme.mode) {
        applyTheme(newSettings.theme.mode);
      }
      
      // Send update to backend - only send the changed parts
      await axios.patch(`${API_URL}/api/settings`, newSettings);
      
      return updatedSettings;
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
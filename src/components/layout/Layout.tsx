'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useSettings } from '@/contexts/SettingsContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { settings, loading } = useSettings();

  // Apply global settings whenever they change
  useEffect(() => {
    if (!settings || loading) return;

    // Apply various settings to the app
    const applyGlobalSettings = () => {
      // Apply theme settings
      if (settings.theme.mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (settings.theme.mode === 'light') {
        document.documentElement.classList.remove('dark');
      }

      // Apply font size
      if (settings.theme.fontSize) {
        const fontSize = settings.theme.fontSize;
        document.documentElement.style.setProperty('--base-font-size', 
          fontSize === 'small' ? '0.875rem' : 
          fontSize === 'large' ? '1.125rem' : 
          '1rem'); // medium or default
      }
      
      // Apply accent color if available
      if (settings.theme.accentColor) {
        document.documentElement.style.setProperty('--accent-color', settings.theme.accentColor);
      }
      
      // Apply animation settings
      if (settings.visualization?.enableAnimations !== undefined) {
        if (!settings.visualization.enableAnimations) {
          document.documentElement.style.setProperty('--animation-duration', '0s');
        } else {
          document.documentElement.style.setProperty('--animation-duration', '0.3s');
        }
      }
    };
    
    applyGlobalSettings();
  }, [settings, loading]);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />
      <div className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
} 
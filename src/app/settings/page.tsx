'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import api from '@/services/api';
import Layout from '@/components/layout/Layout';

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
      const response = await api.get(`/api/settings`);
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
      const response = await api.patch(
        `/api/settings`,
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
        ? `/api/settings/reset?category=${category}`
        : `/api/settings/reset`;
      
      const response = await api.post(url);
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
    
    // Create a partial update with the specific key-value pair
    const visualizationUpdate: VisualizationUpdate = {
      [key]: value
    };
    
    updateSettings({ 
      visualization: visualizationUpdate as Settings['visualization']
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
    
    // Create a partial update with the specific key-value pair
    const notificationsUpdate: NotificationsUpdate = {
      [key]: value
    };
    
    updateSettings({ 
      notifications: notificationsUpdate as Settings['notifications']
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
    
    // Create a partial update with the specific key-value pair
    const systemUpdate: SystemUpdate = {
      [key]: value
    };
    
    updateSettings({ 
      system: systemUpdate as Settings['system']
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
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert className="mb-6 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        {settings && (
          <Tabs defaultValue="theme" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="visualization">Visualization</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            
            <TabsContent value="theme">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Preferences</CardTitle>
                  <CardDescription>
                    Customize the appearance of the application.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="theme-mode">Theme Mode</Label>
                    <Select 
                      value={settings.theme.mode} 
                      onValueChange={handleThemeChange}
                    >
                      <SelectTrigger id="theme-mode">
                        <SelectValue placeholder="Select theme mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="secondary" 
                    onClick={() => resetSettings('theme')}
                    disabled={saving}
                  >
                    Reset to Defaults
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="visualization">
              <Card>
                <CardHeader>
                  <CardTitle>Visualization Settings</CardTitle>
                  <CardDescription>
                    Configure how repository visualizations are displayed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="default-view">Default View</Label>
                    <Select 
                      value={settings.visualization.defaultView} 
                      onValueChange={(value) => handleVisualizationChange('defaultView', value)}
                    >
                      <SelectTrigger id="default-view">
                        <SelectValue placeholder="Select default view" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="forceGraph">Force Graph</SelectItem>
                        <SelectItem value="tree">Tree</SelectItem>
                        <SelectItem value="sunburst">Sunburst</SelectItem>
                      </SelectContent>
                    </Select>
          </div>
          
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-labels">Show Labels</Label>
                    <Switch 
                      id="show-labels" 
                      checked={settings.visualization.showLabels}
                      onCheckedChange={(checked) => handleVisualizationChange('showLabels', checked)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="label-font-size">Label Font Size: {settings.visualization.labelFontSize}px</Label>
                    </div>
                    <Slider
                      id="label-font-size"
                      min={8}
                      max={24}
                      step={1}
                      value={[settings.visualization.labelFontSize]}
                      onValueChange={(value) => handleVisualizationChange('labelFontSize', value[0])}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="secondary" 
                    onClick={() => resetSettings('visualization')}
                    disabled={saving}
                  >
                    Reset to Defaults
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure how you receive notifications.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-sound">Enable Sound</Label>
                    <Switch 
                      id="enable-sound" 
                      checked={settings.notifications.enableSound}
                      onCheckedChange={(checked) => handleNotificationChange('enableSound', checked)}
                    />
              </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="desktop-notifications">Show Desktop Notifications</Label>
                    <Switch 
                      id="desktop-notifications" 
                      checked={settings.notifications.showDesktopNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('showDesktopNotifications', checked)}
                    />
          </div>
                  
                  <div className="space-y-2">
                    <Label>Notification Types</Label>
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
                          <Label htmlFor={`notification-type-${type}`} className="capitalize">
                            {type}
                          </Label>
          </div>
                      ))}
            </div>
        </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="secondary" 
                    onClick={() => resetSettings('notifications')}
                    disabled={saving}
                  >
                    Reset to Defaults
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure system-level settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-update">Auto Update</Label>
                    <Switch 
                      id="auto-update" 
                      checked={settings.system.autoUpdate}
                      onCheckedChange={(checked) => handleSystemChange('autoUpdate', checked)}
                    />
        </div>
        
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={settings.system.language} 
                      onValueChange={(value) => handleSystemChange('language', value)}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="secondary" 
                    onClick={() => resetSettings('system')}
                    disabled={saving}
                  >
                    Reset to Defaults
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}
        
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={() => resetSettings()} 
            variant="secondary" 
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
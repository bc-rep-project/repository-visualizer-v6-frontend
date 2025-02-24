import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/common/Button';
import { repositoryApi } from '@/services/api';

interface Settings {
    max_repo_size: string;
    default_branch: string;
    auto_cleanup: string;
    cleanup_after_days: number;
}

export default function Settings() {
    const [settings, setSettings] = useState<Settings>({
        max_repo_size: '1000MB',
        default_branch: 'main',
        auto_cleanup: 'true',
        cleanup_after_days: 30
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await repositoryApi.getSettings();
                setSettings(data);
            } catch (error) {
                setMessage({
                    type: 'error',
                    text: 'Failed to load settings'
                });
            }
        };

        fetchSettings();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage(null);

        try {
            await repositoryApi.updateSettings(settings);
            setMessage({
                type: 'success',
                text: 'Settings updated successfully'
            });
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Failed to update settings'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
                </div>

                <div className="p-6 bg-card rounded-lg border">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Maximum Repository Size
                                </label>
                                <input
                                    type="text"
                                    value={settings.max_repo_size}
                                    onChange={(e) => setSettings({ ...settings, max_repo_size: e.target.value })}
                                    className="input w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Default Branch
                                </label>
                                <input
                                    type="text"
                                    value={settings.default_branch}
                                    onChange={(e) => setSettings({ ...settings, default_branch: e.target.value })}
                                    className="input w-full"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Auto Cleanup
                                </label>
                                <select
                                    value={settings.auto_cleanup}
                                    onChange={(e) => setSettings({ ...settings, auto_cleanup: e.target.value })}
                                    className="input w-full"
                                >
                                    <option value="true">Enabled</option>
                                    <option value="false">Disabled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Cleanup After (Days)
                                </label>
                                <input
                                    type="number"
                                    value={settings.cleanup_after_days}
                                    onChange={(e) => setSettings({ ...settings, cleanup_after_days: parseInt(e.target.value) })}
                                    className="input w-full"
                                    min="1"
                                    max="365"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={`p-4 rounded-md ${
                                message.type === 'success' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-destructive/10 text-destructive-foreground'
                            }`}>
                                {message.text}
                            </div>
                        )}

                        <Button type="submit" isLoading={isSaving}>
                            Save Settings
                        </Button>
                    </form>
                </div>
            </div>
        </Layout>
    );
} 
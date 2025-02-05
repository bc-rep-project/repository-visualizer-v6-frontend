import { useState, useEffect } from 'react';
import { api, ConversionResponse } from '../utils/api';
import { RepositoryVisualization } from '../components/RepositoryVisualization';

export default function Home() {
    const [repoUrl, setRepoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<string | null>(null);
    const [analysisData, setAnalysisData] = useState<ConversionResponse['analysis'] | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setProgress('Starting repository clone...');

        try {
            // Clone repository
            const cloneResponse = await api.cloneRepository(repoUrl);
            setProgress('Repository cloned successfully. Starting conversion...');

            // Start polling for progress
            const pollInterval = setInterval(async () => {
                try {
                    const progressResponse = await api.getProgress(cloneResponse.repo_id);
                    setProgress(progressResponse.progress);
                } catch (err) {
                    console.error('Failed to fetch progress:', err);
                }
            }, 1000);

            // Convert repository
            const conversionResponse = await api.convertRepository(cloneResponse.repo_path);
            clearInterval(pollInterval);
            setProgress('Conversion complete!');
            setAnalysisData(conversionResponse.analysis);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container">
            <main>
                <h1>Repository Visualization</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="text"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="Enter GitHub repository URL"
                            required
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? 'Processing...' : 'Analyze Repository'}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="error">
                        {error}
                    </div>
                )}

                {progress && (
                    <div className="progress">
                        {progress}
                    </div>
                )}

                {analysisData && (
                    <div className="visualization">
                        <h2>Repository Analysis</h2>
                        <div className="stats">
                            <p>Total Files: {analysisData.repository_stats.total_files}</p>
                            <p>File Extensions: {analysisData.repository_stats.extensions.join(', ')}</p>
                        </div>
                        <RepositoryVisualization data={analysisData} />
                    </div>
                )}
            </main>

            <style jsx>{`
                .container {
                    min-height: 100vh;
                    padding: 2rem;
                    background: #f5f5f5;
                }

                main {
                    max-width: 1200px;
                    margin: 0 auto;
                }

                h1 {
                    text-align: center;
                    margin-bottom: 2rem;
                    color: #333;
                }

                .input-group {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                input {
                    flex: 1;
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                }

                button {
                    padding: 0.75rem 1.5rem;
                    background: #0070f3;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 1rem;
                }

                button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }

                .error {
                    padding: 1rem;
                    background: #fee;
                    border: 1px solid #fcc;
                    border-radius: 4px;
                    color: #c00;
                    margin-bottom: 1rem;
                }

                .progress {
                    padding: 1rem;
                    background: #e8f5e9;
                    border: 1px solid #c8e6c9;
                    border-radius: 4px;
                    color: #2e7d32;
                    margin-bottom: 1rem;
                }

                .visualization {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .stats {
                    margin-bottom: 2rem;
                    padding: 1rem;
                    background: #f8f9fa;
                    border-radius: 4px;
                }

                .stats p {
                    margin: 0.5rem 0;
                    color: #666;
                }
            `}</style>
        </div>
    );
} 
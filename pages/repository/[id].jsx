import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import RepositoryLanguagesChart from '../../components/RepositoryLanguagesChart';

/**
 * Repository detail page component
 * @returns {JSX.Element} The rendered page
 */
const RepositoryDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [repository, setRepository] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enhancedView, setEnhancedView] = useState(false);

  useEffect(() => {
    // Only fetch when we have an ID from the router
    if (!id) {
      return;
    }

    const fetchRepository = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/repositories/${id}`);
        
        // Make sure we have data
        if (response.data) {
          setRepository(response.data);
        } else {
          throw new Error('Repository not found');
        }
      } catch (err) {
        console.error('Error loading repository:', err);
        setError('Failed to load repository data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRepository();
  }, [id]);

  const handleAnalyze = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      await axios.post(`/api/repositories/${id}/analyze`);
      
      // Refetch repository data
      const response = await axios.get(`/api/repositories/${id}`);
      setRepository(response.data);
    } catch (err) {
      console.error('Error analyzing repository:', err);
      setError('Failed to analyze repository. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this repository?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/repositories/${id}`);
      router.push('/');
    } catch (err) {
      console.error('Error deleting repository:', err);
      setError('Failed to delete repository. Please try again.');
    }
  };

  const toggleEnhancedView = () => {
    setEnhancedView(prev => !prev);
  };

  if (loading && !repository) {
    return (
      <div className="repository-detail loading">
        <div className="loading-spinner">Loading repository data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="repository-detail error">
        <div className="error-message">{error}</div>
        <button 
          onClick={() => router.push('/')}
          className="back-button"
        >
          Back to Repositories
        </button>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="repository-detail not-found">
        <div className="not-found-message">Repository not found</div>
        <button 
          onClick={() => router.push('/')}
          className="back-button"
        >
          Back to Repositories
        </button>
      </div>
    );
  }

  // Format the timestamp
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format file size
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="repository-detail">
      <div className="repository-header">
        <div className="header-main">
          <h1 className="repository-name">{repository.repo_name}</h1>
          <div className="repository-status">{repository.status}</div>
        </div>
        <a 
          href={repository.repo_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="repository-url"
        >
          {repository.repo_url}
        </a>
      </div>

      <div className="repository-stats">
        <div className="stat-card">
          <div className="stat-value">{repository.file_count || 0}</div>
          <div className="stat-label">Files</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{repository.directory_count || 0}</div>
          <div className="stat-label">Directories</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatSize(repository.total_size || 0)}</div>
          <div className="stat-label">Total Size</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatDate(repository.updated_at)}</div>
          <div className="stat-label">Last Updated</div>
        </div>
      </div>

      <div className="repository-actions">
        <button 
          onClick={handleAnalyze}
          className="action-button analyze"
          disabled={loading || repository.status === 'pending'}
        >
          {loading ? 'Processing...' : 'Analyze'}
        </button>
        <button 
          onClick={toggleEnhancedView}
          className={`action-button enhanced ${enhancedView ? 'active' : ''}`}
        >
          {enhancedView ? 'Simple View' : 'Enhanced View'}
        </button>
        <button 
          onClick={handleDelete}
          className="action-button delete"
        >
          Delete
        </button>
      </div>

      {/* Use our language component */}
      <RepositoryLanguagesChart repositoryId={id} />

      <style jsx>{`
        .repository-detail {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .repository-header {
          margin-bottom: 20px;
        }
        
        .header-main {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .repository-name {
          margin: 0;
          font-size: 24px;
        }
        
        .repository-status {
          padding: 5px 10px;
          border-radius: 20px;
          font-size: 14px;
          background-color: #edf2f7;
          text-transform: capitalize;
        }
        
        .repository-status.pending {
          background-color: #feebc8;
          color: #c05621;
        }
        
        .repository-status.completed {
          background-color: #c6f6d5;
          color: #2f855a;
        }
        
        .repository-status.failed {
          background-color: #fed7d7;
          color: #c53030;
        }
        
        .repository-url {
          display: block;
          margin-top: 5px;
          color: #4299e1;
          text-decoration: none;
        }
        
        .repository-url:hover {
          text-decoration: underline;
        }
        
        .repository-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          text-align: center;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .stat-label {
          color: #718096;
          font-size: 14px;
        }
        
        .repository-actions {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .action-button {
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-weight: 500;
        }
        
        .action-button.analyze {
          background-color: #4299e1;
          color: white;
        }
        
        .action-button.analyze:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
        }
        
        .action-button.enhanced {
          background-color: #e2e8f0;
          color: #2d3748;
        }
        
        .action-button.enhanced.active {
          background-color: #4a5568;
          color: white;
        }
        
        .action-button.delete {
          background-color: #e53e3e;
          color: white;
          margin-left: auto;
        }
        
        .loading, .error, .not-found {
          text-align: center;
          padding: 100px 0;
        }
        
        .loading-spinner, .error-message, .not-found-message {
          font-size: 18px;
          margin-bottom: 20px;
        }
        
        .error-message {
          color: #e53e3e;
        }
        
        .back-button {
          padding: 8px 16px;
          background-color: #4299e1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default RepositoryDetail; 
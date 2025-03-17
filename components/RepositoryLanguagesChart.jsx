import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Component for displaying languages used in repositories with a visual chart
 * 
 * @param {Object} props Component props
 * @param {string} props.repositoryId Optional repository ID to fetch languages for a specific repo
 * @returns {JSX.Element} The rendered component
 */
const RepositoryLanguagesChart = ({ repositoryId }) => {
  // State to store languages data
  const [languages, setLanguages] = useState({});
  // State to track loading status
  const [loading, setLoading] = useState(true);
  // State to store any error message
  const [error, setError] = useState(null);
  // State to toggle between list and chart view
  const [showChart, setShowChart] = useState(true);

  // These colors will be used for the language bars
  const languageColors = {
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    Python: '#3572A5',
    Java: '#b07219',
    HTML: '#e34c26',
    CSS: '#563d7c',
    SCSS: '#c6538c',
    PHP: '#4F5D95',
    Ruby: '#701516',
    Go: '#00ADD8',
    Rust: '#dea584',
    C: '#555555',
    'C++': '#f34b7d',
    'C#': '#178600',
    Shell: '#89e051',
    // Default color for other languages
    default: '#cccccc'
  };

  useEffect(() => {
    // Function to fetch languages from the API
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Determine which endpoint to use based on whether a repository ID is provided
        const endpoint = repositoryId 
          ? `/api/repositories/${repositoryId}/languages`
          : '/api/repositories/languages';
        
        const response = await axios.get(endpoint);
        
        // The API returns an object where keys are language names and values are counts
        // Make sure we have a valid object, even if response.data is null/undefined
        const languageData = response.data || {};
        
        // Update state with the fetched languages
        setLanguages(languageData);
      } catch (err) {
        console.error('Error loading languages:', err);
        setError('Failed to load languages. Please try again.');
        // Ensure we have an empty object to prevent iteration errors
        setLanguages({});
      } finally {
        setLoading(false);
      }
    };

    // Call the fetch function when the component mounts or repositoryId changes
    fetchLanguages();
  }, [repositoryId]);

  // Toggle between list and chart view
  const toggleView = () => {
    setShowChart(prev => !prev);
  };

  // If we're still loading, show a loading indicator
  if (loading) {
    return <div className="languages-loading">Loading languages...</div>;
  }

  // If there was an error, show the error message
  if (error) {
    return <div className="languages-error">{error}</div>;
  }

  // Get the language entries as an array to make it iterable
  // This is crucial to avoid "not iterable" errors
  const languageEntries = Object.entries(languages);

  // If there are no languages, show a message
  if (languageEntries.length === 0) {
    return <div className="languages-empty">No languages detected</div>;
  }

  // Calculate total for percentage calculation
  const total = languageEntries.reduce((sum, [_, count]) => sum + count, 0);

  // Sort languages by count (descending)
  const sortedLanguages = languageEntries.sort((a, b) => b[1] - a[1]);

  // Render the languages as a list or chart
  return (
    <div className="repository-languages">
      <div className="languages-header">
        <h3>Languages</h3>
        <button 
          onClick={toggleView}
          className="view-toggle-button"
        >
          {showChart ? 'Show List' : 'Show Chart'}
        </button>
      </div>

      {showChart ? (
        <div className="languages-chart">
          {sortedLanguages.map(([language, count]) => {
            const percentage = (count / total * 100).toFixed(1);
            const color = languageColors[language] || languageColors.default;
            
            return (
              <div key={language} className="chart-bar-container">
                <div className="chart-label">
                  <span className="language-name">{language}</span>
                  <span className="language-percentage">{percentage}%</span>
                </div>
                <div 
                  className="chart-bar" 
                  style={{ 
                    width: `${percentage}%`, 
                    backgroundColor: color,
                    minWidth: '2%' // Ensure very small percentages are still visible
                  }}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="languages-list">
          {sortedLanguages.map(([language, count]) => {
            const percentage = (count / total * 100).toFixed(1);
            
            return (
              <li key={language} className="language-item">
                <span className="language-name">{language}</span>
                <div className="language-stats">
                  <span className="language-count">{count} files</span>
                  <span className="language-percentage">({percentage}%)</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      
      <style jsx>{`
        .repository-languages {
          margin: 20px 0;
          padding: 15px;
          border-radius: 8px;
          background-color: #f8f9fa;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .languages-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .view-toggle-button {
          padding: 5px 10px;
          border-radius: 4px;
          background-color: #4a5568;
          color: white;
          border: none;
          cursor: pointer;
        }
        
        .languages-list {
          list-style-type: none;
          padding: 0;
        }
        
        .language-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        
        .language-stats {
          display: flex;
          gap: 10px;
          color: #666;
        }
        
        .chart-bar-container {
          margin-bottom: 10px;
        }
        
        .chart-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        
        .chart-bar {
          height: 20px;
          border-radius: 3px;
          transition: width 0.5s ease;
        }
        
        .languages-loading, .languages-error, .languages-empty {
          padding: 20px;
          text-align: center;
          color: #666;
        }
        
        .languages-error {
          color: #e53e3e;
        }
      `}</style>
    </div>
  );
};

export default RepositoryLanguagesChart; 
import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Component for displaying languages used in repositories
 * 
 * @param {Object} props Component props
 * @param {string} props.repositoryId Optional repository ID to fetch languages for a specific repo
 * @returns {JSX.Element} The rendered component
 */
const RepositoryLanguages = ({ repositoryId }) => {
  // State to store languages data
  const [languages, setLanguages] = useState({});
  // State to track loading status
  const [loading, setLoading] = useState(true);
  // State to store any error message
  const [error, setError] = useState(null);

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

  // Render the languages as a list
  return (
    <div className="repository-languages">
      <h3>Languages</h3>
      <ul className="languages-list">
        {/* Map over the entries array (which is definitely iterable) */}
        {languageEntries.map(([language, count]) => (
          <li key={language} className="language-item">
            <span className="language-name">{language}</span>
            <span className="language-count">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RepositoryLanguages; 
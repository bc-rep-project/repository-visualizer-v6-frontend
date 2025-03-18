import { useState, useEffect } from 'react';
import axios from 'axios';

const RepositoryLanguages = () => {
  const [languages, setLanguages] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      console.log("DEBUG: Starting to fetch languages");
      try {
        setLoading(true);
        
        console.log("DEBUG: Making API request to /api/repositories/languages");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/repositories/languages`
        );
        
        console.log("DEBUG: API response received:", response);
        console.log("DEBUG: Response status:", response.status);
        console.log("DEBUG: Response headers:", response.headers);
        console.log("DEBUG: Response data:", response.data);
        console.log("DEBUG: Type of response.data:", typeof response.data);
        console.log("DEBUG: Is response.data an object?", typeof response.data === 'object');
        console.log("DEBUG: Is response.data an array?", Array.isArray(response.data));
        
        if (response.data === null) {
          console.error("DEBUG: response.data is null");
          setError(new Error('Received null response from API'));
          return;
        }

        if (typeof response.data !== 'object') {
          console.error("DEBUG: response.data is not an object:", response.data);
          setError(new Error(`Expected object but got ${typeof response.data}`));
          return;
        }

        if (Array.isArray(response.data)) {
          console.warn("DEBUG: response.data is an array, not an object:", response.data);
          // Convert array to object if needed
          const languagesObj: Record<string, number> = {};
          response.data.forEach((item: any) => {
            if (item && item.name) {
              languagesObj[item.name] = item.count || 1;
            }
          });
          console.log("DEBUG: Converted array to object:", languagesObj);
          setLanguages(languagesObj);
        } else {
          // It's a proper object
          console.log("DEBUG: Setting languages state with object:", response.data);
          setLanguages(response.data);
        }
      } catch (err) {
        console.error("DEBUG: Error fetching languages:", err);
        if (err instanceof Error) {
          console.error("DEBUG: Error name:", err.name);
          console.error("DEBUG: Error message:", err.message);
          console.error("DEBUG: Error stack:", err.stack);
          
          if ('response' in err && err.response) {
            // @ts-ignore - axios error
            console.error("DEBUG: Error response status:", err.response.status);
            // @ts-ignore - axios error
            console.error("DEBUG: Error response data:", err.response.data);
          }
          
          setError(err);
        } else {
          setError(new Error('Unknown error occurred'));
        }
      } finally {
        setLoading(false);
        console.log("DEBUG: Finished fetching languages");
      }
    };

    fetchLanguages();
  }, []);

  // Debug render information
  console.log("DEBUG: Rendering RepositoryLanguages component");
  console.log("DEBUG: Current languages state:", languages);
  console.log("DEBUG: Loading state:", loading);
  console.log("DEBUG: Error state:", error);
  
  // Add debug logging for iteration outside JSX to avoid linter errors
  useEffect(() => {
    if (!loading && !error && languages) {
      console.log("DEBUG: About to iterate over languages:", languages);
      console.log("DEBUG: Object.entries(languages) =", Object.entries(languages));
      
      Object.entries(languages).forEach(([language, count]) => {
        console.log("DEBUG: Language item:", language, count);
      });
    }
  }, [languages, loading, error]);

  // Always render the current state for debugging
  return (
    <div className="languages-container">
      <h3 className="text-lg font-medium mb-2">Languages Used:</h3>
      
      {/* DEBUG VIEW - always show this for debugging */}
      <div className="border border-gray-300 p-3 mb-4 bg-gray-50 rounded text-sm">
        <h4 className="font-bold mb-2">Debug Information</h4>
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>Error: {error ? error.message : 'none'}</div>
        <div>Languages type: {typeof languages}</div>
        <div>Is languages object: {typeof languages === 'object' ? 'true' : 'false'}</div>
        <div>Is languages array: {Array.isArray(languages) ? 'true' : 'false'}</div>
        <div>Languages keys: {Object.keys(languages).join(', ') || 'none'}</div>
        <div>Raw languages data: <pre>{JSON.stringify(languages, null, 2)}</pre></div>
      </div>
      
      {/* REGULAR VIEW */}
      {loading ? (
        <div className="text-gray-500">Loading language information...</div>
      ) : error ? (
        <div className="text-red-500">Error loading languages: {error.message}</div>
      ) : !languages || Object.keys(languages).length === 0 ? (
        <div className="text-gray-500">No language information available</div>
      ) : (
        <ul className="space-y-2">
          {/* 
            CRITICAL DEBUGGING POINT: This is where we try to iterate, 
            and where the "t is not iterable" error likely occurs
          */}
          {Object.entries(languages).map(([language, count]) => (
            <li key={language} className="flex justify-between items-center border-b pb-1">
              <span className="font-medium">{language}</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                {count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RepositoryLanguages; 
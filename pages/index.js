import { useState } from 'react';
import Visualization from '../components/Visualization';

export default function Home() {
  const [repoUrl, setRepoUrl] = useState('');
  const [repoPath, setRepoPath] = useState('');
  const [jsonData, setJsonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (event) => {
    setRepoUrl(event.target.value);
  };

  const handleClone = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repo_url: repoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clone repository');
      }

      const data = await response.json();
      setRepoPath(data.repo_path); // Set the repo path here
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/convert`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ repo_path: repoPath }), // Use the repo path from state
      });
  
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to convert repository');
      }
  
      const data = await response.json();
  
      // Fetch the generated JSON data from the public folder of the backend
      const jsonResponse = await fetch(`${data.json_path}`);
      if (!jsonResponse.ok) {
          throw new Error('Failed to fetch JSON data');
      }
      const fetchedJsonData = await jsonResponse.json();
      setJsonData(fetchedJsonData);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div>
      <h1>GitHub Repo Visualization</h1>
      <div>
        <input type="text" value={repoUrl} onChange={handleInputChange} placeholder="Enter GitHub repo URL" />
        <button onClick={handleClone} disabled={loading}>
          Clone Repo
        </button>
        <button onClick={handleConvert} disabled={loading || !repoPath}>
          Convert to JSON
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}

      {jsonData && <Visualization data={jsonData} />}
    </div>
  );
}
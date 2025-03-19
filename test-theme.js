// Test script to demonstrate theme management
const API_URL = 'http://localhost:8000';

// Function to fetch settings from API
async function fetchSettings() {
  try {
    const response = await fetch(`${API_URL}/api/settings`);
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
}

// Function to update settings via API
async function updateTheme(mode) {
  try {
    const response = await fetch(`${API_URL}/api/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        theme: {
          mode: mode // 'light', 'dark', or 'system'
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update theme');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating theme:', error);
    return null;
  }
}

// Function to apply theme to document
function applyTheme(theme) {
  console.log(`Applying theme: ${theme}`);
  
  if (theme === 'dark') {
    // Apply dark mode
    console.log('Adding dark class to document');
    document.documentElement.classList.add('dark');
  } else if (theme === 'light') {
    // Apply light mode
    console.log('Removing dark class from document');
    document.documentElement.classList.remove('dark');
  } else if (theme === 'system') {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log(`System preference is dark: ${prefersDark}`);
    
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

// Example usage
async function initializeTheme() {
  const settings = await fetchSettings();
  if (settings && settings.theme) {
    applyTheme(settings.theme.mode);
  }
}

// Theme toggle function (as would be used in settings page)
async function toggleTheme() {
  const settings = await fetchSettings();
  const currentTheme = settings?.theme?.mode || 'light';
  
  // Toggle between light and dark
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  const updatedSettings = await updateTheme(newTheme);
  if (updatedSettings && updatedSettings.theme) {
    applyTheme(updatedSettings.theme.mode);
  }
}

// Test all theme options
async function testAllThemes() {
  console.log('Setting theme to light...');
  await updateTheme('light');
  
  setTimeout(async () => {
    console.log('Setting theme to dark...');
    await updateTheme('dark');
    
    setTimeout(async () => {
      console.log('Setting theme to system...');
      await updateTheme('system');
    }, 2000);
  }, 2000);
}

// Run the test when loaded in browser
console.log('Theme test initialized');
// Call initializeTheme() to start with current settings
// Call toggleTheme() to toggle between light and dark
// Call testAllThemes() to cycle through all themes 
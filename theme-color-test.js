// Theme Color Test Script
const API_URL = 'http://localhost:8000';

// Available theme colors
const themeColors = ['default', 'midnight', 'ocean', 'forest', 'ember'];

// Function to apply theme color to document
function applyThemeColor(color) {
  // Remove all theme color classes first
  document.documentElement.classList.remove(
    'theme-default',
    'theme-midnight',
    'theme-ocean',
    'theme-forest',
    'theme-ember'
  );
  
  // Add the selected theme color class
  document.documentElement.classList.add(`theme-${color}`);
  
  // Make sure dark mode is enabled
  document.documentElement.classList.add('dark');
  
  console.log(`Applied theme color: ${color}`);
  
  // Update color samples
  updateColorSamples(color);
}

// Function to update the color samples based on CSS variables
function updateColorSamples(themeName) {
  const computedStyle = getComputedStyle(document.documentElement);
  
  document.getElementById('primary-color').style.backgroundColor = 
    `rgb(${computedStyle.getPropertyValue('--primary-color')})`;
  
  document.getElementById('secondary-color').style.backgroundColor = 
    `rgb(${computedStyle.getPropertyValue('--secondary-color')})`;
  
  document.getElementById('accent-color').style.backgroundColor = 
    `rgb(${computedStyle.getPropertyValue('--accent-color')})`;
  
  document.getElementById('hover-color').style.backgroundColor = 
    `rgb(${computedStyle.getPropertyValue('--hover-color')})`;
  
  document.getElementById('bg-color').style.backgroundColor = 
    `rgb(${computedStyle.getPropertyValue('--background-rgb')})`;
  
  document.getElementById('active-theme').textContent = themeName;
}

// Update settings on the backend (for testing)
async function updateBackendThemeColor(color) {
  try {
    const response = await fetch(`${API_URL}/api/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        theme: {
          color: color
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update theme color');
    }
    
    const data = await response.json();
    console.log('Backend settings updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating theme color:', error);
    return null;
  }
}

// Cycle through all available theme colors
function cycleThemeColors() {
  let currentIndex = 0;
  
  // Apply the first theme immediately
  applyThemeColor(themeColors[currentIndex]);
  
  // Set interval to cycle through themes
  const interval = setInterval(() => {
    currentIndex = (currentIndex + 1) % themeColors.length;
    const color = themeColors[currentIndex];
    
    applyThemeColor(color);
    
    // Update backend (optional)
    // updateBackendThemeColor(color);
    
  }, 3000); // change every 3 seconds
  
  return interval;
}

// Initialize demo when document is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Setup buttons for manual theme changes
  themeColors.forEach(color => {
    const button = document.getElementById(`btn-${color}`);
    if (button) {
      button.addEventListener('click', () => {
        applyThemeColor(color);
        // Uncomment to update backend
        // updateBackendThemeColor(color);
      });
    }
  });
  
  // Auto cycle button
  const cycleButton = document.getElementById('btn-cycle');
  let cycleInterval = null;
  
  if (cycleButton) {
    cycleButton.addEventListener('click', () => {
      if (cycleInterval) {
        clearInterval(cycleInterval);
        cycleInterval = null;
        cycleButton.textContent = 'Start Auto Cycle';
      } else {
        cycleInterval = cycleThemeColors();
        cycleButton.textContent = 'Stop Auto Cycle';
      }
    });
  }
  
  // Apply default theme initially
  applyThemeColor('default');
}); 
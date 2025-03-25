import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface LanguageChartProps {
  languages: Record<string, number>;
  className?: string;
}

// Common language colors for visualization
const languageColors: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#2b7489',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Swift: '#ffac45',
  Kotlin: '#F18E33',
  Rust: '#dea584',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Dockerfile: '#384d54',
  'Jupyter Notebook': '#DA5B0B',
};

// Function to get a color for a language
const getLanguageColor = (language: string): string => {
  // Extract just the language name from extensions like .js, .py, etc.
  const langName = language.replace(/^\./, '').toLowerCase();
  
  // Check for common languages
  for (const [key, value] of Object.entries(languageColors)) {
    if (key.toLowerCase() === langName || 
        key.toLowerCase() === langName.replace('script', '') ||
        (key.toLowerCase() + 'script') === langName) {
      return value;
    }
  }
  
  // Generate a color based on the language name if not in our predefined list
  let hash = 0;
  for (let i = 0; i < language.length; i++) {
    hash = language.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
};

const LanguageChart: React.FC<LanguageChartProps> = ({ languages, className = '' }) => {
  // Prepare data for the chart
  const prepareChartData = (): ChartData<'doughnut'> => {
    // Sort languages by percentage
    const sortedLanguages = Object.entries(languages)
      .sort((a, b) => b[1] - a[1]);
    
    // Get top 6 languages and group others
    const topLanguages = sortedLanguages.slice(0, 6);
    const otherLanguages = sortedLanguages.slice(6);
    
    const labels = topLanguages.map(([lang]) => lang.replace(/^\./, ''));
    const data = topLanguages.map(([, value]) => value);
    
    // Add "Other" category if there are more languages
    if (otherLanguages.length > 0) {
      labels.push('Other');
      data.push(otherLanguages.reduce((sum, [, value]) => sum + value, 0));
    }
    
    // Generate colors for each language
    const backgroundColors = [
      ...topLanguages.map(([lang]) => getLanguageColor(lang)),
      '#808080', // Gray for "Other"
    ];
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: backgroundColors,
          borderColor: 'transparent',
          hoverOffset: 4,
        },
      ],
    };
  };
  
  // Chart options
  const chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
          },
          color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#4b5563',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw as number;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number;
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${percentage}%`;
          },
        },
      },
    },
    cutout: '65%',
  };
  
  // If no languages data, show a message
  if (!languages || Object.keys(languages).length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 bg-gray-50 dark:bg-gray-800 rounded-lg ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">No language data available</p>
      </div>
    );
  }
  
  return (
    <div className={`${className}`}>
      <div className="h-64">
        <Doughnut data={prepareChartData()} options={chartOptions} />
      </div>
    </div>
  );
};

export default LanguageChart; 
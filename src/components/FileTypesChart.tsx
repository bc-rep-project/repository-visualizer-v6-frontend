'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { FileNode } from '@/types/types';

Chart.register(...registerables);

interface FileTypesChartProps {
  data: FileNode;
}

interface FileTypeCount {
  extension: string;
  count: number;
  color: string;
}

const FileTypesChart: React.FC<FileTypesChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [fileTypes, setFileTypes] = useState<FileTypeCount[]>([]);
  const chartInstance = useRef<Chart | null>(null);

  // Generate a color based on the file extension
  const getColorForExtension = (extension: string): string => {
    const colors: Record<string, string> = {
      '.js': '#f7df1e',     // JavaScript - yellow
      '.jsx': '#61dafb',    // React JSX - light blue
      '.ts': '#3178c6',     // TypeScript - blue
      '.tsx': '#61dafb',    // React TSX - light blue
      '.css': '#264de4',    // CSS - blue
      '.scss': '#cc6699',   // SCSS - pink
      '.html': '#e34c26',   // HTML - orange
      '.json': '#000000',   // JSON - black
      '.md': '#083fa1',     // Markdown - navy
      '.py': '#3776ab',     // Python - blue
      '.java': '#007396',   // Java - blue
      '.php': '#777bb4',    // PHP - purple
      '.rb': '#cc342d',     // Ruby - red
      '.go': '#00add8',     // Go - light blue
      '.c': '#a8b9cc',      // C - light gray
      '.cpp': '#00599c',    // C++ - blue
      '.cs': '#239120',     // C# - green
      '.swift': '#ffac45',  // Swift - orange
      '.kt': '#a97bff',     // Kotlin - purple
      '.rs': '#dea584',     // Rust - orange
    };

    if (extension in colors) {
      return colors[extension];
    }

    // Generate a random color for unknown extensions
    let hash = 0;
    for (let i = 0; i < extension.length; i++) {
      hash = extension.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  };

  // Extract file extension from path
  const getFileExtension = (path: string): string => {
    const parts = path.split('.');
    if (parts.length > 1) {
      return '.' + parts[parts.length - 1].toLowerCase();
    }
    return 'no-extension';
  };

  // Count file types recursively
  const countFileTypes = (node: FileNode): Record<string, number> => {
    const counts: Record<string, number> = {};

    const processNode = (currentNode: FileNode) => {
      if (currentNode.type === 'file') {
        const extension = getFileExtension(currentNode.path);
        counts[extension] = (counts[extension] || 0) + 1;
      }

      if (currentNode.children) {
        currentNode.children.forEach(child => processNode(child));
      }
    };

    processNode(node);
    return counts;
  };

  useEffect(() => {
    if (!data) return;

    // Count file types
    const typeCounts = countFileTypes(data);
    
    // Convert to array and sort by count
    const typeArray = Object.entries(typeCounts)
      .map(([extension, count]) => ({
        extension,
        count,
        color: getColorForExtension(extension)
      }))
      .sort((a, b) => b.count - a.count);
    
    setFileTypes(typeArray);
  }, [data]);

  useEffect(() => {
    if (!chartRef.current || fileTypes.length === 0) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: fileTypes.map(type => type.extension),
        datasets: [{
          data: fileTypes.map(type => type.count),
          backgroundColor: fileTypes.map(type => type.color),
          borderColor: '#ffffff',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 15,
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number;
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} files (${percentage}%)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [fileTypes]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4 dark:text-white">File Types Distribution</h2>
      <div className="h-64 relative">
        {fileTypes.length > 0 ? (
          <canvas ref={chartRef} />
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No file data available</p>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-md font-semibold mb-2 dark:text-white">Top File Types</h3>
        <div className="grid grid-cols-2 gap-2">
          {fileTypes.slice(0, 6).map((type) => (
            <div key={type.extension} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: type.color }}
              ></div>
              <span className="text-sm dark:text-gray-300">
                {type.extension}: {type.count} files
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileTypesChart; 
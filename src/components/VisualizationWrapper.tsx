'use client';

import React, { useEffect, useState, useRef } from 'react';
import { RepositoryGraph } from '@/components/RepositoryGraph';
import { RepositoryTree } from '@/components/RepositoryTree';
import { SimpleSunburst } from '@/components/SimpleSunburst';
import { RepositoryPackedCircles } from '@/components/RepositoryPackedCircles';
import { FileNode, GraphData, AnalysisData } from '@/types/types';
import LoadingSpinner from './LoadingSpinner';

interface VisualizationWrapperProps {
  data: FileNode;
  graphData: GraphData;
  visualizationType: 'graph' | 'tree' | 'sunburst' | 'packed';
  width?: number;
  height?: number;
}

// This component adapts the data for the visualization components
const VisualizationWrapper: React.FC<VisualizationWrapperProps> = ({
  data,
  graphData,
  visualizationType,
  width = 900,
  height = 700,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [adaptedData, setAdaptedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isMobile, setIsMobile] = useState(false);

  // Add a responsive dimensions handler
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      const containerWidth = containerRef.current.clientWidth;
      
      // Adjust dimensions based on visualization type and device
      let adjustedHeight = height;
      let adjustedWidth = containerWidth;
      
      // Different height adjustments for different visualization types
      if (mobile) {
        // Mobile dimensions
        adjustedHeight = visualizationType === 'graph' ? Math.min(450, height) : 
                       (visualizationType === 'packed' ? Math.min(450, height) : 
                       (visualizationType === 'sunburst' ? Math.min(450, height) : Math.min(500, height)));
      } else {
        // Desktop dimensions - prevent components from getting too large
        adjustedHeight = Math.min(visualizationType === 'graph' ? 650 : 
                       (visualizationType === 'packed' ? 650 : 
                       (visualizationType === 'sunburst' ? 650 : 700)), height);
      }
      
      setDimensions({
        width: adjustedWidth,
        height: adjustedHeight
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [visualizationType, height]);

  // Create a deep copy of the data to avoid modifying the original
  const adaptData = () => {
    if (!data) return null;

    try {
      // Return a copy of the original data
      return JSON.parse(JSON.stringify(data));
    } catch (err) {
      console.error('Error adapting data for visualization:', err);
      setError('Failed to process data for visualization');
      return null;
    }
  };

  useEffect(() => {
    if (!data || !graphData) {
      setError('No data available for visualization');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Process data for the current visualization
      const processedData = adaptData();
      setAdaptedData(processedData);
      
      // Just a small delay to allow the UI to update
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Error preparing visualization:', err);
      setError('Failed to load visualization');
      setIsLoading(false);
    }
  }, [data, graphData, visualizationType]);

  // Display loading spinner when data is being processed
  if (isLoading) {
    return (
      <div className="flex justify-center items-center" style={{ height: dimensions.height }}>
        <LoadingSpinner message="Preparing visualization..." />
      </div>
    );
  }
  
  // Display error message if something went wrong
  if (error) {
    return (
      <div className="flex justify-center items-center" style={{ height: dimensions.height }}>
        <div className="text-center">
          <p className="text-red-500 font-medium">{error}</p>
          <p className="text-gray-500 mt-2">Try a different visualization type or refresh the page.</p>
        </div>
      </div>
    );
  }
  
  // If data hasn't been processed yet, show a loading state
  if (!adaptedData && data) {
    return (
      <div className="flex justify-center items-center" style={{ height: dimensions.height }}>
        <LoadingSpinner message="Processing data..." />
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef} 
      className="w-full overflow-hidden"
      style={{ 
        height: dimensions.height,
        maxHeight: isMobile ? '550px' : '700px'
      }}
    >
      {visualizationType === 'graph' && (
        <RepositoryGraph 
          data={graphData} 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      )}
      
      {visualizationType === 'tree' && (
        <RepositoryTree 
          data={adaptedData} 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      )}
      
      {visualizationType === 'sunburst' && (
        <SimpleSunburst 
          data={adaptedData} 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      )}
      
      {visualizationType === 'packed' && (
        <RepositoryPackedCircles 
          data={adaptedData} 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      )}
    </div>
  );
};

export default VisualizationWrapper; 
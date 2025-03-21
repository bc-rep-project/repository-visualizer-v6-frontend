'use client';

import React, { useEffect, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [adaptedData, setAdaptedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Whenever the data or visualization type changes, adapt the data
  useEffect(() => {
    setIsLoading(true);
    try {
      // Process the data for the specific visualization
      const processedData = adaptData(data);
      setAdaptedData(processedData);
      setError(null);
    } catch (err) {
      console.error('Error adapting data for visualization:', err);
      setError('Failed to process data for visualization');
    } finally {
      setIsLoading(false);
    }
  }, [data, visualizationType]);

  // Create a deep copy of the data to avoid modifying the original
  const adaptData = (node: any): any => {
    const adaptedNode = { ...node };
    
    // Adapt imports if they exist
    if (adaptedNode.imports) {
      if (Array.isArray(adaptedNode.imports) && adaptedNode.imports.length > 0) {
        if (typeof adaptedNode.imports[0] === 'string') {
          adaptedNode.imports = adaptedNode.imports.map((imp: string) => ({ source: imp }));
        }
      }
    }
    
    // Adapt function dependencies if they exist
    if (adaptedNode.functions) {
      adaptedNode.functions = adaptedNode.functions.map((func: any) => {
        const adaptedFunc = { ...func };
        if (adaptedFunc.dependencies && Array.isArray(adaptedFunc.dependencies)) {
          if (adaptedFunc.dependencies.length > 0 && typeof adaptedFunc.dependencies[0] === 'string') {
            adaptedFunc.dependencies = adaptedFunc.dependencies.map((dep: string) => ({
              target: dep,
              type: 'calls'
            }));
          }
        }
        return adaptedFunc;
      });
    }
    
    // Adapt class methods dependencies if they exist
    if (adaptedNode.classes) {
      adaptedNode.classes = adaptedNode.classes.map((cls: any) => {
        const adaptedClass = { ...cls };
        if (adaptedClass.methods) {
          adaptedClass.methods = adaptedClass.methods.map((method: any) => {
            const adaptedMethod = { ...method };
            if (adaptedMethod.dependencies && Array.isArray(adaptedMethod.dependencies)) {
              if (adaptedMethod.dependencies.length > 0 && typeof adaptedMethod.dependencies[0] === 'string') {
                adaptedMethod.dependencies = adaptedMethod.dependencies.map((dep: string) => ({
                  target: dep,
                  type: 'calls'
                }));
              }
            }
            return adaptedMethod;
          });
        }
        return adaptedClass;
      });
    }
    
    // Recursively adapt children
    if (adaptedNode.children) {
      adaptedNode.children = adaptedNode.children.map(adaptData);
    }
    
    return adaptedNode;
  };
  
  // Display loading spinner when data is being processed
  if (isLoading) {
    return (
      <div className="flex justify-center items-center" style={{ height }}>
        <LoadingSpinner message="Preparing visualization..." color="blue" />
      </div>
    );
  }
  
  // Display error message if something went wrong
  if (error) {
    return (
      <div className="flex justify-center items-center text-red-500" style={{ height }}>
        <div className="text-center">
          <p className="text-xl font-bold mb-2">Visualization Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  // If data hasn't been processed yet, show a loading state
  if (!adaptedData && data) {
    return (
      <div className="flex justify-center items-center" style={{ height }}>
        <LoadingSpinner message="Processing data..." color="blue" />
      </div>
    );
  }
  
  // Render the appropriate visualization based on the selected type
  switch (visualizationType) {
    case 'graph':
      // For graph visualization, we use the pre-processed graph data
      return <RepositoryGraph data={graphData} width={width} height={height} />;
    case 'tree':
      return <RepositoryTree data={adaptedData} width={width} height={height} />;
    case 'sunburst':
      return <SimpleSunburst data={adaptedData} width={width} height={height} />;
    case 'packed':
      return <RepositoryPackedCircles data={adaptedData} width={width} height={height} />;
    default:
      // Default to packed circles if visualization type is not recognized
      return <RepositoryPackedCircles data={adaptedData} width={width} height={height} />;
  }
};

export default VisualizationWrapper; 
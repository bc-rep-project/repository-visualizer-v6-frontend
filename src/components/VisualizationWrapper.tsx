'use client';

import React from 'react';
import { RepositoryGraph } from '@/components/RepositoryGraph';
import { RepositoryTree } from '@/components/RepositoryTree';
import { SimpleSunburst } from '@/components/SimpleSunburst';
import { RepositoryPackedCircles } from '@/components/RepositoryPackedCircles';
import { FileNode, GraphData } from '@/types/types';

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
  
  // Adapt the data
  const adaptedData = adaptData(data);
  
  // Render the appropriate visualization based on the selected type
  switch (visualizationType) {
    case 'graph':
      return <RepositoryGraph data={graphData} width={width} height={height} />;
    case 'tree':
      return <RepositoryTree data={adaptedData} width={width} height={height} />;
    case 'sunburst':
      return <SimpleSunburst data={adaptedData} width={width} height={height} />;
    case 'packed':
      return <RepositoryPackedCircles data={adaptedData} width={width} height={height} />;
    default:
      return <RepositoryPackedCircles data={adaptedData} width={width} height={height} />;
  }
};

export default VisualizationWrapper; 
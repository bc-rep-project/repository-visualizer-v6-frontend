'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useSettings } from '@/contexts/SettingsContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FileNode } from '@/types/types';

interface SimpleSunburstProps {
  data: FileNode;
  width?: number;
  height?: number;
}

// Helper function to check if a node is an ancestor of another
const isAncestorOf = (p: any, c: any) => {
  if (p === c) return true;
  if (p.depth >= c.depth) return false;
  let current = c.parent;
  while (current && current.depth > p.depth) {
    current = current.parent;
  }
  return current === p;
};

// Helper function to format bytes
const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const SimpleSunburst: React.FC<SimpleSunburstProps> = ({
  data,
  width = 800,
  height = 800,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create and update visualization
  useEffect(() => {
    if (!svgRef.current || !data) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Rendering sunburst with data:", data);

      // Clear previous visualization
      d3.select(svgRef.current).selectAll('*').remove();

      // Validate data structure
      if (!data.name || !data.type) {
        throw new Error("Invalid data structure: missing required properties");
      }

      // Process data for sunburst
      const root = d3.hierarchy<FileNode>(data)
        .sum(d => {
          // Debug the value assignment
          console.log(`Assigning value for ${d.name} (${d.type})`, {
            size: d.size,
            hasChildren: d.children && d.children.length > 0
          });
          
          // Value assignment strategy:
          // - For files: use size property or default to 1
          // - For functions/classes: use 1
          // - For directories: sum of children (handled by d3.hierarchy.sum)
          if (d.type === 'file') {
            return d.size || 1; // Default to 1 if size is missing
          } else if (d.type === 'function' || d.type === 'class' || d.type === 'method') {
            return 1;
          } else if (d.type === 'directory') {
            // If directory has no children, assign a small value
            return (d.children && d.children.length > 0) ? 0 : 0.1;
          }
          return 0;
        })
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      // Debug the processed hierarchy
      console.log("Processed hierarchy:", root);
      
      // Verify the hierarchy has values
      if (!root.value) {
        throw new Error("Hierarchy has no value after processing");
      }

      // Create SVG
      const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [0, 0, width, height]);

      // Add a group for the visualization
      const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      // Create a partition layout
      const radius = Math.min(width, height) / 2;
      const partition = d3.partition<FileNode>()
        .size([2 * Math.PI, radius]);

      // Compute the partition layout
      const rootWithPartition = partition(root);
      
      // Debug the partition result
      console.log("Partition result:", rootWithPartition.descendants().slice(1));

      // Create an arc generator
      const arc = d3.arc<d3.HierarchyRectangularNode<FileNode>>()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .padAngle(0.002)
        .padRadius(radius / 3)
        .innerRadius(d => Math.sqrt(d.y0))
        .outerRadius(d => Math.sqrt(d.y1) - 1);

      // Create a color scale based on node type and language
      const colorScale = (d: d3.HierarchyRectangularNode<FileNode>) => {
        const node = d.data;
        
        // Color by node type
        if (node.type === 'directory') return '#f0f0f0';
        if (node.type === 'function' || node.type === 'method') return '#b794f4';
        if (node.type === 'class') return '#f687b3';
        
        // Color by language for files
        if (node.language) {
          const lang = node.language.toLowerCase();
          if (lang.includes('javascript')) return '#f6e05e';
          if (lang.includes('typescript')) return '#4fd1c5';
          if (lang.includes('css')) return '#63b3ed';
          if (lang.includes('html')) return '#fc8181';
          if (lang.includes('json')) return '#68d391';
          if (lang.includes('markdown')) return '#a0aec0';
          if (lang.includes('python')) return '#667eea';
          if (lang.includes('java')) return '#f687b3';
        }
        
        // Default color for files
        return '#cbd5e0';
      };

      // Zoom function for the sunburst
      const zoomTo = (d: d3.HierarchyNode<FileNode>) => {
        const transition = svg.transition()
          .duration(750);
          
        // Update paths to show only the relevant part of the hierarchy
        path.transition(transition as any)
          .tween('data', (d: any) => {
            const i = d3.interpolate(d.current, d.target);
            return (t: number) => d.current = i(t);
          })
          .attrTween('d', (d: any) => {
            return () => arc(d.current) as string;
          });
      };

      // Create the sunburst visualization
      const path = g.append('g')
        .selectAll('path')
        .data(rootWithPartition.descendants().slice(1))
        .join('path')
        .attr('fill', colorScale)
        .attr('d', arc as any)
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.9)
        .on('mouseover', (event: any, d: any) => {
          // Highlight path on hover
          path.attr('opacity', (n: any) => isAncestorOf(d, n) ? 1 : 0.3);
          
          // Show tooltip
          const tooltip = d3.select('#sunburst-tooltip');
          tooltip.style('display', 'block')
            .html(`
              <div class="p-2">
                <div class="font-bold">${d.data.name}</div>
                <div class="text-sm">${d.data.type}</div>
                ${d.data.language ? `<div class="text-xs">${d.data.language}</div>` : ''}
                ${d.value ? `<div class="text-xs">${formatBytes(d.value)}</div>` : ''}
                <div class="text-xs text-gray-500">${d.data.path}</div>
              </div>
            `)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 20) + 'px');
        })
        .on('mouseout', () => {
          // Reset highlighting
          path.attr('opacity', 0.9);
          
          // Hide tooltip
          d3.select('#sunburst-tooltip').style('display', 'none');
        })
        .on('click', (event: any, d: any) => {
          // Set selected path
          setSelectedPath(d.data.path);
          
          // Zoom to the clicked segment
          zoomTo(d);
        });
        
      // Add center circle for returning to root
      g.append('circle')
        .attr('r', radius * 0.1)
        .attr('fill', '#f0f0f0')
        .attr('stroke', '#ddd')
        .attr('cursor', 'pointer')
        .on('click', () => {
          // Reset zoom to root
          zoomTo(root);
          setSelectedPath(null);
        });
        
      // Add center text
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('font-size', '12px')
        .attr('fill', '#666')
        .text('Reset');

      setLoading(false);
    } catch (err) {
      console.error("Error rendering sunburst:", err);
      setError(err instanceof Error ? err.message : "Unknown error rendering sunburst");
      setLoading(false);
    }
  }, [data, width, height]);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <LoadingSpinner />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <p className="font-bold">Error rendering sunburst</p>
            <p>{error}</p>
            <p className="text-sm mt-2">Check console for more details</p>
          </div>
        </div>
      )}
      
      <svg
        ref={svgRef}
        className="w-full h-full border border-gray-200 rounded-lg"
        style={{ minHeight: '600px' }}
      />
      
      <div
        id="sunburst-tooltip"
        className="absolute z-50 bg-white shadow-lg rounded-md p-2 pointer-events-none hidden"
        style={{ display: 'none' }}
      />
      
      {selectedPath && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg z-20">
          <h3 className="font-bold text-lg">Selected Path</h3>
          <p className="text-sm">{selectedPath}</p>
          <button
            className="mt-2 px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs"
            onClick={() => setSelectedPath(null)}
          >
            Reset View
          </button>
        </div>
      )}
    </div>
  );
}; 
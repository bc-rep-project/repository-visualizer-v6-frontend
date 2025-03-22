'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import LoadingSpinner from '@/components/LoadingSpinner';

// Define types for the data
interface FileNode {
  name: string;
  path: string;
  type: string;
  size?: number;
  language?: string;
  extension?: string;
  children?: FileNode[];
  dependencies?: string[];
  imports?: string[] | { source: string }[];
  functions?: { name: string; dependencies?: { target: string; type: string }[] }[];
  classes?: { name: string; methods?: { name: string; dependencies?: { target: string; type: string }[] }[] }[];
}

// Extended hierarchy node with animation properties
type ExtendedHierarchyCircleNode = d3.HierarchyCircularNode<FileNode> & {
  data: FileNode;
  parent: ExtendedHierarchyCircleNode | null;
  children?: ExtendedHierarchyCircleNode[];
  highlighted?: boolean;
  dependencyLinks?: {
    source: { x: number; y: number; r: number };
    target: { x: number; y: number; r: number };
  }[];
};

interface RepositoryPackedCirclesProps {
  data: FileNode;
  width?: number;
  height?: number;
}

export const RepositoryPackedCircles: React.FC<RepositoryPackedCirclesProps> = ({
  data,
  width = 900,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isMobile, setIsMobile] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Detect mobile devices and set responsive dimensions
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Use smaller size on mobile and limit maximum size on desktop
        const size = mobile ? 
          Math.min(containerWidth, 450) : 
          Math.min(containerWidth, Math.min(width, 800)); // Restrict max size on desktop
        
        setDimensions({
          width: size,
          height: mobile ? size : Math.min(height, 650) // Adjust height to prevent overlap
        });
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [width, height]);

  // Create and update visualization
  useEffect(() => {
    if (!svgRef.current || !data) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    try {
    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

      // Process data for circle packing
    const root = d3.hierarchy(data)
      .sum(d => {
          // Use file size for leaf nodes, or 1 for directories
          if (d.type === 'file' && d.size) {
          return d.size;
        }
          return d.children && d.children.length > 0 ? 0 : 1;
      })
      .sort((a, b) => (b.value || 0) - (a.value || 0));

      // Calculate appropriate padding based on dimensions
      const padding = isMobile ? 1.5 : 2;
      
      // Create a pack layout with adjusted padding
    const pack = d3.pack<FileNode>()
        .size([dimensions.width, dimensions.height])
        .padding(padding);

      // Apply the pack layout to the hierarchy
      const rootWithPack = pack(root);

      // Create SVG with responsive dimensions
    const svg = d3.select(svgRef.current)
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)
        .attr('viewBox', [0, 0, dimensions.width, dimensions.height]);

      // Add a group for zooming
      const g = svg.append('g');

      // Create zoom behavior with limits to prevent excessive zooming
    const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 8]) // Limit zoom levels
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        });

      // Apply zoom behavior to SVG
      svg.call(zoom)
        .on('dblclick.zoom', null); // Disable double-click zoom for better navigation

      // Create circles for each node
      const node = g.selectAll('g')
        .data(rootWithPack.descendants())
        .join('g')
        .attr('transform', d => `translate(${d.x},${d.y})`);

      // Adjust circle size based on device
      const minRadius = isMobile ? 2 : 3;
      
      // Create circles with improved visibility
      node.append('circle')
        .attr('r', d => Math.max(d.r, minRadius))
        .attr('fill', d => {
          const fileNode = d.data;
          if (fileNode.type === 'directory') return '#f9f9f9';
          if (fileNode.type === 'function' || fileNode.type === 'method') return '#b794f4';
          if (fileNode.type === 'class') return '#f687b3';
          if (fileNode.language) {
            const lang = fileNode.language.toLowerCase();
            if (lang.includes('javascript')) return '#f6e05e';
            if (lang.includes('typescript')) return '#4fd1c5';
            if (lang.includes('css')) return '#63b3ed';
            if (lang.includes('html')) return '#fc8181';
            if (lang.includes('json')) return '#68d391';
            if (lang.includes('markdown')) return '#a0aec0';
            if (lang.includes('python')) return '#667eea';
            if (lang.includes('java')) return '#f687b3';
          }
          return '#cbd5e0';
        })
        .attr('stroke', d => d.depth > 1 ? '#fff' : '#e2e8f0')
        .attr('stroke-width', d => d.depth > 1 ? 0.5 : 1)
      .attr('opacity', 0.9)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
          // Highlight on hover
          d3.select(this).attr('stroke', '#4299e1').attr('stroke-width', 2);
          
          // Show tooltip with better positioning
          const tooltip = d3.select('#circle-tooltip');
      tooltip.style('display', 'block')
        .html(`
              <div class="p-2">
                <div class="font-bold">${d.data.name}</div>
                <div class="text-sm">${d.data.type}</div>
                ${d.data.language ? `<div class="text-xs">${d.data.language}</div>` : ''}
                ${d.value ? `<div class="text-xs">${formatBytes(d.value)}</div>` : ''}
          </div>
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 20) + 'px');
        })
        .on('mouseout', function() {
          // Reset highlighting
          d3.select(this)
            .attr('stroke', function(d: any) { return d.depth > 1 ? '#fff' : '#e2e8f0'; })
            .attr('stroke-width', function(d: any) { return d.depth > 1 ? 0.5 : 1; });
      
      // Hide tooltip
          d3.select('#circle-tooltip').style('display', 'none');
        })
        .on('click', (event, d) => {
      event.stopPropagation();
          setSelectedNode(d.data);
        });

      // Only add text to larger circles to prevent overlap
      node.filter(d => d.r > (isMobile ? 12 : 10))
        .append('text')
        .attr('dy', '0.3em')
        .attr('text-anchor', 'middle')
        .attr('font-size', d => Math.min(d.r / 3.5, isMobile ? 10 : 12) + 'px')
        .attr('pointer-events', 'none')
        .text(d => d.data.name)
        .attr('opacity', d => d.r > (isMobile ? 20 : 15) ? 1 : 0.7)
        .style('fill', '#4a5568')
        .each(function(d: any) {
          // Truncate text if needed
          const text = d3.select(this);
          const textLength = text.node()?.getComputedTextLength() || 0;
          const maxLength = d.r * (isMobile ? 1.6 : 1.8);
          
          if (textLength > maxLength) {
            let name = d.data.name;
            let truncated = name;
            
            // For very small circles on mobile, just show first few chars
            if (isMobile && d.r < 15) {
              truncated = name.length > 3 ? name.slice(0, 3) + '…' : name;
              text.text(truncated);
              return;
            }
            
            while (truncated.length > 3 && (text.node()?.getComputedTextLength() || 0) > maxLength) {
              truncated = name.slice(0, truncated.length - 4) + '...';
              text.text(truncated);
            }
          }
        });

      // Add touch support for mobile
      if (isMobile) {
        svg.on('touchstart', function(event) {
          // Prevent scrolling on touch
          event.preventDefault();
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Error creating packed circles visualization:', err);
      setError('Failed to create visualization');
      setLoading(false);
    }
  }, [data, dimensions, isMobile]);

    // Helper function to format bytes
  const formatBytes = (bytes: number) => {
      if (bytes < 1024) return bytes + ' B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <LoadingSpinner />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        </div>
      )}
      
      <div className="flex justify-center items-center">
      <svg
        ref={svgRef}
          className="w-full border border-gray-200 rounded-lg"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
      
      <div
        id="packed-circles-tooltip"
        className="absolute z-50 bg-white shadow-lg rounded-md pointer-events-none hidden"
        style={{ display: 'none' }}
      />
      
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto bg-white p-4 rounded-lg shadow-lg z-20 max-w-xs md:max-w-md">
          <h3 className="font-bold text-lg">{selectedNode.name}</h3>
          <p className="text-sm">{selectedNode.type}</p>
          {selectedNode.language && <p className="text-xs">Language: {selectedNode.language}</p>}
          {selectedNode.size && <p className="text-xs">Size: {formatBytes(selectedNode.size)}</p>}
          {selectedNode.path && (
            <p className="text-xs mt-1 break-all">
              <span className="font-semibold">Path:</span> {selectedNode.path}
            </p>
          )}
          <button
            className="mt-3 w-full md:w-auto px-3 py-1.5 bg-gray-200 text-gray-800 rounded text-sm"
            onClick={() => setSelectedNode(null)}
          >
            Close
          </button>
        </div>
      )}
      
      {isMobile && (
        <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-75 text-center py-2 text-xs">
          <p>Pinch to zoom • Tap to select</p>
        </div>
      )}
    </div>
  );
};

export default RepositoryPackedCircles; 
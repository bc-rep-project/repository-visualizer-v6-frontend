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
        // On mobile, use full width and adjust height ratio
        if (mobile) {
          setDimensions({
            width: containerWidth,
            height: Math.min(containerWidth * 0.8, 500)
          });
        } else {
          setDimensions({
            width: Math.min(containerWidth, 900),
            height: Math.min(containerWidth * 0.6, 600)
          });
        }
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data || !data.children || data.children.length === 0) {
      if (data && (!data.children || data.children.length === 0)) {
        setError('No data available to visualize');
      }
      setLoading(false);
      return;
    }
    
    try {
    setLoading(true);
      setError(null);

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

      // Process the data to create a hierarchy
    const root = d3.hierarchy(data)
      .sum(d => {
          // Use file size for leaf nodes, or 1 for directories
          if (d.type === 'file' && d.size) {
          return d.size;
        }
          return d.children && d.children.length > 0 ? 0 : 1;
      })
      .sort((a, b) => (b.value || 0) - (a.value || 0));

      // Create a pack layout
    const pack = d3.pack<FileNode>()
        .size([dimensions.width, dimensions.height])
        .padding(3);

      // Apply the pack layout to the hierarchy
      const rootWithLayout = pack(root as d3.HierarchyNode<FileNode>);

      // Create the SVG visualization
    const svg = d3.select(svgRef.current)
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)
        .attr('viewBox', [0, 0, dimensions.width, dimensions.height])
        .attr('style', 'max-width: 100%; height: auto;');

      // Create a group for the circles
      const g = svg.append('g');

      // Add zoom behavior - adjust zoom levels for mobile
      const zoom = d3.zoom()
        .scaleExtent([0.5, isMobile ? 5 : 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        });

      svg.call(zoom as any);

      // Draw the circles
      const node = g.selectAll('g')
        .data(rootWithLayout.descendants() as d3.HierarchyCircularNode<FileNode>[])
        .join('g')
        .attr('transform', d => `translate(${d.x},${d.y})`);

      // Create circles for each node
      node.append('circle')
      .attr('r', d => d.r)
        .attr('fill', d => {
          // Color based on file type or directory
          const node = d.data;
          if (node.type === 'directory') return '#e2e8f0';
          
          // For files, color based on language
          if (node.language) {
            const lang = node.language.toLowerCase();
            if (lang.includes('javascript')) return '#ecc94b';
            if (lang.includes('typescript')) return '#4fd1c5';
            if (lang.includes('css')) return '#4299e1';
            if (lang.includes('html')) return '#f56565';
            if (lang.includes('json')) return '#48bb78';
            if (lang.includes('markdown')) return '#a0aec0';
            if (lang.includes('python')) return '#667eea';
            if (lang.includes('java')) return '#ed64a6';
          }
          return '#cbd5e0';
        })
      .attr('opacity', 0.9)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .on('mouseover', function(event, d) {
          // Skip mouseover on mobile devices - we'll use touch instead
          if (isMobile) return;

          // Highlight this node
          d3.select(this).attr('stroke', '#2d3748').attr('stroke-width', 2);
      
      // Show tooltip
          const tooltip = d3.select('#packed-circles-tooltip');
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
          // Skip mouseout on mobile devices
          if (isMobile) return;

          // Reset highlight
          d3.select(this).attr('stroke', '#fff').attr('stroke-width', 1);
      
      // Hide tooltip
          d3.select('#packed-circles-tooltip').style('display', 'none');
        })
        .on('click', (event, d) => {
          // Set selected node for details panel
          setSelectedNode(d.data);
          
          // Prevent event from bubbling up to SVG (which would reset the view)
      event.stopPropagation();
        })
        // Add touch support for mobile
        .on('touchstart', function(event) {
          // Prevent scrolling on touch
          event.preventDefault();
        })
        .on('touchend', function(event, d) {
          // Handle touch on mobile
          event.preventDefault();
          
          // Highlight this node
          d3.selectAll('circle').attr('stroke', '#fff').attr('stroke-width', 1);
          d3.select(this).attr('stroke', '#2d3748').attr('stroke-width', 2);
          
          // Show tooltip at fixed position for mobile
          const tooltip = d3.select('#packed-circles-tooltip');
          tooltip.style('display', 'block')
            .html(`
              <div class="p-2">
                <div class="font-bold">${d.data.name}</div>
                <div class="text-sm">${d.data.type}</div>
                ${d.data.language ? `<div class="text-xs">${d.data.language}</div>` : ''}
                ${d.value ? `<div class="text-xs">${formatBytes(d.value)}</div>` : ''}
              </div>
            `)
            .style('left', '50%')
            .style('transform', 'translateX(-50%)')
            .style('bottom', '20px')
            .style('top', 'auto');
            
          // Set selected node for details panel
          setSelectedNode(d.data);
          
          // Hide tooltip after 2 seconds on mobile
          setTimeout(() => {
            d3.select('#packed-circles-tooltip').style('display', 'none');
          }, 2000);
          
          // Prevent event from bubbling up
          event.stopPropagation();
        });

      // Add labels for larger circles
      node.append('text')
        .attr('dy', '0.3em')
        .style('text-anchor', 'middle')
        .style('pointer-events', 'none')
        .style('font-size', d => {
          // Adjust text size based on circle radius and device
          const size = Math.min(d.r / 3, isMobile ? 9 : 12);
          return size > (isMobile ? 6 : 8) ? `${size}px` : '0px';
        })
        .text(d => d.data.name.substring(0, d.r / 3));

      // Add click handler to the SVG to reset selection
      svg.on('click', () => {
        setSelectedNode(null);
      });

      setLoading(false);
    } catch (err) {
      console.error('Error creating packed circles visualization:', err);
      setError('Failed to create visualization');
      setLoading(false);
    }
  }, [data, dimensions, isMobile]);

    // Helper function to format bytes
    function formatBytes(bytes: number) {
      if (bytes < 1024) return bytes + ' B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

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
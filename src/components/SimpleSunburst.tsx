'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import LoadingSpinner from '@/components/LoadingSpinner';
import { FileNode } from '@/types/types';

interface SimpleSunburstProps {
  data: FileNode;
  width?: number;
  height?: number;
}

export const SimpleSunburst: React.FC<SimpleSunburstProps> = ({
  data,
  width = 800,
  height = 800,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Create and update visualization
  useEffect(() => {
    if (!svgRef.current || !data) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Process data for sunburst
    const root = d3.hierarchy(data);
    root
      .sum(d => {
        // Use file size for leaf nodes, or 1 for directories
        if (d.type === 'file' && d.size) {
          return d.size;
        }
        return d.children && d.children.length > 0 ? 0 : 1;
      })
      .sort((a, b) => (b.value || 0) - (a.value || 0));

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

    // Create an arc generator
    const arc = d3.arc()
      .startAngle((d: any) => d.x0)
      .endAngle((d: any) => d.x1)
      .padAngle(0.002)
      .padRadius(radius / 3)
      .innerRadius((d: any) => Math.sqrt(d.y0))
      .outerRadius((d: any) => Math.sqrt(d.y1) - 1);

    // Create the sunburst visualization
    const path = g.append('g')
      .selectAll('path')
      .data(rootWithPartition.descendants().slice(1))
      .join('path')
      .attr('fill', (d: any) => {
        const node = d.data;
        if (node.type === 'directory') return '#f9f9f9';
        if (node.type === 'function' || node.type === 'method') return '#b794f4';
        if (node.type === 'class') return '#f687b3';
        if (node.language) {
          const ext = node.language.toLowerCase();
          if (ext.includes('javascript')) return '#f6e05e';
          if (ext.includes('typescript')) return '#4fd1c5';
          if (ext.includes('css')) return '#63b3ed';
          if (ext.includes('html')) return '#fc8181';
          if (ext.includes('json')) return '#68d391';
          if (ext.includes('markdown')) return '#a0aec0';
          if (ext.includes('python')) return '#667eea';
          if (ext.includes('java')) return '#f687b3';
        }
        return '#cbd5e0';
      })
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
      });

    // Helper function to check if a node is an ancestor of another
    function isAncestorOf(p: any, c: any) {
      if (p === c) return true;
      if (p.depth >= c.depth) return false;
      let current = c.parent;
      while (current && current.depth > p.depth) {
        current = current.parent;
      }
      return current === p;
    }

    // Helper function to format bytes
    function formatBytes(bytes: number) {
      if (bytes < 1024) return bytes + ' B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setLoading(false);
  }, [data, width, height]);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <LoadingSpinner />
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
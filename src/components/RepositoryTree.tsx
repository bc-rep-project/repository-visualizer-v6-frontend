'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface TreeNode {
  name: string;
  type: string;
  children?: TreeNode[];
  value?: number;
  language?: string;
}

interface RepositoryTreeProps {
  data: TreeNode;
  width?: number;
  height?: number;
}

export const RepositoryTree: React.FC<RepositoryTreeProps> = ({
  data,
  width = 1000,
  height = 800,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultTheme: 'light' | 'dark' = 'light';

  useEffect(() => {
    if (!containerRef.current || !data) return;

    // Clear previous visualization
    d3.select(containerRef.current).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    // Add zoom behavior
    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    (svg as any).call(zoom);

    // Create hierarchical layout
    const root = d3.hierarchy(data)
      .sum(d => d.value || 1);

    // Create tree layout
    const treeLayout = d3.tree<typeof root.data>()
      .size([2 * Math.PI, Math.min(width, height) / 2 - 100])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    // Apply layout
    const treeData = treeLayout(root);

    // Create links
    const linkGenerator = d3.linkRadial<d3.HierarchyPointLink<typeof root.data>, d3.HierarchyPointNode<typeof root.data>>()
      .angle(d => d.x)
      .radius(d => d.y);

    g.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(treeData.links())
      .join('path')
      .attr('d', linkGenerator);

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(treeData.descendants())
      .join('g')
      .attr('transform', d => `translate(${d.y * Math.sin(d.x)},${d.y * Math.cos(d.x) * -1})`);

    // Add circles for nodes
    node.append('circle')
      .attr('fill', d => {
        const nodeType = d.data.type;
        if (nodeType === 'directory') return '#69b3a2';
        if (nodeType === 'file') {
          // Color by language
          const languageColors: Record<string, string> = {
            'JavaScript': '#f6e05e',
            'JavaScript (React)': '#f6ad55',
            'TypeScript': '#4fd1c5',
            'TypeScript (React)': '#38b2ac',
            'Python': '#667eea',
            'HTML': '#fc8181',
            'CSS': '#63b3ed',
            'SCSS': '#b794f4',
            'JSON': '#68d391',
            'Markdown': '#a0aec0',
            'YAML': '#f687b3',
          };
          return languageColors[d.data.language || ''] || '#a0aec0';
        }
        if (nodeType === 'function') return '#3498db';
        if (nodeType === 'class') return '#e74c3c';
        return '#95a5a6';
      })
      .attr('r', d => {
        const nodeType = d.data.type;
        if (nodeType === 'directory') return 8;
        if (nodeType === 'file') return 6;
        return 4;
      });

    // Add labels
    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.x < Math.PI ? 10 : -10)
      .attr('text-anchor', d => d.x < Math.PI ? 'start' : 'end')
      .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
      .text(d => d.data.name)
      .style('font-size', '10px')
      .style('fill', '#333')
      .clone(true).lower()
      .attr('stroke', 'white')
      .attr('stroke-width', 3);

    // Add tooltips
    node.append('title')
      .text(d => `${d.data.name}\nType: ${d.data.type}${d.data.language ? `\nLanguage: ${d.data.language}` : ''}`);

  }, [data, width, height]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
    />
  );
}; 
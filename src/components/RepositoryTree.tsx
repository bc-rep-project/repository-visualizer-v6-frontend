'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import LoadingSpinner from '@/components/LoadingSpinner';

interface TreeNode {
  name: string;
  type: string;
  children?: TreeNode[];
  value?: number;
  language?: string;
  path?: string;
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
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isMobile, setIsMobile] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const defaultTheme: 'light' | 'dark' = 'light';

  // Detect mobile devices and set responsive dimensions
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // For mobile, use a more compact layout
        if (mobile) {
          setDimensions({
            width: containerWidth,
            height: Math.min(containerWidth * 1.2, 600)
          });
        } else {
          setDimensions({
            width: Math.min(containerWidth, 1000),
            height: Math.min(containerWidth * 0.8, 800)
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
    if (!containerRef.current || !data) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Clear previous visualization
    d3.select(containerRef.current).selectAll('*').remove();

    // Create SVG
    const svg = d3.select(containerRef.current)
      .append('svg')
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('viewBox', [0, 0, dimensions.width, dimensions.height])
      .attr('style', 'max-width: 100%; height: auto;');

    // Add zoom behavior with different limits for mobile
    const g = svg.append('g')
      .attr('transform', `translate(${dimensions.width / 2}, ${dimensions.height / 2})`);
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([isMobile ? 0.3 : 0.1, isMobile ? 4 : 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    (svg as any).call(zoom);

    // Initial zoom for mobile to make the tree more visible
    if (isMobile) {
      svg.call(zoom.transform as any, d3.zoomIdentity.scale(0.6).translate(dimensions.width / 5, dimensions.height / 5));
    }

    // Create hierarchical layout
    const root = d3.hierarchy(data)
      .sum(d => d.value || 1);

    // Create tree layout with adjusted radius for mobile
    const radius = Math.min(dimensions.width, dimensions.height) / 2 - (isMobile ? 50 : 100);
    const treeLayout = d3.tree<typeof root.data>()
      .size([2 * Math.PI, radius])
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

    // Add circles for nodes with adjusted sizes for mobile
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
        // Smaller node sizes on mobile
        const mobileFactor = isMobile ? 0.75 : 1;
        
        if (nodeType === 'directory') return 8 * mobileFactor;
        if (nodeType === 'file') return 6 * mobileFactor;
        return 4 * mobileFactor;
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('click', (event, d) => {
        // Show details on click
        event.stopPropagation();
        setSelectedNode(d.data);
      })
      // Add touch support for mobile
      .on('touchstart', function(event) {
        // Prevent scrolling on touch
        event.preventDefault();
      })
      .on('touchend', function(event, d) {
        // Handle touch on mobile
        event.preventDefault();
        event.stopPropagation();
        
        // Highlight this node
        d3.selectAll('circle').attr('stroke', '#fff').attr('stroke-width', 1);
        d3.select(this).attr('stroke', '#2d3748').attr('stroke-width', 2);
        
        // Show node details
        setSelectedNode(d.data);
      });

    // Add labels with smaller text for mobile
    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.x < Math.PI ? 10 : -10)
      .attr('text-anchor', d => d.x < Math.PI ? 'start' : 'end')
      .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
      .text(d => {
        // Truncate text more aggressively on mobile
        const name = d.data.name;
        if (isMobile) {
          return name.length > 10 ? name.substring(0, 8) + '...' : name;
        }
        return name.length > 20 ? name.substring(0, 18) + '...' : name;
      })
      .style('font-size', isMobile ? '8px' : '10px')
      .style('fill', '#333')
      .clone(true).lower()
      .attr('stroke', 'white')
      .attr('stroke-width', isMobile ? 2 : 3);

    // Add tooltips (these work on desktop, not mobile)
    node.append('title')
      .text(d => `${d.data.name}\nType: ${d.data.type}${d.data.language ? `\nLanguage: ${d.data.language}` : ''}`);

    // Add click handler to reset selection on background click
    svg.on('click', () => {
      setSelectedNode(null);
    });

    setLoading(false);
  }, [data, dimensions, isMobile]);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <LoadingSpinner />
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      />
      
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto bg-white p-4 rounded-lg shadow-lg z-20 max-w-xs md:max-w-md">
          <h3 className="font-bold text-lg">{selectedNode.name}</h3>
          <p className="text-sm">Type: {selectedNode.type}</p>
          {selectedNode.language && <p className="text-xs">Language: {selectedNode.language}</p>}
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
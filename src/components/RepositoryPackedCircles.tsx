'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useSettings } from '@/contexts/SettingsContext';
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
  width = 1000,
  height = 800,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { settings } = useSettings();
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<ExtendedHierarchyCircleNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ExtendedHierarchyCircleNode | null>(null);
  const [zoomedNode, setZoomedNode] = useState<ExtendedHierarchyCircleNode | null>(null);
  const [dependencies, setDependencies] = useState<{source: string, target: string, type: string}[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Color scale for file types
  const fileTypeColorScale = d3.scaleOrdinal<string>()
    .domain(['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.json', '.md', '.py', '.java'])
    .range(['#f6e05e', '#f6ad55', '#4fd1c5', '#38b2ac', '#63b3ed', '#b794f4', '#fc8181', '#68d391', '#a0aec0', '#667eea', '#f687b3']);

  // Get node color based on type and extension
  const getNodeColor = useCallback((node: FileNode) => {
    if (node.type === 'directory') {
      return '#f9f9f9';
    }
    
    if (node.type === 'function' || node.type === 'method') {
      return '#b794f4'; // Purple for functions
    }
    
    if (node.type === 'class') {
      return '#f687b3'; // Pink for classes
    }
    
    // For files, use the extension
    if (node.extension) {
      return fileTypeColorScale(`.${node.extension}`);
    }
    
    return '#cbd5e0'; // Default gray
  }, []);

  // Extract dependencies from the data
  useEffect(() => {
    if (!data) {
      console.log('No data provided to RepositoryPackedCircles');
      return;
    }
    
    console.log('RepositoryPackedCircles data:', data);
    console.log('Data structure check:', {
      hasChildren: Boolean(data.children),
      childrenCount: data.children?.length || 0,
      firstChild: data.children?.[0],
      type: data.type,
      name: data.name,
      path: data.path
    });
    
    const deps: {source: string, target: string, type: string}[] = [];
    
    // Function to recursively extract dependencies
    const extractDependencies = (node: FileNode) => {
      if (node.dependencies) {
        node.dependencies.forEach(dep => {
          deps.push({
            source: node.path,
            target: dep,
            type: 'calls'
          });
        });
      }
      
      if (node.children) {
        node.children.forEach(child => {
          // Add parent-child relationship
          deps.push({
            source: node.path,
            target: child.path,
            type: 'contains'
          });
          
          // Process child's dependencies
          extractDependencies(child);
        });
      }
    };
    
    try {
      extractDependencies(data);
      console.log(`Extracted ${deps.length} dependencies`);
      setDependencies(deps);
    } catch (error) {
      console.error('Error extracting dependencies:', error);
    }
  }, [data]);

  // Create and update visualization
  useEffect(() => {
    if (!svgRef.current || !data) {
      setLoading(false);
      return;
    }
    
    setLoading(true);

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Create hierarchy
    const root = d3.hierarchy(data)
      .sum(d => {
        // Use file size for leaf nodes, or calculate based on children
        if (d.size) {
          return d.size;
        }
        return d.children && d.children.length > 0 ? 0 : 100;
      })
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    // Create pack layout
    const pack = d3.pack<FileNode>()
      .size([width - 40, height - 40])
      .padding(d => {
        // Add more padding between levels
        if (d.depth === 0) return 20;
        if (d.depth === 1) return 10;
        return 3;
      });

    // Apply pack layout
    const packedRoot = pack(root) as ExtendedHierarchyCircleNode;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });
    
    svg.call(zoom);
    zoomRef.current = zoom;

    // Create a group for the visualization
    const g = svg.append('g')
      .attr('transform', 'translate(20, 20)');

    // Create a container for links
    const linksGroup = g.append('g')
      .attr('class', 'links');

    // Create a container for nodes
    const nodesGroup = g.append('g')
      .attr('class', 'nodes');

    // Create nodes with staggered animation
    const node = nodesGroup
      .selectAll<SVGCircleElement, ExtendedHierarchyCircleNode>('circle')
      .data<ExtendedHierarchyCircleNode>(packedRoot.descendants() as ExtendedHierarchyCircleNode[])
      .join('circle')
      .attr('class', 'node')
      .attr('r', d => d.r)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('fill', d => getNodeColor(d.data))
      .attr('stroke', '#fff')
      .attr('stroke-width', d => d.depth === 1 ? 2 : 1)
      .attr('opacity', 0) // Start with opacity 0 for animation
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => handleNodeHover(event, d))
      .on('mouseout', () => handleNodeUnhover())
      .on('click', (event, d) => handleNodeClick(event, d));

    // Create labels with size-based visibility
    const label = nodesGroup
      .selectAll<SVGTextElement, ExtendedHierarchyCircleNode>('text')
      .data<ExtendedHierarchyCircleNode>(
        (packedRoot.descendants() as ExtendedHierarchyCircleNode[]).filter(d => d.r > 20)
      )
      .join('text')
      .attr('class', 'label')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(d => {
        const name = d.data.name;
        const maxLength = Math.floor(d.r / 4);
        return name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
      })
      .style('font-size', d => `${Math.min(d.r / 4, 14)}px`)
      .style('font-weight', d => d.depth <= 1 ? 'bold' : 'normal')
      .style('pointer-events', 'none')
      .style('fill', d => {
        const color = getNodeColor(d.data);
        const rgb = d3.rgb(color);
        const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
        return luminance < 128 ? '#fff' : '#000';
      })
      .attr('opacity', 0);

    // Add tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'visualization-tooltip')
      .style('display', 'none');

    // Animate nodes appearing with staggered delay
    node.transition()
      .duration(800)
      .delay(d => d.depth * 300)
      .attr('opacity', 0.9)
      .attrTween('r', function(d) {
        const i = d3.interpolate(0, d.r);
        return (t: number) => i(t).toString();
      });

    // Animate labels appearing
    label.transition()
      .duration(800)
      .delay(d => d.depth * 300 + 200)
      .attr('opacity', 1);

    // Function to handle node hover
    function handleNodeHover(event: MouseEvent, d: ExtendedHierarchyCircleNode) {
      setHoveredNode(d);
      
      // Highlight the node
      node.attr('opacity', n => isRelated(d, n as ExtendedHierarchyCircleNode) ? 0.9 : 0.3);
      node.filter(n => n === d).classed('highlighted', true);
      
      // Show tooltip
      tooltip.style('display', 'block')
        .html(`
          <div>
            <div style="font-weight: bold;">${d.data.name}</div>
            <div style="font-size: 12px;">${d.data.type}</div>
            ${d.data.language ? `<div style="font-size: 11px; color: #666;">${d.data.language}</div>` : ''}
            ${d.value ? `<div style="font-size: 11px; color: #666;">${formatBytes(d.value)}</div>` : ''}
          </div>
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 20) + 'px');
      
      // Draw dependency links
      drawDependencyLinks(d);
    }

    // Function to handle node unhover
    function handleNodeUnhover() {
      if (!selectedNode) {
        // Reset highlighting only if no node is selected
        node.attr('opacity', 0.9);
        node.classed('highlighted', false);
        
        // Remove dependency links
        linksGroup.selectAll('.dependency-link').remove();
      }
      
      setHoveredNode(null);
      
      // Hide tooltip
      tooltip.style('display', 'none');
    }

    // Function to handle node click
    function handleNodeClick(event: MouseEvent, d: ExtendedHierarchyCircleNode) {
      event.stopPropagation();
      
      if (selectedNode === d) {
        // If clicking the same node, deselect it
        setSelectedNode(null);
        node.attr('opacity', 0.9);
        node.classed('highlighted', false);
        linksGroup.selectAll('.dependency-link').remove();
        return;
      }
      
      setSelectedNode(d);
      
      // Highlight the node and its connections
      node.attr('opacity', n => isRelated(d, n as ExtendedHierarchyCircleNode) ? 0.9 : 0.3);
      node.classed('highlighted', n => n === d);
      
      // Draw dependency links
      drawDependencyLinks(d);
      
      // Zoom to the node
      zoomToNode(d);
    }

    // Function to zoom to a node
    function zoomToNode(d: ExtendedHierarchyCircleNode) {
      setZoomedNode(d);
      
      const scale = Math.min(8, 0.9 / (d.r / Math.min(width, height)));
      const translateX = width / 2 - scale * d.x;
      const translateY = height / 2 - scale * d.y;
      
      svg.transition()
        .duration(750)
        .call(
          zoom.transform as any,
          d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );
    }

    // Function to draw dependency links
    function drawDependencyLinks(d: ExtendedHierarchyCircleNode) {
      // Remove existing links
      linksGroup.selectAll('.dependency-link').remove();
      
      // Find all dependencies related to this node
      const dependencies = findDependencies(d);

      // Draw each dependency link
      dependencies.forEach(dep => {
        const source = findNodeByPath(packedRoot, dep.source);
        const target = findNodeByPath(packedRoot, dep.target);

        if (source && target) {
          // Calculate link path
          const path = calculateLinkPath(source, target, dep.type);

          // Draw the link with animation
          linksGroup.append('path')
            .attr('class', 'dependency-link')
            .classed('animated', true)
            .attr('d', path)
            .attr('stroke', dep.type === 'import' ? '#3182ce' : '#e53e3e')
            .attr('stroke-width', 2)
            .attr('fill', 'none')
            .attr('opacity', 0)
            .transition()
            .duration(300)
            .attr('opacity', 0.7);
        }
      });
    }

    // Helper function to find dependencies
    function findDependencies(node: ExtendedHierarchyCircleNode) {
      const deps: { source: string; target: string; type: string; }[] = [];

      function extractDependencies(n: FileNode) {
        if (n.imports) {
          n.imports.forEach(imp => {
            const importPath = typeof imp === 'string' ? imp : imp.source;
            // Find the target node by path
            const targetNode = findNodeByPath(root, importPath);
            if (targetNode && targetNode.data) {
              deps.push({
                source: n.path,
                target: targetNode.data.path,
                type: 'import'
              });
            }
          });
        }

        if (n.functions) {
          n.functions.forEach(func => {
            if (func.dependencies) {
              func.dependencies.forEach(dep => {
                deps.push({
                  source: `${n.path}#${func.name}`,
                  target: dep.target,
                  type: dep.type
                });
              });
            }
          });
        }

        if (n.classes) {
          n.classes.forEach(cls => {
            cls.methods?.forEach(method => {
              if (method.dependencies) {
                method.dependencies.forEach(dep => {
                  deps.push({
                    source: `${n.path}#${cls.name}.${method.name}`,
                    target: dep.target,
                    type: dep.type
                  });
                });
              }
            });
          });
        }

        if (n.children) {
          n.children.forEach(extractDependencies);
        }
      }

      extractDependencies(node.data);
      return deps;
    }

    // Helper function to find a node by path
    function findNodeByPath(root: ExtendedHierarchyCircleNode, path: string) {
      let result: ExtendedHierarchyCircleNode | null = null;
      
      function traverse(node: ExtendedHierarchyCircleNode) {
        if (node.data.path === path) {
          result = node;
          return;
        }
        
        node.children?.forEach(traverse);
      }
      
      traverse(root);
      return result;
    }

    // Helper function to calculate link path
    function calculateLinkPath(source: ExtendedHierarchyCircleNode, target: ExtendedHierarchyCircleNode, type: string) {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dr = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const sourceX = source.x + Math.cos(angle) * source.r;
      const sourceY = source.y + Math.sin(angle) * source.r;
      const targetX = target.x - Math.cos(angle) * target.r;
      const targetY = target.y - Math.sin(angle) * target.r;
      
      if (type === 'import') {
        return `M${sourceX},${sourceY}L${targetX},${targetY}`;
      } else {
        const midX = (sourceX + targetX) / 2;
        const midY = (sourceY + targetY) / 2;
        const offset = 30;
        const controlX = midX + offset * Math.cos(angle + Math.PI / 2);
        const controlY = midY + offset * Math.sin(angle + Math.PI / 2);
        return `M${sourceX},${sourceY}Q${controlX},${controlY},${targetX},${targetY}`;
      }
    }

    // Function to check if two nodes are related
    function isRelated(a: ExtendedHierarchyCircleNode, b: ExtendedHierarchyCircleNode) {
      // Same node
      if (a === b) return true;
      
      // Ancestor-descendant relationship
      if (isAncestorOf(a, b) || isAncestorOf(b, a)) return true;
      
      // Check direct dependencies
      const isDirectDependency = dependencies.some(link => 
        (link.source === a.data.path && link.target === b.data.path) ||
        (link.source === b.data.path && link.target === a.data.path)
      );
      
      return isDirectDependency;
    }

    // Helper function to check if a node is an ancestor of another
    function isAncestorOf(p: ExtendedHierarchyCircleNode, c: ExtendedHierarchyCircleNode) {
      if (p === c) return false;
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

    // Add arrow marker for links
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Add click handler to background to reset selection
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .style('cursor', 'default')
      .on('click', () => {
        setSelectedNode(null);
        node.attr('opacity', 0.9);
        node.classed('highlighted', false);
        linksGroup.selectAll('.dependency-link').remove();
        
        // Reset zoom
        svg.transition()
          .duration(750)
          .call(
            zoom.transform as any,
            d3.zoomIdentity.translate(20, 20).scale(1)
          );
      });

    setLoading(false);

    // Cleanup on unmount
    return () => {
      tooltip.remove();
    };
  }, [data, width, height, dependencies, getNodeColor]);

  // Handle zoom in button click
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const newZoom = Math.min(8, zoomLevel * 1.5);
    
    svg.transition()
      .duration(300)
      .call(
        zoomRef.current.transform as any,
        d3.zoomIdentity.translate(width / 2 - newZoom * width / 2, height / 2 - newZoom * height / 2).scale(newZoom)
      );
  }, [zoomLevel, width, height]);

  // Handle zoom out button click
  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const newZoom = Math.max(0.1, zoomLevel / 1.5);
    
    svg.transition()
      .duration(300)
      .call(
        zoomRef.current.transform as any,
        d3.zoomIdentity.translate(width / 2 - newZoom * width / 2, height / 2 - newZoom * height / 2).scale(newZoom)
      );
  }, [zoomLevel, width, height]);

  // Handle reset view button click
  const handleResetView = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    
    const svg = d3.select(svgRef.current);
    
    svg.transition()
      .duration(750)
      .call(
        zoomRef.current.transform as any,
        d3.zoomIdentity.translate(20, 20).scale(1)
      );
    
    setSelectedNode(null);
    svg.selectAll('.node').attr('opacity', 0.9).classed('highlighted', false);
    svg.selectAll('.dependency-link').remove();
  }, []);

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
      >
        <style>
          {`
          @keyframes pulse {
            0% {
              stroke-opacity: 0.7;
              stroke-width: 2;
            }
            50% {
              stroke-opacity: 1;
              stroke-width: 3;
            }
            100% {
              stroke-opacity: 0.7;
              stroke-width: 2;
            }
          }
          `}
        </style>
      </svg>
      
      {/* Zoom controls */}
      <div className="zoom-controls">
        <button className="zoom-button" onClick={handleZoomIn} title="Zoom In">
          +
        </button>
        <button className="zoom-button" onClick={handleZoomOut} title="Zoom Out">
          -
        </button>
        <button className="zoom-button" onClick={handleResetView} title="Reset View">
          ↺
        </button>
      </div>
      
      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg z-20">
          <h3 className="font-bold text-lg">{selectedNode.data.name}</h3>
          <p className="text-sm capitalize">{selectedNode.data.type}</p>
          {selectedNode.data.language && (
            <p className="text-xs text-gray-600">{selectedNode.data.language}</p>
          )}
          <button
            className="mt-2 px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs"
            onClick={handleResetView}
          >
            Reset View
          </button>
        </div>
      )}
    </div>
  );
};

export default RepositoryPackedCircles; 
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import LoadingSpinner from '@/components/LoadingSpinner';

// Define types for graph data
export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
  fileType?: string;
  size: number;
  language?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

// Add this interface for typed edges in the simulation
interface SimulationEdgeDatum extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

export interface Edge extends SimulationEdgeDatum {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: Edge[];
}

interface RepositoryGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
}

export const RepositoryGraph: React.FC<RepositoryGraphProps> = ({
  data,
  width = 1000,
  height = 800,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultSettings = {
    enable_animations: true,
    default_visualization: 'graph'
  };
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulation, setSimulation] = useState<d3.Simulation<GraphNode, SimulationEdgeDatum> | null>(null);
  const [dimensions, setDimensions] = useState({ width: width, height: height });
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices and adjust dimensions
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = mobile ? 450 : 650; // Use smaller height on mobile
        
        setDimensions({
          width: containerWidth || width,
          height: containerHeight
        });
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [width]);

  // Color scale for file types
  const fileTypeColorScale = d3.scaleOrdinal<string>()
    .domain(['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html', '.json', '.md', '.py', '.java'])
    .range(['#f6e05e', '#f6ad55', '#4fd1c5', '#38b2ac', '#63b3ed', '#b794f4', '#fc8181', '#68d391', '#a0aec0', '#667eea', '#f687b3']);

  // Get node color based on type and language
  const getNodeColor = useCallback((node: GraphNode) => {
    if (node.type === 'directory') {
      return '#f9f9f9';
    }
    
    if (node.type === 'function' || node.type === 'method') {
      return '#b794f4'; // Purple for functions
    }
    
    if (node.type === 'class') {
      return '#f687b3'; // Pink for classes
    }
    
    // For files, use the language/extension
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
    
    return '#cbd5e0'; // Default gray
  }, []);

  // Function to get adjusted node radius based on type and device
  const getAdjustedNodeRadius = (node: GraphNode) => {
    const baseSize = isMobile ? 0.7 : 1; // Scale down on mobile
    
    // Base size based on node type
    let size = 5 * baseSize; // Default size
    
    if (node.type === 'directory') {
      size = 8 * baseSize;
    } else if (node.type === 'file') {
      size = 6 * baseSize;
    } else if (node.type === 'function' || node.type === 'method') {
      size = 4 * baseSize;
    } else if (node.type === 'class') {
      size = 5 * baseSize;
    }
    
    // Add slight variation based on node size if available
    if (node.size) {
      const sizeBonus = Math.log(node.size) / 10;
      size += Math.min(sizeBonus, 4); // Cap the size bonus
    }
    
    return size;
  };

  // Create and update visualization
  useEffect(() => {
    if (!svgRef.current || !data || !data.nodes || !data.edges) {
      setLoading(false);
      return;
    }
      
    setLoading(true);

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Process data
    const nodes = [...data.nodes];
    const edges = data.edges.map(edge => ({
      ...edge,
      source: typeof edge.source === 'string' ? edge.source : edge.source.id,
      target: typeof edge.target === 'string' ? edge.target : edge.target.id
    }));

    // Create SVG with responsive dimensions
    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .attr('viewBox', [0, 0, dimensions.width, dimensions.height]);

    // Add zoom behavior
    const g = svg.append('g');
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);

    // Add a background to capture mouse events
    g.append('rect')
      .attr('width', dimensions.width * 2)
      .attr('height', dimensions.height * 2)
      .attr('x', -dimensions.width / 2)
      .attr('y', -dimensions.height / 2)
      .attr('fill', 'transparent')
      .on('click', () => {
        // Deselect when clicking background
        highlightConnections(null);
        setSelectedNode(null);
      });

    // Create force simulation
    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, SimulationEdgeDatum>(edges)
        .id(d => d.id)
        .distance(edge => {
          if ((edge as Edge).type === 'contains') return isMobile ? 20 : 30;
          return isMobile ? 60 : 100;
        })
        .strength(edge => {
          if ((edge as Edge).type === 'contains') return 0.8;
          return 0.2;
        }))
      .force('charge', d3.forceManyBody<GraphNode>()
        .strength(d => {
          if (d.type === 'directory') return isMobile ? -150 : -300;
          if (d.type === 'file') return isMobile ? -80 : -150;
          return isMobile ? -30 : -50;
        }))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collide', d3.forceCollide<GraphNode>().radius(d => getAdjustedNodeRadius(d) + 2))
      .force('x', d3.forceX(dimensions.width / 2).strength(0.05))
      .force('y', d3.forceY(dimensions.height / 2).strength(0.05));

    // Create edges
    const edge = g.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll<SVGLineElement, Edge>('line')
      .data(edges)
      .join('line')
      .attr('stroke-width', d => d.type === 'contains' ? 1 : 2)
      .attr('stroke', d => {
        if (d.type === 'contains') return '#999';
        if (d.type === 'import') return '#3182ce';
        if (d.type === 'calls') return '#e53e3e';
        return '#999';
      })
      .attr('stroke-dasharray', d => d.type === 'contains' ? '0' : '5,5')
      .attr('opacity', 0.3);

    // Create nodes
    const node = g.append('g')
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => getAdjustedNodeRadius(d))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .call((selection) => {
        const dragBehavior = d3.drag<SVGCircleElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
          });
        selection.call(dragBehavior);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
        highlightConnections(d);
      })
      .on('mouseover', (event, d) => {
        if (!selectedNode) {
          highlightConnections(d, false);
        }
        
        // Show tooltip
        tooltip.style('display', 'block')
          .html(`
            <div class="p-2">
              <div class="font-bold">${d.name}</div>
              <div class="text-sm">${d.type}</div>
              ${d.language ? `<div class="text-xs">${d.language}</div>` : ''}
            </div>
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 20) + 'px');
      })
      .on('mouseout', () => {
        if (!selectedNode) {
          resetHighlighting();
        }
        
        // Hide tooltip
        tooltip.style('display', 'none');
      })
      // Add touch support for mobile
      .on('touchstart', function(event, d) {
        // Prevent scrolling on touch
        event.preventDefault();
      })
      .on('touchend', function(event, d) {
        // Handle touch on mobile
        event.preventDefault();
        event.stopPropagation();
        
        // Show node selection on mobile
        setSelectedNode(d);
        highlightConnections(d);
        
        // Show tooltip at fixed position for mobile
        tooltip.style('display', 'block')
          .html(`
            <div class="p-2">
              <div class="font-bold">${d.name}</div>
              <div class="text-sm">${d.type}</div>
              ${d.language ? `<div class="text-xs">${d.language}</div>` : ''}
            </div>
          `)
          .style('left', '50%')
          .style('transform', 'translateX(-50%)')
          .style('bottom', '60px')
          .style('top', 'auto');
        
        // Hide tooltip after 2 seconds on mobile
        setTimeout(() => {
          tooltip.style('display', 'none');
        }, 2000);
      });

    // Add labels
    const label = g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('dx', d => getAdjustedNodeRadius(d) + 5)
      .attr('dy', '.35em')
      .text(d => d.name)
      .style('font-size', d => {
        if (d.type === 'directory') return '12px';
        if (d.type === 'file') return '10px';
        return '8px';
      })
      .style('fill', '#333')
      .style('pointer-events', 'none')
      .style('opacity', d => {
        if (d.type === 'directory') return 1;
        if (d.type === 'file') return 0.8;
        return 0; // Hide function labels initially
      });

    // Add tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'absolute z-50 bg-white shadow-lg rounded-md p-2 pointer-events-none')
      .style('display', 'none');

    // Update positions on tick
    sim.on('tick', () => {
      edge
        .attr('x1', d => {
          const source = typeof d.source === 'string' 
            ? nodes.find(n => n.id === d.source) 
            : d.source as GraphNode;
          return source?.x || 0;
        })
        .attr('y1', d => {
          const source = typeof d.source === 'string' 
            ? nodes.find(n => n.id === d.source) 
            : d.source as GraphNode;
          return source?.y || 0;
        })
        .attr('x2', d => {
          const target = typeof d.target === 'string' 
            ? nodes.find(n => n.id === d.target) 
            : d.target as GraphNode;
          return target?.x || 0;
        })
        .attr('y2', d => {
          const target = typeof d.target === 'string' 
            ? nodes.find(n => n.id === d.target) 
            : d.target as GraphNode;
          return target?.y || 0;
        });

      node
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);

      label
        .attr('x', d => d.x || 0)
        .attr('y', d => d.y || 0);
    });

    // Function to highlight connections
    function highlightConnections(d: GraphNode | null, permanent = true) {
      if (!d) {
        resetHighlighting();
        return;
      }

      // Dim all nodes and edges
      node.attr('opacity', 0.2);
      edge.attr('opacity', 0.1);
      label.style('opacity', 0);

      // Highlight the selected node
      node.filter(n => n.id === d.id)
        .attr('opacity', 1)
        .attr('stroke', '#f56565')
        .attr('stroke-width', 3);

      // Show label for selected node
      label.filter(n => n.id === d.id)
        .style('opacity', 1)
        .style('font-weight', 'bold');

      // Find connected nodes and edges
      const connectedNodeIds = new Set<string>();
      connectedNodeIds.add(d.id);

      // Find incoming edges (where this node is the target)
      const incomingEdges = edges.filter(e => {
        const targetId = typeof e.target === 'string' ? e.target : (e.target as GraphNode).id;
        return targetId === d.id;
      });
      
      // Find outgoing edges (where this node is the source)
      const outgoingEdges = edges.filter(e => {
        const sourceId = typeof e.source === 'string' ? e.source : (e.source as GraphNode).id;
        return sourceId === d.id;
      });

      // Collect all connected edges
      const connectedEdges = [...incomingEdges, ...outgoingEdges];

      // Highlight connected edges with animation
      edge.filter(e => connectedEdges.includes(e))
        .attr('opacity', 0.8)
        .attr('stroke-width', e => e.type === 'contains' ? 1.5 : 3)
        .classed('animate-pulse', true);

      // Add connected node IDs
      incomingEdges.forEach(e => {
        const sourceId = typeof e.source === 'string' ? e.source : (e.source as GraphNode).id;
        connectedNodeIds.add(sourceId);
      });
      
      outgoingEdges.forEach(e => {
        const targetId = typeof e.target === 'string' ? e.target : (e.target as GraphNode).id;
        connectedNodeIds.add(targetId);
      });

      // Highlight connected nodes
      node.filter(n => connectedNodeIds.has(n.id) && n.id !== d.id)
        .attr('opacity', 0.8)
        .attr('stroke', '#4299e1')
        .attr('stroke-width', 2);

      // Show labels for connected nodes
      label.filter(n => connectedNodeIds.has(n.id))
        .style('opacity', 0.8);
    }

    // Function to reset highlighting
    function resetHighlighting() {
      node.attr('opacity', 1)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5);
      
      edge.attr('opacity', 0.3)
        .attr('stroke-width', d => d.type === 'contains' ? 1 : 2)
        .classed('animate-pulse', false);
      
      label.style('opacity', d => {
        if (d.type === 'directory') return 1;
        if (d.type === 'file') return 0.8;
        return 0;
      })
      .style('font-weight', 'normal');
    }

    // Save simulation for later use
    setSimulation(sim);
    setLoading(false);

    // Cleanup on unmount
    return () => {
      sim.stop();
      tooltip.remove();
    };
  }, [data, dimensions.width, dimensions.height, isMobile, getNodeColor, getAdjustedNodeRadius]);

  // Handle selected node changes
  useEffect(() => {
    if (!svgRef.current || !simulation) return;
    
    const svg = d3.select(svgRef.current);
    
    if (selectedNode) {
      // Center view on selected node
      const node = simulation.nodes().find(n => n.id === selectedNode.id);
      if (node && node.x && node.y) {
        const transform = d3.zoomTransform(svg.node() as Element);
        const scale = transform.k;
        const x = -node.x * scale + dimensions.width / 2;
        const y = -node.y * scale + dimensions.height / 2;
        
        svg.transition().duration(750)
          .call(
            d3.zoom<SVGSVGElement, unknown>().transform as any,
            d3.zoomIdentity.translate(x, y).scale(scale)
          );
      }
    }
  }, [selectedNode, simulation, dimensions.width, dimensions.height]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <LoadingSpinner />
        </div>
      )}
      <svg
        ref={svgRef}
        className="w-full h-full border border-gray-200 rounded-lg"
        style={{ minHeight: isMobile ? '400px' : '600px' }}
      />
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto bg-white p-4 rounded-lg shadow-lg z-20 max-w-xs md:max-w-md">
          <h3 className="font-bold text-lg truncate">{selectedNode.name}</h3>
          <p className="text-sm capitalize">{selectedNode.type}</p>
          {selectedNode.language && (
            <p className="text-xs text-gray-600">{selectedNode.language}</p>
          )}
          <button 
            className="mt-2 px-3 py-1.5 bg-gray-200 text-gray-800 rounded text-sm flex items-center justify-center w-full md:w-auto"
            onClick={() => {
              setSelectedNode(null);
              const svg = d3.select(svgRef.current);
              const g = svg.select('g');
              g.selectAll('circle').attr('opacity', 1).attr('stroke', '#fff').attr('stroke-width', 1.5);
              g.selectAll('line').attr('opacity', 0.3).attr('stroke-width', (d: any) => d.type === 'contains' ? 1 : 2);
            }}
          >
            Clear Selection
          </button>
        </div>
      )}
      
      {isMobile && !selectedNode && (
        <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-75 text-center py-2 text-xs z-10">
          <p>Drag to move • Pinch to zoom • Tap nodes to select</p>
        </div>
      )}
    </div>
  );
}; 

export default RepositoryGraph; 
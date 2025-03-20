'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { GraphData, Edge } from '@/types/types';

// Define a proper interface for graph nodes
interface GraphNode {
  id: string;
  name: string;
  type: string;
  size: number;
  language?: string;
  path?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface ForceGraphProps {
  data: GraphData;
  width: string | number;
  height: string | number;
}

const ForceGraph: React.FC<ForceGraphProps> = ({ data, width, height }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !data.nodes.length || !svgRef.current) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current);
    const container = svg.append("g");

    // Get dimensions
    const svgElement = svgRef.current;
    const bbox = svgElement.getBoundingClientRect();
    const width = bbox.width;
    const height = bbox.height;

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Define node colors by type
    const nodeColors: Record<string, string> = {
      file: "#4CAF50",
      directory: "#2196F3",
      function: "#FF9800",
      class: "#9C27B0",
      method: "#E91E63",
      default: "#607D8B"
    };

    // Define edge colors by type
    const edgeColors: Record<string, string> = {
      contains: "#9E9E9E",
      imports: "#03A9F4",
      calls: "#FF5722",
      default: "#9E9E9E"
    };

    // Create nodes data with proper typing
    const nodesData: GraphNode[] = data.nodes.map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      size: node.size || 0,
      language: node.language,
      path: node.path
    }));

    // Create the force simulation
    const simulation = d3.forceSimulation<GraphNode>()
      .force("link", d3.forceLink<GraphNode, Edge>()
        .id(d => d.id)
        .distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(30));

    // Process edges for d3
    const edgesData = data.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type
    }));

    // Create edges
    const links = container.selectAll(".link")
      .data(edgesData)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", d => edgeColors[d.type as keyof typeof edgeColors] || edgeColors.default)
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.6);

    // Create nodes
    const nodes = container.selectAll<SVGGElement, GraphNode>(".node")
      .data(nodesData)
      .enter()
      .append("g")
      .attr("class", "node");
      
    // Setup drag behavior
    const dragBehavior = d3.drag<SVGGElement, GraphNode>()
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded);
      
    nodes.call(dragBehavior);

    // Add circles to nodes
    nodes.append("circle")
      .attr("r", d => getNodeRadius(d))
      .attr("fill", d => nodeColors[d.type as keyof typeof nodeColors] || nodeColors.default);

    // Add text labels to nodes
    nodes.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .attr("y", d => getNodeRadius(d) + 12)
      .text(d => d.name)
      .attr("font-size", "10px")
      .attr("fill", "#333");

    // Add tooltips
    nodes.append("title")
      .text(d => `${d.name} (${d.type})${d.path ? '\nPath: ' + d.path : ''}`);

    // Update positions on tick
    simulation.nodes(nodesData).on("tick", () => {
      links
        .attr("x1", d => {
          const source = typeof d.source === 'string' 
            ? nodesData.find(n => n.id === d.source) 
            : d.source as GraphNode;
          return source?.x || 0;
        })
        .attr("y1", d => {
          const source = typeof d.source === 'string' 
            ? nodesData.find(n => n.id === d.source) 
            : d.source as GraphNode;
          return source?.y || 0;
        })
        .attr("x2", d => {
          const target = typeof d.target === 'string' 
            ? nodesData.find(n => n.id === d.target) 
            : d.target as GraphNode;
          return target?.x || 0;
        })
        .attr("y2", d => {
          const target = typeof d.target === 'string' 
            ? nodesData.find(n => n.id === d.target) 
            : d.target as GraphNode;
          return target?.y || 0;
        });

      nodes.attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Set links for force
    (simulation.force("link") as d3.ForceLink<GraphNode, Edge>)
      .links(edgesData as any);

    // Drag handlers
    function dragStarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragEnded(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Helper to determine node radius based on type and size
    function getNodeRadius(node: GraphNode): number {
      const baseSize = 5;
      const typeMultiplier: Record<string, number> = {
        directory: 1.5,
        file: 1.2,
        function: 0.9,
        class: 1.3,
        method: 0.8,
        default: 1.0
      };
      
      const multiplier = typeMultiplier[node.type as keyof typeof typeMultiplier] || typeMultiplier.default;
      
      // Optional: scale with node size property
      const sizeScale = node.size ? Math.log(node.size + 1) / 10 : 1;
      return baseSize * multiplier * Math.max(1, sizeScale);
    }

    // Center the initial view
    svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.8));

    // Cleanup when unmounting
    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height} 
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default ForceGraph; 
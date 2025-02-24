import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { HierarchyNode } from 'd3';

interface FileData {
  name: string;
  content?: any;
  children?: FileData[];
}

interface VisualizationProps {
  data: Record<string, unknown>;
}

export const Visualization: React.FC<VisualizationProps> = ({ data }: VisualizationProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    const width = 900;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Clear any existing elements in the SVG
    svg.selectAll('*').remove();

    // Convert data to hierarchical format for D3
    const rootData: FileData = {
      name: 'root',
      children: Object.entries(data).map(([key, value]) => ({ 
        name: key, 
        content: value 
      }))
    };

    const hierarchicalData = d3.hierarchy<FileData>(rootData)
      .sum(() => 1) // Modify this to weight nodes based on content size if needed
      .sort((a: HierarchyNode<FileData>, b: HierarchyNode<FileData>) => 
        b.height - a.height || b.data.name.localeCompare(a.data.name)
      );

    // Create a pack layout
    const packLayout = d3.pack<FileData>()
      .size([width, height])
      .padding(5);

    const root = packLayout(hierarchicalData);

    // Create node groups
    const node = svg.selectAll<SVGGElement, d3.HierarchyCircularNode<FileData>>('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    // Draw circles for each node
    node.append('circle')
      .attr('r', d => d.r)
      .attr('fill', d => {
        // Use calming, nature-inspired colors
        switch (d.depth) {
          case 0: return '#E5E9F0'; // Light gray like the pathway
          case 1: return '#81A1C1'; // Ocean blue from the background
          case 2: return '#A3BE8C'; // Tree green
          default: return '#EBCB8B'; // Warm sand color
        }
      })
      .attr('stroke', '#D8DEE9')  // Lighter border
      .attr('stroke-width', 0.5);

    // Add text labels to the nodes, only if radius is large enough
    node.filter(d => d.r > 20) // Adjust radius threshold as needed
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', d => Math.max(10, d.r / 5)) // Dynamic font size based on node size
      .selectAll<SVGTSpanElement, d3.HierarchyCircularNode<FileData>>('tspan')
      .data(d => {
        const nameParts = d.data.name.split('/');
        return nameParts.map(part => ({ text: part, parent: d }));
      })
      .join('tspan')
      .attr('x', 0)
      .attr('y', (_, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
      .text(d => d.text);
  }, [data]);

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-lg p-4">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
}; 
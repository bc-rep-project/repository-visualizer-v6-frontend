import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Visualization = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data) return;

    const width = 900;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Clear any existing elements in the SVG
    svg.selectAll('*').remove();

    // Convert data to hierarchical format for D3
    const hierarchicalData = d3.hierarchy({ name: 'root', children: Object.entries(data).map(([key, value]) => ({ name: key, content: value })) })
      .sum(() => 1) // Modify this to weight nodes based on content size if needed
      .sort((a, b) => b.height - a.height || b.data.name.localeCompare(a.data.name));

    // Create a pack layout
    const root = d3.pack()
      .size([width, height])
      .padding(5)(hierarchicalData);

    // Create node groups
    const node = svg.selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    // Draw circles for each node
    node.append('circle')
      .attr('r', d => d.r)
      .attr('fill', d => {
        // Color based on depth for visual hierarchy
        switch (d.depth) {
          case 0: return '#757575'; // Root node
          case 1: return '#64b5f6'; // Main folders
          case 2: return '#aed581'; // Subfolders
          default: return '#fff59d'; // Files
        }
      })
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1);

    // Add text labels to the nodes, only if radius is large enough
    node.filter(d => d.r > 20) // Adjust radius threshold as needed
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', d => Math.max(10, d.r / 5)) // Dynamic font size based on node size
      .selectAll('tspan')
      .data(d => {
        const nameParts = d.data.name.split('/');
        return nameParts;
      })
      .join('tspan')
      .attr('x', 0)
      .attr('y', (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
      .text(d => d);
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default Visualization;
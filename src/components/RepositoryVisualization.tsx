import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { HierarchyNode as D3HierarchyNode } from 'd3';
import { ConversionResponse } from '../utils/api';

interface FileNode {
    name: string;
    value: number;
    lines: number;
    extension: string;
}

interface HierarchyNode {
    name: string;
    children: FileNode[];
}

interface RepositoryVisualizationProps {
    data: ConversionResponse['analysis'];
}

export const RepositoryVisualization: React.FC<RepositoryVisualizationProps> = ({ data }: RepositoryVisualizationProps) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!data || !svgRef.current) return;

        // Clear previous visualization
        d3.select(svgRef.current).selectAll('*').remove();

        const width = 800;
        const height = 600;
        const margin = { top: 40, right: 40, bottom: 40, left: 40 };

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        // Create hierarchical data structure
        const hierarchyData: HierarchyNode = {
            name: 'root',
            children: data.files.map((file: any) => ({
                name: file.original_path,
                value: file.size,
                lines: file.lines,
                extension: file.original_extension
            }))
        };

        // Create treemap layout
        const treemap = d3.treemap<HierarchyNode | FileNode>()
            .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
            .padding(1);

        const root = d3.hierarchy<HierarchyNode | FileNode>(hierarchyData)
            .sum((d: HierarchyNode | FileNode) => 'value' in d ? d.value : 0)
            .sort((a: D3HierarchyNode<HierarchyNode | FileNode>, b: D3HierarchyNode<HierarchyNode | FileNode>) => (b.value || 0) - (a.value || 0));

        treemap(root);

        // Color scale for different file extensions
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(data.repository_stats.extensions);

        // Create container for treemap
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add cells
        const cell = g.selectAll('g')
            .data(root.leaves())
            .enter().append('g')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);

        // Add rectangles
        cell.append('rect')
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => colorScale(d.data.extension))
            .attr('opacity', 0.8)
            .on('mouseover', function() {
                d3.select(this).attr('opacity', 1);
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 0.8);
            });

        // Add file names
        cell.append('text')
            .attr('x', 5)
            .attr('y', 15)
            .text(d => {
                const name = d.data.name.split('/').pop() || '';
                return name.length * 6 < (d.x1 - d.x0) ? name : '';
            })
            .attr('font-size', '10px')
            .attr('fill', 'white');

        // Add legend
        const legend = svg.append('g')
            .attr('font-family', 'sans-serif')
            .attr('font-size', 10)
            .attr('text-anchor', 'start')
            .selectAll('g')
            .data(data.repository_stats.extensions)
            .enter().append('g')
            .attr('transform', (d, i) => `translate(${width - margin.right - 100},${margin.top + i * 20})`);

        legend.append('rect')
            .attr('x', 0)
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', d => colorScale(d));

        legend.append('text')
            .attr('x', 20)
            .attr('y', 10)
            .text(d => d);

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', margin.top / 2)
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .text('Repository File Structure');

    }, [data]);

    return (
        <div className="visualization-container">
            <svg ref={svgRef}></svg>
            <style jsx>{`
                .visualization-container {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </div>
    );
}; 
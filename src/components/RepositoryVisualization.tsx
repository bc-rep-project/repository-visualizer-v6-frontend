import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { HierarchyNode, HierarchyRectangularNode } from 'd3';

interface FileNode {
    name: string;
    size?: number;
    children?: FileNode[];
}

interface VisualizationProps {
    data: FileNode;
    width?: number;
    height?: number;
}

type TreemapNode = HierarchyRectangularNode<FileNode>;

export const RepositoryVisualization: React.FC<VisualizationProps> = ({
    data,
    width = 928,
    height = 600,
}: VisualizationProps) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current || !data) return;

        // Clear previous visualization
        d3.select(svgRef.current).selectAll('*').remove();

        // Create hierarchy
        const root = d3.hierarchy<FileNode>(data)
            .sum((d: FileNode) => d.size || 0)
            .sort((a: HierarchyNode<FileNode>, b: HierarchyNode<FileNode>) => (b.value || 0) - (a.value || 0));

        // Create treemap layout
        const treemap = d3.treemap<FileNode>()
            .size([width, height])
            .paddingOuter(3)
            .paddingTop(19)
            .paddingInner(1)
            .round(true);

        const rootWithLayout = treemap(root);

        // Create SVG
        const svg = d3.select(svgRef.current)
            .attr('viewBox', [0, 0, width, height])
            .style('font', '10px sans-serif');

        // Create color scale
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        const node = svg.selectAll<SVGGElement, TreemapNode>('g')
            .data(rootWithLayout.descendants())
            .join('g')
            .attr('transform', (d: TreemapNode) => `translate(${d.x0},${d.y0})`);

        node.append('rect')
            .attr('width', (d: TreemapNode) => Math.max(0, d.x1 - d.x0))
            .attr('height', (d: TreemapNode) => Math.max(0, d.y1 - d.y0))
            .attr('fill', (d: TreemapNode) => color(d.depth.toString()))
            .attr('fill-opacity', 0.6)
            .attr('stroke', '#fff');

        // Add labels
        const text = node.append('text')
            .attr('x', 3)
            .attr('y', 15)
            .attr('fill', '#000');

        // Add title
        text.append('tspan')
            .attr('font-weight', (d: TreemapNode) => d.depth ? null : 'bold')
            .text((d: TreemapNode) => d.data.name);

        // Add size labels for files
        node.filter((d: TreemapNode) => !d.children && d.value !== undefined && d.value > 0)
            .append('text')
            .attr('x', 3)
            .attr('y', 25)
            .attr('fill', '#000')
            .attr('opacity', 0.7)
            .text((d: TreemapNode) => formatBytes(d.value || 0));

        // Add hover effects
        node.on('mouseover', function(this: SVGGElement, event: MouseEvent, d: TreemapNode) {
            d3.select(this).select('rect')
                .attr('fill-opacity', 0.8)
                .attr('stroke-width', 2);
        }).on('mouseout', function(this: SVGGElement, event: MouseEvent, d: TreemapNode) {
            d3.select(this).select('rect')
                .attr('fill-opacity', 0.6)
                .attr('stroke-width', 1);
        });

    }, [data, width, height]);

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    };

    return (
        <div className="relative w-full h-full bg-white rounded-lg shadow-lg">
            <svg
                ref={svgRef}
                width={width}
                height={height}
                className="w-full h-full"
            />
        </div>
    );
}; 
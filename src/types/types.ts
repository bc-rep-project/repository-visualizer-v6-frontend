import * as d3 from 'd3';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'function' | 'class';
  size?: number;
  language?: string;
  children?: FileNode[];
  functions?: {
    name: string;
    type: string;
    dependencies?: string[];
  }[];
  classes?: {
    name: string;
    type: string;
    methods?: {
      name: string;
      type: string;
      dependencies?: string[];
    }[];
  }[];
  imports?: string[];
}

export interface Node {
  id: string;
  name: string;
  type: string;
  size: number;
  language: string;
  path: string;
}

export interface Edge {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export interface AnalysisData {
  graph: GraphData;
  tree: FileNode;
}

export interface FilterOptions {
  showFiles: boolean;
  showDirectories: boolean;
  showFunctions: boolean;
  showClasses: boolean;
  searchQuery: string;
}

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

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

// D3.js specific types
export type HierarchyNode = d3.HierarchyNode<FileNode>;
export type HierarchyRectangularNode = d3.HierarchyRectangularNode<FileNode>;

export interface AnimatedNode extends HierarchyRectangularNode {
  current: {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  };
  target: {
    x0: number;
    x1: number;
    y0: number;
    y1: number;
  };
}

export interface SunburstData {
  node: AnimatedNode;
  path: string;
} 
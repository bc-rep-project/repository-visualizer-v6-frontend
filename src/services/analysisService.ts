import axios from 'axios';
import { FileNode, GraphData, AnalysisData, Node, Edge } from '@/types/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export interface Dependency {
  source: string;
  target: string;
  type: string;
}

export interface GraphNode {
  id: string;
  name: string;
  type: string;
  fileType?: string;
  size: number;
  language?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

interface FilterOptions {
  showFiles: boolean;
  showDirectories: boolean;
  showFunctions: boolean;
  showClasses: boolean;
  searchQuery: string;
}

/**
 * Transforms raw analysis data for visualization
 */
export function transformAnalysisData(data: FileNode, filters: FilterOptions): AnalysisData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const nodeMap = new Map<string, Node>();

  function processNode(node: FileNode, parentId?: string) {
    // Skip nodes based on filters
    if (
      (node.type === 'file' && !filters.showFiles) ||
      (node.type === 'directory' && !filters.showDirectories) ||
      (filters.searchQuery && !node.path.toLowerCase().includes(filters.searchQuery.toLowerCase()))
    ) {
      return;
    }

    // Create node
    const nodeId = node.path || node.name;
    const nodeData: Node = {
      id: nodeId,
      name: node.name,
      type: node.type,
      size: node.size || 0,
      language: node.language || '',
      path: node.path
    };

    nodes.push(nodeData);
    nodeMap.set(nodeId, nodeData);

    // Create edge to parent if exists
    if (parentId) {
      edges.push({
        source: parentId,
        target: nodeId,
        type: 'contains'
      });
    }

    // Process functions if enabled
    if (filters.showFunctions && node.functions) {
      for (const func of node.functions) {
        const funcId = `${nodeId}:${func.name}`;
        const funcNode: Node = {
          id: funcId,
          name: func.name,
          type: 'function',
          path: `${node.path}#${func.name}`,
          size: 0,
          language: node.language || ''
        };
        nodes.push(funcNode);
        nodeMap.set(funcId, funcNode);

        // Edge from file to function
        edges.push({
          source: nodeId,
          target: funcId,
          type: 'contains'
        });

        // Process function dependencies
        if (func.dependencies) {
          for (const dep of func.dependencies) {
            edges.push({
              source: funcId,
              target: typeof dep === 'string' ? dep : dep.target,
              type: 'calls'
            });
          }
        }
      }
    }

    // Process classes if enabled
    if (filters.showClasses && node.classes) {
      for (const cls of node.classes) {
        const classId = `${nodeId}:${cls.name}`;
        const classNode: Node = {
          id: classId,
          name: cls.name,
          type: 'class',
          path: `${node.path}#${cls.name}`,
          size: 0,
          language: node.language || ''
        };
        nodes.push(classNode);
        nodeMap.set(classId, classNode);

        // Edge from file to class
        edges.push({
          source: nodeId,
          target: classId,
          type: 'contains'
        });
      }
    }

    // Process imports
    if (node.imports) {
      for (const imp of node.imports) {
        edges.push({
          source: nodeId,
          target: typeof imp === 'string' ? imp : imp.source,
          type: 'imports'
        });
      }
    }

    // Recursively process children
    if (node.children) {
      for (const child of node.children) {
        processNode(child, nodeId);
      }
    }
  }

  // Start processing from root
  processNode(data);

  // Create graph data
  const graph: GraphData = {
    nodes,
    edges: edges.filter(edge => 
      nodeMap.has(edge.source) && nodeMap.has(edge.target)
    )
  };
  
  return {
    graph,
    tree: data
  };
}

/**
 * Recursively filters the tree based on filters
 */
const filterTree = (tree: FileNode, filters: any): FileNode => {
  // Clone the tree to avoid modifying the original
  const result = { ...tree };
  
  if (tree.children) {
    result.children = tree.children
      .filter(child => {
        // Apply type filters
        if (child.type === 'file' && !filters.showFiles) return false;
        if (child.type === 'directory' && !filters.showDirectories) return false;
        if (child.type === 'function' && !filters.showFunctions) return false;
        if (child.type === 'class' && !filters.showClasses) return false;
        
        // Apply search filter
        if (filters.searchQuery) {
          const lowerQuery = filters.searchQuery.toLowerCase();
          return child.name.toLowerCase().includes(lowerQuery) || 
                 child.path.toLowerCase().includes(lowerQuery);
        }
        
        return true;
      })
      .map(child => filterTree(child, filters));
  }
  
  return result;
};

export interface RepositoryAnalysis {
  name: string;
  type: 'directory';
  path: string;
  children: FileNode[];
  dependencies: Dependency[];
  tree: FileNode;
  graph: {
    nodes: any[];
    edges: any[];
  };
}

export const analysisService = {
  async getRepositoryAnalysis(repositoryId: string): Promise<FileNode> {
    const response = await fetch(`${API_BASE_URL}/repositories/${repositoryId}/analyze`);
    if (!response.ok) {
      throw new Error(`Failed to fetch repository analysis: ${response.statusText}`);
    }
    return response.json();
  },
  
  async getAnalysisStatus(repositoryId: string): Promise<{
    repository_id: string;
    standard_analysis_available: boolean;
    enhanced_analysis_available: boolean;
    standard_analysis_date: string | null;
    enhanced_analysis_date: string | null;
  }> {
    const response = await fetch(`${API_BASE_URL}/repositories/${repositoryId}/analysis/status`);
    if (!response.ok) {
      throw new Error(`Failed to fetch analysis status: ${response.statusText}`);
    }
    return response.json();
  },
  
  async refreshAnalysis(repositoryId: string): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/repositories/${repositoryId}/analyze/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to refresh analysis: ${response.statusText}`);
    }
    return response.json();
  }
}; 
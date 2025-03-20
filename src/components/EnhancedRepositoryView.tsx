'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileNode, GraphData, FilterOptions } from '@/types/types';
import { analysisService } from '@/services/analysisService';
import ForceGraph from './visualization/ForceGraph';
import DirectoryStructure from './DirectoryStructure';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Loader } from 'lucide-react';

interface EnhancedRepositoryViewProps {
  repositoryId: string;
}

const EnhancedRepositoryView: React.FC<EnhancedRepositoryViewProps> = ({ repositoryId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<FileNode | null>(null);
  const [dependencyGraph, setDependencyGraph] = useState<GraphData | null>(null);
  const [filteredGraph, setFilteredGraph] = useState<GraphData | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    showFiles: true,
    showDirectories: true,
    showFunctions: false,
    showClasses: false,
    searchQuery: ''
  });

  // Fetch analysis data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch repository analysis
        const analysis = await analysisService.getRepositoryAnalysis(repositoryId);
        setAnalysisData(analysis);
        
        // Fetch dependency graph
        const graph = await analysisService.getDependencyGraph(repositoryId);
        setDependencyGraph(graph);
        setFilteredGraph(graph); // Initialize filtered graph
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load repository analysis');
        setLoading(false);
      }
    };
    
    if (repositoryId) {
      fetchData();
    }
  }, [repositoryId]);

  // Apply filters when they change
  useEffect(() => {
    if (analysisData) {
      const filtered = analysisService.applyFilters(analysisData, filters);
      setFilteredGraph(filtered.graph);
    }
  }, [filters, analysisData]);

  // Handle filter changes
  const handleFilterChange = (field: keyof FilterOptions) => (value: boolean) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <Loader className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Analyzing repository structure...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="graph" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="graph">Dependency Graph</TabsTrigger>
          <TabsTrigger value="structure">Directory Structure</TabsTrigger>
        </TabsList>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="col-span-1 md:col-span-3">
            <CardHeader>
              <CardTitle>Visualization Controls</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showFiles" 
                  checked={filters.showFiles} 
                  onCheckedChange={handleFilterChange('showFiles')}
                />
                <Label htmlFor="showFiles">Files</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showDirectories" 
                  checked={filters.showDirectories} 
                  onCheckedChange={handleFilterChange('showDirectories')}
                />
                <Label htmlFor="showDirectories">Directories</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showFunctions" 
                  checked={filters.showFunctions} 
                  onCheckedChange={handleFilterChange('showFunctions')}
                />
                <Label htmlFor="showFunctions">Functions</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showClasses" 
                  checked={filters.showClasses} 
                  onCheckedChange={handleFilterChange('showClasses')}
                />
                <Label htmlFor="showClasses">Classes</Label>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Search</CardTitle>
            </CardHeader>
            <CardContent>
              <Input 
                placeholder="Search files, functions, etc." 
                value={filters.searchQuery}
                onChange={handleSearchChange}
              />
            </CardContent>
          </Card>
        </div>
        
        <TabsContent value="graph" className="border rounded-lg min-h-[600px] p-4">
          {filteredGraph ? (
            <ForceGraph data={filteredGraph} width="100%" height="600px" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No graph data available</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="structure" className="border rounded-lg min-h-[600px] p-4">
          {analysisData ? (
            <DirectoryStructure data={analysisData} searchQuery={filters.searchQuery} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No directory structure available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <div className="text-sm text-muted-foreground">
        <p>Enhanced repository analysis provides deep insights into your code structure, including functions, classes, and dependencies.</p>
        <ul className="list-disc list-inside mt-2">
          <li>View directory structure and files</li>
          <li>Analyze function and class definitions</li>
          <li>Visualize dependencies between code elements</li>
          <li>Search and filter to focus on specific parts</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedRepositoryView; 
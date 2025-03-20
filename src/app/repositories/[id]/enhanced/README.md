# Enhanced Repository View Feature

The Enhanced Repository View provides in-depth analysis and insights into a repository's code structure, metrics, and dependencies. This feature utilizes advanced code parsing techniques to extract detailed information from the codebase, allowing developers to gain deeper understanding of their repositories.

## Features

### Advanced Code Metrics

The Enhanced View provides comprehensive metrics about the codebase:

- **Code Statistics**: Lines of code, comment lines, blank lines, and code-to-comment ratio
- **Code Structure**: Counts of functions, classes, and file types
- **Complexity Analysis**: Average, highest, and lowest complexity metrics across the codebase
- **Dependency Analysis**: Internal and external dependency counts, most dependent files
- **Language Distribution**: Breakdown of programming languages used in the repository

### Visual Representations

Multiple visualization options to explore the codebase:

- **Packed Circles View**: Hierarchical view showing relative sizes of files and directories
- **Force Graph**: Network visualization of dependencies between code files
- **Sunburst View**: Radial visualization of directory structure
- **Tree View**: Traditional tree view of the repository structure

### Detailed Code Analysis

- **Function and Class Detection**: Identification of functions, methods, and classes across various programming languages
- **Import/Dependency Tracking**: Analysis of dependencies between files and modules
- **Complexity Metrics**: Cyclomatic complexity analysis for individual files

## How to Use

1. Navigate to the Repositories page
2. Find the repository you want to analyze
3. Click the "Enhanced View" button
4. Explore the various metrics and visualizations provided
5. Use filters to focus on specific aspects of the codebase

## Supported Languages

The Enhanced View provides detailed analysis for these languages:

- JavaScript (including React/JSX)
- TypeScript
- Python
- Java
- HTML/CSS
- Various other text-based languages

## Technical Implementation

The Enhanced View is built on our advanced repository analysis service that:

1. Clones the repository to a temporary directory
2. Performs deep code parsing and analysis
3. Extracts function, class, and dependency information
4. Calculates code metrics and statistics
5. Generates visualization-ready data structures
6. Returns a comprehensive analysis to the frontend

This feature is continuously being improved with new metrics and visualizations to provide the most insightful code repository analysis possible. 
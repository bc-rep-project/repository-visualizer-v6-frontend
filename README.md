# Repository Visualizer Frontend

A Next.js-based web application for visualizing GitHub repository structure and dependencies. This application provides interactive visualizations of repository code structure, dependencies, and function calls.

## Tech Stack

- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Visualization**: D3.js
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Deployment**: Vercel

## Repository Visualization Implementation Roadmap

This roadmap outlines the steps to implement a comprehensive repository visualization tool similar to the one shown in the example images.

### 1. Data Visualization Components

#### 1.1 Force-Directed Graph
- [x] Implement force-directed graph using D3.js
- [x] Visualize files, directories, functions, and classes as nodes
- [x] Show dependencies and function calls as edges
- [x] Add interactive features (zoom, pan, selection)
- [x] Implement highlighting of connected nodes
- [ ] Add animation for traversing dependencies
- [ ] Implement physics-based interaction for nodes

#### 1.2 Sunburst Diagram
- [x] Implement sunburst visualization using D3.js
- [x] Represent hierarchical structure of repository
- [x] Add interactive zooming and selection
- [x] Show file sizes proportionally
- [ ] Add animation for transitions
- [ ] Implement breadcrumb navigation for deep hierarchies

#### 1.3 Tree View
- [x] Implement collapsible tree view
- [ ] Add code preview on selection
- [ ] Highlight dependencies in tree view
- [ ] Add context menu for additional actions

#### 1.4 Additional Visualizations
- [ ] Implement dependency chord diagram
- [ ] Add heatmap for file changes/activity
- [ ] Create function call stack visualization
- [ ] Add timeline view for repository evolution

### 2. User Interface Components

#### 2.1 Repository Management
- [x] Repository list view
- [x] Repository details page
- [ ] Repository settings panel
- [ ] Repository comparison view

#### 2.2 Visualization Controls
- [x] Visualization type selector (Graph, Sunburst, Tree)
- [x] Filter controls for node types
- [x] Search functionality
- [ ] Layout controls for force-directed graph
- [ ] Color scheme selector

#### 2.3 Information Panels
- [x] Node details panel
- [ ] Code preview panel
- [ ] Dependency details panel
- [ ] Statistics panel

### 3. Interactive Features

#### 3.1 Filtering and Search
- [x] Filter by file type
- [x] Filter by node type (file, directory, function, class)
- [x] Search by name or path
- [ ] Advanced filtering by dependency type
- [ ] Save and load filter presets

#### 3.2 Selection and Highlighting
- [x] Highlight selected node
- [x] Highlight connected nodes and edges
- [x] Show detailed information for selected node
- [ ] Trace dependency paths
- [ ] Multi-select nodes for comparison

#### 3.3 Animation
- [x] Animate transitions between views
- [x] Animate highlighting of connections
- [ ] Animate dependency traversal
- [ ] Add motion effects for user interactions

### 4. Performance Optimization

#### 4.1 Rendering Optimization
- [ ] Implement virtualization for large graphs
- [ ] Use WebGL for rendering large datasets
- [ ] Optimize D3.js rendering performance
- [ ] Implement level-of-detail rendering

#### 4.2 Data Management
- [ ] Implement client-side caching
- [ ] Add progressive loading for large repositories
- [ ] Optimize data structures for faster rendering
- [ ] Implement data compression for large repositories

### 5. User Experience Enhancements

#### 5.1 Onboarding and Help
- [ ] Add interactive tutorial
- [ ] Implement contextual help
- [ ] Add tooltips for UI elements
- [ ] Create documentation pages

#### 5.2 Accessibility
- [ ] Ensure keyboard navigation
- [ ] Add screen reader support
- [ ] Implement high contrast mode
- [ ] Support color blindness modes

#### 5.3 Responsive Design
- [ ] Optimize for mobile devices
- [ ] Implement responsive layouts
- [ ] Add touch gestures for mobile interaction
- [ ] Create mobile-specific views

### 6. Integration and Deployment

#### 6.1 Authentication
- [ ] Implement GitHub OAuth
- [ ] Add user profiles
- [ ] Implement role-based access control
- [ ] Add team collaboration features

#### 6.2 Sharing and Export
- [ ] Generate shareable links
- [ ] Export visualizations as images
- [ ] Export data as JSON/CSV
- [ ] Create embeddable visualizations

#### 6.3 Deployment
- [x] Deploy to Vercel
- [ ] Set up CI/CD pipeline
- [ ] Implement analytics
- [ ] Add error tracking

## Prerequisites

- Node.js 18+
- npm or yarn

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/repository-visualizer-frontend.git
cd repository-visualizer-frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
frontend/
├── public/                # Static assets
├── src/
│   ├── app/              # Next.js app router
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── repositories/ # Repository pages
│   ├── components/       # React components
│   │   ├── common/       # Common UI components
│   │   ├── layout/       # Layout components
│   │   └── features/     # Feature-specific components
│   ├── contexts/         # React contexts
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API services
│   ├── styles/           # Global styles
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── .env.local            # Local environment variables
├── next.config.js        # Next.js configuration
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Deployment (Vercel)

1. Connect your GitHub repository to Vercel

2. Configure the project settings:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

3. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://repository-visualizer-backend.onrender.com
   ```

4. Deploy the application

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Create a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
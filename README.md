# Repository Visualizer Frontend

A modern web application built with React, TypeScript, and Tailwind CSS for visualizing and managing GitHub repositories. This application provides a user-friendly interface for cloning, analyzing, and managing GitHub repositories.

## Tech Stack

- **Framework**: React 18 with Next.js 14
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **Package Manager**: npm
- **Development Tools**: ESLint, Prettier

## Prerequisites

- Node.js 18+
- npm 9+
- Backend service running (see [backend README](../backend/README.md))

## Local Development Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

3. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
frontend/
├── src/
│   ├── components/         # React components
│   │   ├── common/        # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   └── ...
│   │   └── features/      # Feature-specific components
│   │       └── repositories/
│   ├── hooks/             # Custom React hooks
│   │   └── useRepositories.ts
│   ├── services/          # API services
│   │   └── api.ts
│   ├── types/             # TypeScript type definitions
│   │   └── repository.types.ts
│   ├── utils/             # Helper functions
│   └── pages/             # Next.js pages
├── public/                # Static assets
├── styles/                # CSS styles
├── package.json          # Dependencies and scripts
└── .env                  # Environment variables
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Features

- Modern, responsive UI with Tailwind CSS
- Real-time repository status updates
- Repository management (clone, delete)
- File statistics visualization
- Error handling and loading states
- TypeScript for type safety

## Components

### Common Components

- `Button`: Reusable button component with variants
- `Input`: Form input component
- `Loading`: Loading spinner component
- `Error`: Error message component

### Feature Components

- `RepositoryList`: Main repository management component
- `RepositoryCard`: Individual repository display
- `CloneForm`: Repository cloning form

## API Integration

The application uses Axios for API communication. API service is configured in `src/services/api.ts`:

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const repositoryApi = {
    listRepositories: async () => {
        const response = await api.get('/repositories');
        return response.data.repositories;
    },
    // ... other API methods
};
```

## Custom Hooks

### useRepositories

A custom hook for managing repository data:

```typescript
const { 
    repositories,
    loading,
    error,
    cloneRepository,
    deleteRepository 
} = useRepositories();
```

## Styling

The project uses Tailwind CSS for styling. Configuration is in:
- `tailwind.config.js`
- `postcss.config.js`

Custom styles can be added in `styles/` directory.

## Environment Variables

| Variable             | Description          | Required | Default                    |
|---------------------|----------------------|----------|----------------------------|
| NEXT_PUBLIC_API_URL | Backend API URL      | Yes      | http://localhost:5000/api |

## Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`
3. Deploy using default settings

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Create a pull request

## Development Guidelines

### Code Style

- Use functional components with hooks
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Keep components focused and reusable
- Write meaningful component and function names

### Best Practices

1. Use TypeScript types for props and state
2. Handle loading and error states
3. Implement proper error boundaries
4. Use proper component composition
5. Follow React hooks best practices

## Troubleshooting

### Common Issues

1. Build errors:
   - Clear `node_modules` and reinstall
   - Check TypeScript errors
   - Verify environment variables

2. API connection issues:
   - Check backend service is running
   - Verify API_URL in .env
   - Check CORS configuration

3. TypeScript errors:
   - Run `npm run type-check`
   - Update type definitions
   - Check import paths

## VS Code Configuration

Recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript Vue Plugin
- Error Lens

## License

MIT License 
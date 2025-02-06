export const API_CONFIG = {
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    endpoints: {
      clone: '/clone',
      progress: (repoId: string) => `/progress/${repoId}`,
      convert: '/convert',
      repositories: '/repositories',
      repository: (repoId: string) => `/repository/${repoId}`,
    }
  };
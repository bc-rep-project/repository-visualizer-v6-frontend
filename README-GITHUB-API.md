# GitHub API Integration

This document explains how to set up and use the GitHub API integration in the Repository Visualizer application.

## Setup

### 1. Generate a GitHub Personal Access Token

1. Go to your GitHub account settings
2. Navigate to "Developer settings" > "Personal access tokens" > "Tokens (classic)"
3. Click "Generate new token"
4. Give your token a descriptive name (e.g., "Repository Visualizer")
5. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `read:user` (Read all user profile data)
   - `user:email` (Access user email addresses)
6. Click "Generate token" and copy your new token

### 2. Configure Your Environment

#### Frontend Configuration

Add your GitHub token to the `.env.local` file in the frontend project:

```
NEXT_PUBLIC_GITHUB_TOKEN=your_github_token_here
```

#### Backend Configuration

Add your GitHub token to the `.env` file in the backend project:

```
GITHUB_TOKEN=your_github_token_here
```

## Features

The GitHub API integration provides the following features:

1. **Repository Information**: Basic details about the repository, including stars, forks, and language distribution
2. **Commit History**: Real commit data with author information and links to GitHub
3. **Issues**: Active and closed issues with assignee details and labels
4. **Pull Requests**: Open, closed, and merged pull requests with branch information
5. **Contributors**: List of contributors with avatars and contribution counts
6. **README Content**: Rendered markdown content of the repository's README file
7. **Language Distribution**: Visualization of the languages used in the repository

## Using the GitHub API Service

The GitHub API service can be imported and used in your components:

```typescript
import githubService from '@/services/githubService';

// Fetch repository details
const repoDetails = await githubService.getRepositoryDetails('https://github.com/user/repo');

// Fetch commits
const commits = await githubService.getCommits('https://github.com/user/repo');

// Fetch issues
const issues = await githubService.getIssues('https://github.com/user/repo');

// Fetch pull requests
const pullRequests = await githubService.getPullRequests('https://github.com/user/repo');

// Fetch contributors
const contributors = await githubService.getContributors('https://github.com/user/repo');

// Fetch README content
const readme = await githubService.getReadmeContent('https://github.com/user/repo');

// Format dates in a readable way
const formattedDate = githubService.formatDate('2023-06-15T12:00:00Z'); // Returns "6 months ago"
```

## Rate Limiting

The GitHub API is subject to rate limiting. Without authentication, you are limited to 60 requests per hour. With authentication, this increases to 5,000 requests per hour. You can check your current rate limit status with:

```typescript
const rateLimit = await githubService.getRateLimit();
console.log(`Remaining requests: ${rateLimit.remaining}`);
```

## Error Handling

The GitHub API service methods return `null` or an empty array if there's an error. You should always check for these cases in your code:

```typescript
const repoDetails = await githubService.getRepositoryDetails('https://github.com/user/repo');
if (!repoDetails) {
  // Handle error case
  console.error('Failed to fetch repository details');
} else {
  // Process the data
  console.log(`Repository name: ${repoDetails.name}`);
}
```

## Backend Proxy API

The backend provides a proxy API endpoint for GitHub data:

```
GET /api/repositories/:repoId/github
```

This endpoint fetches data from GitHub for a specific repository in your database and returns:
- Repository information
- Commits
- Issues
- Pull requests
- Contributors
- README content

This proxy approach helps to:
1. Hide your GitHub token from client-side code
2. Centralize rate limit management
3. Cache frequently accessed data
4. Add additional preprocessing or filtering

## Troubleshooting

If you encounter issues with the GitHub API integration:

1. **Rate limiting**: Wait until your rate limit resets or use a token with higher limits
2. **Authentication issues**: Check that your token is valid and has the required scopes
3. **Repository not found**: Verify that the repository URL is correct and that you have access to it
4. **Data not loading**: Check the browser console for errors and ensure that the repository is a GitHub repository

For specific error messages, consult the [GitHub API documentation](https://docs.github.com/en/rest).
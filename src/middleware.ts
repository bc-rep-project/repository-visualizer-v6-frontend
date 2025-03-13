import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the URL matches the repository analyze pattern
  if (request.nextUrl.pathname.match(/\/repositories\/(.*?)\/analyze/)) {
    // Extract the repository ID
    const repoId = request.nextUrl.pathname.split('/')[2];
    
    // Check if the ID is valid
    if (!repoId || repoId === 'undefined' || repoId === 'null' || repoId === 'None') {
      // Redirect to home page if invalid
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/repositories/:id/analyze',
}; 
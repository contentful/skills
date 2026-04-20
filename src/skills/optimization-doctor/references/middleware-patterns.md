# Next.js Middleware for Ninetailed

## Purpose

Middleware enables server-side personalization by:
1. Reading the `ntaid` cookie (Ninetailed anonymous ID)
2. Forwarding it to the Experience API for server-side variant resolution
3. Setting cookies on the response for profile continuity

## Basic Setup

```ts
// middleware.ts (project root)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // Forward ntaid cookie for personalization continuity
  const ntaid = request.cookies.get('ntaid');
  if (ntaid) {
    response.headers.set('x-ntaid', ntaid.value);
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

## Matcher Configuration

The matcher should include all routes that serve personalized content. Common patterns:

```ts
// Broad: all pages except static assets
matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']

// Specific paths
matcher: ['/', '/blog/:path*', '/products/:path*']
```

## Common Issues

- `middleware.ts` placed in wrong directory (must be at project root, not inside `app/` or `src/`)
- Matcher excludes routes that have personalized content
- Not forwarding cookies in the response
- Edge runtime violations (importing Node.js-only modules)
- Missing `ntaid` cookie forwarding breaks profile continuity

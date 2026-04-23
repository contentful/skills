# Middleware Patterns

Middleware is the most common source of setup failures. Treat matcher and cookie behavior as first-class design decisions.

## Choose the Right Runtime Pattern

| Pattern | Use when | Notes |
|--------|----------|-------|
| Client-only | Personalized HTML on first response is not required | Simplest operationally |
| Hybrid SSR or edge plus client | Personalized HTML must be correct on first response and a client SDK will hydrate afterward | Recommended default for SSR or edge setups |
| Server-only | No client SDK will run at all | Poor fit for most experimentation and insights use cases |

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

## Hybrid Preflight Pattern

Recommended flow:

1. Read `ntaid` from the incoming request cookie.
2. Build a server-side page event with URL, referrer, and geo data when available.
3. Call the Experience API with preflight:
   - first visit: `POST /profiles?type=preflight`
   - returning visit: `POST /profiles/{ntaid}?type=preflight`
4. Use the response to render personalized HTML.
5. Set `ntaid` from `response.data.profile.id`.
6. Let the client SDK hydrate and send the normal persisted page event.

Why preflight matters:

- It prevents double-counting when a client SDK will send the same page event after hydration.
- It gives the server or edge layer a read-only view for first-render personalization.

## Server-Only Pattern

Use this only when no client SDK will run after render.

Rules:

- Do not use preflight in a true server-only flow.
- Persist the server event normally.
- Explain clearly that server-only setup limits experiment measurement and client-side insights.

## Matcher Configuration

The matcher should include all routes that serve personalized content.

- Include all personalized routes.
- Exclude static assets and unrelated routes.
- Start with explicit route groups, then widen only when necessary.
- Skip non-HTML requests whenever possible.

Common patterns:

```ts
// Broad: all pages except static assets
matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']

// Specific paths
matcher: ['/', '/blog/:path*', '/products/:path*']
```

## Cookie Management

- Read `ntaid` from the request.
- Always set `ntaid` from `response.data.profile.id`, never from the old cookie value.
- Keep the cookie available across the full site path.
- Validate both first-time and returning-visitor behavior.

Recommended cookie attributes:

```text
Path=/; Max-Age=31536000; SameSite=Lax; Secure
```

## Geo Data

- If the edge platform exposes visitor country, include it in the server-side event.
- This is especially important for geo-based audiences.
- Missing `countryCode` often causes audience evaluation to reflect the server location instead of the visitor location.

## Edge Runtime Constraints

- Do not use Node-only APIs in edge middleware.
- Prefer web-standard APIs supported by the edge runtime.
- Add fallback behavior for unsupported operations.

## Hand-off Rules

- Keep experience selection hand-off deterministic.
- Pass selected experiences or changes to the render layer in one clear mechanism.
- Avoid hidden coupling between middleware, headers, URL state, and client hydration.

## Common Issues

- `middleware.ts` placed in wrong directory (must be at project root, not inside `app/` or `src/`)
- Matcher excludes routes that have personalized content
- Not forwarding cookies in the response
- Edge runtime violations (importing Node.js-only modules)
- Missing `ntaid` cookie forwarding breaks profile continuity

## Verification Checklist

1. Middleware executes for intended URLs.
2. Matcher does not capture static assets unnecessarily.
3. Hybrid server or edge requests use preflight when a client SDK also runs.
4. `ntaid` is updated from the API response profile ID.
5. Geo data is present when geo audiences matter.
6. No runtime errors come from unsupported edge APIs.

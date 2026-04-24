# Framework-Specific Notes

Guidance for personalization readiness by framework.

## Next.js App Router (13.4+)

### Provider Placement

`NinetailedProvider` is a client component — it must be in a Client Component
boundary. Typically placed in `app/layout.tsx` wrapped with `'use client'`:

```typescript
// app/providers.tsx
'use client';
export function Providers({ children }) {
  return (
    <NinetailedProvider clientId={process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID}>
      {children}
    </NinetailedProvider>
  );
}

// app/layout.tsx
import { Providers } from './providers';
export default function RootLayout({ children }) {
  return <html><body><Providers>{children}</Providers></body></html>;
}
```

### Server Components

Server Components cannot use hooks or context. Personalization must happen
in Client Components or via edge middleware.

Pattern: fetch content in a Server Component, pass to a Client Component
that handles personalization:

```typescript
// app/page.tsx (Server Component)
export default async function Page() {
  const entries = await fetchPageContent();
  return <PersonalizedPage entries={entries} />;
}

// components/PersonalizedPage.tsx
'use client';
export function PersonalizedPage({ entries }) {
  // Use <Experience> components here
}
```

### Key Readiness Signals

- `app/` directory exists → App Router
- `'use client'` directives present → aware of client/server boundary
- Data fetching in Server Components → good pattern for personalization
- Look for a `providers.tsx` or similar client wrapper pattern

## Next.js Pages Router

### Provider Placement

Provider goes in `pages/_app.tsx`:

```typescript
export default function App({ Component, pageProps }) {
  return (
    <NinetailedProvider
      clientId={process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID}
      plugins={[new NinetailedInsightsPlugin()]}
    >
      <Component {...pageProps} />
    </NinetailedProvider>
  );
}
```

### Data Fetching Patterns

- `getStaticProps` + `revalidate` (ISR) → ideal for personalization
- `getServerSideProps` → works, allows server-side personalization
- Client-side only (`useEffect`) → works but flash-of-default

### Key Readiness Signals

- `pages/_app.tsx` exists → Pages Router
- `getStaticProps` with `revalidate` → ISR ready
- `getServerSideProps` → SSR ready (can add middleware later)
- `pages/[[...slug]].tsx` or similar catch-all → dynamic routing ready

## Gatsby

### Provider Placement

Provider goes in `gatsby-browser.js` (and `gatsby-ssr.js` for SSR):

```javascript
// gatsby-browser.js
export const wrapRootElement = ({ element }) => (
  <NinetailedProvider clientId={process.env.GATSBY_NINETAILED_CLIENT_ID}>
    {element}
  </NinetailedProvider>
);
```

### Data Fetching

Gatsby uses GraphQL queries at build time. Content is available via
`useStaticQuery` or page queries. Personalization is client-side only —
the static HTML shows the baseline, and the SDK swaps variants after hydration.

### Environment Variables

Gatsby requires `GATSBY_` prefix for client-side env vars:
```
GATSBY_NINETAILED_CLIENT_ID
GATSBY_NINETAILED_ENVIRONMENT
GATSBY_CONTENTFUL_SPACE_ID
GATSBY_CONTENTFUL_TOKEN
```

### Key Readiness Signals

- `gatsby-config.js/ts` exists → Gatsby project
- `gatsby-source-contentful` plugin → Contentful integrated
- GraphQL queries for content types → data layer ready
- `gatsby-browser.js` exists → can add provider

## Remix

### Provider Placement

Provider goes in `app/root.tsx`:

```typescript
export default function App() {
  return (
    <NinetailedProvider clientId={...}>
      <Outlet />
    </NinetailedProvider>
  );
}
```

### Data Fetching

Remix uses `loader` functions for server-side data fetching. Content
is available via `useLoaderData()`. This pattern is compatible with
personalization — loaders can fetch Contentful entries and pass them
to components.

### Key Readiness Signals

- `remix.config.js` or `app/root.tsx` → Remix project
- `loader` functions in route files → data fetching pattern compatible
- `useLoaderData()` usage → data flows from server to components

## Plain React (CRA / Vite)

### Provider Placement

Provider goes at the app root:

```typescript
// src/App.tsx or src/main.tsx
ReactDOM.createRoot(root).render(
  <NinetailedProvider clientId={...}>
    <App />
  </NinetailedProvider>
);
```

### Data Fetching

Typically `useEffect` + API calls. Personalization is client-side only.
Consider:
- Is there a centralized data-fetching layer?
- Or does each component fetch its own data?

### Key Readiness Signals

- `react-scripts` or `vite` in deps → CRA or Vite
- Centralized API client → data fetching can be adapted
- No SSR capabilities → client-side personalization only

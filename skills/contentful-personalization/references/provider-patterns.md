# Provider Patterns

Use these patterns to avoid scope and hydration problems.

## Placement Rules

- Put the provider as high in the tree as the personalization scope requires.
- Keep the first render deterministic between server and client.
- Keep provider initialization stable across navigation.
- Avoid wrapping only a subset of pages unless that is intentional.

## Modern SDKs: `@contentful/optimization`

Mount `OptimizationRoot` once near the app root. It owns the Web SDK lifecycle (creation,
initialization, teardown). Use the router tracker subpath for the router in use.

Recommended pattern:

1. Put `OptimizationRoot` at the app root with `clientId` and `environment`.
2. Mount the matching router tracker inside `OptimizationRoot`.
3. Render personalized entries with `OptimizedEntry` (render prop).
4. Keep the provider instance stable across route changes.

Checklist:

- App Router: `NextAppAutoPageTracker` from `@contentful/optimization-react-web/router/next-app`.
- Pages Router: `NextPagesAutoPageTracker` from `@contentful/optimization-react-web/router/next-pages`.
- React Router / TanStack: the corresponding `/router/*` subpath.
- For full Next.js server + client + request-handler integration, prefer the
  `@contentful/optimization-nextjs` adapter (see below).

### React (non-Next)

```tsx
import { OptimizationRoot } from '@contentful/optimization-react-web';
import { ReactRouterAutoPageTracker } from '@contentful/optimization-react-web/router/react-router';

function App() {
  return (
    <OptimizationRoot clientId={import.meta.env.VITE_OPTIMIZATION_CLIENT_ID} environment="main">
      <ReactRouterAutoPageTracker />
      <Routes>{/* ... */}</Routes>
    </OptimizationRoot>
  );
}
```

### Next.js App Router (via the adapter)

Use the `@contentful/optimization-nextjs` adapter so the server and client share one configuration.

```tsx
// app/providers.tsx
'use client';

import { NextAppAutoPageTracker, OptimizationRoot } from '@contentful/optimization-nextjs/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OptimizationRoot
      clientId={process.env.NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID!}
      environment={process.env.NEXT_PUBLIC_OPTIMIZATION_ENVIRONMENT ?? 'main'}
    >
      {/* Use initialPageEvent="skip" only when the server already called page() for this route */}
      <NextAppAutoPageTracker />
      {children}
    </OptimizationRoot>
  );
}
```

Wrap `children` with `<Providers>` in `app/layout.tsx`. Keep the root layout server-first and the
provider in a client component.

## Current default SDKs: `@ninetailed/experience.js`

### Next.js Pages Router

Recommended pattern:

1. Put `NinetailedProvider` in `pages/_app.tsx`.
2. Add only the plugins the project actually needs.
3. Let the Next.js Pages Router integration handle route-change page tracking.
4. Do not add duplicate `page()` calls for navigation events.

Typical plugin choices:

- `NinetailedInsightsPlugin` for measurement
- `NinetailedSsrPlugin` for SSR or edge profile continuity
- `NinetailedPreviewPlugin` only for preview or development workflows

Example shape:

```tsx
<NinetailedProvider
  clientId={process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID ?? ''}
  environment={process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT ?? 'main'}
  plugins={[
    new NinetailedInsightsPlugin(),
    ...(preview
      ? [
          new NinetailedPreviewPlugin({
            experiences: pageProps.ninetailed?.preview?.experiences ?? [],
            audiences: pageProps.ninetailed?.preview?.audiences ?? [],
          }),
        ]
      : []),
  ]}
>
  <Component {...pageProps} />
</NinetailedProvider>
```

### Next.js App Router

Recommended pattern:

1. Keep root layout server-first where possible.
2. Put `NinetailedProvider` initialization in a dedicated client wrapper component.
3. Add a dedicated client-side page tracker because the current SDKs do not auto-track App Router
   navigation.
4. Keep the provider high enough that all personalizable entries are wrapped.

Example shape:

```tsx
import { NinetailedProvider } from '@ninetailed/experience.js-next';
import { NinetailedInsightsPlugin } from '@ninetailed/experience.js-plugin-insights';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NinetailedProvider
          clientId={process.env.NEXT_PUBLIC_NINETAILED_API_KEY!}
          environment={process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT}
          plugins={[new NinetailedInsightsPlugin()]}
        >
          {children}
        </NinetailedProvider>
      </body>
    </html>
  );
}
```

Checklist:

- Provider is high enough to cover all personalizable components.
- Server/client boundaries are explicit.
- App Router navigation triggers exactly one `page()` call.
- Initial render is deterministic between server and client.

Use a dedicated tracker component for App Router navigation rather than scattering `page()` calls
across many routes.

## Hydration Safety Rules

- Do not render the personalized variant on the server and the baseline on the client for the same
  first paint.
- Avoid non-deterministic branching during initial render.
- Keep initial data contracts consistent for baseline and variant props.
- If an SSR or edge setup passes selected experiences/optimizations to the client, make that handoff
  deterministic and inspectable.

## Common Issues

- Provider placed too deep in the tree (must wrap all personalized content).
- Missing `clientId` prop (API key not passed or env var undefined).
- `@contentful/optimization`: destructuring methods off `useOptimization()` instead of using
  `useOptimizationActions()` (loses the instance binding).
- `@ninetailed/experience.js`: empty `plugins` array when analytics is expected; using `apiKey`
  instead of `clientId` on older SDK versions.
- Provider rendered only on some pages instead of globally.

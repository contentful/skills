<!-- Load optimization-shared.md before this reference. -->

# Optimization SDK: Next.js App Router

Use `@contentful/optimization-nextjs` for an App Router application. It binds the Node runtime used
for request-time decisions to the React Web runtime used after hydration.

```bash
pnpm add @contentful/optimization-nextjs
```

## Public entry points

| Import                                        | Use                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------- |
| `@contentful/optimization-nextjs/app-router`  | Create the bound root, entry component, page tracker, and request handler         |
| `@contentful/optimization-nextjs/client`      | Browser hooks and the client `OptimizedEntry` with per-entry live-update controls |
| `@contentful/optimization-nextjs/server`      | Advanced manual server composition only                                           |
| `@contentful/optimization-nextjs/api-schemas` | Contentful Optimization type guards                                               |

The package root is not exported. Do not import from `@contentful/optimization-nextjs` directly or
wire the lower-level Node and React packages together for the standard path.

## Canonical topology

Create the binding once in an application-owned module:

```ts
// lib/optimization.ts
import { createNextjsAppRouterOptimization } from '@contentful/optimization-nextjs/app-router';

export const CONSENT_COOKIE = 'app-personalization-consent';

export const { proxy, NextAppAutoPageTracker, OptimizationRoot, OptimizedEntry } = createNextjsAppRouterOptimization({
  clientId: process.env.NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID ?? '',
  environment: process.env.NEXT_PUBLIC_OPTIMIZATION_ENVIRONMENT ?? 'main',
  locale: 'en-US',
  defaults: { consent: false, persistenceConsent: false },
  server: {
    enabled: true,
    consent: ({ cookies }) =>
      cookies.get(CONSENT_COOKIE)?.value === 'granted' ? { events: true, persistence: true } : false,
  },
  app: { name: 'my-next-app', version: '1.0.0' },
});
```

`server.consent` may also be a consent value. A resolver receives `{ cookies, headers }`; its
cookie API is `cookies.get(name)?.value`. The application owns the consent record. The SDK owns
`ctfl-opt-aid`, which must remain browser-readable for server/browser profile continuity.

Mount the returned handler using the filename and export required by the application's Next.js
major version:

```ts
// proxy.ts — Next.js 16
export { proxy } from './lib/optimization';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

```ts
// middleware.ts — Next.js 15
export { proxy as middleware } from './lib/optimization';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
```

The matcher must include every route that performs bound server personalization. With
`server.enabled: true`, a missing or misnamed handler makes the bound root throw; it does not fall
back to baseline.

Mount one bound root around the participating application tree. The App Router tracker reads
`useSearchParams`, so it must be inside `Suspense`:

```tsx
// app/layout.tsx
import { CONSENT_COOKIE, NextAppAutoPageTracker, OptimizationRoot } from '@/lib/optimization';
import { cookies } from 'next/headers';
import { Suspense, type ReactNode } from 'react';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const serverOwnsInitialPageEvent = cookieStore.get(CONSENT_COOKIE)?.value === 'granted';

  return (
    <html lang="en">
      <body>
        <OptimizationRoot>
          <Suspense>
            <NextAppAutoPageTracker initialPageEvent={serverOwnsInitialPageEvent ? 'skip' : 'emit'} />
          </Suspense>
          {children}
        </OptimizationRoot>
      </body>
    </html>
  );
}
```

Use `initialPageEvent="skip"` only when the matching, consented server handler emitted the initial
page event. Use `"emit"` when the browser owns it. For route metadata, return custom values inside
`properties`:

```tsx
<NextAppAutoPageTracker
  initialPageEvent="skip"
  getPagePayload={({ context: { pathname } }) => ({
    properties: { routeGroup: pathname.startsWith('/account') ? 'account' : 'public' },
  })}
/>
```

## Render an app-fetched entry

Fetch one concrete locale with enough link depth, then render the value returned by the render
prop. Its public type is the base Contentful `Entry`; cast it at the application boundary when a
generated type is narrower.

```tsx
import { OptimizedEntry } from '@/lib/optimization';

export function EntryRenderer({ entry }: { entry: ContentEntry }) {
  return (
    <OptimizedEntry baselineEntry={entry}>
      {(resolved, { getMergeTagValue }) => (
        <EntryComponent entry={resolved as ContentEntry} getMergeTagValue={getMergeTagValue} />
      )}
    </OptimizedEntry>
  );
}
```

Do not wrap the same baseline entry ID at multiple nested levels; the duplicate wrapper renders
nothing and warns in development. Keep the wrapper at the entry-to-component handoff.

## Let the SDK fetch an entry

For server-managed fetching, configure an application-owned Contentful client:

```ts
createNextjsAppRouterOptimization({
  // standard config
  contentful: { client },
});
```

The bound server component accepts `entryId` instead of `baselineEntry`, plus an optional
`entryQuery`:

```tsx
<OptimizedEntry entryId="hero-entry" entryQuery={{ include: 10 }}>
  {(resolved) => <Hero entry={resolved as HeroEntry} />}
</OptimizedEntry>
```

That fetch is scoped to the server render. It does not automatically seed a separate client
`OptimizedEntry` using the same ID. For client ownership, either pass a `baselineEntry` or prefetch
the descriptor at the root so it is included in the browser handoff:

```tsx
<OptimizationRoot prefetchManagedEntries={[{ entryId: 'hero-entry', entryQuery: { include: 10 } }]}>
  {children}
</OptimizationRoot>
```

## Browser-only controls

Import hooks from `/client` in a `'use client'` module. `useOptimizationActions()` exposes the
bound actions `setConsent`, `flushEvents`, `identifyUser`, `trackPageView`, `resetUser`,
`trackScreen`, and `trackEvent`; state hooks and lower-level entry or merge-tag hooks are exported
there too.

The bound `/app-router` `OptimizedEntry` intentionally omits per-entry `liveUpdates` and
`loadingFallback` so it works across server and client components. Use the `/client` component for
per-entry behavior:

```tsx
'use client';

import { OptimizedEntry } from '@contentful/optimization-nextjs/client';

export function LiveHero({ entry }: { entry: HeroEntry }) {
  return (
    <OptimizedEntry baselineEntry={entry} liveUpdates>
      {(resolved) => <Hero entry={resolved as HeroEntry} />}
    </OptimizedEntry>
  );
}
```

Set factory `liveUpdates: true` for an app-wide default. Do not nest another config-owned provider
inside the bound root: the nearer context can hide server state and managed-entry handoffs and can
attempt to create a second browser SDK singleton.

`OptimizedEntry` supplies browser interaction metadata and tracks resolved-entry views, clicks,
and hovers when policy permits. Use factory `trackEntryInteraction` for global controls and entry
props such as `trackViews`, `trackClicks`, `trackHovers`, and `clickable` for local controls.

## Server and cache boundaries

- Bound server components read request headers, making personalized routes dynamic. They are not
  compatible with shared SSG/ISR output.
- Personalized HTML, forwarded Optimization data, and resolved entries are request-specific. Do
  not share-cache them unless every personalization input is represented in the cache key.
- Raw baseline Contentful data can follow an application-owned cache policy; do not cache the
  request-specific resolution with it.
- Use `/server` only when the bound factory cannot express the route. A manual integration owns
  request binding, page-event emission, cookie persistence, tracking attributes, managed-entry
  handoff, and `serverOptimizationState` transfer.

## Validation and failure diagnosis

Verify a variant targeted to all visitors appears in View Source and remains unchanged after
hydration. Then test consent changes, profile continuity, client navigation, live updates, and
exactly one initial page event.

| Symptom                                            | Check                                                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Bound root throws about the handler                | Use `proxy.ts` + `proxy` on Next.js 16 or `middleware.ts` + `middleware` on Next.js 15; verify the matcher |
| Entry remains baseline                             | Check consent, audience match, one concrete CDA locale, include depth, and published optimization links    |
| Variant flashes back after hydration               | Render the same baseline/component path in both runtimes; hand managed entries to the browser              |
| Live entry does not change after identity or reset | Enable factory or per-entry live updates                                                                   |
| Duplicate or missing initial page event            | Align `initialPageEvent` with the actual server event owner                                                |
| Personalized HTML is stale across visitors         | Remove shared output caching or vary it on the complete personalization context                            |

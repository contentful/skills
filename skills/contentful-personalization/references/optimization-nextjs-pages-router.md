<!-- Load optimization-shared.md before this reference. -->

# Optimization SDK: Next.js Pages Router

Use `@contentful/optimization-nextjs` for a Pages Router application. The supported integration is
an explicit browser/server split joined through `getServerSideProps` and `pageProps`.

```bash
pnpm add @contentful/optimization-nextjs
```

## Public entry points

| Import                                                | Use                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| `@contentful/optimization-nextjs/pages-router`        | Client factory for the bound root, entry component, and page tracker |
| `@contentful/optimization-nextjs/pages-router/server` | Server factory and `getServerSideOptimizationProps` helper           |
| `@contentful/optimization-nextjs/client`              | Browser hooks and lower-level browser controls                       |
| `@contentful/optimization-nextjs/server`              | Advanced manual server composition only                              |
| `@contentful/optimization-nextjs/api-schemas`         | Contentful Optimization type guards                                  |

The two router subpaths export different factories with the same
`createNextjsPagesRouterOptimization` name. Keep them in separate client and server modules. The
package root is not exported.

## Create the two bindings

Create the browser binding once:

```ts
// lib/optimization.ts
import { createNextjsPagesRouterOptimization } from '@contentful/optimization-nextjs/pages-router';

export const APP_LOCALE = 'en-US';

export const { NextPagesAutoPageTracker, OptimizationRoot, OptimizedEntry } = createNextjsPagesRouterOptimization({
  clientId: process.env.NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID ?? '',
  environment: process.env.NEXT_PUBLIC_OPTIMIZATION_ENVIRONMENT ?? 'main',
  locale: APP_LOCALE,
  defaults: { consent: false, persistenceConsent: false },
  app: { name: 'my-next-pages-app', version: '1.0.0' },
});
```

Create the server helper once. `server.consent` is required and may be a consent value or a
resolver receiving `GetServerSidePropsContext`:

```ts
// lib/optimization-server.ts
import { createNextjsPagesRouterOptimization } from '@contentful/optimization-nextjs/pages-router/server';
import type { GetServerSidePropsContext } from 'next';
import { APP_LOCALE } from './optimization';

const CONSENT_COOKIE = 'app-personalization-consent';

const { getServerSideOptimizationProps } = createNextjsPagesRouterOptimization({
  clientId: process.env.NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID ?? '',
  environment: process.env.NEXT_PUBLIC_OPTIMIZATION_ENVIRONMENT ?? 'main',
  locale: APP_LOCALE,
  app: { name: 'my-next-pages-app', version: '1.0.0' },
  server: {
    consent: (context: GetServerSidePropsContext) =>
      context.req.cookies[CONSENT_COOKIE] === 'granted' ? { events: true, persistence: true } : false,
  },
});

export function getOptimizationProps(context: GetServerSidePropsContext) {
  return getServerSideOptimizationProps(context);
}
```

Pages Router consent reads `context.req.cookies[name]`, not App Router's `cookies.get(name)`. The
application owns the consent cookie. The helper writes the SDK-owned `ctfl-opt-aid` cookie; keep it
browser-readable so the browser runtime can continue the server profile.

There is no proxy or middleware in this integration. All request binding, server resolution,
initial page-event work, and `Set-Cookie` handling occurs in `getServerSideProps`.

## Pass server state through the application root

Mount the bound root and tracker once in `pages/_app.tsx`:

```tsx
import { NextPagesAutoPageTracker, OptimizationRoot } from '@/lib/optimization';
import type { NextjsPagesRouterOptimizationPageProps } from '@contentful/optimization-nextjs/pages-router/server';
import type { AppProps } from 'next/app';

interface OptimizationPageProps {
  readonly contentfulOptimization?: NextjsPagesRouterOptimizationPageProps;
}

export default function App({ Component, pageProps }: AppProps<OptimizationPageProps>) {
  const optimization = pageProps.contentfulOptimization;

  return (
    <OptimizationRoot
      clientDefaults={optimization?.clientDefaults}
      serverOptimizationState={optimization?.serverOptimizationState}
      prefetchedManagedEntries={optimization?.prefetchedManagedEntries}
    >
      <NextPagesAutoPageTracker initialPageEvent={optimization?.initialPageEvent} />
      <Component {...pageProps} />
    </OptimizationRoot>
  );
}
```

The Pages tracker uses `useRouter`; it does not need `Suspense`. Its `getPagePayload` callback puts
route fields under `context`:

```tsx
<NextPagesAutoPageTracker
  initialPageEvent={optimization?.initialPageEvent}
  getPagePayload={({ context: { pathname } }) => ({
    properties: { routeGroup: pathname.startsWith('/account') ? 'account' : 'public' },
  })}
/>
```

Pass the helper's `initialPageEvent` through unchanged. It is `"skip"` when server state exists and
server event consent allowed the initial page event; otherwise it is `"emit"`. This prevents the
browser from duplicating a server-owned event while still covering browser-owned routes.

## Resolve a personalized page

Fetch entries and Optimization state for the same request, then spread `optimization.props` into
the page props:

```tsx
import { OptimizedEntry } from '@/lib/optimization';
import { getOptimizationProps } from '@/lib/optimization-server';
import type { NextjsPagesRouterOptimizationProps } from '@contentful/optimization-nextjs/pages-router/server';
import type { GetServerSideProps } from 'next';

type PageProps = NextjsPagesRouterOptimizationProps & {
  readonly entries: ContentEntry[];
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const [entries, optimization] = await Promise.all([getPageEntries(context), getOptimizationProps(context)]);

  return { props: { ...optimization.props, entries } };
};

export default function Page({ entries }: PageProps) {
  return entries.map((entry) => (
    <OptimizedEntry key={entry.sys.id} baselineEntry={entry}>
      {(resolved, { getMergeTagValue }) => (
        <EntryComponent entry={resolved as ContentEntry} getMergeTagValue={getMergeTagValue} />
      )}
    </OptimizedEntry>
  ));
}
```

`NextjsPagesRouterOptimizationProps` is the spreadable server result shape.
`NextjsPagesRouterOptimizationPageProps` is only the nested
`pageProps.contentfulOptimization` shape consumed by `_app.tsx`.

If `optimization.props` is not spread, the browser receives no decisions or request consent and
entries remain on baseline. The render prop exposes a base Contentful `Entry`; cast it at the
application component boundary. Do not double-wrap the same baseline entry ID.

## Let the server fetch entries by ID

Managed fetching is a server-prefetch flow. Configure the server factory with the application's
Contentful client, pass descriptors to the helper, forward the returned handoffs through the root,
then render by ID:

```ts
// lib/optimization-server.ts
const { getServerSideOptimizationProps } = createNextjsPagesRouterOptimization({
  // standard server config
  contentful: { client },
  server: { consent: resolveConsent },
});

export function getOptimizationProps(context: GetServerSidePropsContext) {
  return getServerSideOptimizationProps(context, {
    prefetchManagedEntries: [{ entryId: 'hero-entry', entryQuery: { include: 10 } }],
  });
}
```

```tsx
// _app.tsx: required handoff
<OptimizationRoot
  clientDefaults={optimization?.clientDefaults}
  serverOptimizationState={optimization?.serverOptimizationState}
  prefetchedManagedEntries={optimization?.prefetchedManagedEntries}
>
  {children}
</OptimizationRoot>
```

```tsx
<OptimizedEntry entryId="hero-entry">{(resolved) => <Hero entry={resolved as HeroEntry} />}</OptimizedEntry>
```

Descriptors are either entry ID strings or `{ entryId, entryQuery? }`. Omitting the root handoff
leaves the client without the managed baseline and the entry renders nothing.

## Browser behavior

The factory-returned Pages `OptimizedEntry` is the React Web component, so it supports per-entry
`liveUpdates`, `loadingFallback`, `errorFallback`, `onEntryError`, and interaction-tracking props.
Set factory `liveUpdates: true` for the app-wide default or override one entry:

```tsx
<OptimizedEntry baselineEntry={entry} liveUpdates>
  {(resolved) => <Hero entry={resolved as HeroEntry} />}
</OptimizedEntry>
```

Import hooks from `/client`, not `/pages-router`. `useOptimizationActions()` exposes the bound
actions `setConsent`, `flushEvents`, `identifyUser`, `trackPageView`, `resetUser`, `trackScreen`,
and `trackEvent`; state, entry-resolution, merge-tag, and context hooks are exported there too.

`OptimizedEntry` supplies browser interaction metadata and tracks resolved-entry views, clicks,
and hovers when policy permits. Use factory `trackEntryInteraction` for global controls and entry
props such as `trackViews`, `trackClicks`, `trackHovers`, and `clickable` for local controls.

## Failure policy and caching

Ordinary no-selection cases fall back to `baselineEntry`. An Experience API failure is different:
`getServerSideOptimizationProps` rejects and Next.js returns a 500 unless the application catches
it. To choose baseline-on-outage, make the Optimization fields optional and omit them in the catch
branch:

```tsx
type PageProps = Partial<NextjsPagesRouterOptimizationProps> & {
  readonly entries: ContentEntry[];
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (context) => {
  const entries = await getPageEntries(context);
  try {
    const optimization = await getOptimizationProps(context);
    return { props: { ...optimization.props, entries } };
  } catch {
    return { props: { entries } };
  }
};
```

`getServerSideProps` is already request-dynamic. Personalized HTML and serialized Optimization
state remain visitor-specific; do not place them in a shared cache unless every personalization
input is represented in the cache key. Raw baseline Contentful data may use a separate,
application-owned cache policy.

## Validation and failure diagnosis

Verify a variant targeted to all visitors appears in View Source and remains unchanged after
hydration. Then test consent changes, profile continuity, client navigation, live updates, the
outage policy, and exactly one initial page event.

| Symptom                                            | Check                                                                                                                        |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Every entry remains baseline                       | Spread `optimization.props`; pass `clientDefaults` and `serverOptimizationState`; check consent and Contentful payload shape |
| Page returns 500 during an Experience API outage   | Catch the server helper if baseline-on-outage is the intended policy                                                         |
| Managed entry renders nothing                      | Configure the server Contentful client, prefetch its descriptor, and forward `prefetchedManagedEntries`                      |
| Variant flashes back after hydration               | Ensure `_app.tsx` receives `serverOptimizationState` and renders the same baseline/component path                            |
| Live entry does not change after identity or reset | Enable factory or per-entry live updates                                                                                     |
| Duplicate or missing initial page event            | Pass the helper's `initialPageEvent` through rather than hard-coding it                                                      |
| Personalized HTML is stale across visitors         | Remove shared output caching or vary it on the complete personalization context                                              |

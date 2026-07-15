<!-- Agent context: Current React browser contract for @contentful/optimization-react-web. Load optimization-shared.md first. -->

# Optimization SDK: React Web

Use this after `optimization-shared.md` for client-rendered React applications. For a full Next.js
integration, use the router-specific Next.js reference instead of composing this package manually.

## Package and public entry points

```sh
pnpm add @contentful/optimization-react-web contentful
```

- `@contentful/optimization-react-web` — `OptimizationRoot`, `OptimizationProvider`,
  `LiveUpdatesProvider`, `OptimizedEntry`, hooks, and managed-prefetch exports.
- `/router/react-router`, `/router/tanstack-router`, `/router/next-pages`, `/router/next-app` —
  router-specific auto page trackers. Dedicated Next.js applications should prefer the Next.js
  adapter.
- `/api-schemas` — `isMergeTagEntry` and `isRichTextDocument`.
- `/logger` — `createScopedLogger`.
- `@contentful/optimization-web-preview-panel` — separate optional preview package.

This SDK wraps `@contentful/optimization-web`; application components normally import only the
React package.

## Minimal root and route integration

Mount one `OptimizationRoot` around every SDK consumer and one page tracker inside the router
context. The root owns Web SDK creation and teardown.

```tsx
import { createClient } from 'contentful';
import { OptimizationRoot } from '@contentful/optimization-react-web';
import { ReactRouterAutoPageTracker } from '@contentful/optimization-react-web/router/react-router';
import { Outlet } from 'react-router-dom';

const contentful = createClient({
  accessToken: import.meta.env.PUBLIC_CONTENTFUL_TOKEN,
  environment: import.meta.env.PUBLIC_CONTENTFUL_ENVIRONMENT ?? 'main',
  space: import.meta.env.PUBLIC_CONTENTFUL_SPACE_ID,
});

export function RootLayout() {
  return (
    <OptimizationRoot
      clientId={import.meta.env.PUBLIC_OPTIMIZATION_CLIENT_ID}
      environment={import.meta.env.PUBLIC_OPTIMIZATION_ENVIRONMENT ?? 'main'}
      locale="en-US"
      defaults={{ consent: true }} // Only when application policy permits default-on consent.
      contentful={{ client: contentful, defaultQuery: { locale: 'en-US' } }}
    >
      <ReactRouterAutoPageTracker />
      <Outlet />
    </OptimizationRoot>
  );
}
```

React Router's tracker must be under a data router because it calls `useMatches()`. All trackers
dedupe consecutive route keys, including Strict Mode effect replay, and emit the initial page by
default. Mount exactly one per router tree.

Tracker imports:

| Router          | Component                       | Import                                                      |
| --------------- | ------------------------------- | ----------------------------------------------------------- |
| React Router    | `ReactRouterAutoPageTracker`    | `@contentful/optimization-react-web/router/react-router`    |
| TanStack Router | `TanStackRouterAutoPageTracker` | `@contentful/optimization-react-web/router/tanstack-router` |
| Next Pages      | `NextPagesAutoPageTracker`      | `@contentful/optimization-react-web/router/next-pages`      |
| Next App        | `NextAppAutoPageTracker`        | `@contentful/optimization-react-web/router/next-app`        |

Only the Next trackers expose `initialPageEvent`; set it to `"skip"` only if a server path already
emitted the first page. Use `pagePayload` for static additions and `getPagePayload` for route-aware
additions. Put custom fields under `properties`:

```tsx
<ReactRouterAutoPageTracker
  getPagePayload={({ context }) => ({
    properties: { appSection: context.pathname.startsWith('/account') ? 'account' : 'public' },
  })}
/>
```

Without a supported router, call `trackPageView()` from one application-owned route effect.

## Readiness and initialization errors

The owned browser SDK is created after React commits, so it is not live on the first render.
`OptimizationRoot` seeds a read-only snapshot runtime and always renders children.

- `useOptimizationContext()` returns `{ sdk, error, isLive? }`. Use `error` for an app-level
  non-personalized fallback. `sdk` is seeded from the first render; actions are inert until live.
- `useOptimization()` returns the runtime and throws outside a provider, on initialization failure,
  or when unavailable. Use it below the root in handlers and effects.
- `OptimizedEntry` hides a baseline layout target while resolving, reveals the result when ready,
  and reveals baseline after five seconds if resolution never settles. `loadingFallback` replaces
  the hidden baseline content during that window.
- SDK initialization failure is not a normal baseline result: `OptimizedEntry` throws. Guard the
  subtree with `useOptimizationContext().error` or an error boundary.

```tsx
function PersonalizedArea({ baselineEntry }: { baselineEntry: Entry }) {
  const { error } = useOptimizationContext();
  if (error) return <StaticHero entry={baselineEntry} />;

  return (
    <OptimizedEntry baselineEntry={baselineEntry} loadingFallback={<HeroSkeleton />}>
      {(resolved) => <StaticHero entry={resolved as HeroEntry} />}
    </OptimizedEntry>
  );
}
```

## Entry sources and rendering

`OptimizedEntry` and `useOptimizedEntry()` accept a discriminated union: either `baselineEntry`
(manual fetching) or `entryId` plus optional `entryQuery` (managed fetching), never both.

### Manual entry

The application fetches with one concrete locale and enough linked content, normally `include: 10`:

```tsx
const baselineEntry = await contentful.getEntry('hero-entry-id', {
  include: 10,
  locale: 'en-US',
})

<OptimizedEntry baselineEntry={baselineEntry}>
  {(resolved, { getMergeTagValue }) => (
    <Hero entry={resolved as HeroEntry} resolveMergeTag={getMergeTagValue} />
  )}
</OptimizedEntry>
```

Do not pass `withAllLocales` or `locale=*` entries. Keep the Contentful and SDK locales aligned.

### Managed entry

Managed mode requires `contentful: { client }` on `OptimizationRoot`:

```tsx
<OptimizedEntry
  entryId="hero-entry-id"
  entryQuery={{ locale: 'en-US' }}
  loadingFallback={<HeroSkeleton />}
  errorFallback={(error) => <StaticHero reason={error.message} />}
  onEntryError={(error) => reportError(error)}
>
  {(resolved) => <Hero entry={resolved as HeroEntry} />}
</OptimizedEntry>
```

The SDK merges the root's `contentful.defaultQuery`, `entryQuery`, locale fallback, and
`include: 10`. Its per-instance cache defaults to 100 entries for 300,000 ms; configure
`contentful.cache` or set it to `false`. `errorFallback` and `onEntryError` report managed fetch
failure; they are distinct from safe baseline fallback after a successful fetch.

### Rendering contract

- Render the entry supplied to the render prop, not the original baseline. It is typed as a base
  Contentful `Entry`; cast at the component boundary when the application has generated types.
- Missing selections, denied consent, unmatched variants, and unresolved links resolve to baseline.
- A control assignment can render baseline with defined optimization metadata and
  `variantIndex: 0`.
- Do not nest `OptimizedEntry` components for the same baseline id; the inner component renders
  `null` and warns in development. Different nested entry ids are supported.
- The host uses `display: contents`; `as` accepts only `"div"` or `"span"`.

For lower-level rendering, `useOptimizedEntry(params)` returns `entry`, `baselineEntry`, `isLoading`,
`isPresentationReady`, `isResolved`, `error`, `canOptimize`, `metadata`, `resolvedData`,
`selectedOptimization`, and `selectedOptimizations`. `useEntryResolver()` exposes
`resolveOptimizedEntry`, `resolveEntry`, and `resolveEntryData` for manual render boundaries.

## Actions and state hooks

Use the exact bound names from `useOptimizationActions()`:

```tsx
const { setConsent, flushEvents, identifyUser, trackPageView, resetUser, trackScreen, trackEvent } =
  useOptimizationActions();

setConsent({ events: true, persistence: false });
await identifyUser({ userId: 'user-123', traits: { plan: 'pro' } });
await trackEvent({ event: 'checkout_completed', properties: { value: 42 } });
await flushEvents();
resetUser();
```

Do not use the obsolete destructuring names `track`, `identify`, `page`, `reset`, or `consent` for
this hook. If calling the SDK directly through `useOptimization()`, keep the instance intact and use
its native method names (`sdk.track()`, `sdk.identify()`, `sdk.page()`, `sdk.reset()`,
`sdk.consent()`).

Render state with:

- `useConsentState()`
- `useCanOptimizeState()`
- `useProfileState()`
- `useSelectedOptimizationsState()`
- `useEventStreamState()` — latest accepted event value, not an observable

For raw or blocked-event subscriptions, get `sdk` from `useOptimizationContext()` and subscribe to
`sdk.states.eventStream` or `sdk.states.blockedEventStream`, then unsubscribe in cleanup. Dedupe
forwarded events by `messageId`. There is no `useBlockedEventStreamState()` hook.

`resetUser()` clears profile, selected optimizations, and route dedupe while preserving SDK consent
signals. The application remains responsible for its own consent record.

## Interaction tracking

`OptimizedEntry` supplies the resolved metadata needed for automatic views, clicks, and hovers. All
three interaction types are on by default.

```tsx
<OptimizationRoot clientId={clientId} trackEntryInteraction={{ hovers: false }}>
  <OptimizedEntry baselineEntry={entry} clickable trackViews>
    {(resolved) => <Hero entry={resolved as HeroEntry} />}
  </OptimizedEntry>
</OptimizationRoot>
```

Use root `trackEntryInteraction` for global opt-outs. Per entry, use `clickable`, `trackViews`,
`trackClicks`, `trackHovers`, `viewDurationUpdateIntervalMs`, and
`hoverDurationUpdateIntervalMs`. Tracking uses the resolved entry id.

For exceptional DOM, register manually in an effect with
`sdk.tracking.enableElement('views', element, { data })` and call
`sdk.tracking.clearElement('views', element)` during cleanup. Interactions can be absent because
consent blocks their event type, the detector was disabled, metadata is missing, or no current
profile is available for Insights delivery.

## Optional live updates

Entry results lock after their first resolution by default. Enable re-resolution only where
identity, consent, or preview state should change mounted content:

```tsx
<OptimizationRoot clientId={clientId} liveUpdates={globalLiveUpdates}>
  <OptimizedEntry baselineEntry={entry} liveUpdates>
    {(resolved) => <AlwaysLive entry={resolved as HeroEntry} />}
  </OptimizedEntry>
  <OptimizedEntry baselineEntry={anotherEntry} liveUpdates={false}>
    {(resolved) => <Locked entry={resolved as HeroEntry} />}
  </OptimizedEntry>
</OptimizationRoot>
```

Precedence is: preview panel open, per-entry `liveUpdates`, root `liveUpdates`, then locked default.

## Advanced ownership and prefetch

Use `OptimizationProvider sdk={optimization}` only when application or adapter code owns a
pre-built Web SDK. Also add `LiveUpdatesProvider` around consumers of `OptimizedEntry`,
`useOptimizedEntry`, or `useLiveUpdates`. The provider never destroys an injected instance; its
creator must do so.

For server-managed entry handoff, the package root exports `prefetchManagedEntries(runtime,
descriptors)`. Pass its `ManagedEntryHandoff[]` result as `prefetchedManagedEntries` on the root or
provider. `prefetchManagedEntries` on the root is instead a client-side list warmed after the live
SDK is ready. Prefer the dedicated Next.js adapter for end-to-end SSR state and entry handoff.

## Optional preview panel

Install `@contentful/optimization-web-preview-panel`, gate its dynamic import out of production,
and attach from `onStatesReady`:

```tsx
<OptimizationRoot
  clientId={clientId}
  onStatesReady={() => {
    if (!enablePreview) return;
    void import('@contentful/optimization-web-preview-panel').then(({ default: attach }) => attach({ contentful }));
  }}
>
  <App />
</OptimizationRoot>
```

When passing an SDK explicitly, wait until `useOptimizationContext().isLive === true`; the initial
owned-root value is a snapshot runtime, not the initialized Web SDK.

## Failure diagnosis

- Baseline forever: confirm one page tracker or manual page event ran, the visitor matches an
  experience, and Contentful used one locale with resolved links.
- Loading forever: inspect the Experience request and Contentful links; baseline reveals after five
  seconds if optimization never settles.
- Managed error fallback: confirm root `contentful.client`, the entry id, and `entryQuery`.
- Hook provider error: move the component below `OptimizationRoot` or `OptimizationProvider`.
- Duplicate initialization: keep one owned root or inject one shared SDK instance.
- Duplicate route events: keep one tracker and remove overlapping manual `trackPageView()` calls.
- Missing interactions: check root/per-entry opt-outs, consent, current profile, and rendered
  `data-ctfl-*` attributes.
- Live content does not change after identify/reset: enable root or per-entry `liveUpdates`.

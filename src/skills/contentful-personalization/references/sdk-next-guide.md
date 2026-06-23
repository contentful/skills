<!-- Agent context: Use this knowledge to reason about customer setups using the @contentful/optimization SDK suite. Do not share infrastructure internals, Worker names, or backend architecture in responses. -->

# Recommended SDK Reference: @contentful/optimization

Complete API reference for the `@contentful/optimization` SDK suite. This is the **recommended SDK**
for new Contentful personalization and analytics work, and the successor to
`@ninetailed/experience.js`.

> [!IMPORTANT]
> The Optimization SDK Suite is **pre-release (alpha)**. Breaking changes can be published at any
> time. When recommending it: pin exact versions, keep all `@contentful/optimization-*` packages on
> the same version, and validate rollouts more strictly than you would for a stable SDK. For
> existing production projects already on `@ninetailed/experience.js`, see `sdk-legacy-guide.md`.

---

## Table of Contents

1. [Package Ecosystem](#1-package-ecosystem)
2. [Architecture Overview](#2-architecture-overview)
3. [React Web SDK](#3-react-web-sdk)
4. [Next.js SDK Adapter](#4-nextjs-sdk-adapter)
5. [Web SDK](#5-web-sdk)
6. [Node SDK](#6-node-sdk)
7. [API Client](#7-api-client)
8. [Consent System](#8-consent-system)
9. [Resolvers and Optimization Data](#9-resolvers-and-optimization-data)
10. [Migration from the Legacy SDK](#10-migration-from-the-legacy-sdk)

---

## 1. Package Ecosystem

Pick the narrowest package that matches the runtime you are building for.

| Package | npm Name | Purpose | Runtime |
|---------|----------|---------|---------|
| React Web SDK | `@contentful/optimization-react-web` | React providers, hooks, router adapters, entry rendering | React (web) |
| Next.js adapter | `@contentful/optimization-nextjs` | Next.js App Router server + client + request-handler glue | Next.js |
| Web SDK | `@contentful/optimization-web` | Stateful browser SDK (non-React or custom adapters) | Browser |
| Node SDK | `@contentful/optimization-node` | Stateless server SDK for SSR and server functions | Node.js |
| React Native SDK | `@contentful/optimization-react-native` | Mobile SDK | React Native |
| Web Preview Panel | `@contentful/optimization-web-preview-panel` | Author preview tooling for an existing Web SDK instance | Browser |
| Core SDK | `@contentful/optimization-core` | Shared foundation (`CoreStateful` + `CoreStateless`) | Any |
| API Client | `@contentful/optimization-api-client` | Direct Experience API + Insights API client | Any |
| API Schemas | `@contentful/optimization-api-schemas` | Zod Mini validation schemas and inferred types | Any |

Selection rules:

- **React on the web** → `@contentful/optimization-react-web`. It wraps the Web SDK transitively, so
  React apps use the React layer as the application-facing entry point.
- **Next.js App Router** → `@contentful/optimization-nextjs`. It composes the Node SDK on the server
  and the React Web SDK on the client. Import its `/server`, `/client`, and `/request-handler`
  subpaths rather than wiring the lower-level packages by hand.
- **Non-React browser app** → `@contentful/optimization-web` directly.
- **Stateless server / SSR layer** → `@contentful/optimization-node`.
- `@contentful/optimization-core` is the shared foundation and is **not used directly** by app code.
- `@contentful/optimization-api-client` and `@contentful/optimization-api-schemas` are lower-level
  building blocks for custom integrations.

Native iOS (`ContentfulOptimization` Swift Package) and native Android
(`com.contentful.java:optimization-android`) SDKs also exist as pre-release implementations and are
separate from `@contentful/optimization-react-native`.

---

## 2. Architecture Overview

The suite is layered:

```
@contentful/optimization-api-schemas   (Zod validation, types)
            |
@contentful/optimization-api-client    (HTTP clients: Experience + Insights)
            |
@contentful/optimization-core          (CoreBase -> CoreStateful / CoreStateless)
          /        \
optimization-web   optimization-node    (Environment SDKs)
       |
optimization-react-web                 (React framework SDK)
       |
optimization-nextjs                    (Next.js adapter: server + client + request handler)
```

Two runtime modes:

- **CoreStateful** (browser/mobile) — manages state via reactive signals, cookies, event queues,
  consent gating, and singleton enforcement.
- **CoreStateless** (server/SSR) — no internal state. Event methods are request-scoped and return
  `Promise<OptimizationData>`.

---

## 3. React Web SDK

**Package:** `@contentful/optimization-react-web`

The recommended entry point for React browser applications. Start here for React, Gatsby, Remix, and
other non-Next React setups. For Next.js App Router, prefer the
[Next.js adapter](#4-nextjs-sdk-adapter).

### OptimizationRoot (start here)

Mount `OptimizationRoot` once near the root of the React tree. It owns the Web SDK lifecycle
(creation, initialization, and teardown).

```tsx
import { OptimizationRoot } from '@contentful/optimization-react-web';

function App() {
  return (
    <OptimizationRoot clientId="your-client-id" environment="main" locale="en-US">
      <YourApp />
    </OptimizationRoot>
  );
}
```

`OptimizationRoot` accepts the Web SDK config props plus React-specific props:

| Prop | Required? | Default | Description |
|------|-----------|---------|-------------|
| `clientId` | Yes | — | Shared API key for the Experience API and Insights API |
| `environment` | No | `'main'` | Contentful environment identifier |
| `locale` | No | `undefined` | SDK Experience API and default event locale |
| `defaults` | No | `undefined` | Initial state (e.g. `{ consent: true }`, profile values) |
| `allowedEventTypes` | No | `['identify', 'page']` | Event types allowed before consent is set |
| `trackEntryInteraction` | No | `{ views: true, clicks: false, hovers: false }` | Auto interaction tracking for `OptimizedEntry` elements |
| `liveUpdates` | No | `false` | Whether `OptimizedEntry` reacts continuously to SDK state |
| `onStatesReady` | No | `undefined` | Subscribe to SDK state as part of provider initialization |
| `onEventBlocked` | No | `undefined` | Callback invoked when consent/guard logic blocks an event |
| `queuePolicy` | No | SDK defaults | Flush retry behavior and offline queue bounds |
| `cookie` | No | `{ expires: 365 }` | Anonymous ID cookie settings (from the Web SDK) |
| `api` | No | Web SDK defaults | Experience/Insights endpoint and request options |
| `logLevel` | No | `'error'` | Minimum log level for the default console sink |

### OptimizationProvider (escape hatch)

Use `OptimizationProvider` directly only when application or adapter code must own a pre-built SDK
instance. When you inject an instance, the provider does **not** destroy it — teardown stays with the
owner that created it.

```tsx
import { OptimizationProvider } from '@contentful/optimization-react-web';

<OptimizationProvider sdk={optimization}>
  <YourApp />
</OptimizationProvider>
```

### Hooks

```tsx
import {
  useOptimization,
  useOptimizationActions,
  useConsentState,
  useProfileState,
  useSelectedOptimizationsState,
  useEntryResolver,
  useMergeTagResolver,
  useOptimizedEntry,
} from '@contentful/optimization-react-web';
```

- **`useOptimization()`** returns the **SDK instance itself**. Keep it in a variable and call methods
  on it. Do **not** destructure methods off it — they rely on the instance `this` binding.

  ```tsx
  const optimization = useOptimization();
  optimization.track({ event: 'purchase' }); // correct
  // const { track } = useOptimization(); // ❌ loses the binding
  ```

- **`useOptimizationActions()`** returns destructurable, pre-bound action methods. Prefer it when a
  component just needs to call actions.

  ```tsx
  const { track, identify, page, reset, consent } = useOptimizationActions();
  ```

- **State hooks** — render current SDK state without subscribing to `sdk.states.*` from effects:
  `useConsentState()`, `useProfileState()`, `useSelectedOptimizationsState()`.

- **`useEntryResolver()`** — manual entry resolution without the `OptimizedEntry` wrapper:

  ```tsx
  const { resolveEntry } = useEntryResolver();
  const resolvedEntry = resolveEntry(baselineEntry);
  ```

- **`useMergeTagResolver()`** — resolve embedded merge tag entries:

  ```tsx
  const { getMergeTagValue } = useMergeTagResolver();
  return <span>{getMergeTagValue(mergeTagEntry) ?? ''}</span>;
  ```

- **`useOptimizedEntry({ baselineEntry, liveUpdates })`** — lower-level resolution result
  (`{ canOptimize, entry, isLoading, isReady, selectedOptimization, ... }`).

### OptimizedEntry

Resolves a baseline Contentful entry to the selected variant (or baseline) and renders via a render
prop:

```tsx
import { OptimizedEntry } from '@contentful/optimization-react-web';

function HeroEntry({ baselineEntry }) {
  return (
    <OptimizedEntry baselineEntry={baselineEntry}>
      {(resolvedEntry) => <HeroCard entry={resolvedEntry} />}
    </OptimizedEntry>
  );
}
```

Behavior:

- The loading phase begins immediately while optimization is unresolved. If state is still
  unresolved after **5 seconds**, the component reveals baseline content so loading never persists
  forever. Without a custom `loadingFallback`, the wrapper preserves layout by hiding the baseline
  until that timeout elapses.
- Emits the Web SDK's `data-ctfl-*` tracking attributes for resolved entries. Configure entry
  tracking with `clickable`, `hoverDurationUpdateIntervalMs`, and `viewDurationUpdateIntervalMs`
  props instead of setting `data-ctfl-*` manually.
- `baselineEntry` must be a single-locale CDA entry that includes `nt_experiences` (use `include: 10`
  when fetching). Do **not** pass all-locale (`withAllLocales` / `locale=*`) responses.

### Router page events

Router adapters live on **subpaths** and auto-emit `page()` on route changes. Mount each inside
`OptimizationRoot`.

| Router | Import path | Mounting rule |
|--------|-------------|---------------|
| React Router | `@contentful/optimization-react-web/router/react-router` | Under a React Router data router |
| Next.js Pages | `@contentful/optimization-react-web/router/next-pages` | Once in `pages/_app.tsx` |
| Next.js App Router | `@contentful/optimization-react-web/router/next-app` | In `app/layout.tsx` |
| TanStack Router | `@contentful/optimization-react-web/router/tanstack-router` | Under the TanStack router tree |

```tsx
import { NextAppAutoPageTracker } from '@contentful/optimization-react-web/router/next-app';

<OptimizationRoot clientId="your-client-id">
  <NextAppAutoPageTracker />
  {children}
</OptimizationRoot>
```

All adapters accept `pagePayload` (static) and `getPagePayload(context)` (dynamic) for payload
enrichment. For Next.js apps that also need the server and request-handler integration, prefer the
[`@contentful/optimization-nextjs`](#4-nextjs-sdk-adapter) adapter.

### Live updates and preview

`liveUpdates` defaults to `false`, so optimized entries lock to the first resolved value. Set it
globally on `OptimizationRoot` or per `OptimizedEntry` when entries must react to profile, flag, or
preview changes. When the browser preview panel
(`@contentful/optimization-web-preview-panel`) is open, live updates are forced on for all
`OptimizedEntry` components so authors can inspect variant changes immediately.

---

## 4. Next.js SDK Adapter

**Package:** `@contentful/optimization-nextjs`

The recommended path for Next.js App Router applications. It is a thin adapter — not a new runtime —
that composes the Node SDK on the server and the React Web SDK on the client.

| Runtime | Import path | Responsibility |
|---------|-------------|----------------|
| Client | `@contentful/optimization-nextjs/client` | React providers, hooks, components, trackers |
| Server | `@contentful/optimization-nextjs/server` | Node SDK creation, request binding, SSR wrapper |
| Request handler | `@contentful/optimization-nextjs/request-handler` | Next middleware/proxy request composition |
| Shared | `@contentful/optimization-nextjs/tracking-attributes` | SSR `data-ctfl-*` tracking attributes |

### Server

```tsx
import {
  ServerOptimizedEntry,
  createNextjsOptimization,
  getNextjsServerOptimizationData,
} from '@contentful/optimization-nextjs/server';
import { cookies, headers } from 'next/headers';

const sdk = createNextjsOptimization({ clientId: 'client-id', environment: 'main' });

export default async function Page() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const { data } = await getNextjsServerOptimizationData(sdk, {
    consent: { events: true, persistence: true },
    cookies: cookieStore,
    headers: headerStore,
    locale: 'en-US',
  });

  const resolvedData = sdk.resolveOptimizedEntry(entry, data?.selectedOptimizations);

  return (
    <ServerOptimizedEntry baselineEntry={entry} resolvedData={resolvedData}>
      {resolvedData.entry.fields.title}
    </ServerOptimizedEntry>
  );
}
```

### Client

```tsx
import { NextAppAutoPageTracker, OptimizationRoot } from '@contentful/optimization-nextjs/client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OptimizationRoot clientId="client-id" environment="main">
      <NextAppAutoPageTracker initialPageEvent="skip" />
      {children}
    </OptimizationRoot>
  );
}
```

Use `initialPageEvent="skip"` only when the server already called `page()` for the same initial
route. Route changes still emit normally.

### Request handler

```ts
import { optimization } from '@/lib/optimization-server';
import { createNextjsOptimizationRequestHandler } from '@contentful/optimization-nextjs/request-handler';

export const proxy = createNextjsOptimizationRequestHandler(optimization, {
  getLocale: () => 'en-US',
  resolveConsent: () => ({ events: true, persistence: true }),
});
```

Export the returned handler from `middleware.ts` or `proxy.ts`. It can compose with another
request-layer handler by accepting and returning the same `NextResponse`.

---

## 5. Web SDK

**Package:** `@contentful/optimization-web`

Use directly for non-React browser apps, custom framework adapters, and Web Components. React apps
should use the React Web SDK instead.

```ts
import ContentfulOptimization from '@contentful/optimization-web';

const optimization = new ContentfulOptimization({
  clientId: 'your-client-id',
  environment: 'main',
  locale: 'en-US',
});
```

> Initialize once per page runtime. Reuse `window.contentfulOptimization` (or your own singleton
> binding) instead of constructing additional instances.

Key configuration (see the generated reference for the complete surface):

| Option | Default | Description |
|--------|---------|-------------|
| `clientId` | — | Required shared API key |
| `environment` | `'main'` | Contentful environment identifier |
| `locale` | `undefined` | Experience API + default event locale |
| `defaults` | `undefined` | Initial state (e.g. `{ consent: true }`) |
| `allowedEventTypes` | `['identify', 'page']` | Events allowed before consent |
| `autoTrackEntryInteraction` | `{ views: false, clicks: false, hovers: false }` | Opt-in DOM interaction tracking |
| `cookie` | `{ expires: 365 }` | Anonymous ID cookie settings |
| `getAnonymousId` | `undefined` | Provide an anonymous ID from app-owned identity state |
| `queuePolicy` | SDK defaults | Flush retry behavior and offline queue bounds |
| `onEventBlocked` | `undefined` | Callback when consent/guard logic blocks an event |

`api` options include `experienceBaseUrl`, `insightsBaseUrl`, `enabledFeatures`
(`['ip-enrichment', 'location']`), `preflight`, `beaconHandler`, and `plainText`. Default fetch
retries apply only to HTTP `503`.

### Key methods

```ts
await optimization.identify({ userId: 'ext-123', traits: { plan: 'pro' } });
await optimization.page({ properties: { path: location.pathname } });
await optimization.track({ event: 'purchase', properties: { total: 99 } });

optimization.consent(true);                         // boolean form
optimization.consent({ events: true, persistence: false }); // object form

const resolved = optimization.resolveOptimizedEntry(baselineEntry, data?.selectedOptimizations);
const flag = optimization.getFlag('dark-mode');
const value = optimization.getMergeTagValue(mergeTagEntry);

optimization.setLocale('de-DE'); // updates default Experience API locale; does not refetch
await optimization.flush();
optimization.reset();            // clears state except consent/persistence consent
optimization.destroy();          // teardown for tests / hot reload
```

### Observable state

```ts
const unsubscribe = optimization.states.profile.subscribe((profile) => {
  console.log(profile?.id);
});
```

Common streams: `consent`, `persistenceConsent`, `profile`, `selectedOptimizations`, `changes`,
`eventStream`, `blockedEventStream`, plus preview-panel state. Subscriptions fire immediately with
the current value (like a `BehaviorSubject`), then on every change.

### Web Components (optional)

```ts
import { defineContentfulOptimizationElements } from '@contentful/optimization-web/web-components';

defineContentfulOptimizationElements();
```

Importing the subpath is side-effect-free; elements register only when
`defineContentfulOptimizationElements()` runs. Use `<ctfl-optimization-root>` and
`<ctfl-optimized-entry>`, assign structured values (like `baselineEntry`) as DOM **properties** (not
attributes), and listen for `ctfl-entry-loading`, `ctfl-entry-resolved`, and `ctfl-entry-error`.

---

## 6. Node SDK

**Package:** `@contentful/optimization-node`

Stateless server-side SDK for SSR, server functions, and Node services. Create it once per module or
process, then bind consent and request context per request with `forRequest()`.

```ts
import ContentfulOptimization from '@contentful/optimization-node';

const optimization = new ContentfulOptimization({
  clientId: 'your-client-id',
  environment: 'main',
  locale: 'en-US',
});

app.get('/products/:slug', async (req, res) => {
  const appLocale = getAppLocale(req);
  const requestOptimization = optimization.forRequest({
    consent: {
      events: appPolicyAllowsOptimizationEvent(req),
      persistence: appPolicyAllowsOptimizationEvent(req),
    },
    locale: appLocale,
    eventContext: { locale: appLocale },
    profile: { id: req.cookies.profileId },
  });

  const optimizationData = await requestOptimization.page({ properties: { path: req.path } });

  if (requestOptimization.canPersistProfile && optimizationData?.profile.id) {
    persistProfileId(res, optimizationData.profile.id);
  }

  const resolvedEntry = optimization.resolveOptimizedEntry(
    baselineEntry,
    optimizationData?.selectedOptimizations,
  );

  res.render('product', { optimizationData, resolvedEntry });
});
```

Key differences from the Web SDK:

- No signals, queues, or singleton enforcement. The SDK holds no state between requests.
- All event methods (`page`, `identify`, `screen`, `track`, sticky `trackView`) return
  `Promise<OptimizationData>` and are scoped through `forRequest()`.
- Event calls **fail closed** except the pre-consent allowlist `['identify', 'page']`, which send
  with `context.gdpr.isConsentGiven: false` when consent is not granted. Pass `allowedEventTypes: []`
  to require strict opt-in for all methods.
- Insights-backed methods (non-sticky `trackView`/`trackClick`/`trackHover`/`trackFlagView`) require
  a request-bound profile ID.
- `getFlag()` does **not** auto-emit flag-view tracking (the Web SDK does).

**Caching:** cache raw Contentful CDA payloads; never cache `page()`/`track()` results or
`resolveOptimizedEntry()`/`getMergeTagValue()` output across requests (they depend on the current
profile).

---

## 7. API Client

**Package:** `@contentful/optimization-api-client`

Low-level transport for the Experience API and Insights API. Most app code should not use this
directly.

```ts
import { ApiClient } from '@contentful/optimization-api-client';

const api = new ApiClient({ clientId: 'abc-123', environment: 'main' });
```

- `api.experience` — `getProfile`, `createProfile`, `updateProfile`, `upsertProfile`,
  `upsertManyProfiles`. Default base URL `https://experience.ninetailed.co/`. Request options:
  `enabledFeatures`, `ip` (`X-Force-IP`), `locale`, `plainText`, `preflight`.
- `api.insights` — `sendBatchEvents`. Default base URL `https://ingest.insights.ninetailed.co/`.
  Supports a beacon fallback for fire-and-forget delivery during page unload.
- Retries apply only to HTTP `503` (default 1 retry attempt).

> The `experience.ninetailed.co` / `ingest.insights.ninetailed.co` hosts are the current backend
> endpoint names. They are not the legacy SDK — `@contentful/optimization-*` and
> `@ninetailed/experience.js*` are different client packages that talk to the same platform.

---

## 8. Consent System

Consent is application policy. The SDK stores event consent, blocks non-allowed events until consent
is accepted, and tracks durable profile-continuity persistence consent separately.

```ts
optimization.consent(true);                          // grant events + persistence
optimization.consent(false);                         // withdraw
optimization.consent({ events: true, persistence: false }); // events on, continuity session-only
```

- **Boolean** consent controls both event emission and durable profile-continuity persistence.
- **Object** consent lets events emit while keeping profile, selected optimizations, changes, and the
  anonymous ID session-only until persistence consent is granted.
- Events not in `allowedEventTypes` (default `['identify', 'page']`) are blocked until consent is
  granted. Blocked events surface on `sdk.states.blockedEventStream` and via the `onEventBlocked`
  callback.

For default-on policies with no end-user consent UI, seed accepted consent at startup with
`defaults: { consent: true }`. For cross-SDK consent semantics see `analytics-and-preview.md` and the
SDK suite's consent concept doc.

---

## 9. Resolvers and Optimization Data

The unified response type returned by event methods:

```typescript
type OptimizationData = {
  profile: Profile;
  selectedOptimizations: SelectedOptimizationArray;
  changes: ChangeArray;
};
```

Three resolvers are available on every SDK instance:

```typescript
// Feature flags: flattens ChangeArray into a value
sdk.getFlag(name: string, changes?: ChangeArray): Json

// Entry resolution: returns the correct variant for a baseline entry
sdk.resolveOptimizedEntry(entry, selectedOptimizations?): ResolvedData
// ResolvedData = { entry: Entry, selectedOptimization?: SelectedOptimization }

// Merge tags: resolves profile data references in Rich Text
sdk.getMergeTagValue(mergeTagEntry, profile?): string | undefined
```

Resolution flow for `resolveOptimizedEntry`:

1. If no `selectedOptimizations`, return baseline.
2. If the entry has no `nt_experiences`, return baseline.
3. Find the matching optimization entry by `experienceId`.
4. Look up `variantIndex` (`0` = baseline, `1+` = variant; 1-based).
5. Resolve the variant entry from `nt_variants` and return it with optimization metadata.

The new SDK resolves the **same `nt_experiences` / `nt_variants` content model** as the legacy SDK,
so the Contentful content side does not change when migrating.

---

## 10. Migration from the Legacy SDK

| Aspect | Legacy (`@ninetailed/*`) | New (`@contentful/optimization-*`) |
|--------|--------------------------|------------------------------------|
| Init | `new Ninetailed({ clientId })` | `new ContentfulOptimization({ clientId })` |
| React entry | `NinetailedProvider` | `OptimizationRoot` (provider lifecycle owner) |
| React actions | `useNinetailed()` | `useOptimizationActions()` (and `useOptimization()` for the instance) |
| State | Callbacks (`onProfileChange`) | Observable signals + state hooks (`useProfileState`, etc.) |
| Personalization | `<Experience>` wrapper | `<OptimizedEntry>` render prop |
| Next.js | `@ninetailed/experience.js-next` | `@contentful/optimization-nextjs` (server + client + request-handler) |
| Router tracking | Pages Router only (auto) | Subpath adapters for Next App/Pages, React Router, TanStack |
| Plugins | `plugins[]` array | Built-in behavior + `interceptors` (event + state) |
| SSR | Plugin-based (`NinetailedSsrPlugin`) | Native `CoreStateless` / Node SDK |
| Feature flags | Via experiences/variants | Dedicated `getFlag()` + `states.flag(name)` |
| Consent | Privacy plugin | Built-in `{ events, persistence }` gating + `BlockedEvent` stream |
| Cookie name | `ntaid` | `ctfl-opt-aid` (auto-migrates from `ntaid`) |
| Window global | `window.ninetailed` | `window.contentfulOptimization` |
| Validation | None | Zod Mini schemas on all API boundaries |

Cookie and localStorage keys auto-migrate from the legacy names on construction:

```
ANONYMOUS_ID_COOKIE        = 'ctfl-opt-aid'
ANONYMOUS_ID_COOKIE_LEGACY = 'ntaid'        // auto-migrated
__ctfl_opt_*  localStorage keys             // auto-migrated from __nt_*
```

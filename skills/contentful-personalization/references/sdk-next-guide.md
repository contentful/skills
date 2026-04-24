<!-- Agent context: Use this knowledge to reason about customer setups using the new @contentful/optimization SDK. Do not share infrastructure internals, Worker names, or backend architecture in responses. -->

# Next-Gen SDK Reference: @contentful/optimization

Complete API reference for the @contentful/optimization SDK packages (successor to @ninetailed/experience.js). Not yet released (alpha).

---

## Table of Contents

1. [Package Ecosystem](#1-package-ecosystem)
2. [Architecture Overview](#2-architecture-overview)
3. [Web SDK](#3-web-sdk)
4. [React Web SDK](#4-react-web-sdk)
5. [Node SDK](#5-node-sdk)
6. [API Client](#6-api-client)
7. [Consent System](#7-consent-system)
8. [Migration from Legacy SDK](#8-migration-from-legacy-sdk)

---

## 1. Package Ecosystem

| Package | npm Name | Purpose | Runtime |
|---------|----------|---------|---------|
| Core SDK | `@contentful/optimization-core` | Platform-agnostic foundation (stateful + stateless) | Any |
| Web SDK | `@contentful/optimization-web` | Stateful browser SDK | Browser |
| React Web SDK | `@contentful/optimization-react-web` | React integration layer | React (web) |
| Node SDK | `@contentful/optimization-node` | Stateless server SDK | Node.js |
| React Native SDK | `@contentful/optimization-react-native` | Mobile SDK | React Native |
| API Client | `@contentful/optimization-api-client` | Direct Experience API + Insights API client | Any |
| API Schemas | `@contentful/optimization-api-schemas` | Zod Mini validation schemas and inferred types | Any |

General selection rules:
- Most application code should start with an environment SDK (web, node) or framework SDK (react-web).
- `@contentful/optimization-core` is the shared foundation -- not used directly.
- `@contentful/optimization-api-client` and `@contentful/optimization-api-schemas` are lower-level building blocks.

---

## 2. Architecture Overview

The SDK suite is layered:

```
@contentful/optimization-api-schemas   (Zod validation, types)
            |
@contentful/optimization-api-client    (HTTP clients: Experience + Insights)
            |
@contentful/optimization-core          (CoreBase -> CoreStateful / CoreStateless)
          /    \
optimization-web  optimization-node    (Environment SDKs)
         |
optimization-react-web                (Framework SDK)
```

Two runtime modes:

- **CoreStateful** (Browser/mobile) -- Manages state via reactive signals, cookies, event queues, consent gating, and singleton enforcement.
- **CoreStateless** (Server/SSR) -- All event methods return `Promise<OptimizationData>` and accept `requestOptions` for per-request scoping. No internal state.

---

## 3. Web SDK

### ContentfulOptimization

Extends CoreStateful. Provides browser-specific wiring. Singleton enforced via `window.contentfulOptimization`.

```typescript
import ContentfulOptimization from '@contentful/optimization-web';

const sdk = new ContentfulOptimization({
  clientId: 'abc-123',
  environment: 'main',
  // Optional:
  app?: App,
  autoTrackEntryInteraction?: { views?: boolean, clicks?: boolean, hovers?: boolean },
  cookie?: { domain?: string, expires?: number },  // default expires: 365 days
  logLevel?: LogLevels,
  allowedEventTypes?: EventType[],  // Default: ['identify', 'page']
  defaults?: { consent?: boolean, profile?: Profile, changes?: ChangeArray, selectedOptimizations?: SelectedOptimizationArray },
  api?: {
    experienceBaseUrl?: string,
    insightsBaseUrl?: string,
    enabledFeatures?: ('ip-enrichment' | 'location')[],
    preflight?: boolean,
    locale?: string,
    ip?: string,
  },
  queuePolicy?: {
    flush?: {
      flushIntervalMs?: number,          // Default: 30000 (30s)
      baseBackoffMs?: number,            // Default: 500
      maxBackoffMs?: number,             // Default: 30000
      maxConsecutiveFailures?: number,   // Default: 8
      circuitOpenMs?: number,            // Default: 120000 (2min)
    },
    offlineMaxEvents?: number,           // Default: 100
  },
});
```

#### Key Methods

```typescript
// Event methods (all consent-gated)
await sdk.identify({ userId: 'ext-123', traits: { plan: 'pro' } });
await sdk.page({ properties: { title: 'Home' } });
await sdk.track({ event: 'purchase', properties: { total: 99 } });
await sdk.trackView({ componentId: 'hero', viewId: 'v1', viewDurationMs: 2000 });
await sdk.trackClick({ componentId: 'hero' });

// State management
sdk.consent(true);   // Grant consent
sdk.reset();         // Clear all state
sdk.destroy();       // Clean up (force-flush, release singleton)
await sdk.flush();   // Flush event queues

// Resolvers
const flag = sdk.getFlag('dark-mode');
const resolved = sdk.resolveOptimizedEntry(entry);
const mergeTagValue = sdk.getMergeTagValue(mergeTagEntry);
```

#### Observable State

All state is accessible via `sdk.states`:

```typescript
interface CoreStates {
  consent: Observable<boolean | undefined>;
  profile: Observable<Profile | undefined>;
  selectedOptimizations: Observable<SelectedOptimizationArray | undefined>;
  canOptimize: Observable<boolean>;       // computed: selectedOptimizations !== undefined
  flag: (name: string) => Observable<Json>;
  eventStream: Observable<Event | undefined>;
  blockedEventStream: Observable<BlockedEvent | undefined>;
  previewPanelAttached: Observable<boolean>;
  previewPanelOpen: Observable<boolean>;
}
```

Observable interface:

```typescript
interface Observable<T> {
  readonly current: T;                                 // Deep-cloned snapshot
  subscribe: (next: (v: T) => void) => Subscription;  // Emits immediately + on change
  subscribeOnce: (next: (v: NonNullable<T>) => void) => Subscription;  // First non-null, then auto-unsubscribe
}
```

Key detail: `subscribe` fires immediately with the current value (like `BehaviorSubject`), then on every change.

#### Interceptors

Transform events or state updates via a pipeline:

```typescript
// Add an event interceptor
const id = sdk.interceptors.event.add(async (event) => {
  // Transform event before it's sent
  return event;
});

// Add a state interceptor
const id = sdk.interceptors.state.add(async (data) => {
  // Transform optimization data before it's applied
  return data;
});

// Remove
sdk.interceptors.event.remove(id);
```

#### Entry Interaction Tracking

Automatic DOM-based tracking for views, clicks, and hovers. Elements are discovered via `[data-ctfl-entry-id]` selector using MutationObserver.

```typescript
// Auto-tracking via config
new ContentfulOptimization({
  autoTrackEntryInteraction: { views: true, clicks: true, hovers: true },
  ...
});

// Manual tracking API
sdk.tracking.enable('views', { dwellTimeMs: 2000, minVisibleRatio: 0.5 });
sdk.tracking.enable('clicks');
sdk.tracking.enableElement('views', element, { dwellTimeMs: 3000 });
sdk.tracking.disable('views');
sdk.tracking.disableElement('views', element);
```

#### Cookie and Storage

```typescript
// Cookie names
ANONYMOUS_ID_COOKIE = 'ctfl-opt-aid'
ANONYMOUS_ID_COOKIE_LEGACY = 'ntaid'       // auto-migrated

// localStorage keys
ANONYMOUS_ID_KEY = '__ctfl_opt_anonymous_id__'
CONSENT_KEY = '__ctfl_opt_consent__'
PROFILE_CACHE_KEY = '__ctfl_opt_profile__'
SELECTED_OPTIMIZATIONS_CACHE_KEY = '__ctfl_opt_selected-optimizations__'
CHANGES_CACHE_KEY = '__ctfl_opt_changes__'
```

Legacy cookies and localStorage keys are automatically migrated on construction.

---

## 4. React Web SDK

**Package:** `@contentful/optimization-react-web`

### OptimizationProvider

Wraps the React tree with SDK context. Two usage modes:

```typescript
// Mode 1: Pass config props -- creates ContentfulOptimization instance internally
<OptimizationProvider clientId="abc" environment="main">
  {children}
</OptimizationProvider>

// Mode 2: Pass an existing SDK instance
<OptimizationProvider sdk={existingInstance}>
  {children}
</OptimizationProvider>
```

When the provider creates the instance (config mode), it calls `destroy()` on unmount. When an external SDK is passed, the provider does not own or destroy it.

### OptimizationRoot

Convenience wrapper combining `OptimizationProvider` + `LiveUpdatesProvider`:

```tsx
<OptimizationRoot clientId="abc" environment="main" liveUpdates>
  {children}
</OptimizationRoot>
```

### OptimizedEntry Component

Resolves a baseline entry to the appropriate variant and renders it.

```typescript
interface OptimizedEntryProps {
  baselineEntry: Entry;              // Must include nt_experiences (include: 10)
  children: (entry: Entry) => ReactNode;  // Render prop
  liveUpdates?: boolean;             // Override global setting
  as?: WrapperElement;               // Default: 'div'
  loadingFallback?: ReactNode | (() => ReactNode) | false;
}
```

Usage:

```tsx
<OptimizedEntry baselineEntry={entry}>
  {(resolvedEntry) => <MyComponent {...resolvedEntry.fields} />}
</OptimizedEntry>
```

Key behaviors:
- Renders with `style={{ display: 'contents' }}` wrapper (invisible in layout)
- Shows a loading fallback while `canOptimize` is false and the entry has optimization references
- Attaches `data-ctfl-*` tracking attributes to the wrapper element when resolved

### useOptimizedEntry Hook

```typescript
interface UseOptimizedEntryResult {
  canOptimize: boolean;
  entry: Entry;                                        // Resolved (variant or baseline)
  isLoading: boolean;
  isReady: boolean;
  selectedOptimization: SelectedOptimization | undefined;
  resolvedData: ResolvedData;
  selectedOptimizations: SelectedOptimizationArray | undefined;
}

const result = useOptimizedEntry({ baselineEntry: entry, liveUpdates: true });
```

When `liveUpdates` is true (or preview panel is open), always updates to latest selections. When false, locks selections after the first non-undefined value.

### useOptimization Hook

Returns bound SDK methods for React components.

```typescript
interface UseOptimizationResult {
  readonly consent: OptimizationSdk['consent'];
  readonly getFlag: OptimizationSdk['getFlag'];
  readonly getMergeTagValue: OptimizationSdk['getMergeTagValue'];
  readonly identify: OptimizationSdk['identify'];
  readonly interactionTracking: OptimizationSdk['tracking'];
  readonly page: OptimizationSdk['page'];
  readonly resolveOptimizedEntry: OptimizationSdk['resolveOptimizedEntry'];
  readonly resolveEntry: (entry: Entry) => Entry;
  readonly resolveEntryData: (entry: Entry) => ResolvedData;
  readonly sdk: OptimizationSdk;
  readonly track: OptimizationSdk['track'];
}

const { page, track, identify, getFlag, resolveEntry, consent, sdk } = useOptimization();
```

### useOptimizationContext Hook

Lower-level context access. Returns the raw context value without throwing on missing SDK.

```typescript
interface OptimizationContextValue {
  readonly sdk: OptimizationSdk | undefined;
  readonly isReady: boolean;
  readonly error: Error | undefined;
}

const { sdk, isReady, error } = useOptimizationContext();
```

### Router Auto-Page Trackers

Pre-built components that auto-emit `page()` events on route changes. All render `null`.

#### Next.js App Router

```tsx
import { NextAppAutoPageTracker } from '@contentful/optimization-react-web';

<NextAppAutoPageTracker />
<NextAppAutoPageTracker pagePayload={{ properties: { title: 'My Page' } }} />
<NextAppAutoPageTracker getPagePayload={(ctx) => ({ properties: { title: ctx.pathname } })} />
```

#### Next.js Pages Router

```tsx
import { NextPagesAutoPageTracker } from '@contentful/optimization-react-web';

<NextPagesAutoPageTracker />
```

#### React Router (v6+)

```tsx
import { ReactRouterAutoPageTracker } from '@contentful/optimization-react-web';

<ReactRouterAutoPageTracker />
```

#### TanStack Router

```tsx
import { TanStackRouterAutoPageTracker } from '@contentful/optimization-react-web';

<TanStackRouterAutoPageTracker />
```

All trackers accept:

```typescript
interface AutoPagePayloadOptions<TRouteContext> {
  readonly pagePayload?: AutoPagePayload;                     // Static payload for every emission
  readonly getPagePayload?: (context: AutoPageEmissionContext<TRouteContext>) => AutoPagePayload | undefined;
}
```

### LiveUpdatesProvider

Subscribes to preview panel open state and provides live-update context:

```typescript
<LiveUpdatesProvider globalLiveUpdates={false}>
  {children}
</LiveUpdatesProvider>
```

---

## 5. Node SDK

**Package:** `@contentful/optimization-node`

Thin wrapper over CoreStateless with Node-appropriate defaults.

```typescript
import ContentfulOptimization from '@contentful/optimization-node';

const sdk = new ContentfulOptimization({
  clientId: 'abc-123',
  environment: 'main',
  logLevel: 'info',
});

// All methods require request-scoped options
const requestOptions = { locale: 'en-US', ip: req.ip, preflight: true };

const data = await sdk.page({ properties: { title: 'Home' } }, requestOptions);
const flag = sdk.getFlag('dark-mode', data.changes);
const resolved = sdk.resolveOptimizedEntry(entry, data.selectedOptimizations);
```

Default configuration:
- `channel: 'server'`
- `library: { name: '@contentful/optimization-node', version: BUILD_VERSION }`

All event methods accept an optional `requestOptions` final argument:

```typescript
interface CoreStatelessRequestOptions {
  ip?: string;
  locale?: string;
  plainText?: boolean;
  preflight?: boolean;
}
```

Key differences from the web SDK:
- No signals, no queues, no consent gating, no singleton enforcement
- All event methods return `Promise<OptimizationData>` directly
- Events are validated and sent immediately (no queueing)
- `trackView` with `sticky: true` sends to both Experience and Insights APIs; with `sticky: false` sends only to Insights

Re-exports Core and API types via entrypoints:
- `@contentful/optimization-node/core-sdk`
- `@contentful/optimization-node/api-client`
- `@contentful/optimization-node/api-schemas`

---

## 6. API Client

**Package:** `@contentful/optimization-api-client`

### ApiClient

Top-level client exposing both Experience and Insights API clients.

```typescript
import { ApiClient } from '@contentful/optimization-api-client';

const api = new ApiClient({
  clientId: 'abc-123',
  environment: 'main',
  experience?: { /* ExperienceApiClientConfig overrides */ },
  insights?: { /* InsightsApiClientConfig overrides */ },
});
```

### ExperienceApiClient

```typescript
const EXPERIENCE_BASE_URL = 'https://experience.ninetailed.co/';

interface ExperienceApiClientRequestOptions {
  enabledFeatures?: ('ip-enrichment' | 'location')[];
  ip?: string;                  // X-Force-IP header
  locale?: string;
  plainText?: boolean;          // text/plain to avoid CORS preflight
  preflight?: boolean;          // Evaluate without persisting
}

// Methods
api.experience.getProfile(id, options?): Promise<OptimizationData>
api.experience.createProfile({ events }, options?): Promise<OptimizationData>
api.experience.updateProfile({ profileId, events }, options?): Promise<OptimizationData>
api.experience.upsertProfile({ profileId?, events }, options?): Promise<OptimizationData>
api.experience.upsertManyProfiles({ events }, options?): Promise<BatchResponse>
```

URL patterns:
- `GET v2/organizations/{clientId}/environments/{env}/profiles/{id}`
- `POST v2/organizations/{clientId}/environments/{env}/profiles`
- `POST v2/organizations/{clientId}/environments/{env}/profiles/{profileId}`
- `POST v2/organizations/{clientId}/environments/{env}/events`

### InsightsApiClient

```typescript
const INSIGHTS_BASE_URL = 'https://ingest.insights.ninetailed.co/';

api.insights.sendBatchEvents(batches, options?): Promise<boolean>
```

Beacon fallback: If `beaconHandler` is configured and returns `true`, skips fetch. Used for fire-and-forget delivery during page unload.

### Retry Behavior

Only retries on HTTP 503 status. Default 1 retry attempt.

---

## 7. Consent System

The SDK has built-in consent gating:

```typescript
// Grant or revoke consent
sdk.consent(true);
sdk.consent(false);

// Observe consent state
sdk.states.consent.subscribe((consent) => {
  console.log('Consent:', consent);
});
```

Event methods are gated by `allowedEventTypes`. Default allowed without consent: `['identify', 'page']` (web) or `['identify', 'page', 'screen']` (core). Events not in the allowed list are blocked until consent is granted.

Blocked events emit to `sdk.states.blockedEventStream`:

```typescript
sdk.states.blockedEventStream.subscribe((blocked) => {
  if (blocked) {
    console.log(`Event ${blocked.method} blocked: ${blocked.reason}`);
  }
});
```

You can also configure a callback:

```typescript
new ContentfulOptimization({
  onEventBlocked: (event) => {
    console.log(`Blocked: ${event.method} (${event.reason})`);
  },
  ...
});
```

---

## 8. Migration from Legacy SDK

### Key Differences

| Aspect | Legacy (`@ninetailed/*`) | New (`@contentful/optimization-*`) |
|--------|------------------------|------------------------------------|
| Init | `new Ninetailed({ clientId })` | `new ContentfulOptimization({ clientId })` |
| State | Callbacks (`onProfileChange`) | Observable signals (`.current` + `.subscribe()`) |
| Personalization | `<Experience>` wrapper | `<OptimizedEntry>` + render prop |
| Plugins | `plugins[]` array | Built-in `interceptors` (`event` + `state`) |
| API client | Single `NinetailedApiClient` | Dual `ExperienceApiClient` + `InsightsApiClient` |
| SSR | Plugin-based (`NinetailedSsrPlugin`) | Native `CoreStateless` / Node SDK |
| Feature flags | Via experiences/variants | Dedicated `getFlag()` + `states.flag(name)` |
| Cookie name | `ntaid` | `ctfl-opt-aid` (auto-migrates from legacy) |
| LocalStorage keys | `__nt_*` | `__ctfl_opt_*` (auto-migrates from legacy) |
| Window global | `window.ninetailed` | `window.contentfulOptimization` |
| Entry tracking | Manual `observeElement` | `autoTrackEntryInteraction` + `tracking` API |
| Router integration | Next.js Pages only (auto) | Auto-page trackers for Next.js App/Pages, React Router, TanStack |
| Consent | Basic (privacy plugin) | Built-in gated event system with `allowedEventTypes`, `BlockedEvent` stream |
| Queue resilience | Basic | Exponential backoff, circuit breaker, offline buffering |
| Validation | None | Zod mini schemas on all API boundaries |
| Live updates | None | `LiveUpdatesProvider` + `liveUpdates` prop + preview panel signals |

### OptimizationData Type

The unified response type:

```typescript
type OptimizationData = {
  profile: Profile;
  selectedOptimizations: SelectedOptimizationArray;
  changes: ChangeArray;
};
```

### Resolvers

Three static resolvers are available on all SDK instances:

```typescript
// Feature flags: flattens ChangeArray into key-value map
sdk.getFlag(name: string, changes?: ChangeArray): Json

// Entry resolution: returns the correct variant for an entry
sdk.resolveOptimizedEntry(entry, selectedOptimizations?): ResolvedData
// ResolvedData = { entry: Entry, selectedOptimization?: SelectedOptimization }

// Merge tags: resolves profile data references
sdk.getMergeTagValue(mergeTagEntry, profile?): string | undefined
```

Variant indexing: `variantIndex` is 1-based. `0` = baseline. First variant = `1`.

Resolution flow for `resolveOptimizedEntry`:
1. Check if `selectedOptimizations` exist -- if not, return baseline
2. Check if entry has `nt_experiences` -- if not, return baseline
3. Find matching optimization entry by `experienceId`
4. Look up `variantIndex` (0 = baseline, 1+ = variant)
5. Resolve variant entry from `nt_variants`
6. Return resolved variant entry + optimization metadata

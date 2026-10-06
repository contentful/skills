<!-- Agent context: Current imperative browser contract for @contentful/optimization-web. Load optimization-shared.md first. -->

# Optimization SDK: browser Web

Use this after `optimization-shared.md` for non-React browser applications or custom framework
adapters. React applications should normally use `@contentful/optimization-react-web` instead.

## Package and public entry points

```sh
pnpm add @contentful/optimization-web contentful
```

- `@contentful/optimization-web` — default export `ContentfulOptimization`, the stateful browser
  SDK.
- `@contentful/optimization-web/web-components` — optional custom elements and
  `defineContentfulOptimizationElements()`.
- `@contentful/optimization-web/api-schemas` — Contentful type guards such as `isMergeTagEntry`.
- `@contentful/optimization-web/constants` — constants including `ANONYMOUS_ID_COOKIE` and
  `DEFAULT_WEB_ALLOWED_EVENT_TYPES`.
- `@contentful/optimization-web-preview-panel` — separate optional authoring package; its default
  export is `attachOptimizationPreviewPanel`.

## Required lifecycle: construct, emit, resolve

Create exactly one instance per browser runtime. Construction is synchronous, but selected
optimizations are empty until an accepted `page()` or `identify()` call completes. Resolving first
therefore returns the baseline.

```ts
import { createClient } from 'contentful';
import ContentfulOptimization from '@contentful/optimization-web';

const locale = 'en-US';
const contentful = createClient({
  accessToken: browserConfig.contentfulToken,
  environment: browserConfig.contentfulEnvironment,
  space: browserConfig.contentfulSpace,
});

// Keep this in a module-level singleton and import it wherever it is needed.
export const optimization = new ContentfulOptimization({
  clientId: browserConfig.optimizationClientId,
  environment: browserConfig.optimizationEnvironment,
  locale,
  app: { name: 'my-web-app', version: '1.0.0' },
  defaults: { consent: true }, // Only when application policy permits default-on consent.
});

const { accepted } = await optimization.page();
if (!accepted) throw new Error('The initial page event was blocked');

const baselineEntry = await contentful.getEntry('hero-entry-id', {
  include: 10,
  locale,
});
const { entry } = optimization.resolveOptimizedEntry(baselineEntry);
renderHero(entry);
```

In a browser, construction registers the instance as `window.contentfulOptimization` and throws
`ContentfulOptimization is already initialized` if another instance exists. `destroy()` is for
owner teardown, tests, or hot reload—not routine navigation.

## Configuration that changes integration behavior

- `clientId`, `environment`, `locale`, `app`, `logLevel`, and `api` configure API and event context.
  `api` accepts `experienceBaseUrl` and `insightsBaseUrl` overrides.
- `defaults.consent` and `defaults.persistenceConsent` seed the two consent axes. When
  `persistenceConsent` is omitted, it defaults to `consent`.
- `allowedEventTypes`, `queuePolicy`, and `onEventBlocked` control event admission and delivery.
  The browser default before consent is `['identify', 'page']`.
- `cookie.domain` and `cookie.expires` configure the SDK-owned anonymous-id cookie. Expiry is in
  days and defaults to 365.
- `autoTrackEntryInteraction` controls automatic `views`, `clicks`, and `hovers`; all three default
  to `true`.
- `contentful: { client, defaultQuery?, cache? }` opts into SDK-managed entry fetching. The client
  remains application-owned and must provide `getEntry()` and `getEntries()`.

Keep browser configuration bundler-agnostic and expose only values safe for the client. Never ship
a Contentful Management API token.

## Fetching and resolving entries

### Manual fetching

Fetch with one concrete locale and sufficient link resolution, normally `include: 10`. Do not pass
`withAllLocales` or `locale=*` results to the resolver. Keep the SDK locale aligned with the CDA
locale.

```ts
const baseline = await contentful.getEntry(entryId, { include: 10, locale: 'en-US' });
const result = optimization.resolveOptimizedEntry(baseline);
renderEntry(result.entry);
```

Omitting the second `resolveOptimizedEntry()` argument uses current
`states.selectedOptimizations`. The result includes `entry`, `selectedOptimization?`, and
`optimizationContextId?`. A control assignment still has a defined `selectedOptimization` with
`variantIndex: 0`, even though `entry` equals the baseline.

### Managed fetching

```ts
const optimization = new ContentfulOptimization({
  clientId,
  environment,
  locale: 'en-US',
  contentful: {
    client: contentful,
    defaultQuery: { locale: 'en-US' },
    cache: { maxEntries: 100, ttlMs: 300_000 },
  },
});

await optimization.page();
const { baselineEntry, entry, selectedOptimization } = await optimization.fetchOptimizedEntry('hero-entry-id');
```

Managed methods require `contentful.client`:

- `fetchContentfulEntry(entryId, query?)` fetches one baseline entry.
- `fetchContentfulEntries(descriptors)` accepts ids or `{ entryId, entryQuery? }` and preserves
  input order, including duplicates.
- `fetchOptimizedEntry(entryId, { query?, selectedOptimizations? }?)` fetches and resolves.
- `prefetchManagedEntries(descriptors)` returns handoff objects containing `baselineEntry`.
- `clearContentfulEntryCache()` clears this instance's managed cache.

The SDK merges `defaultQuery`, the per-call query, its locale fallback, and `include: 10`. It batches
same-query misses through `getEntries()` and splits large batches into 100-id chunks. The default
cache is 100 entries for 300,000 ms; use `cache: false` to disable it.

## Routes, state, consent, and identity

Use `trackCurrentPage()` for SPA navigation so consecutive duplicate route keys do not emit twice:

```ts
await optimization.trackCurrentPage({
  routeKey: `${location.pathname}${location.search}${location.hash}`,
  buildPayload: () => ({ properties: { url: location.href } }),
});
```

Use `initialPageEvent: 'skip'` only when a server runtime already emitted the same first page. A
bare `page()` always attempts to emit.

The primary methods are:

```ts
optimization.consent({ events: true, persistence: false });
await optimization.identify({ userId: 'user-123', traits: { plan: 'pro' } });
await optimization.track({ event: 'checkout_completed', properties: { value: 42 } });
optimization.reset();
```

`page()`, `identify()`, `track()`, and `screen()` return `{ accepted, data? }`. `reset()` clears
profile, selections, route dedupe, SDK continuity storage, and interaction tracking, but preserves
consent signals and any application/CMP consent record.

State observables expose a synchronous `.current` value and immediate subscription:

```ts
const subscription = optimization.states.selectedOptimizations.subscribe((selections) => {
  rerenderOptimizedEntries(selections);
});

subscription.unsubscribe();
```

Relevant states include `consent`, `persistenceConsent`, `profile`, `selectedOptimizations`,
`eventStream`, `blockedEventStream`, and `flag(name)`. Dedupe analytics forwarding by event
`messageId`. `setLocale()` changes future Experience and event locale only; the application must
refetch Contentful content, clear relevant caches, and emit the appropriate page event.

## Entry interaction tracking

Automatic view, click, and hover detection observes DOM elements with `data-ctfl-*` metadata. Use
the resolved entry id, while keeping the baseline id separately for future resolution.

```ts
const { entry, selectedOptimization, optimizationContextId } = optimization.resolveOptimizedEntry(baselineEntry);

element.dataset.ctflEntryId = entry.sys.id;
element.dataset.ctflBaselineId = baselineEntry.sys.id;
if (optimizationContextId) element.dataset.ctflOptimizationContextId = optimizationContextId;
if (selectedOptimization) {
  element.dataset.ctflOptimizationId = selectedOptimization.experienceId;
  element.dataset.ctflVariantIndex = String(selectedOptimization.variantIndex);
}
element.dataset.ctflClickable = 'true';
```

For imperative registration, use
`optimization.tracking.enableElement('views', element, { data, dwellTimeMs? })`, then
`disableElement()` or `clearElement()` during teardown. A missing interaction can mean it was
disabled, consent blocked it, tracking metadata is missing, the path is not marked clickable, or
there is no current profile for Insights delivery.

## Optional Web Components

Register the elements explicitly; the entry point has no registration side effect:

```ts
import { defineContentfulOptimizationElements } from '@contentful/optimization-web/web-components';

defineContentfulOptimizationElements();
```

- `<ctfl-optimization-root>` can own an SDK from `client-id`, `environment`, and `locale`, reuse the
  global instance, or receive an explicit `sdk` property. `contentful`, `defaults`, `api`, and
  `prefetchManagedEntries` are properties. Listen for `ctfl-root-ready` and `ctfl-root-error`.
- `<ctfl-optimized-entry>` accepts either the `baselineEntry` property (manual) or `entry-id` /
  `entryId` plus optional `entryQuery` (managed). Listen for `ctfl-entry-loading`,
  `ctfl-entry-resolved`, and `ctfl-entry-error`, and render from `event.detail.entry`.

Do not provide both manual and managed entry sources.

## Optional preview panel

Environment-gate the separate package and attach after the SDK exists:

```ts
const { default: attachOptimizationPreviewPanel } = await import('@contentful/optimization-web-preview-panel');

await attachOptimizationPreviewPanel({
  contentful,
  optimization,
  nonce: cspNonce,
});
```

Pass either a Contentful client or pre-fetched `entries: { audiences, experiences }`; `entries`
wins when both are supplied. Attachment is idempotent.

## Failure diagnosis

- Baseline forever: confirm an accepted `page()` or `identify()` completed before resolution, the
  visitor matches an experience, and the CDA result uses one locale with resolved links.
- Duplicate initialization: find every `new ContentfulOptimization()` and reuse one module-level
  instance.
- Duplicate SPA page events: replace direct route-change `page()` calls with one
  `trackCurrentPage()` integration and a stable route key.
- Blocked custom or interaction events: inspect `states.consent.current`, `allowedEventTypes`,
  `states.blockedEventStream`, and `onEventBlocked`.
- Type mismatch: resolver results are base Contentful `Entry` values; cast to the application's
  entry type at the rendering boundary.

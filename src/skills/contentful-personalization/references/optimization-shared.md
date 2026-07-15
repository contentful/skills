<!-- Agent context: Shared behavioral contract for modern @contentful/optimization runtimes. Load one runtime-specific optimization-*.md reference as well. -->

# Optimization SDK shared contract

## Mental model

The Experience API returns visitor-specific `OptimizationData`:

```ts
{
  (profile, selectedOptimizations, changes);
}
```

Stateful browser and mobile SDKs apply that data to reactive state. Stateless server SDKs return it
to the current request. Entry resolution then combines a fetched baseline Contentful entry with
`selectedOptimizations` and returns either the authored variant or the original entry.

An accepted event may have no `data` yet. Check the discriminated result before reading it:

```ts
const result = await runtime.page();
if (result.accepted && result.data) {
  const { profile, selectedOptimizations, changes } = result.data;
}
```

## Entry ownership and fetching

The application owns the `contentful.js` client. It can hand entries to the SDK in two supported
ways:

- Manual: fetch an entry in application code and pass `baselineEntry`, or call
  `resolveOptimizedEntry(entry)`.
- Managed: configure `contentful: { client }`, then use an `entryId` API such as
  `<OptimizedEntry entryId>`, `useOptimizedEntry({ entryId })`, or `fetchOptimizedEntry(entryId)`.

Never pass both `baselineEntry` and `entryId` to a discriminated entry API.

Managed configuration accepts the following shape. `defaultQuery` and `cache` are optional:

```ts
const contentfulConfig = {
  client,
  defaultQuery: { locale: 'en-US' },
  cache: { maxEntries: 100, ttlMs: 300_000 },
};
```

Managed queries merge the default query, per-entry query, SDK or request locale fallback, and
`include: 10`. The per-instance cache defaults to 100 entries for five minutes. Use
`clearContentfulEntryCache()` when application policy requires invalidation. Prefetch APIs require
explicit entry descriptors; they do not crawl linked entries.

## Contentful payload contract

Fetch one concrete locale. Do not use `withAllLocales` or CDA `locale=*`: locale-keyed field maps
cannot be resolved and fall back to baseline.

Fetch enough linked depth to include:

- the baseline entry's fixed `fields.nt_experiences` links;
- each matching experience's fixed `fields.nt_variants` links;
- the variant entries and any application content they need.

The managed path supplies `include: 10`. A manual fetch must supply a comparable depth.

The resolved value is a base `contentful` `Entry`. Cast it to the application's generated entry type
at the render boundary when required.

## Baseline and control behavior

Resolution returns the baseline entry when no selection matches, links are unresolved, the entry is
not optimized, or the payload is all-locale. This is a valid outcome and must render without an
error state.

Do not use `resolved.entry === baselineEntry` to infer that no experience matched. A control
assignment has `variantIndex: 0`, returns the baseline entry, and still has a defined
`selectedOptimization`.

Resolution does not read consent. Consent controls event admission and therefore whether selections
become available; missing selections naturally resolve to baseline.

Managed-fetch failure is different from baseline fallback: surface it through the runtime's loading,
error callback, and error fallback APIs.

## Consent and persistence

The suite has two independent permissions:

- `consent`: may admit personalization and analytics events;
- `persistenceConsent`: may retain profile continuity.

A boolean sets both axes. In stateful Web, React, Next.js browser, and React Native runtimes, use the
object form when policy differs:

```ts
sdk.consent({ events: true, persistence: false });
```

Node binds the same decision per request with
`optimization.forRequest({ consent: { events, persistence } })`; it has no singleton `consent()`
method.

With no configured or persisted decision, state is `undefined`, not `false`. Web-family defaults
allow `identify` and `page` before explicit consent; React Native defaults allow `identify` and
`screen`. Tighten this with `allowedEventTypes: []` when policy requires fail-closed behavior.

The application owns the consent record and policy. Stateful SDKs own their documented profile
storage; the Node SDK stores nothing and makes persistence an application responsibility.

`reset()` clears profile and selection continuity but does not erase the application's consent
record. Clear application-owned authentication and consent state separately when appropriate.

## Lifecycle and event ordering

For the first personalized render:

1. Initialize the runtime once.
2. Seed or apply consent and an existing profile identity.
3. Identify a known user when applicable.
4. Emit the initial page or screen event.
5. Resolve entries from the returned or current selections.

Stateful React runtimes initialize after React commits, so loading and initialization failure are
real states. Node is request-scoped. The imperative Web class is synchronously constructed but has
no selections until an accepted Experience call returns.

Auto page or screen trackers deduplicate consecutive route keys. Mount one tracker per router tree.
In a hybrid server/browser integration, designate one owner for the initial page event so hydration
does not report it twice.

## Live updates

Entry re-resolution after load is opt-in. Configure it globally or per entry; a per-entry value
overrides the global default. It reacts to browser or mobile profile, identity, consent, and preview
state changes according to the selected runtime. Do not enable it merely to make the initial render
work.

## Merge tags and Custom Flags

Merge tags are profile-backed substitutions, separate from entry replacement. Validate a Contentful
entry with the runtime's `isMergeTagEntry` type guard before passing it to `getMergeTagValue`; the
configured fallback is returned when no profile value exists.

`getFlag(name)` reads a Custom Flag. Tracking semantics differ: stateful runtimes may emit a flag
view when consent and profile allow, while Node's base read is side-effect free and requires an
explicit request-bound `trackFlagView()` for exposure reporting.

## Diagnostics checklist

When an entry stays on baseline, check in order:

1. The initial Experience event was accepted and returned selections.
2. Consent and `allowedEventTypes` admit that event.
3. Profile identity is continuous across the relevant runtimes.
4. The Contentful fetch uses one locale and includes resolved experience and variant links.
5. The baseline carries `nt_experiences` and the matching experience carries `nt_variants`.
6. The selected experience and variant IDs match the fetched payload.

When interactions are missing, also check the runtime's tracking opt-outs, presence of a current
profile, resolved entry ID, visibility or gesture threshold, and duplicate route/event suppression.

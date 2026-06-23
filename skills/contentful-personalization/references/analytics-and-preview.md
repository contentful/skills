# Analytics and Preview

Analytics and preview are part of setup, not afterthoughts.

## Default Analytics Recommendation

### `@contentful/optimization` (recommended)

Analytics is **built in** — there is no separate insights plugin to install. Enable it through the
SDK:

- Set `trackEntryInteraction` (React Web SDK / `OptimizationRoot`) or `autoTrackEntryInteraction`
  (Web SDK) to capture views, clicks, and hovers on `OptimizedEntry` elements.
- `OptimizedEntry` emits the `data-ctfl-*` attributes the Web SDK observes; resolved entries are
  tracked automatically when interaction tracking is on.
- Use `track()` (via `useOptimizationActions()` or the SDK instance) for business/conversion events.
- Events flow to the Insights API for experiment and component measurement.

```tsx
<OptimizationRoot
  clientId={process.env.NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID!}
  trackEntryInteraction={{ views: true, clicks: true, hovers: false }}
>
  {children}
</OptimizationRoot>
```

### `@ninetailed/experience.js` (legacy)

Use `@ninetailed/experience.js-plugin-insights` when an existing Ninetailed setup needs:

- experiment measurement
- component insights
- click and view tracking from personalized components

Do not present `@ninetailed/experience.js-plugin-analytics` as the default built-in answer for these
legacy setups.

## Event Responsibilities

### `page()`

- Send once per route change.
- `@contentful/optimization`: use the router tracker subpath for the router in use
  (`NextAppAutoPageTracker`, `NextPagesAutoPageTracker`, React Router, TanStack). The Next.js adapter
  wires the client tracker for you.
- `@ninetailed/experience.js`: Pages Router with `NinetailedProvider` wires this for navigation; App
  Router needs a manual tracker.

### `track()`

- Use for business and conversion events such as signup completion or purchase.
- Keep event names consistent and human-readable.

### `identify()`

- Use for external user IDs and traits.
- Never identify using the anonymous profile ID (`ctfl-opt-aid` for the new SDK, `ntaid` for legacy).

## Component View Tracking Notes

- Component view tracking depends on the personalized component actually reaching the viewport.
- The default in-view threshold is typically `2000` ms.
- If the customer wants experiment results, the client-side measurement path matters — a client SDK
  must run after render.

## Consent and Analytics

- `@contentful/optimization` gates events by consent. Events outside `allowedEventTypes` (default
  `['identify', 'page']`) are blocked until consent is granted, and surface on
  `states.blockedEventStream` / the `onEventBlocked` callback. Object consent
  (`{ events, persistence }`) lets events emit while keeping profile continuity session-only.
- If analytics events are not appearing, check consent state before suspecting the network path.

## Preview Guidance

### `@contentful/optimization` (recommended)

Use `@contentful/optimization-web-preview-panel` for author preview against an existing Web SDK
instance. When the panel is open, live updates are forced on for all `OptimizedEntry` components so
authors see variant changes immediately. Set `liveUpdates` on `OptimizationRoot` (or per
`OptimizedEntry`) when entries must react to profile/flag/preview changes outside of preview.

### `@ninetailed/experience.js` (legacy)

Use the preview plugin only when the customer needs editor or QA tooling.

Requirements:

1. Fetch experiences for the preview environment.
2. Fetch audiences for the preview environment.
3. Pass both into the preview plugin.
4. Gate the plugin away from production unless the customer explicitly wants live preview behavior.

## Server-Only Limitation Warning

If no client SDK runs after render (either SDK family):

- personalized HTML can still render
- trait-based audiences can still work
- geo audiences can still work if geo context is passed
- component insights are limited
- experiment reporting is significantly weaker

Server-only is usually the wrong recommendation for customers who want a healthy experimentation
program.

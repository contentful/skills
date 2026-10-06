# Analytics and Preview

Analytics and preview are part of setup, not afterthoughts.

For new integrations, use the `@contentful/optimization` guidance. Apply the Ninetailed sections
only when maintaining a repository that already uses the legacy SDK.

## Default Analytics Recommendation

### Existing legacy deployments: `@ninetailed/experience.js`

Use `@ninetailed/experience.js-plugin-insights` when the customer wants:

- experiment measurement
- component insights
- click and view tracking from personalized components

Do not present `@ninetailed/experience.js-plugin-analytics` as the default built-in answer for these
setups.

### Recommended: `@contentful/optimization`

Analytics is **built in** — there is no separate insights plugin to install. Enable it through the
SDK:

- Set `trackEntryInteraction` (React Web SDK / `OptimizationRoot`) or `autoTrackEntryInteraction`
  (Web SDK) to capture views, clicks, and hovers on `OptimizedEntry` elements.
- `OptimizedEntry` emits the `data-ctfl-*` attributes the Web SDK observes; resolved entries are
  tracked automatically when interaction tracking is on.
- In React, call `trackEvent()` from `useOptimizationActions()`. On the SDK instance itself, call
  `track()`.
- Events flow to the Insights API for experiment and component measurement.

```tsx
<OptimizationRoot
  clientId={process.env.NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID!}
  trackEntryInteraction={{ views: true, clicks: true, hovers: false }}
>
  {children}
</OptimizationRoot>
```

## Event Responsibilities

### Page events (`page()` / `trackPageView()`)

- Send once per route change.
- `@contentful/optimization`: use the router tracker subpath for the router in use
  (`NextAppAutoPageTracker`, `NextPagesAutoPageTracker`, React Router, TanStack). A Next.js bound
  factory exports the matching tracker; the application still mounts it.
- `@ninetailed/experience.js`: Pages Router with `NinetailedProvider` wires this for navigation; App
  Router needs a manual tracker.

### Business events (`track()` / `trackEvent()`)

- Use for business and conversion events such as signup completion or purchase.
- Keep event names consistent and human-readable.

### Identity (`identify()` / `identifyUser()`)

- Use for external user IDs and traits.
- Never identify using the anonymous profile ID (`ctfl-opt-aid` for Optimization, `ntaid` for legacy).

## Component View Tracking Notes

- Component view tracking depends on the personalized component actually reaching the viewport.
- Visibility and dwell thresholds are runtime-specific; check the active runtime reference before
  changing them.
- If the customer wants experiment results, the client-side measurement path matters — a client SDK
  must run after render.

## Consent and Analytics

- `@contentful/optimization` gates events by consent. Events outside `allowedEventTypes` (default
  `['identify', 'page']`) are blocked until consent is granted, and surface on
  `states.blockedEventStream` / the `onEventBlocked` callback. Object consent
  (`{ events, persistence }`) lets events emit while keeping profile continuity session-only.
- If analytics events are not appearing, check consent state before suspecting the network path.

## Preview Guidance

### Existing legacy deployments: `@ninetailed/experience.js`

Use the preview plugin only when the customer needs editor or QA tooling.

Requirements:

1. Fetch experiences for the preview environment.
2. Fetch audiences for the preview environment.
3. Pass both into the preview plugin.
4. Gate the plugin away from production unless the customer explicitly wants live preview behavior.

### Recommended: `@contentful/optimization`

Use `@contentful/optimization-web-preview-panel` for author preview against an existing Web SDK
instance. When the panel is open, live updates are forced on for all `OptimizedEntry` components so
authors see variant changes immediately. Set `liveUpdates` on `OptimizationRoot` (or per
`OptimizedEntry`) when entries must react to profile/flag/preview changes outside of preview.

## Server-Only Limitation Warning

If no client SDK runs after render (either SDK family):

- personalized HTML can still render
- trait-based audiences can still work
- geo audiences can still work if geo context is passed
- component insights are limited
- experiment reporting is significantly weaker

Server-only is usually the wrong recommendation for customers who want a healthy experimentation
program.

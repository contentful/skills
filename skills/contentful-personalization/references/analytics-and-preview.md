# Analytics and Preview

Analytics and preview are part of setup, not afterthoughts.

## Default Analytics Recommendation for Current SDKs

Use `@ninetailed/experience.js-plugin-insights` when the customer wants:

- experiment measurement
- component insights
- click and view tracking from personalized components

Do not present `@ninetailed/experience.js-plugin-analytics` as the default built-in answer for these customer setups.

## Event Responsibilities

### `page()`

- Send once per route change.
- Pages Router with `NinetailedProvider` already wires this for navigation.
- App Router with the current SDKs needs a manual tracker.
- The new SDKs provide router tracker components for App Router and Pages Router.

### `track()`

- Use for business and conversion events such as signup completion or purchase.
- Keep event names consistent and human-readable.

### `identify()`

- Use for external user IDs and traits.
- Never identify using the anonymous profile ID such as `ntaid`.

## Insights Plugin Notes

- Component view tracking depends on the personalized component actually reaching the viewport.
- The default tracking threshold is typically `2000` ms in view.
- If the customer wants experiment results, the client-side measurement path matters.

## Preview Plugin Guidance

Use preview only when the customer needs editor or QA tooling.

Requirements:

1. Fetch experiences for the preview environment.
2. Fetch audiences for the preview environment.
3. Pass both into the preview plugin.
4. Gate the plugin away from production unless the customer explicitly wants live preview behavior.

## Server-Only Limitation Warning

If no client SDK runs after render:

- personalized HTML can still render
- trait-based audiences can still work
- geo audiences can still work if geo context is passed
- component insights are limited
- experiment reporting is significantly weaker

Server-only is usually the wrong recommendation for customers who want a healthy experimentation program.

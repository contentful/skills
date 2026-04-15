---
name: optimization-setup
description: >-
  Guide the installation and configuration of Contentful optimization and personalization SDKs.
  Covers server-side and edge rendering setup, middleware placement, cookie handling,
  hydration, and provider configuration for Next.js App Router and Pages Router.
  Use when asked to set up optimization, configure personalization, install Ninetailed,
  or initialize A/B testing. Also triggers on "set up personalization", "server-side
  personalization", "edge personalization", "install Ninetailed", or "set up analytics".
  Not for readiness audits or troubleshooting broken setups; use $optimization-readiness
  or $optimization-doctor.
---

# Optimization Setup

Use this skill to implement a reliable personalization setup.

## When to Use

- New optimization/personalization setup in an existing Contentful app
- Migration from client-only personalization to server-side or edge resolution
- Next.js App Router or Pages Router integration work
- Analytics plugin setup for personalization measurement
- NOT for readiness assessment, use $optimization-readiness
- NOT for debugging a broken setup, use $optimization-doctor

## Setup Workflow

Follow these steps in order. Do not skip verification gates.

### 1) Run Prerequisites Check

1. Run $optimization-readiness first to detect framework, rendering mode, and component mapping patterns.
2. Confirm the project already has Contentful delivery wired (client, environment variables, fetch path).
3. Confirm target runtime paths: Node server, edge middleware, or both.

If readiness gaps are found, fix those before setup.

### 2) Choose SDK Path

For SDK choice and tradeoffs, see [references/sdk-selection.md](references/sdk-selection.md).

- For a fresh install, there is a new alpha SDK at https://github.com/contentful/optimization.
- The current `@ninetailed/experience.js` SDK is battle-tested and reliable.
- Default recommendation for production today: use `@ninetailed/experience.js` unless the user explicitly wants to adopt alpha.

### 3) Install Packages

If using the stable SDK path:

```bash
npm install @ninetailed/experience.js @ninetailed/experience.js-next @ninetailed/experience.js-plugin-analytics
```

Guidance:

- Keep package versions aligned to the same minor/patch line.
- Use your project's package manager (`npm`, `pnpm`, or `yarn`) consistently.
- If upgrading, check release notes for breaking changes before bumping major versions.

### 4) Configure Environment Variables

Add and validate these variables:

- `NINETAILED_API_KEY`
- `NINETAILED_ENVIRONMENT`

Implementation rules:

1. Add real values to `.env.local`.
2. Add placeholder keys to `.env.example`.
3. Ensure server and middleware can both access required values.
4. Never hardcode API keys in source files.

### 5) Add Provider Setup

For detailed patterns, see [references/provider-patterns.md](references/provider-patterns.md).

App Router (`app/layout.tsx`):

- Place provider high in the tree so all personalizable components are wrapped.
- Respect server/client boundaries and move client-only provider logic into a client component wrapper when needed.

Pages Router (`pages/_app.tsx`):

- Wrap the full app with the provider in `_app.tsx`.
- Keep provider initialization deterministic between server and client to avoid hydration mismatches.

### 6) Configure Server-Side and Edge Middleware

This is the critical section. For concrete examples, see [references/middleware-patterns.md](references/middleware-patterns.md).

Checklist:

1. Ensure `middleware.ts` executes on routes that require personalization.
2. Configure matcher patterns carefully; too broad hurts performance, too narrow misses pages.
3. Forward required personalization cookies/headers consistently.
4. Avoid Node-only APIs in edge runtime code.
5. Add explicit fallbacks for unsupported runtime behavior.

### 7) Add Experience Mapping and Wrapping

- Confirm there is a clear map from Contentful types to render components.
- Wrap personalizable regions/components using your chosen SDK pattern.
- Ensure baseline and variant rendering accept compatible props.
- Keep personalized components presentational; avoid hidden data-fetching logic inside them.

### 8) Configure Analytics Plugin

- Add analytics plugin during provider initialization.
- Track page views, key component impressions, and conversion events.
- Keep event names consistent and meaningful.

### 9) Verify End-to-End

1. Load a page with known experience targeting and verify variant resolution.
2. Confirm no hydration mismatch warnings in browser console.
3. Validate middleware execution and matcher behavior for intended routes.
4. Confirm analytics events are emitted.
5. If verification fails, switch to $optimization-doctor.

## Output Expectations

When applying this skill, return:

- SDK path chosen (stable vs alpha), with rationale
- files touched and what changed in each
- middleware matcher and cookie-forwarding decisions
- verification results and remaining risks

## Common Failure Modes

For detailed remediations, see [references/common-errors.md](references/common-errors.md).

- Provider placed too low in the component tree
- Middleware matcher misses personalized routes
- Cookie forwarding omitted in server or edge path
- Client and server render different defaults, causing hydration mismatch
- Edge code uses Node APIs

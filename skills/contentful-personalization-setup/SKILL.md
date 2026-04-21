---
name: contentful-personalization-setup
description: >-
  Set up Contentful Personalization end-to-end in Contentful and code. Covers
  Contentful app installation, data buckets, nt_experience/nt_audience/nt_mergetag
  content model setup, the current production `@ninetailed/experience.js` SDKs,
  the modern `@contentful/optimization` SDKs, Next.js Pages Router and App Router,
  SSR and edge preflight, cookie handling, analytics, preview, and verification.
  Use when asked to set up personalization, install Contentful Personalization,
  configure Ninetailed, wire the new optimization SDKs, prepare A/B testing or just 
  about how to personalize. Not for readiness audits or debugging broken integrations; use
  the contentful-personalization-readiness skill or the contentful-personalization-doctor skill.
---

# Optimization Setup

Use this skill to implement a complete customer-ready personalization setup. Always start with the contentful-personalization-readiness skill first to assess the project.

## Default Recommendation

- Treat `@ninetailed/experience.js` as the current production SDK path.
- Treat `@contentful/optimization` as the modern next-generation SDK path.
- Do not describe `@ninetailed/experience.js` to customers as legacy unless they explicitly ask about the history.
- Default to the current `@ninetailed/experience.js` packages unless the user explicitly wants the new SDKs or a forward-looking greenfield setup.
- For server-rendered or edge-rendered personalized HTML, default to the hybrid pattern: server or edge preflight plus client SDK.
- Use the Insights plugin by default when the customer wants experiment measurement or component insights.
- Keep preview tooling optional and limited to preview or development environments.

## When to Use

- New personalization setup in an existing Contentful project
- Migration from client-only rendering to SSR or edge personalization
- Next.js Pages Router or App Router integration work
- Contentful Personalization app installation and content-model preparation
- Analytics, preview, or middleware setup as part of initial implementation
- NOT for readiness assessment, use the contentful-personalization-readiness skill
- NOT for debugging a broken setup, use the contentful-personalization-doctor skill

## Setup Workflow

Follow these steps in order. Do not skip the Contentful app setup or verification steps.

### 1) Run an Optimization Readiness Check First

1. Run the contentful-personalization-readiness skill to understand framework, router, rendering mode, and component mapping patterns.
2. Confirm the project already fetches Contentful content successfully.
3. Confirm whether personalization must happen in the browser only, on the server, at the edge, or in a hybrid setup.
4. Treat readiness as a hard gate before setup implementation:
   - If readiness is `NEEDS WORK` or `SIGNIFICANT RESTRUCTURING NEEDED`, stop setup and give a prerequisite-fix plan first.
   - If the framework/runtime is below supported baseline (for example Next.js 12), do not install SDK packages yet.
   - Resume setup only after prerequisites are fixed and readiness is re-run.
5. If readiness gaps are found, fix those before wiring the SDK.

### 2) Complete the Contentful Setup Before Writing App Code

For the full checklist, see [references/contentful-app-setup.md](references/contentful-app-setup.md).

1. Confirm the customer has access to the Contentful Personalization product.
2. Install the Contentful Personalization app in the correct Contentful environment.
3. Select the correct data bucket, usually `Main` for production or `Development` for non-production work.
4. Extend the content types that should become personalizable so they get the `nt_experiences` field.
5. Explain the three personalization content types clearly:
   - `nt_experience`: experience and experiment definitions
   - `nt_audience`: audience definitions used for targeting
   - `nt_mergetag`: inline personalization values for rich text or JSX
6. Confirm the customer understands that the content model is part of setup, not a later optional step.

### 3) Choose Architecture and SDK Path

For SDK choice and tradeoffs, see [references/sdk-selection.md](references/sdk-selection.md).

Use this decision rule:

1. Existing production implementation, predictable support needs, or minimal migration risk: use the current `@ninetailed/experience.js` SDKs.
2. Forward-looking greenfield work, willingness to adopt alpha APIs, or explicit request for the new platform direction: use the `@contentful/optimization` SDKs.
3. Personalized HTML on first response: choose hybrid SSR or edge plus client SDK.
4. Browser-only personalization is acceptable: client-only setup is fine.
5. No client SDK is allowed: use server-only setup, but explain the analytics and experiment limitations.

### 4) Install the Right Packages for the Chosen Setup

For most production setups today, start with the current SDKs:

```bash
npm install @ninetailed/experience.js @ninetailed/experience.js-next @ninetailed/experience.js-utils-contentful
```

Add packages by need:

- `@ninetailed/experience.js-plugin-insights`: default analytics and insights plugin
- `@ninetailed/experience.js-plugin-ssr`: add when server or edge rendering needs profile continuity
- `@ninetailed/experience.js-plugin-preview`: add only for preview or editor workflows
- `@ninetailed/experience.js-node`: add for Node-only server event sending

If the user explicitly wants the new SDKs, start with:

```bash
npm install @contentful/optimization-web @contentful/optimization-react-web
```

Add packages by need:

- `@contentful/optimization-node`: Node and stateless server work
- `@contentful/optimization-web-preview-panel`: browser preview tooling where applicable

Rules:

- Keep package versions aligned.
- Use the project's existing package manager consistently.
- If the customer wants the new SDKs, explicitly note that they are the modern path and may still evolve faster than the current production SDKs.

### 5) Configure Environment Variables by Runtime

For the full matrix, see [references/environment-variables.md](references/environment-variables.md).

Core rules:

1. Browser-safe SDK credentials and server-only Contentful preview tokens must not be mixed.
2. For current Next.js SDK setups, browser-side variables usually use `NEXT_PUBLIC_NINETAILED_*` and `NEXT_PUBLIC_CONTENTFUL_*` names.
3. Edge workers and middleware often use `NINETAILED_API_KEY` and `NINETAILED_ENVIRONMENT` without the `NEXT_PUBLIC_` prefix.
4. The new `@contentful/optimization` SDKs do not force one env var naming scheme. Pick clear names and keep them consistent across the project.
5. Add real values to `.env.local` and placeholders to `.env.example`.
6. Never hardcode API keys or preview tokens in source files.

### 6) Wire the Contentful Fetching and Rendering Pipeline

For concrete patterns, see [references/rendering-pipeline.md](references/rendering-pipeline.md).

Checklist:

1. Use a delivery client for published content and a preview client for draft content when preview mode is required.
2. If using the Contentful REST client, prefer `.withoutUnresolvableLinks` to avoid null-reference surprises.
3. Fetch with enough include depth for experiences and variants to resolve. Minimum useful depth is usually `2`; nested page structures often use `10`.
4. Ensure the personalizable entry types actually include the `nt_experiences` field.
5. Map experiences with `ExperienceMapper.isExperienceEntry` and `ExperienceMapper.mapExperience`.
6. Use a clear component-mapper pattern such as `ContentTypeMap` plus `ComponentRenderer` plus `BlockRenderer`.
7. Keep personalized components mostly presentational. Avoid hiding unrelated data fetching inside a personalized component when a renderer can pass the needed props.
8. If merge tags are used, render `nt_mergetag` entries with the `MergeTag` component or an equivalent pipeline.

### 7) Add the Provider and Page Tracking

For provider placement patterns, see [references/provider-patterns.md](references/provider-patterns.md).

Current production SDKs:

- Pages Router: wrap the app in `pages/_app.tsx` with `NinetailedProvider`.
- Pages Router automatically tracks page changes through the Next.js Page Router integration. Do not add duplicate `page()` calls for route changes.
- App Router: keep the root layout server-first, move provider initialization into a client wrapper, and add manual page tracking.
- Add `NinetailedInsightsPlugin` when measurement is required.
- Add `NinetailedSsrPlugin` only when SSR or edge rendering is part of the architecture.
- Add `NinetailedPreviewPlugin` only when preview is explicitly required, and gate it away from production.

Modern SDKs:

- Use `OptimizationProvider` at the app root.
- Use `NextAppAutoPageTracker` for App Router or `NextPagesAutoPageTracker` for Pages Router.
- Render personalized entries with `OptimizedEntry` or an equivalent resolver-based pattern.

### 8) Add SSR or Edge Personalization When Required

For runtime flow and cookie details, see [references/middleware-patterns.md](references/middleware-patterns.md).

This is the most important setup section.

Default recommendation:

- If the page renders personalized HTML on the server or edge and a client SDK also runs afterward, use preflight on the server or edge and let the client SDK persist state.

Checklist:

1. Match only the HTML routes that actually need personalization.
2. Exclude static assets, APIs, and unrelated requests.
3. Read the `ntaid` cookie from the request.
4. Build a server-side page event with URL, referrer, and geo data when available.
5. For hybrid setups, call the Experience API with `?type=preflight`.
6. Always set the `ntaid` cookie from `response.data.profile.id`, never from the stale request cookie.
7. Pass the selected experiences or changes through to the render path in a deterministic way.
8. Include `countryCode` when the edge platform exposes it, or geo audiences may evaluate incorrectly.
9. Avoid Node-only APIs in edge code.
10. If there is no client SDK at all, explain clearly that server-only mode reduces measurement capability.

### 9) Add Analytics, Conversion Tracking, and Optional Preview

For details, see [references/analytics-and-preview.md](references/analytics-and-preview.md).

1. Use `NinetailedInsightsPlugin` by default for the current SDKs when the customer wants experiment reporting or component insights.
2. Ensure page views are tracked once per route change, not twice.
3. Use `track()` for conversion and business events.
4. Use `identify()` for traits or external IDs, never with the anonymous profile ID.
5. Only enable preview tooling when the customer needs editor or QA workflows.
6. Preview requires all experiences and audiences plus preview-capable Contentful fetching.
7. Explain that server-only setups do not provide full client-side component insights and are a poor fit for most experimentation programs.

### 10) Verify the Setup End to End

1. Confirm the relevant entries in Contentful have `nt_experiences` links and published content where expected.
2. Load a page with known targeting and confirm the correct baseline or variant resolves.
3. Confirm the provider wraps the whole intended subtree.
4. Confirm no hydration mismatch warnings appear.
5. Confirm page tracking happens exactly once per navigation.
6. Confirm click or component insights fire when expected.
7. Confirm preview only appears where intended.
8. Confirm SSR or edge flows keep the anonymous ID stable across requests.
9. If verification fails, move to the contentful-personalization-doctor skill.

## Common Failure Modes

For remediations, see [references/common-errors.md](references/common-errors.md).

- Contentful app installed but content types were never extended, so entries have no `nt_experiences` field
- Wrong plugin package chosen, especially using the analytics base package instead of the Insights plugin
- Include depth too shallow, so experiences or variants do not resolve
- Provider mounted too low in the tree
- Duplicate page tracking in Next.js
- Hybrid SSR or edge setup missing preflight
- `ntaid` cookie set from the request value instead of the API response profile ID
- Preview plugin enabled in production or without full preview data
- Geo audiences failing because `countryCode` was never passed from the edge or middleware layer

## Output Expectations

When applying this skill, return:

- chosen architecture and SDK path, with rationale
- manual Contentful actions completed or still required
- packages added or updated
- environment variables added or expected
- files touched and what changed in each
- SSR or edge decisions, including matcher and cookie handling
- analytics and preview decisions
- verification results and remaining risks

If the agent cannot complete Contentful UI steps directly, it must still leave the user with an exact checklist of what to click and configure.

Always include a readiness gate statement:

- `Readiness passed, proceeding with setup.`
- or `Readiness not passed, prerequisite upgrades required before setup.`

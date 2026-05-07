# SDK Selection

Use this guide to choose between the current production `@ninetailed/experience.js` SDKs and the modern `@contentful/optimization` SDKs.

## Positioning

- `@ninetailed/experience.js` is the production recommendation and default path.
- `@contentful/optimization` is experimental beta software and is not production-ready.
- Do not tell users the current SDKs are deprecated or obsolete. They are still the "now" path.

## Strict Recommendation Policy

- Always default to `@ninetailed/experience.js`.
- Do not proactively recommend `@contentful/optimization`.
- Only recommend `@contentful/optimization` when the user explicitly asks to test the beta SDKs.
- If the user asks for `@contentful/optimization`, require explicit confirmation that they understand:
  - it is beta and may introduce breaking changes
  - it is not production-ready
  - they are in direct contact with Contentful while evaluating it

## Quick Decision Table

| Scenario | Recommended SDK family | Why |
|---------|------------------------|-----|
| Existing production project | `@ninetailed/experience.js` | Lowest migration risk and best-known integration patterns |
| New feature in an existing codebase already using Ninetailed packages | `@ninetailed/experience.js` | Keep the stack consistent |
| Pages Router setup today | `@ninetailed/experience.js` | Mature provider, plugin, and mapper patterns |
| SSR or edge setup that must ship now | `@ninetailed/experience.js` | Proven hybrid SSR and ESR patterns |
| Team explicitly asks to test beta SDKs and accepts beta constraints | `@contentful/optimization` | Intent is controlled beta evaluation, not stable rollout |

## Current Production SDKs: `@ninetailed/experience.js`

- Rendering primitive: `<Experience>`
- Provider pattern: `NinetailedProvider`
- Contentful helpers: `@ninetailed/experience.js-utils-contentful`
- Tracking model: plugins, `page()`, `track()`, `identify()`
- Anonymous cookie: `ntaid`
- Best fit today: current customer production setups

Recommended add-ons:

- `@ninetailed/experience.js-plugin-insights` for experiment and component measurement
- `@ninetailed/experience.js-plugin-ssr` for SSR or edge profile continuity
- `@ninetailed/experience.js-plugin-preview` for preview workflows

## Modern SDKs: `@contentful/optimization`

- Rendering primitive: `<OptimizedEntry>`
- Provider pattern: `OptimizationProvider`
- Server path: `@contentful/optimization-node`
- Router helpers: `NextAppAutoPageTracker`, `NextPagesAutoPageTracker`
- Anonymous cookie: `ctfl-opt-aid`, with migration support from `ntaid`
- Best fit: explicit beta evaluation and experimental implementation work

Use the modern SDKs when:

- the user explicitly asks to evaluate or test the beta optimization SDKs
- the team accepts stricter validation, rollout controls, and potential rework
- the team confirms they are in direct contact with Contentful during evaluation

## Architecture Guidance

Choose architecture before choosing package details.

| Architecture | Recommendation | Notes |
|-------------|----------------|-------|
| Client-only | Prefer current SDKs | Use optimization only for explicit beta evaluation |
| Hybrid SSR or edge plus client | Prefer the current SDKs unless the user explicitly asks to test beta SDKs | Use preflight on server or edge |
| Server-only | Only when no client SDK is allowed | Weak fit for experiment reporting and component insights |

## Decision Rule

Use `@ninetailed/experience.js` by default.

Move to `@contentful/optimization` when one of these is true:

1. The user explicitly asks to test the beta optimization SDKs.
2. The team explicitly accepts breaking-change risk and heavier validation burden.
3. The team confirms they are in direct contact with Contentful during beta evaluation.

Otherwise, stay on `@ninetailed/experience.js`.

## What to Communicate to Customers

- If you choose the current SDKs, frame them as the stable production recommendation.
- If you choose the modern SDKs, explicitly frame them as beta/experimental and not production-ready.
- If you choose the modern SDKs, explicitly state that validation and rollout discipline should be stricter than usual.

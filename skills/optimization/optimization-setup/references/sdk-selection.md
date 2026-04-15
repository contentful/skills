# SDK Selection

Use this guide to choose between the current production `@ninetailed/experience.js` SDKs and the modern `@contentful/optimization` SDKs.

## Positioning

- `@ninetailed/experience.js` is the current production path customers should use today unless there is a strong reason to adopt the new SDKs.
- `@contentful/optimization` is the newer SDK family with a more modern architecture and future-facing platform direction.
- Do not casually tell customers the current SDKs are deprecated or obsolete. They are still the "now" path.

## Quick Decision Table

| Scenario | Recommended SDK family | Why |
|---------|------------------------|-----|
| Existing production project | `@ninetailed/experience.js` | Lowest migration risk and best-known integration patterns |
| New feature in an existing codebase already using Ninetailed packages | `@ninetailed/experience.js` | Keep the stack consistent |
| Pages Router setup today | `@ninetailed/experience.js` | Mature provider, plugin, and mapper patterns |
| SSR or edge setup that must ship now | `@ninetailed/experience.js` | Proven hybrid SSR and ESR patterns |
| Forward-looking greenfield work | `@contentful/optimization` | Modern architecture and future platform direction |
| Team explicitly wants the new SDKs | `@contentful/optimization` | Aligns with customer intent |
| Strong App Router-first investment and willingness to adopt evolving APIs | `@contentful/optimization` | Built-in router tracker components and newer primitives |

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
- Best fit: customers explicitly adopting the new platform direction

Use the modern SDKs when:

- the user explicitly asks for the new optimization SDKs
- the project is greenfield and can absorb faster API evolution
- the team wants to build toward the newer platform model

## Architecture Guidance

Choose architecture before choosing package details.

| Architecture | Recommendation | Notes |
|-------------|----------------|-------|
| Client-only | Either family | Simplest option when first-response personalized HTML is not required |
| Hybrid SSR or edge plus client | Prefer the current SDKs unless the user explicitly wants the new SDKs | Use preflight on server or edge |
| Server-only | Only when no client SDK is allowed | Weak fit for experiment reporting and component insights |

## Decision Rule

Use `@ninetailed/experience.js` by default.

Move to `@contentful/optimization` when one of these is true:

1. The user explicitly asks for it.
2. The implementation is intentionally future-facing and greenfield.
3. The team accepts faster-moving SDK behavior and verification needs.

## What to Communicate to Customers

- If you choose the current SDKs, frame them as the stable production recommendation.
- If you choose the modern SDKs, frame them as the newer architecture with more future-facing capabilities.
- If you choose the modern SDKs, explicitly state that validation and rollout discipline should be stricter than usual.

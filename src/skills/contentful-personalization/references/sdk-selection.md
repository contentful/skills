# SDK Selection

Use this guide to choose between the current production `@ninetailed/experience.js` SDKs and the
modern `@contentful/optimization` SDKs.

## Positioning

- `@ninetailed/experience.js` is the **current default** customers should use today unless there is a
  strong reason to adopt the new SDKs. It is production-proven and widely deployed.
- `@contentful/optimization` is the **modern, next-gen** SDK family with a redesigned architecture
  (React Web, Next.js adapter, Web, Node, React Native) and is the platform's forward direction.
- Do not casually tell customers the current SDKs are deprecated or obsolete. They are still the
  "now" path.

> [!NOTE]
> `@contentful/optimization` is **pre-release (alpha)**; breaking changes can ship at any time.
> When a customer opts into it, pin exact versions, keep all `@contentful/optimization-*` packages on
> the same version, and apply stricter validation and rollout discipline than usual.

## Quick Decision Table

| Scenario | Recommended SDK family | Why |
|---------|------------------------|-----|
| Existing production project | `@ninetailed/experience.js` | Lowest migration risk and best-known integration patterns |
| New feature in an existing codebase already using Ninetailed packages | `@ninetailed/experience.js` | Keep the stack consistent |
| Pages Router setup today | `@ninetailed/experience.js` | Mature provider, plugin, and mapper patterns |
| SSR or edge setup that must ship now | `@ninetailed/experience.js` | Proven hybrid SSR and ESR patterns |
| Forward-looking greenfield work | `@contentful/optimization` | Modern architecture and future platform direction |
| Team explicitly wants the new SDKs | `@contentful/optimization` | Aligns with customer intent |
| Strong App Router-first investment and willingness to adopt evolving APIs | `@contentful/optimization` | Dedicated Next.js adapter and newer primitives |

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

See `sdk-legacy-guide.md` for the full API.

## Modern SDKs: `@contentful/optimization`

- Rendering primitive: `<OptimizedEntry>` (React render prop)
- React entry point: `OptimizationRoot` (owns SDK lifecycle); `OptimizationProvider` to inject an instance
- Next.js: `@contentful/optimization-nextjs` (`/server`, `/client`, `/request-handler` subpaths)
- Server path: `@contentful/optimization-node` (stateless, `forRequest()`)
- Router tracking: subpath adapters — `@contentful/optimization-react-web/router/next-app`,
  `/router/next-pages`, `/router/react-router`, `/router/tanstack-router`
- Actions: `useOptimizationActions()`; SDK instance via `useOptimization()` (do not destructure)
- Consent: object-capable `consent({ events, persistence })` with blocked-event streams
- Anonymous cookie: `ctfl-opt-aid`, auto-migrated from `ntaid`
- Best fit: customers explicitly adopting the new platform direction

Use the modern SDKs when:

- the user explicitly asks for the new optimization SDKs
- the project is greenfield and can absorb faster, pre-release API evolution
- the team wants to build toward the newer platform model

See `sdk-next-guide.md` for the full API and `package-versions.md` for package selection.

## Architecture Guidance

Choose architecture before choosing package details. Both SDK families support all three.

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
3. The team accepts faster-moving, pre-release SDK behavior and stricter verification needs.

## What to Communicate to Customers

- If you choose the current SDKs, frame them as the stable production recommendation.
- If you choose the modern SDKs, frame them as the newer architecture with more future-facing
  capabilities — and state plainly that they are pre-release (alpha), so versions should be pinned
  and rollouts validated more strictly than usual.

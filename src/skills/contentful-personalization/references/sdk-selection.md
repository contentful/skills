# SDK Selection

Use this guide to choose between the recommended `@contentful/optimization` SDKs and the legacy
`@ninetailed/experience.js` SDKs.

## Positioning

- `@contentful/optimization` is the **recommended default** for new personalization and analytics
  work. It has a modern, layered architecture (React Web, Next.js adapter, Web, Node, React Native)
  and is the platform's forward direction.
- `@ninetailed/experience.js` is the **legacy fallback**. It remains a fully supported, production-
  proven path and is the right choice for projects already built on it, or when a required
  integration exists only there.
- Do not tell customers the legacy SDKs are deprecated or obsolete. They still work and are widely
  deployed — they are simply no longer the default recommendation for new builds.

> [!IMPORTANT]
> `@contentful/optimization` is **pre-release (alpha)**; breaking changes can ship at any time.
> When you recommend it, pin exact versions, keep all `@contentful/optimization-*` packages on the
> same version, and apply stricter validation and rollout discipline than you would for a stable SDK.

## Quick Decision Table

| Scenario | Recommended SDK family | Why |
|---------|------------------------|-----|
| New / greenfield project | `@contentful/optimization` | Modern architecture and the platform's forward direction |
| New feature in a codebase **not** already using a personalization SDK | `@contentful/optimization` | Start on the recommended path |
| Next.js App Router build | `@contentful/optimization` | Dedicated `@contentful/optimization-nextjs` adapter (server + client + request-handler) |
| React app needing router page tracking | `@contentful/optimization` | Built-in router adapters and `OptimizedEntry` |
| Existing project already using Ninetailed packages | `@ninetailed/experience.js` | Keep the stack consistent; lowest migration risk |
| Change that must ship now and can't absorb alpha churn | `@ninetailed/experience.js` | Most production-proven path today |
| Requires a plugin/integration only Ninetailed has | `@ninetailed/experience.js` | Capability not yet in the new SDKs |

## Recommended SDKs: `@contentful/optimization`

- Rendering primitive: `<OptimizedEntry>` (React render prop)
- React entry point: `OptimizationRoot` (owns SDK lifecycle); `OptimizationProvider` to inject an instance
- Next.js: `@contentful/optimization-nextjs` (`/server`, `/client`, `/request-handler` subpaths)
- Server path: `@contentful/optimization-node` (stateless, `forRequest()`)
- Router tracking: subpath adapters — `@contentful/optimization-react-web/router/next-app`,
  `/router/next-pages`, `/router/react-router`, `/router/tanstack-router`
- Actions: `useOptimizationActions()`; SDK instance via `useOptimization()` (do not destructure)
- Consent: object-capable `consent({ events, persistence })` with blocked-event streams
- Anonymous cookie: `ctfl-opt-aid`, auto-migrated from `ntaid`
- Best fit: new builds and teams adopting the platform's forward direction

See `sdk-next-guide.md` for the full API and `package-versions.md` for package selection.

## Legacy SDKs: `@ninetailed/experience.js`

- Rendering primitive: `<Experience>`
- Provider pattern: `NinetailedProvider`
- Contentful helpers: `@ninetailed/experience.js-utils-contentful`
- Tracking model: plugins, `page()`, `track()`, `identify()`
- Anonymous cookie: `ntaid`
- Best fit: existing customer production setups

Recommended add-ons:

- `@ninetailed/experience.js-plugin-insights` for experiment and component measurement
- `@ninetailed/experience.js-plugin-ssr` for SSR or edge profile continuity
- `@ninetailed/experience.js-plugin-preview` for preview workflows

See `sdk-legacy-guide.md` for the full API.

## Architecture Guidance

Choose architecture before choosing package details. Both SDK families support all three.

| Architecture | Recommendation | Notes |
|-------------|----------------|-------|
| Client-only | Either family | Simplest option when first-response personalized HTML is not required |
| Hybrid SSR or edge plus client | Either family; prefer `@contentful/optimization` for new builds | Use server/edge preflight, then hydrate the client SDK |
| Server-only | Only when no client SDK is allowed | Weak fit for experiment reporting and component insights |

## Decision Rule

Use `@contentful/optimization` by default.

Move to `@ninetailed/experience.js` when one of these is true:

1. The project already uses `@ninetailed/experience.js` and you are extending it.
2. A required integration or plugin exists only in the legacy SDK.
3. The change must ship now and cannot absorb the new SDK's faster-moving, pre-release behavior.

## What to Communicate to Customers

- If you choose `@contentful/optimization`, frame it as the recommended, modern path — and state
  plainly that it is pre-release (alpha), so versions should be pinned and rollouts validated more
  strictly than usual.
- If you choose `@ninetailed/experience.js`, frame it as the stable, production-proven path that is
  best for existing setups — not as deprecated.

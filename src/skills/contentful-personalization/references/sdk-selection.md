# SDK Selection

Use this guide to decide whether a task should use `@contentful/optimization` or preserve an
existing `@ninetailed/experience.js` integration.

## Default Policy

- Use `@contentful/optimization` for every new personalization integration.
- Continue using `@contentful/optimization` when it is already installed.
- Use `@ninetailed/experience.js` guidance only when the repository already contains that SDK and
  the task is to diagnose, repair, or extend that deployment.
- Do not make migration a prerequisite for an urgent legacy fix or a scoped extension.
- When the user wants to modernize an existing legacy deployment, recommend
  `@contentful/optimization` and plan the migration explicitly.
- Never choose the legacy SDK for greenfield work because its examples are more familiar, a plugin
  exists, or a particular framework pattern was historically documented there.

Read the target project's installed packages and lockfile before giving version or migration
advice. Keep packages in the same dependency graph compatible; React Native can follow a different
release cadence from the Web, React, Next.js, and Node packages.

## Decision Table

| Project state and task                                          | SDK to use                  | Guidance                                                   |
| --------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------- |
| No personalization SDK installed                                | `@contentful/optimization`  | New integration; use the recommended SDK                   |
| Optimization packages already installed                         | `@contentful/optimization`  | Follow the matching runtime reference                      |
| Both SDK families; new work or no legacy target                 | `@contentful/optimization`  | Treat legacy code as a migration or compatibility boundary |
| Both SDK families; task targets the existing Ninetailed side    | `@ninetailed/experience.js` | Diagnose, repair, or extend only that legacy boundary      |
| Existing Ninetailed deployment has a bug                        | `@ninetailed/experience.js` | Diagnose and repair in place                               |
| Existing Ninetailed deployment needs a scoped feature           | `@ninetailed/experience.js` | Extend the established deployment consistently             |
| Existing Ninetailed deployment is intentionally being migrated  | `@contentful/optimization`  | Plan lifecycle, identity, consent, and tracking changes    |
| New app or independent integration beside an old Ninetailed app | `@contentful/optimization`  | Do not copy the legacy choice into new work                |
| React Native                                                    | `@contentful/optimization`  | Use the dedicated React Native package                     |

## Recommended SDK: `@contentful/optimization`

Pick the application-facing package by runtime:

- React Web: `@contentful/optimization-react-web`
- Next.js App Router or Pages Router: `@contentful/optimization-nextjs`
- Browser without React: `@contentful/optimization-web`
- Node.js and stateless server evaluation: `@contentful/optimization-node`
- React Native: `@contentful/optimization-react-native`

The integration model is runtime-specific:

- React Web uses `OptimizationRoot` or an explicitly owned instance with `OptimizationProvider`.
- Next.js uses the bound factory for its router; do not assemble it from generic client and server
  exports.
- Web and Node use `ContentfulOptimization`; Node creates request-scoped evaluation with
  `forRequest()`.
- React Native uses its asynchronous root or an explicitly owned mobile instance.

Load `optimization-shared.md` together with exactly the runtime references selected by
`optimization-overview.md`.

## Existing Legacy Deployments: `@ninetailed/experience.js`

Legacy references exist to support deployed systems that still use:

- `NinetailedProvider`
- `<Experience>` or `<Personalize>`
- `@ninetailed/experience.js-utils-contentful`
- insights, SSR, preview, privacy, or destination plugins
- the `ntaid` browser cookie and legacy page, track, or identify calls

For those systems, preserve compatible package majors and follow the project's established
provider, plugin, and rendering patterns. Load `sdk-legacy-guide.md` only when old packages or APIs
are present, or when the user explicitly asks about an existing legacy deployment.

Do not describe the legacy deployment as broken merely because it has not migrated. Fix or extend
it in place when that is the requested scope. A migration is a separate change because provider
lifecycle, consent, identity, persistence, rendering, and tracking contracts differ.

## Architecture Guidance

Choose architecture after selecting the SDK and runtime, from the project's real rendering model.

| Architecture                   | Default for new work                                    | Existing legacy deployment                               |
| ------------------------------ | ------------------------------------------------------- | -------------------------------------------------------- |
| Client-only                    | Use the matching Optimization browser or mobile runtime | Preserve the current provider and plugin pattern         |
| Hybrid SSR or edge plus client | Use the framework adapter or Node plus browser handoff  | Preserve and repair the established SSR continuity model |
| Server-only                    | Use Node only when no client runtime is allowed         | Keep only when the existing constraints require it       |

### The client-only tradeoff

Client-only evaluates personalization in the browser after hydration, so the page renders the
baseline (unpersonalized) content first and then swaps to the selected variant. The visitor sees
either a flash of baseline content or a hidden/skeleton slot until evaluation resolves. This matters
more for personalization than for a small A/B tweak, because the whole point is to show the right
content — and it is most visible above the fold.

### Prefer server-side where the framework and pipeline support it

Lean toward hybrid SSR (server preflight resolves the variant before markup is sent, then the client
hydrates and takes over) when both are true:

- the framework can render on the server (Next.js App or Pages Router, Remix), and
- the app already fetches content at the page or server level.

In that case hybrid SSR removes the baseline flash while preserving the cacheable/ISR HTML profile,
and the framework adapter handles the server-to-client handoff — so it is usually a small step, not
a rewrite.

Choose client-only when the framework is client-only (Gatsby, Create React App, Vite React, React
Native), when the app fetches only in the browser and the smaller change is preferred, or when the
personalized surface is below the fold or non-critical. Do not push a client-fetched app to convert
to SSR purely for this setup — recommend what fits the app today, name the flash tradeoff honestly,
and note that moving to a server-rendered fetch later is the path to eliminate it.

Server-only remains a weak fit when the product needs browser event collection, component
insights, or reliable experiment reporting.

## Communication Rule

Lead new work with `@contentful/optimization` without presenting both SDKs as equivalent choices.
Mention `@ninetailed/experience.js` only when the detected codebase or the user's maintenance task
makes it relevant.

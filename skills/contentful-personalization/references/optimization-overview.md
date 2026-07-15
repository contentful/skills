<!-- Agent context: Route modern @contentful/optimization work to the narrowest runtime reference. Load optimization-shared.md with that runtime file. -->

# Optimization SDK runtime router

Use this reference for the modern `@contentful/optimization-*` family. Keep the product-level
decision between modern and legacy SDKs in `sdk-selection.md`; this file describes the current modern
SDK surface.

## Choose the application-facing package

| Project runtime                   | Package                                 | Load next                             |
| --------------------------------- | --------------------------------------- | ------------------------------------- |
| React SPA or React browser app    | `@contentful/optimization-react-web`    | `optimization-react-web.md`           |
| Next.js App Router                | `@contentful/optimization-nextjs`       | `optimization-nextjs-app-router.md`   |
| Next.js Pages Router              | `@contentful/optimization-nextjs`       | `optimization-nextjs-pages-router.md` |
| Browser app without React         | `@contentful/optimization-web`          | `optimization-web.md`                 |
| Node.js server or server function | `@contentful/optimization-node`         | `optimization-node.md`                |
| React Native                      | `@contentful/optimization-react-native` | `optimization-react-native.md`        |

Always load `optimization-shared.md` with the selected runtime file.

Do not wire lower layers directly when an application-facing package exists:

- React Web wraps the browser Web SDK.
- Next.js composes the Node SDK on the server with React Web in the browser.
- `@contentful/optimization-core`, API client, and API schemas are lower-level building blocks, not
  the normal starting point for application code.
- The Web preview panel is a separate package:
  `@contentful/optimization-web-preview-panel`.

Native iOS and Android SDKs exist upstream, but this reference pack deliberately excludes them until
they have the same verified knowledge-base and blueprint coverage as the runtimes above.

## Detect the runtime before editing

Prefer repository evidence over the user's shorthand:

- `app/`, Server Components, route handlers, or `proxy.ts` indicate Next.js App Router.
- `pages/`, `_app.tsx`, or `getServerSideProps` indicate Next.js Pages Router.
- `react-router` or `@tanstack/react-router` without Next.js indicates React Web.
- `react-native` plus native platform directories or Metro indicates React Native.
- An imperative DOM app without React indicates Web.
- A request handler without a browser bundle indicates Node.

If both Next.js routers are present, determine which tree owns the personalized route. Do not mix
router-specific factories or bound components.

## Package boundaries that commonly drift

- App Router factory: `createNextjsAppRouterOptimization` from
  `@contentful/optimization-nextjs/app-router`.
- Pages Router client factory: `createNextjsPagesRouterOptimization` from
  `@contentful/optimization-nextjs/pages-router`.
- Pages Router server factory: the same name from
  `@contentful/optimization-nextjs/pages-router/server`.
- Router-neutral browser hooks are available from `@contentful/optimization-nextjs/client`.
- React bound actions are `setConsent`, `flushEvents`, `identifyUser`, `trackPageView`, `resetUser`,
  `trackScreen`, and `trackEvent`.
- Node events live on the request client returned by `forRequest()`, not on the process singleton.

## Version discipline

Read installed package versions from the target project and verify its lockfile before giving exact
upgrade commands. Keep related `@contentful/optimization-*` packages compatible; do not copy a
version from this reference into a project blindly. React Native may use a different prerelease
cadence from the Web, React, Next.js, and Node packages.

## Implementation order

For a new integration:

1. Confirm runtime, router, locale, and Contentful client ownership.
2. Install the application-facing package and required peers.
3. Create exactly one runtime root or process singleton.
4. Connect application consent and identity policy.
5. Emit the runtime's initial page or screen evaluation.
6. Fetch and resolve one entry, preserving baseline fallback.
7. Add route, interaction, preview, live-update, and analytics features only when required.
8. Verify accepted events, profile continuity, selected optimization state, and baseline behavior.

## Migration guardrail

Do not mechanically rename legacy `@ninetailed/*` imports. Provider lifecycle, consent, identity,
entry rendering, router integration, and server state ownership differ. First classify the current
architecture, then replace one lifecycle boundary at a time using the selected runtime reference.

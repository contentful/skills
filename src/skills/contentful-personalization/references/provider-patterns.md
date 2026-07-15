# Provider Patterns

Use these patterns to avoid scope and hydration problems.

## Placement Rules

- Put the provider as high in the tree as the personalization scope requires.
- Keep the first render deterministic between server and client.
- Keep provider initialization stable across navigation.
- Avoid wrapping only a subset of pages unless that is intentional.

## Recommended SDKs: `@contentful/optimization`

The lifecycle boundary is runtime-specific. Do not treat every Optimization integration as a client-only
React provider:

- React Web mounts one `OptimizationRoot` and one router tracker around the browser tree.
- Next.js App Router creates bound components with `createNextjsAppRouterOptimization` from
  `@contentful/optimization-nextjs/app-router`; the bound `OptimizationRoot` owns server evaluation
  and browser takeover.
- Next.js Pages Router creates separate client and server bindings with
  `createNextjsPagesRouterOptimization` from `/pages-router` and `/pages-router/server`.
- Web and Node create imperative `ContentfulOptimization` singletons; Node calls `forRequest()` for
  each request.
- React Native mounts one asynchronous `OptimizationRoot` or injects an explicitly owned instance.

For exact provider or factory code, use the matching `optimization-<runtime>.md` reference together
with `optimization-shared.md`. Keep one root/factory, one initial page or screen owner, and one clear
manual-or-managed entry boundary.

## Existing legacy deployments: `@ninetailed/experience.js`

Use the following patterns only when the repository already uses the Ninetailed SDK and the task is
to diagnose, repair, or extend that deployment.

### Next.js Pages Router

Recommended pattern:

1. Put `NinetailedProvider` in `pages/_app.tsx`.
2. Add only the plugins the project actually needs.
3. Let the Next.js Pages Router integration handle route-change page tracking.
4. Do not add duplicate `page()` calls for navigation events.

Typical plugin choices:

- `NinetailedInsightsPlugin` for measurement
- `NinetailedSsrPlugin` for SSR or edge profile continuity
- `NinetailedPreviewPlugin` only for preview or development workflows

Example shape:

```tsx
<NinetailedProvider
  clientId={process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID ?? ''}
  environment={process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT ?? 'main'}
  plugins={[
    new NinetailedInsightsPlugin(),
    ...(preview
      ? [
          new NinetailedPreviewPlugin({
            experiences: pageProps.ninetailed?.preview?.experiences ?? [],
            audiences: pageProps.ninetailed?.preview?.audiences ?? [],
          }),
        ]
      : []),
  ]}
>
  <Component {...pageProps} />
</NinetailedProvider>
```

### Next.js App Router

Recommended pattern:

1. Keep root layout server-first where possible.
2. Put `NinetailedProvider` initialization in a dedicated client wrapper component.
3. Add a dedicated client-side page tracker because the current SDKs do not auto-track App Router
   navigation.
4. Keep the provider high enough that all personalizable entries are wrapped.

Example shape:

```tsx
import { NinetailedProvider } from '@ninetailed/experience.js-next';
import { NinetailedInsightsPlugin } from '@ninetailed/experience.js-plugin-insights';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NinetailedProvider
          clientId={process.env.NEXT_PUBLIC_NINETAILED_API_KEY!}
          environment={process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT}
          plugins={[new NinetailedInsightsPlugin()]}
        >
          {children}
        </NinetailedProvider>
      </body>
    </html>
  );
}
```

Checklist:

- Provider is high enough to cover all personalizable components.
- Server/client boundaries are explicit.
- App Router navigation triggers exactly one `page()` call.
- Initial render is deterministic between server and client.

Use a dedicated tracker component for App Router navigation rather than scattering `page()` calls
across many routes.

## Hydration Safety Rules

- Do not render the personalized variant on the server and the baseline on the client for the same
  first paint.
- Avoid non-deterministic branching during initial render.
- Keep initial data contracts consistent for baseline and variant props.
- If an SSR or edge setup passes selected experiences/optimizations to the client, make that handoff
  deterministic and inspectable.

## Common Issues

- Provider placed too deep in the tree (must wrap all personalized content).
- Missing `clientId` prop (API key not passed or env var undefined).
- `@contentful/optimization`: destructuring methods off `useOptimization()` instead of using
  `useOptimizationActions()` (loses the instance binding).
- `@ninetailed/experience.js`: empty `plugins` array when analytics is expected; using `apiKey`
  instead of `clientId` on older SDK versions.
- Provider rendered only on some pages instead of globally.

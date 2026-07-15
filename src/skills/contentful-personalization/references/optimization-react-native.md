<!-- Agent context: Current React Native integration contract for @contentful/optimization-react-native. Load optimization-shared.md first. -->

# Optimization SDK: React Native

Use native screen, tap, and viewport terminology. Do not transplant Web page, click, hover, cookie,
or DOM behavior into this runtime.

## Install and build

```bash
pnpm add @contentful/optimization-react-native \
  @react-native-async-storage/async-storage \
  contentful
```

AsyncStorage is required. NetInfo is optional and enables offline detection. Clipboard and safe-area
context are optional until the preview panel is used. Rebuild the native application after adding
native peers; Expo Go cannot host the preview panel's native modules, so Expo projects need a custom
development build.

## Mount one root

```tsx
import { OptimizationRoot } from '@contentful/optimization-react-native';
import { createClient } from 'contentful';

const contentfulClient = createClient({
  space: process.env.EXPO_PUBLIC_CONTENTFUL_SPACE_ID!,
  accessToken: process.env.EXPO_PUBLIC_CONTENTFUL_DELIVERY_TOKEN!,
});

export function AppRoot() {
  return (
    <OptimizationRoot
      clientId={process.env.EXPO_PUBLIC_CONTENTFUL_OPTIMIZATION_CLIENT_ID!}
      environment="main"
      locale="en-US"
      defaults={{ consent: true }}
      contentful={{ client: contentfulClient }}
    >
      <App />
    </OptimizationRoot>
  );
}
```

`OptimizationRoot` initializes asynchronously and withholds its children while an owned instance is
loading. The SDK allows one active instance. Use `ContentfulOptimization.create(config)` plus
`<OptimizationProvider sdk={sdk}>` only when application or test code must own the instance; the
owner must then call `destroy()`.

Replace the quick-start consent default with application policy. The React Native default
pre-consent allow-list admits `identify` and `screen`; entry views, taps, page events, and custom
events remain blocked until allowed.

## Render one optimized entry

Managed path:

```tsx
import { OptimizedEntry } from '@contentful/optimization-react-native';

<OptimizedEntry
  entryId="hero-entry-id"
  loadingFallback={<LoadingHero />}
  errorFallback={(error) => <HeroError error={error} />}
>
  {(entry) => <Hero entry={entry as HeroEntry} />}
</OptimizedEntry>;
```

Manual path:

```tsx
<OptimizedEntry baselineEntry={entry}>
  {(resolvedEntry, metadata) => (
    <Hero entry={resolvedEntry as HeroEntry} experienceId={metadata.selectedOptimization?.experienceId} />
  )}
</OptimizedEntry>
```

Pass `baselineEntry` or `entryId`, never both. Managed loading and fetch errors are distinct from a
valid baseline resolution. Static children are supported for tracking-only wrappers but cannot
receive variant data.

## Track screens through one path

For a simple screen:

```tsx
import { useScreenTracking } from '@contentful/optimization-react-native';

function ProductScreen() {
  useScreenTracking({ name: 'Product' });
  return <Product />;
}
```

For React Navigation, use `OptimizationNavigationContainer` and pass its render-prop `ref`,
`onReady`, and `onStateChange` to the navigation container. Do not also mount per-screen automatic
tracking for the same route. Automatic screen tracking deduplicates the current route; the callback
and returned imperative `trackScreen()` emit directly.

## Track entry views and taps

`OptimizedEntry` enables viewport views and taps by default. It renders a `View` with layout and
touch handlers around resolved content. Configure globally:

```tsx
<OptimizationRoot {...config} trackEntryInteraction={{ views: true, taps: true }}>
  <App />
</OptimizationRoot>
```

Use `trackViews`, `trackTaps`, and `onTap` per entry. Wrap scrollable personalized content in
`OptimizationScrollProvider` so visibility uses the real scroll viewport. Default view thresholds
are 80% visible for two seconds, followed by five-second duration updates. Tap recognition requires
less than ten points of movement, so scrolling is not counted as a tap.

## Identity, consent, and persistence

Access the initialized SDK through `useOptimization()`:

```tsx
const sdk = useOptimization();

await sdk.identify({ userId: user.id, traits: { plan: user.plan } });
sdk.consent({ events: true, persistence: true });
sdk.reset();
```

React Native stores consent state in AsyncStorage. Profile, changes, selections, and the anonymous
ID are stored only when persistence consent is true. Event queues are in memory and do not survive a
process restart. `reset()` clears profile continuity and screen deduplication, but application-owned
authentication and consent records remain application responsibilities.

React Native uses AsyncStorage keys, not the browser `ctfl-opt-aid` cookie. There is no built-in
cross-platform cookie handoff.

## Live updates, offline behavior, and preview

- Live entry re-resolution is off by default. Enable it at the root or per entry. A visible preview
  panel forces live updates while open.
- Install `@react-native-community/netinfo` to gate event flushing on connectivity. Without it,
  offline detection is disabled. Replay remains in-memory only.
- On background or inactive app state, the SDK flushes events and pending AsyncStorage writes.
- Import `PreviewPanelOverlay` from `@contentful/optimization-react-native/preview`, supply the
  application Contentful client, and render it inside `OptimizationRoot` or inside both
  `OptimizationProvider` and `LiveUpdatesProvider`.
- For Android emulators, rewrite application-configured localhost API hosts to `10.0.2.2`; the SDK
  does not do this automatically.

## Verify and debug

- Confirm native peers were installed and the app was rebuilt.
- Confirm there is one active SDK instance and account for asynchronous provider readiness.
- Confirm exactly one screen-tracking path owns each route.
- Confirm the Contentful payload has one locale and resolved links.
- Distinguish managed-fetch errors from valid baseline fallback.
- For missing views, check consent, a current profile, scroll context, visibility ratio, and dwell
  time.
- For missing taps, check consent, per-entry opt-outs, and gesture movement.
- For preview failures, check the custom native build and optional clipboard/safe-area peers.
- For offline failures, check NetInfo presence and remember queues do not survive restart.

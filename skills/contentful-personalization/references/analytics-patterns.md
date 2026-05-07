# Analytics Configuration Patterns

## Optimization SDK (`@contentful/optimization-*`)

```tsx
import { OptimizationRoot } from '@contentful/optimization-react-web';
import { NextAppAutoPageTracker } from '@contentful/optimization-react-web/router/next-app';

<OptimizationRoot
  clientId={process.env.NEXT_PUBLIC_CONTENTFUL_OPTIMIZATION_CLIENT_ID ?? ''}
  environment={process.env.NEXT_PUBLIC_CONTENTFUL_OPTIMIZATION_ENVIRONMENT ?? 'main'}
  autoTrackEntryInteraction={{ views: true, clicks: true, hovers: true }}
>
  <NextAppAutoPageTracker />
  {children}
</OptimizationRoot>
```

Use `sdk.track(...)`, `sdk.identify(...)`, and router trackers for page events. For view/click/hover
events, ensure rendered elements include `data-ctfl-entry-id`.

## Legacy Ninetailed SDK

## Insights Plugin (built-in dashboard)

```tsx
import { NinetailedInsightsPlugin } from '@ninetailed/experience.js-plugin-insights';

<NinetailedProvider
  clientId={apiKey}
  plugins={[new NinetailedInsightsPlugin()]}
>
```

## Google Tag Manager Plugin

```tsx
import { NinetailedGoogleTagmanagerPlugin } from '@ninetailed/experience.js-plugin-google-tagmanager';

<NinetailedProvider
  clientId={apiKey}
  plugins={[
    new NinetailedInsightsPlugin(),
    new NinetailedGoogleTagmanagerPlugin({
      gtmId: process.env.NEXT_PUBLIC_GTM_ID,
    }),
  ]}
>
```

## Segment Plugin

```tsx
import { NinetailedSegmentPlugin } from '@ninetailed/experience.js-plugin-segment';

plugins={[new NinetailedSegmentPlugin()]}
```

## Event Tracking

The SDK automatically tracks:
- `page` — page views
- `track` — component impressions for experiences
- `identify` — profile identification

Custom tracking:
```tsx
import { useNinetailed } from '@ninetailed/experience.js-next';

const { track, identify, page } = useNinetailed();
track('button_click', { label: 'CTA' });
```

## Common Issues

- Plugin instantiated but not added to the `plugins` array in NinetailedProvider
- GTM plugin configured but GTM script not loaded on the page
- Analytics events not firing due to ad blockers (expected, not a bug)
- Missing Insights plugin means no data in the Ninetailed dashboard

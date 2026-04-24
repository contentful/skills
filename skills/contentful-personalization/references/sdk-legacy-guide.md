<!-- Agent context: Use this knowledge to reason about customer setups using the legacy Ninetailed SDK. Do not share infrastructure internals, Worker names, or backend architecture in responses. -->

# Legacy SDK Reference: @ninetailed/experience.js

Complete API reference for the Ninetailed legacy SDK packages.

---

## Table of Contents

1. [Package Ecosystem](#1-package-ecosystem)
2. [Core SDK](#2-core-sdk)
3. [React SDK](#3-react-sdk)
4. [Next.js SDK](#4-nextjs-sdk)
5. [Shared SDK and API Client](#5-shared-sdk-and-api-client)
6. [Contentful Utils](#6-contentful-utils)
7. [Plugins](#7-plugins)
8. [Type Definitions](#8-type-definitions)

---

## 1. Package Ecosystem

| Package | Purpose |
|---------|---------|
| `@ninetailed/experience.js` | Core SDK (browser) |
| `@ninetailed/experience.js-react` | React bindings (Provider, hooks, components) |
| `@ninetailed/experience.js-next` | Next.js integration (auto page tracking, re-exports React + SSR) |
| `@ninetailed/experience.js-shared` | Shared types, NinetailedApiClient, event builders |
| `@ninetailed/experience.js-utils-contentful` | ExperienceMapper, AudienceMapper for Contentful REST API |
| `@ninetailed/experience.js-node` | Server-side Node.js SDK |
| `@ninetailed/experience.js-plugin-insights` | Component view/click/hover tracking via Beacon API |
| `@ninetailed/experience.js-plugin-preview` | Preview editor UI widget |
| `@ninetailed/experience.js-plugin-ssr` | SSR/ESR support (cookie-based anonymous ID persistence) |
| `@ninetailed/experience.js-plugin-privacy` | Consent management / GDPR event filtering |
| `@ninetailed/experience.js-plugin-segment` | Segment CDP integration |
| `@ninetailed/experience.js-plugin-google-tagmanager` | GTM data layer integration |
| `@ninetailed/experience.js-plugin-google-analytics` | Google Analytics (gtag) integration |
| `@ninetailed/experience.js-plugin-contentsquare` | Contentsquare integration |

---

## 2. Core SDK

### Constructor

```typescript
import { Ninetailed } from '@ninetailed/experience.js';

const ninetailed = new Ninetailed(
  // First argument: NinetailedApiClientOptions OR NinetailedApiClient instance
  {
    clientId: string,           // Required: API key
    environment?: string,       // Default: 'main'
    preview?: boolean,          // Enable preview mode
  },
  // Second argument: Options
  {
    url?: string,                              // Override API base URL
    locale?: Locale,                           // Language locale string
    plugins?: (NinetailedPlugin | NinetailedPlugin[])[], // Plugins (nested arrays flattened)
    requestTimeout?: number,                   // Timeout for API requests
    onLog?: OnLogHandler,                      // Custom log handler
    onError?: OnErrorHandler,                  // Custom error handler
    componentViewTrackingThreshold?: number,   // Default: 2000 (ms)
    componentHoverTrackingThreshold?: number,  // Default: 2000 (ms)
    onInitProfileId?: OnInitProfileId,         // Callback when profile ID is first initialized
    buildClientContext?: () => NinetailedRequestContext, // Custom context builder
    storageImpl?: Storage,                     // Custom storage ({ getItem, setItem, removeItem })
  }
);
```

### Public Methods

#### `page(data?, options?): Promise<FlushResult>`

Sends a pageview event. Waits for SDK initialization, then fires through the analytics instance and flushes.

```typescript
await ninetailed.page({ url: '/some-page', title: 'My Page' });
```

#### `track(event, properties?, options?): Promise<FlushResult>`

Sends a custom tracking event.

```typescript
await ninetailed.track('button_click', { buttonId: 'cta-hero' });
```

#### `identify(uid, traits?, options?): Promise<FlushResult>`

Identifies a user by ID and optional traits. If `uid` is empty string, applies traits without triggering a merge.

```typescript
await ninetailed.identify('user-123', { plan: 'enterprise', role: 'admin' });
```

#### `batch(events: Event[]): Promise<FlushResult>`

Sends multiple events at once.

```typescript
await ninetailed.batch([
  { type: 'page', properties: {} },
  { type: 'track', event: 'signup', properties: {} },
]);
```

#### `reset(): Promise<void>`

Resets the SDK state (clears profile, cookies, etc.).

#### `debug(enabled: boolean): Promise<void>`

Enables or disables debug mode.

#### `onProfileChange(cb: OnProfileChangeCallback): DetachListeners`

Subscribes to profile state changes. The callback is called immediately with the current state, then on every subsequent change. Returns an unsubscribe function.

```typescript
const unsubscribe = ninetailed.onProfileChange((profileState) => {
  if (profileState.status === 'success') {
    console.log('Profile:', profileState.profile);
    console.log('Experiences:', profileState.experiences);
  }
});
```

#### `onSelectVariant({ baseline, experiences }, cb): () => void`

Core method for experience resolution. Given a baseline and array of experiences, subscribes to profile changes and calls `cb` with the resolved variant. This is what powers the `<Experience>` component.

The callback receives:
- `status: 'loading' | 'success' | 'error'`
- `loading: boolean`
- `hasVariants: boolean`
- `baseline`, `experience`, `variant`, `variantIndex`
- `audience: { id: string } | null`
- `isPersonalized: boolean`
- `profile: Profile | null`
- `error: Error | null`

#### `observeElement(payload, options?): void`

Registers an element for intersection observation (view tracking), click tracking, and hover tracking.

```typescript
// ObserveOptions:
{ delay?: number, trackClicks?: boolean, trackHovers?: boolean }
```

#### `unobserveElement(element: Element): void`

Stops observing an element.

### ProfileState Type

```typescript
type ProfileState =
  | { status: 'loading'; profile: null; experiences: null; changes: null; error: null; from: 'api' | 'hydrated' }
  | { status: 'success'; profile: Profile; experiences: SelectedVariantInfo[]; changes: Change[]; error: null; from: 'api' | 'hydrated' }
  | { status: 'error'; profile: Profile | null; experiences: SelectedVariantInfo[] | null; changes: Change[] | null; error: Error; from: 'api' | 'hydrated' };
```

### Window Global

The SDK attaches to `window.ninetailed` with:
- `page()`, `track()`, `identify()`, `reset()`, `debug()` -- non-async wrappers
- `profile` -- current profile object
- `experiences` -- current experience selections

---

## 3. React SDK

**Package:** `@ninetailed/experience.js-react`

### NinetailedProvider

Creates a `Ninetailed` instance (or accepts a pre-created one) and puts it in React context.

```typescript
// Instantiation mode (creates Ninetailed internally)
type NinetailedProviderInstantiationProps = {
  clientId: string;
  environment?: string;
  preview?: boolean;
  url?: string;
  plugins?: (NinetailedPlugin | NinetailedPlugin[])[];
  locale?: Locale;
  requestTimeout?: number;
  onLog?: OnLogHandler;
  onError?: OnErrorHandler;
  componentViewTrackingThreshold?: number;
  componentHoverTrackingThreshold?: number;
  buildClientContext?: () => NinetailedRequestContext;
  onInitProfileId?: OnInitProfileId;
  storageImpl?: Storage;
};

// Instance mode (pass a pre-created Ninetailed)
type NinetailedProviderProps =
  | NinetailedProviderInstantiationProps
  | { ninetailed: Ninetailed };
```

### Hooks

#### `useNinetailed(): NinetailedInstance`

Returns the `NinetailedInstance` from context. Throws if used outside `NinetailedProvider`. Provides access to all core SDK methods.

```typescript
const { track, identify, page, reset, debug, profileState } = useNinetailed();
```

#### `useProfile(): UseProfileHookResult`

Returns the current profile state with the `experiences` property stripped (to prevent unnecessary re-renders).

```typescript
type UseProfileHookResult = Omit<ProfileState, 'experiences'> & {
  loading: boolean;  // true when status === 'loading'
};
```

```typescript
const { profile, loading, status, error } = useProfile();
if (loading) return <Spinner />;
console.log(profile.traits, profile.location, profile.audiences);
```

#### `useExperience({ baseline, experiences }): UseExperienceReturn`

The hook that powers the `<Experience>` component.

```typescript
const {
  status, hasVariants, experience, variant, variantIndex,
  audience, isPersonalized, profile, error
} = useExperience({ baseline, experiences });
```

Return type is a discriminated union by status: `'loading' | 'success' | 'error'`.

#### `useFlag(flagKey, defaultValue, options?): FlagResult`

Accesses a Ninetailed variable (feature flag) with built-in auto-tracking.

```typescript
type FlagResult<T> =
  | { status: 'loading'; value: T; error: null }
  | { status: 'success'; value: T; error: null }
  | { status: 'error'; value: T; error: Error };

type UseFlagOptions = {
  shouldAutoTrack?: boolean | (() => boolean);  // default: true
};
```

```typescript
const { status, value, error } = useFlag('banner-text', 'default text');
const { value: config } = useFlag<{ padding: string; color: string }>(
  'hero-config',
  { padding: '10px', color: 'blue' }
);
```

#### `useFlagWithManualTracking(flagKey, defaultValue): [FlagResult, () => void]`

Same as `useFlag` but returns a tuple with the flag result and a manual track function. Useful when you want to control exactly when the impression is tracked.

```typescript
const [flag, track] = useFlagWithManualTracking<{
  padding: string;
  color: string;
}>('testing-component-tracking', { padding: '10px', color: 'blue' });

const handleClick = () => {
  track();
  // ... user interaction
};
```

#### `usePersonalize(baseline, variants, options?): SelectVariantResult`

Selects a variant for simple (non-experience-based) personalization.

```typescript
const { loading, variant, isPersonalized, audience } = usePersonalize(
  baseline,
  variants,
  { holdout: -1 }  // holdout percentage (-1 = disabled)
);
```

### Components

#### `<Experience>`

The primary personalization component. Resolves which variant to show based on experience configuration and the current profile.

```typescript
type ExperienceProps<P, PassThroughProps, Variant> = {
  id: string;                                           // Required: baseline entry ID
  experiences: ExperienceConfiguration<Variant>[];      // Mapped experiences
  component: ComponentType<P>;                          // The component to render
  loadingComponent?: ExperienceLoadingComponent;        // Custom loading component
  passthroughProps?: PassThroughProps;                   // Props passed regardless of variant
  trackClicks?: boolean;                                // Enable click tracking
  trackHovers?: boolean;                                // Enable hover tracking
  // ...all other baseline props spread
};
```

Behavior:
1. If no variants exist, renders the baseline directly
2. While loading, renders `LoadingComponent` (default hides baseline with `visibility: hidden`)
3. If the selected variant has `hidden: true`, renders only a tracking marker
4. Otherwise renders the selected variant with `ninetailed` prop: `{ isPersonalized, audience: { id } }`

```typescript
<Experience
  {...entry.fields}
  id={entry.sys.id}
  component={ComponentRenderer}
  experiences={mappedExperiences}
  trackClicks
  trackHovers
  loadingComponent={ESRLoadingComponent}
/>
```

#### `<ESRLoadingComponent>`

Loading component for Edge-Side Rendering. Reads the `experienceVariantsMap` from `ESRContext` and renders the pre-resolved variant immediately (no flicker).

```typescript
type ESRProviderProps = {
  experienceVariantsMap: Record<string, number>;  // experienceId -> variantIndex
};
```

#### `<Personalize>`

A simplified personalization component (legacy data model).

```typescript
type PersonalizeProps<P> = P & {
  id: string;
  variants?: Variant<P>[];
  component: PersonalizedComponent<P>;
  loadingComponent?: React.ComponentType;
  holdout?: number;   // default: -1
};
```

#### `<MergeTag>`

Renders a profile trait value inline.

```typescript
type MergeTagProps = {
  id: string;         // Trait path (e.g. 'traits_company' or 'location_city')
  fallback?: string;  // Fallback value if trait not found
};
```

The `id` uses underscores that are converted to nested dot paths. For example `traits_company_name` tries selectors like `traits.company_name`, `traits.company.name`, etc.

```typescript
<MergeTag id="traits_firstName" fallback="there" />
// Renders: profile.traits.firstName or "there"
```

#### `<EntryAnalytics>`

Wraps `<Experience>` with an empty `experiences` array. Useful for tracking views/clicks on entries without any personalization.

```typescript
<EntryAnalytics
  {...entry}
  id={entry.id}
  component={MyComponent}
  trackClicks
/>
```

### Variant Type

```typescript
type Variant<P = unknown> = P & {
  id: string;
  audience: { id: string };
};
```

---

## 4. Next.js SDK

**Package:** `@ninetailed/experience.js-next`

Re-exports everything from `@ninetailed/experience.js-react` and `@ninetailed/experience.js-plugin-ssr`, then adds Next.js-specific features.

### NinetailedProvider (Next.js version)

Wraps the React `NinetailedProvider` and adds a `<Tracker />` component for automatic page tracking on route changes.

```typescript
type NextNinetailedProviderProps = NinetailedProviderProps & {
  onRouteChange?: OnRouteChange;
};

type OnRouteChange = (
  routeInfo: { isInitialRoute: boolean },
  ninetailed: NinetailedInstance
) => void;
```

If `onRouteChange` is provided, it replaces the default `ninetailed.page()` call on route changes.

### Tracker Component

Listens to Next.js router events (`routeChangeComplete`) and automatically calls `ninetailed.page()` on each page navigation. Deduplicates calls. Fires on initial mount and on each subsequent route change.

### `decodeExperienceVariantsMap(encoded: string): Record<string, number>`

Decodes a comma-separated string of `experienceId=variantIndex` pairs. Used in ESR patterns where the edge worker encodes variant selections in the URL.

```typescript
// Input: "expId1=1,expId2=2"
// Output: { expId1: 1, expId2: 2 }
decodeExperienceVariantsMap('expId1=1,expId2=2');
```

---

## 5. Shared SDK and API Client

**Package:** `@ninetailed/experience.js-shared`

### NinetailedApiClient

HTTP client for the Ninetailed Experience API.

```typescript
const apiClient = new NinetailedApiClient({
  clientId: string,
  environment?: string,     // Default: 'main'
  url?: string,             // Override base URL
  fetchImpl?: FetchImpl,    // Custom fetch for non-browser environments
});
```

#### Methods

| Method | Description |
|--------|-------------|
| `createProfile({ events }, options?)` | Creates a new profile |
| `updateProfile({ profileId, events }, options?)` | Updates an existing profile |
| `upsertProfile({ profileId?, events }, options?)` | Create or update based on whether ID is present |
| `getProfile(id, options?)` | Retrieve a profile by ID |
| `upsertManyProfiles({ events }, options?)` | Batch upserts (each event needs `anonymousId`) |

All return `Promise<ProfileWithSelectedVariants>`.

#### Request Options

```typescript
type RequestOptions = {
  timeout?: number;               // Default: 3000ms
  preflight?: boolean;            // ESR/SSR mode: evaluate but don't persist
  locale?: string;
  ip?: string;                    // Override IP for server-side calls
  plainText?: boolean;            // Default: true. Avoids CORS preflight
  retries?: number;               // Default: 1. Only retries 503s
  minRetryTimeout?: number;       // Default: 0ms
  enabledFeatures?: Feature[];    // 'ip-enrichment' | 'location'
};
```

### Event Builder Functions

```typescript
import { buildPageEvent, buildTrackEvent, buildIdentifyEvent } from '@ninetailed/experience.js-shared';

buildPageEvent({ messageId, timestamp, ctx, location?, properties });
buildTrackEvent({ messageId, timestamp, ctx, location?, event, properties });
buildIdentifyEvent({ messageId, timestamp, ctx, location?, userId, traits });
```

The `ctx` parameter:

```typescript
{
  url: string;
  referrer: string;
  locale: string;
  userAgent: string;
  document?: { title: string };
}
```

### Key Type Definitions

#### Profile

```typescript
type Profile = {
  id: string;
  stableId: string;
  random: number;               // 0-1, used for traffic allocation
  audiences: string[];          // Array of matched audience IDs
  traits: Traits;               // JSON object of user traits
  location: GeoLocation;
  session: SessionStatistics;
};
```

#### GeoLocation

```typescript
type GeoLocation = {
  coordinates?: { latitude: number; longitude: number };
  city?: string;
  postalCode?: string;
  region?: string;
  regionCode?: string;
  country?: string;
  countryCode?: Alpha2Code;
  continent?: string;
  timezone?: string;
};
```

#### ExperienceConfiguration

```typescript
type ExperienceConfiguration<Variant extends Reference = Reference> = {
  id: string;
  type: 'nt_personalization' | 'nt_experiment';
  name?: string;
  description?: string;
  audience?: { id: string; name?: string; description?: string };
  trafficAllocation: number;
  distribution: Distribution[];
  sticky?: boolean;
  components: (EntryReplacement<Variant> | InlineVariable)[];
};
```

#### SelectedVariantInfo

```typescript
type SelectedVariantInfo = {
  experienceId: string;
  variantIndex: number;
  variants: Record<string, string>;
  sticky: boolean;
};
```

#### Change

```typescript
type Change = {
  type: 'Variable';
  key: string;
  value: string | boolean | number | JsonObject;
  meta: { experienceId: string; variantIndex: number };
};
```

---

## 6. Contentful Utils

**Package:** `@ninetailed/experience.js-utils-contentful`

For use with the Contentful REST APIs (Content Delivery API and Content Preview API). For GraphQL, use `@ninetailed/experience.js-utils` instead.

### ExperienceMapper

#### `ExperienceMapper.isExperienceEntry(entry): boolean`

Type guard that validates whether a Contentful entry is a valid experience entry using Zod schema validation. Use with `.filter()`.

#### `ExperienceMapper.mapExperience(entry): ExperienceConfiguration`

Maps a Contentful experience entry to SDK format. Each variant gets `{ ...variant, id: variant.sys.id }`.

#### `ExperienceMapper.mapCustomExperience(entry, mapFn): ExperienceConfiguration`

Like `mapExperience` but accepts a custom variant mapping function.

```typescript
ExperienceMapper.mapCustomExperience(ctfExperience, (variant) => ({
  id: variant.sys.id,
  ...variant.fields,
}));
```

#### `ExperienceMapper.mapCustomExperienceAsync(entry, mapFn): Promise<ExperienceConfiguration>`

Async version. Available in SDK >= 7.7.x.

#### `ExperienceMapper.isExperiment(entry): boolean`

Type guard for experiment entries specifically.

#### `ExperienceMapper.mapExperiment(entry): ExperienceConfiguration`

Maps an experiment entry. Variants are mapped to empty `{ id: '' }`.

#### `ExperienceMapper.mapBaselineWithExperiences(entry): ExperienceConfiguration[]`

Convenience method that takes an entry with `nt_experiences` field, filters valid experiences, and maps them all.

```typescript
const experiences = ExperienceMapper.mapBaselineWithExperiences(heroEntry);
```

### AudienceMapper

#### `AudienceMapper.isAudienceEntry(entry): boolean`

Type guard validating a Contentful entry as a valid audience entry.

#### `AudienceMapper.mapAudience(audience): Audience`

Maps to `{ id, name, description }`.

### Standard Usage Pattern

```typescript
import { ExperienceMapper } from '@ninetailed/experience.js-utils-contentful';

const experiences = (entry.fields.nt_experiences || [])
  .filter(ExperienceMapper.isExperienceEntry)
  .map(ExperienceMapper.mapExperience);
```

---

## 7. Plugins

### NinetailedInsightsPlugin

**Package:** `@ninetailed/experience.js-plugin-insights`

Tracks component views, clicks, and hovers. Sends batched events to the Insights API via Beacon API on page hide.

```typescript
new NinetailedInsightsPlugin({ url?: string })
```

- Tracks view events with view duration deduplication
- Tracks click and hover events
- On page hidden: flushes all pending events using Beacon API
- **Always include this plugin** if you want the built-in analytics dashboard to show component-level metrics

### NinetailedPreviewPlugin

**Package:** `@ninetailed/experience.js-plugin-preview`

Renders a preview widget UI for content editors to view/toggle audiences and force specific experience variants.

```typescript
new NinetailedPreviewPlugin({
  experiences: ExperienceConfiguration[],           // All available experiences
  audiences: ExposedAudienceDefinition[],          // All available audiences
  onOpenExperienceEditor?: (experience) => void,   // Callback to open experience editor
  onOpenAudienceEditor?: (audience) => void,       // Callback to open audience editor
  url?: string,                                     // Preview bridge URL override
  nonce?: string,                                   // CSP nonce for script/style injection
  ui?: { opener: { hide: boolean } },              // Widget UI options
})
```

Key methods exposed via `window.ninetailed.plugins.preview`:
- `open()`, `close()`, `toggle()` -- widget visibility
- `activateAudience(id)`, `deactivateAudience(id)`, `resetAudience(id)`
- `setExperienceVariant({ experienceId, variantIndex })`
- `resetExperience(experienceId)`
- `reset()` -- full SDK reset

**When to use:** Include during development and preview modes. Pass all experiences and audiences. Does NOT auto-disable in production -- conditionally instantiate.

```typescript
const preview = process.env.NODE_ENV !== 'production';
plugins={[
  ...(preview ? [new NinetailedPreviewPlugin({ ... })] : []),
]}
```

### NinetailedSsrPlugin

**Package:** `@ninetailed/experience.js-plugin-ssr`

Persists the Ninetailed anonymous ID in a cookie so that server-side/edge rendering can read the same profile ID.

```typescript
new NinetailedSsrPlugin({
  cookie?: {
    domain?: string,      // Cookie domain
    expires?: number,     // Days until expiry (default: 365)
  }
})
```

Behavior:
- On `initialize`: reads cookie value and sets it as the analytics anonymous ID
- On `PROFILE_CHANGE`: writes the profile ID to the cookie
- On `PROFILE_RESET`: removes the cookie

**When to use:** Required for ESR patterns and any SSR scenario where the profile ID needs to persist across server and client.

### NinetailedPrivacyPlugin

**Package:** `@ninetailed/experience.js-plugin-privacy`

Manages consent and controls which events/properties are sent.

```typescript
new NinetailedPrivacyPlugin(
  config?: Partial<PrivacyConfig>,              // Config when consent NOT given
  acceptedConsentConfig?: Partial<PrivacyConfig> // Config when consent IS given (SDK >= 7.7)
)
```

```typescript
type PrivacyConfig = {
  allowedEvents: EventType[];                  // Default no-consent: ['page']
  allowedPageEventProperties: string[];        // Default: ['*']
  allowedTrackEvents: string[];                // Default: []
  allowedTrackEventProperties: string[];       // Default: []
  allowedTraits: string[];                     // Default: []
  blockProfileMerging: boolean;                // Default: true
  enabledFeatures: Feature[];                  // Default: []
};
```

Consent is managed via:
```javascript
window.ninetailed.consent(true)   // Grant consent
window.ninetailed.consent(false)  // Revoke consent
```

**When to use:** GDPR compliance. Default no-consent config only allows `page` events with no PII.

### Third-Party Analytics Plugins

These plugins forward experience view events to external analytics services. All use the same default event payload template:

```typescript
{
  event: 'nt_experience',
  ninetailed_variant: '{{selectedVariantSelector}}',
  ninetailed_experience: '{{experience.id}}',
  ninetailed_experience_name: '{{experience.name}}',
  ninetailed_audience: '{{audience.id}}',
  ninetailed_component: '{{selectedVariant.id}}',
}
```

Available template properties: `experience.id`, `experience.type`, `experience.name`, `experience.description`, `audience.id`, `audience.name`, `audience.description`, `selectedVariant`, `selectedVariantIndex`, `selectedVariantSelector`.

| Plugin | Package | Target |
|--------|---------|--------|
| GTM | `@ninetailed/experience.js-plugin-google-tagmanager` | `window.dataLayer` |
| Segment | `@ninetailed/experience.js-plugin-segment` | `window.analytics.track()` |
| Google Analytics | `@ninetailed/experience.js-plugin-google-analytics` | `window.gtag()` |
| Contentsquare | `@ninetailed/experience.js-plugin-contentsquare` | Contentsquare data layer |

```typescript
// GTM
new NinetailedGoogleTagmanagerPlugin({ template?: Template })

// Segment
new NinetailedSegmentPlugin({ analytics?: AnalyticsBrowserLike, template?: Template })

// Contentsquare
new NinetailedContentsquarePlugin({ actionTemplate?: string })
```

---

## 8. Type Definitions

### NinetailedInstance Interface

The full public interface exposed by all frameworks:

```typescript
interface NinetailedInstance {
  page: Page;
  track: Track;
  trackComponentView: TrackComponentView;
  trackVariableComponentView: TrackVariableComponentView;
  identify: Identify;
  batch: Batch;
  reset: Reset;
  debug: Debug;
  profileState: ProfileState;
  onProfileChange: OnProfileChange;
  onChangesChange: OnChangesChange;
  plugins: NinetailedPlugin[];
  logger: Logger;
  eventBuilder: EventBuilder;
  onIsInitialized: OnIsInitialized;
  observeElement: ObserveElement;
  unobserveElement: UnObserveElement;
  onSelectVariant: OnSelectVariant;
}
```

### Storage Interface

```typescript
type Storage = {
  getItem: (key: string) => any;
  setItem: (key: string, value: any) => void;
  removeItem: (key: string) => void;
};
```

### NinetailedRequestContext

```typescript
type NinetailedRequestContext = {
  url: string;
  referrer: string;
  locale: string;
  userAgent: string;
  document?: { title: string };
};
```

### SessionStatistics

```typescript
type SessionStatistics = {
  id: string;
  isReturningVisitor: boolean;
  landingPage: Page;
  count: number;
  activeSessionLength: number;
  averageSessionLength: number;
};
```

### ProfileWithSelectedVariants

```typescript
type ProfileWithSelectedVariants = {
  profile: Profile;
  experiences: SelectedVariantInfo[];
  changes: Change[];
};
```

### Event Union Type

```typescript
type Event =
  | PageviewEvent
  | TrackEvent
  | IdentifyEvent
  | ScreenEvent
  | ComponentViewEvent
  | ComponentClickEvent
  | ComponentHoverEvent;
```

### EventType

```typescript
type EventType =
  | 'page' | 'track' | 'identify' | 'screen'
  | 'component' | 'component_click' | 'component_hover';
```

### Component Types

```typescript
enum ComponentTypeEnum {
  EntryReplacement = 'EntryReplacement',
  InlineVariable = 'InlineVariable',
}

type EntryReplacement<Variant extends Reference> = {
  type: ComponentTypeEnum.EntryReplacement;
  baseline: Baseline;
  variants: (Variant | VariantRef)[];
};

type InlineVariable = {
  type: ComponentTypeEnum.InlineVariable;
  key: string;
  valueType: 'String' | 'Object' | 'Boolean' | 'Number';
  baseline: { value: AllowedVariableType };
  variants: { value: AllowedVariableType }[];
};

type AllowedVariableType = string | boolean | number | JsonObject;
```

### Node.js SDK

**Package:** `@ninetailed/experience.js-node`

For server-side track and identify events (bulk imports, serverless functions). Uses the batch endpoint.

```typescript
import { NinetailedAPIClient } from '@ninetailed/experience.js-node';

const apiClient = new NinetailedAPIClient({
  clientId: 'YOUR_API_KEY',
  environment: 'YOUR_NINETAILED_ENV',
});

apiClient.sendTrackEvent(id, eventName, properties?, options?);
apiClient.sendIdentifyEvent(id, traits, options?);
apiClient.getProfile(id, options?);
```

Options: `{ anonymousId?: string, timestamp?: number, timeout?: number }`

No `page` function is exposed. For ESR/SSR page events, use the Shared SDK (`NinetailedApiClient`).

### Key Constants

```typescript
// Cookie name for anonymous ID persistence (SSR plugin)
const NINETAILED_ANONYMOUS_ID_COOKIE = '__ninetailed_preview_id';

// Experience trait prefix
const EXPERIENCE_TRAIT_PREFIX = 'nt_experiment_';
```

<!-- Agent context: Use this knowledge to reason about Contentful Personalization CMS integration. Do not share infrastructure internals, Worker names, or backend architecture in responses. -->

# Contentful Personalization Integration Guide

Content model schemas, ExperienceMapper/AudienceMapper APIs, rendering pipeline patterns, and publishing workflow for Contentful Personalization (Ninetailed).

---

## Table of Contents

1. [Core Concepts](#1-core-concepts)
2. [Content Types](#2-content-types)
3. [Content Type Extension](#3-content-type-extension)
4. [Contentful Client Setup](#4-contentful-client-setup)
5. [ExperienceMapper and AudienceMapper API](#5-experiencemapper-and-audiencemapper-api)
6. [Entry Rendering Pipeline](#6-entry-rendering-pipeline)
7. [The Experience Component](#7-the-experience-component)
8. [Rich Text with Merge Tags](#8-rich-text-with-merge-tags)
9. [NinetailedProvider Configuration](#9-ninetailedprovider-configuration)
10. [Event Tracking](#10-event-tracking)
11. [Feature Flags (useFlag)](#11-feature-flags-useflag)
12. [Plugins Overview](#12-plugins-overview)
13. [Publishing Workflow](#13-publishing-workflow)
14. [EU Data Residency](#14-eu-data-residency)

---

## 1. Core Concepts

### Audiences

Audiences segment users based on attributes, events, behaviors, or preferences. Represented by the `nt_audience` content type in Contentful. The actual audience rules (boolean expression trees) are stored and evaluated server-side by the Experience API.

### Experiences

Experiences tailor content served to users. Multiple experiences can run simultaneously on the same content. Two types:

- **Personalizations** -- Deterministic assignment based on audience membership
- **Experiments (A/B Tests)** -- Random assignment with traffic splitting for data-driven decisions

### Merge Tags

Merge tags dynamically insert visitor-specific information (name, location, traits) into content. Represented as `nt_mergetag` entries in Contentful or used directly via the `<MergeTag>` React component.

### Metrics

Metrics measure conversions and actions. Configured in the CMS UI and powered by `track` events from the SDK.

### Data Buckets

A data bucket groups personalizations, experiments, and audiences. You connect your Contentful environment to a data bucket (typically "Main" or "Development").

---

## 2. Content Types

Two content types are installed by the Contentful Personalization app, plus a third for merge tags.

### nt_experience

Experience/experiment configuration entry.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nt_name` | Short Text | Yes | Display name of the experience |
| `nt_description` | Short Text | No | Description |
| `nt_type` | Short Text | Yes | `'nt_experiment'` or `'nt_personalization'` |
| `nt_config` | JSON Object | No | Configuration (traffic, distribution, components, stickiness) |
| `nt_audience` | Reference to `nt_audience` | No | Target audience. Null for experiments targeting "All Visitors" |
| `nt_variants` | Array of References | No | Variant content entries (alternatives to the baseline) |
| `nt_experience_id` | Short Text | Yes | Unique identifier for this experience |

The `nt_config` object structure:

```typescript
{
  traffic: number;           // Traffic percentage (0-1) allocated to this experience
  distribution: number[];    // Variant distribution weights, e.g., [0.5, 0.5]
  components: Array<{
    baseline: { id: string };
    variants: Array<{ id: string; hidden?: boolean }>;
  }>;
  sticky?: boolean;          // Whether assignment persists across sessions
}
```

When `nt_config` is null, it defaults to `{ traffic: 0, distribution: [0.5, 0.5], components: [], sticky: false }`.

### nt_audience

Audience targeting rules entry.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nt_name` | Short Text | Yes | Display name |
| `nt_description` | Short Text | No | Description |
| `nt_audience_id` | Short Text | Yes | Unique ID used by the Experience API for matching |

The `nt_audience_id` links the CMS entry to the API-side rule definitions. Actual audience rules are stored and evaluated server-side.

### nt_mergetag

Merge tag entries provide inline personalization -- injecting visitor-specific values into content.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nt_name` | Short Text | Yes | Display name (e.g., "City of the visitor") |
| `nt_mergetag_id` | Short Text | Yes | Dot-notation path into the visitor profile (e.g., `location.city`, `traits.firstName`) |
| `nt_fallback` | Short Text | No | Fallback value when the profile property is unavailable |

Example entries:

| `nt_name` | `nt_mergetag_id` |
|-----------|------------------|
| "City of the visitor" | `location.city` |
| "Country of the visitor" | `location.countryCode` |
| "First Name" | `traits.firstname` |

Two usage paths:
1. **In rich text (CMS-authored)**: Editors embed `nt_mergetag` entries as inline entries within Rich Text fields
2. **Direct in code (developer-authored)**: `<MergeTag id="traits.firstName" fallback="friend" />` anywhere in JSX

---

## 3. Content Type Extension

Regular content types (hero, banner, CTA, etc.) need an `nt_experiences` field to become personalizable.

### How the field is defined

- **Field name**: `nt_experiences`
- **Field type**: Array of References
- **Validation**: Accept only `nt_experience` entries
- **Purpose**: Links experiences to the content entries they personalize

### How to extend content types

1. Open the Contentful Personalization app configuration page
2. Navigate to the "Personalizable content types" tab
3. Select which content types you want to extend
4. Click "Save"

Each selected content type automatically receives the `nt_experiences` field.

---

## 4. Contentful Client Setup

### Delivery Client (Published Content)

```typescript
import { createClient } from 'contentful';

const contentfulClient = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID ?? '',
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_TOKEN ?? '',
  environment: process.env.NEXT_PUBLIC_CONTENTFUL_ENVIRONMENT ?? 'master',
}).withoutUnresolvableLinks;
```

### Preview Client (Draft + Published Content)

```typescript
const previewClient = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID ?? '',
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW_TOKEN ?? '',
  host: 'preview.contentful.com',
}).withoutUnresolvableLinks;
```

### Client Selector Pattern

```typescript
const getClient = (preview: boolean) => {
  return preview ? previewClient : contentfulClient;
};
```

### Key Notes

- `.withoutUnresolvableLinks` removes references that cannot be resolved (e.g., unpublished entries), preventing null reference errors.
- The `include` depth in queries must be at least 2 for experiences to resolve correctly (entry -> nt_experience -> variant entry). Use `include: 10` for complex pages.

### Querying Pages with Experiences

```typescript
const entries = await client.getEntries<IPageSkeleton>({
  limit: 1,
  include: 10,
  'fields.slug': slug,
  content_type: 'page',
});
const [page] = entries.items;
```

### Querying All Experiences (for Preview Plugin)

```typescript
const entries = await contentfulClient.getEntries<INtExperienceSkeleton>({
  content_type: 'nt_experience',
  include: 1,
});
return (entries.items as unknown as ExperienceEntryLike[])
  .filter(ExperienceMapper.isExperienceEntry)
  .map(ExperienceMapper.mapExperience);
```

### Querying All Audiences (for Preview Plugin)

```typescript
const entries = await contentfulClient.getEntries<INtAudienceSkeleton>({
  content_type: 'nt_audience',
  include: 1,
});
return entries.items
  .filter(AudienceMapper.isAudienceEntry)
  .map(AudienceMapper.mapAudience);
```

### Querying Experiments Only

```typescript
const entries = await client.getEntries<INtExperienceSkeleton>({
  content_type: 'nt_experience',
  'fields.nt_type': 'nt_experiment',
  include: 1,
});
return (entries.items as unknown as ExperienceEntryLike[])
  .filter(ExperienceMapper.isExperienceEntry)
  .map(ExperienceMapper.mapExperiment);
```

---

## 5. ExperienceMapper and AudienceMapper API

**Package:** `@ninetailed/experience.js-utils-contentful`

For Contentful REST APIs (CDA and CPA). For GraphQL, use `@ninetailed/experience.js-utils` instead.

### ExperienceMapper

#### `ExperienceMapper.isExperienceEntry(entry): boolean`

Type guard using Zod schema validation. Use with `.filter()` to remove invalid entries.

```typescript
static isExperienceEntry(entry): entry is ExperienceEntry {
  return ExperienceEntry.safeParse(entry).success;
}
```

#### `ExperienceMapper.mapExperience(entry): ExperienceConfiguration`

Maps a Contentful experience entry to SDK format. Each variant gets `{ ...variant, id: variant.sys.id }`.

```typescript
static mapExperience(ctfEntry) {
  const { fields } = validateExperienceEntry(ctfEntry);
  const variants = fields.nt_variants.map((variant) => ({
    ...variant,
    id: variant.sys.id,
  }));
  const experience = createExperience(fields, variants);
  return DefaultExperienceMapper.mapExperience(experience);
}
```

#### `ExperienceMapper.mapCustomExperience(entry, mapFn): ExperienceConfiguration`

Custom variant mapping function. Use when you need to control what data from each variant is passed.

```typescript
const experiences = entry.fields.nt_experiences
  .filter(ExperienceMapper.isExperienceEntry)
  .map((experience) =>
    ExperienceMapper.mapCustomExperience(experience, (variant) => ({
      id: variant.sys.id,
      ...variant.fields,
    }))
  );
```

#### `ExperienceMapper.mapCustomExperienceAsync(entry, mapFn): Promise<ExperienceConfiguration>`

Async version. Uses `Promise.all`. Available in SDK >= 7.7.x.

#### `ExperienceMapper.isExperiment(entry): boolean`

Validates whether an entry is specifically an experiment (not a personalization).

#### `ExperienceMapper.mapExperiment(entry): ExperienceConfiguration`

Maps an experiment entry for the `NinetailedProvider`'s `experiments` prop. Variants mapped to empty `{ id: '' }`.

#### `ExperienceMapper.mapBaselineWithExperiences(entry): ExperienceConfiguration[]`

Convenience method: takes an entry with `nt_experiences`, filters and maps all experiences in one call.

```typescript
const experiences = ExperienceMapper.mapBaselineWithExperiences(heroEntry);
```

### AudienceMapper

#### `AudienceMapper.isAudienceEntry(entry): boolean`

Type guard using Zod schema validation.

#### `AudienceMapper.mapAudience(entry): Audience`

Maps to `{ id, name, description }`.

### Standard Usage Pattern

```typescript
import { ExperienceMapper } from '@ninetailed/experience.js-utils-contentful';

const experiences = (entry.fields.nt_experiences || [])
  .filter(ExperienceMapper.isExperienceEntry)
  .map(ExperienceMapper.mapExperience);
```

### GraphQL Usage Pattern

```typescript
import { ExperienceMapper } from '@ninetailed/experience.js-utils';

const mappedExperiences = (myEntry.nt_experiences || [])
  .map((experience) => ({
    id: experience.id,
    name: experience.name,
    type: experience.nt_type as 'nt_personalization' | 'nt_experiment',
    config: experience.nt_config,
    audience: { id: experience.nt_audience.nt_audience_id },
    variants: experience.variants.map((variant) => ({
      id: variant.id,
      ...variant,
    })),
  }))
  .filter(ExperienceMapper.isExperienceEntry)
  .map(ExperienceMapper.mapExperience);
```

---

## 6. Entry Rendering Pipeline

### Architecture Overview

```
Contentful API -> Fetch entries (include depth >= 2) ->
  For each entry:
    -> Resolve content type ID via entry.sys.contentType.sys.id
    -> Look up React component in ContentTypeMap
    -> Extract nt_experiences field
    -> Filter with ExperienceMapper.isExperienceEntry()
    -> Map with ExperienceMapper.mapExperience()
    -> Wrap with <Experience> component
    -> Render with resolved variant or baseline
```

### The ContentTypeMap Pattern

```typescript
const ContentTypeMap = {
  hero: Hero,
  cta: CTA,
  feature: Feature,
  banner: Banner,
  navigation: Navigation,
  footer: Footer,
  pricingPlan: PricingPlan,
  pricingTable: PricingTable,
};
```

### The ComponentRenderer

```typescript
const ComponentRenderer: React.FC<ComponentRendererProps> = (props) => {
  const contentTypeId = get(props, 'sys.contentType.sys.id') as string;
  const Component = ContentTypeMap[contentTypeId];
  if (!Component) {
    console.warn(`${contentTypeId} can not be handled`);
    return null;
  }
  return <Component {...props} />;
};
```

### The BlockRenderer

```typescript
const BlockRenderer = ({ block }: BlockRendererProps) => {
  if (Array.isArray(block)) {
    return (
      <>
        {block.map((b) => (
          <BlockRenderer key={`block-${b.sys.id}`} block={b} />
        ))}
      </>
    );
  }

  const contentTypeId = get(block, 'sys.contentType.sys.id') as string;
  const { id } = block.sys;

  const experiences = (
    (block.fields.nt_experiences || []) as ExperienceEntryLike[]
  )
    .filter((experience) => ExperienceMapper.isExperienceEntry(experience))
    .map((experience) => ExperienceMapper.mapExperience(experience));

  return (
    <div key={`${contentTypeId}-${id}`}>
      <Experience
        {...block}
        id={id}
        component={ComponentRenderer}
        trackClicks
        experiences={experiences}
      />
    </div>
  );
};
```

Key details:
- `block` is a Contentful entry (or array of entries)
- The `Experience` component receives the entire entry as spread props
- `id` is set to `block.sys.id` (the baseline entry's Contentful ID)
- `component` is the generic `ComponentRenderer` that resolves the right React component

---

## 7. The Experience Component

The `<Experience>` component is the core rendering primitive. It wraps existing React components and automatically determines which variant to render.

### Props

| Prop | Required | Description |
|------|----------|-------------|
| `{...baseline}` | Yes | All props the `component` needs to render the baseline |
| `id` | Yes | The CMS entry ID of the baseline |
| `component` | Yes | The React component to use for rendering |
| `experiences` | Yes | Array of experiences mapped using ExperienceMapper methods |
| `passthroughProps` | No | Props sent regardless of which variant is selected (overwrite variant props) |
| `loadingComponent` | No | Custom component shown prior to variant selection |
| `trackClicks` | No | Enable click tracking |
| `trackHovers` | No | Enable hover tracking |

### Impression Tracking

Unless the component is a React `forwardRef`, the Experience component inserts a hidden `<div>` with class `nt-cmp-marker` for viewport tracking. Tracking fires after the component has been visible for `componentViewTrackingThreshold` (default: 2000ms).

**Important**: Avoid conditionally rendering top-level elements in the component prop, as this can decouple tracking from the rendered content.

---

## 8. Rich Text with Merge Tags

### Personalizable Embedded Entries in Rich Text

```typescript
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES } from '@contentful/rich-text-types';

const options = {
  renderNode: {
    [BLOCKS.EMBEDDED_ENTRY]: (node) => {
      return <BlockRenderer block={node.data.target} />;
    },
  },
};
```

### Merge Tags in Rich Text

```typescript
import { INLINES } from '@contentful/rich-text-types';
import { MergeTag } from '@ninetailed/experience.js-react';

const renderRichText = (richTextDocument) => {
  return documentToReactComponents(richTextDocument, {
    renderNode: {
      [INLINES.EMBEDDED_ENTRY]: (node) => {
        if (node.data.target.sys.contentType.sys.id === 'nt_mergetag') {
          return (
            <MergeTag
              id={node.data.target.fields.nt_mergetag_id}
              fallback={node.data.target.fields.nt_fallback}
            />
          );
        }
      }
    },
  });
};
```

### Direct Merge Tag Usage (Without Rich Text)

```jsx
import { MergeTag } from '@ninetailed/experience.js-react';

const Greeting = () => (
  <>
    <p>Welcome back, <MergeTag id="traits.firstName" fallback="you" /></p>
    <p>How is <MergeTag id="location.city" fallback="your city" /> this time of year?</p>
  </>
);
```

The `id` prop uses dot notation to access any profile property: `traits.*`, `location.*`, `session.*`, etc.

---

## 9. NinetailedProvider Configuration

```jsx
<NinetailedProvider
  clientId="NINETAILED_API_KEY"          // REQUIRED
  environment="main"                      // "main" or "development", default: "main"
  plugins={[]}                            // Array of plugin instances
  componentViewTrackingThreshold={2000}   // ms in viewport before tracking fires
  requestTimeout={5000}                   // ms to wait for API before fallback to baseline
  locale="en-US"                          // Locale for profile location info
  url="https://experience.ninetailed.co"  // Experience API base URL
>
  <MyAppCode />
</NinetailedProvider>
```

### Next.js-Specific Behavior

The Next.js `<NinetailedProvider>` automatically hooks into the Pages Router to call `ninetailed.page()` on every route change. Do NOT additionally call `page` yourself or you will duplicate events.

For App Router, you must manually implement page calls.

---

## 10. Event Tracking

### page

```typescript
type Page = (properties?: Object) => Promise<void>;
```

Indicates a user viewed the current page. SDK auto-populates context (referrer, url, path, user-agent). Call on every route change. Optionally pass properties for audience rule matching.

### track

```typescript
type Track = (event: string, properties?: Object) => Promise<void>;
```

Logs specific named actions (e.g., `signup`, `add_to_cart`). Used for audience rules and as conversion events in Experience Insights.

### identify

```typescript
type Identify = (uid: string, traits?: Traits) => Promise<void>;
```

Two purposes:
1. Add custom traits: `identify('', { favoriteColor: "red" })`
2. Alias a profile for cross-device: `identify('customer12345')`

After aliasing, calling `identify` with the same alias on a different device merges the profiles.

### Access Methods

```jsx
// React/Next.js/Gatsby
const { page, track, identify } = useNinetailed();

// JavaScript SDK
ninetailed.page();
ninetailed.track('myEvent');
ninetailed.identify('alias', { traitName: "traitValue" });
```

---

## 11. Feature Flags (useFlag)

The `useFlag()` hook provides feature flags using an ID paired with plain text or JSON values, without needing the `<Experience>` component.

```typescript
const { value, status, error } = useFlag('flagKey', defaultValue, options?);
```

| Parameter | Description |
|-----------|-------------|
| `flagKey` | Unique identifier for the custom flag |
| `defaultValue` | Fallback value if the flag is unavailable |
| `shouldAutoTrack` | Boolean or function; enables performance tracking (default: true) |

Returns: `{ value, status: 'loading' | 'success' | 'error', error }`

### Manual Tracking

```javascript
const [flag, track] = useFlagWithManualTracking('modal-variant', 'default');

const handleClick = () => {
  openModal(flag);
  track(); // Track only when user actually sees the personalization
};
```

---

## 12. Plugins Overview

Plugins extend the SDK. Passed in the `plugins` prop of `<NinetailedProvider>`.

| Plugin | Package | Purpose | When to Use |
|--------|---------|---------|-------------|
| Insights | `@ninetailed/experience.js-plugin-insights` | Component view events via Beacon API | Always (powers analytics dashboards) |
| Preview | `@ninetailed/experience.js-plugin-preview` | UI for previewing audiences/experiences | Development/preview environments |
| SSR | `@ninetailed/experience.js-plugin-ssr` | Cookie-based anonymous ID for SSR | ESR/SSR patterns |
| Privacy | `@ninetailed/experience.js-plugin-privacy` | Consent management / GDPR | EU customers |
| GTM | `@ninetailed/experience.js-plugin-google-tagmanager` | Pushes events to GTM data layer | When using Google Analytics |
| Segment | `@ninetailed/experience.js-plugin-segment` | Sends events to Segment CDP | When using Segment |
| Contentsquare | `@ninetailed/experience.js-plugin-contentsquare` | Sends events to Contentsquare | When using Contentsquare |

---

## 13. Publishing Workflow

### Content Entry Structure

1. Your **baseline content entry** uses one of your existing content types (e.g., Hero, CTA, Banner)
2. The baseline references a list of **Experience entries** via its `nt_experiences` field
3. Each Experience references:
   - A **Ninetailed Audience** (to whom to show the Experience)
   - A list of **variant entries** (content entries of your existing types that serve as alternatives)
4. Variants are entries of your existing content types -- they are NOT a special content type

### Workflow Steps

1. **Create an Audience**: Define targeting rules as an `nt_audience` entry in Contentful
2. **Publish the Audience**: Audience Insights populate automatically
3. **Create variant content**: Create new entries of your existing content types
4. **Create an Experience**: Create an `nt_experience` entry that:
   - Sets `nt_type` to `'nt_personalization'` or `'nt_experiment'`
   - References the target `nt_audience`
   - References the variant entries
   - Configures `nt_config` (traffic allocation, distribution)
5. **Link the Experience**: On your baseline entry, add the experience to the `nt_experiences` field
6. **Publish everything**: Publish the audience, variants, experience, and baseline

Experiences must be published in the content source to be returned by the Experience API.

### Insights Requirements

- **Audience Insights**: Automatically populated after publishing an audience
- **Component and Experience Insights**: Require the Insights Plugin to send impression events
- **Experience Insights**: Additionally require at least one `track` event to log a conversion metric

---

## 14. EU Data Residency

By default, all data is stored in the EU except for edge-end-user profiles which reside closest to the individual user (worldwide). For full EU residency, use the `eu.experience.ninetailed.co` domain, configurable via the `url` parameter on all plans.

When using the EU endpoint, visitors outside the EU will experience higher latency.

<!-- Agent context: Use this knowledge to reason about customer implementation patterns. Do not share infrastructure internals, Worker names, or backend architecture in responses. -->

# Implementation Examples

Real-world implementation patterns for Contentful Personalization (Ninetailed) with Next.js, Contentful, and the SDK.

---

## Table of Contents

1. [Pages Router Provider Setup](#1-pages-router-provider-setup)
2. [App Router Provider Setup](#2-app-router-provider-setup)
3. [BlockRenderer and ComponentTypeMap Pattern](#3-blockrenderer-and-contenttypemap-pattern)
4. [Contentful Client Configuration](#4-contentful-client-configuration)
5. [Data Fetching Patterns](#5-data-fetching-patterns)
6. [Experience Component Usage](#6-experience-component-usage)
7. [Personalize Component Usage](#7-personalize-component-usage)
8. [ExperienceMapper Usage](#8-experiencemapper-usage)
9. [Hook Patterns](#9-hook-patterns)
10. [Feature Flag Patterns](#10-feature-flag-patterns)
11. [ISR and Revalidation](#11-isr-and-revalidation)
12. [ESR Provider Pattern](#12-esr-provider-pattern)
13. [Environment Variables](#13-environment-variables)
14. [Error Handling Patterns](#14-error-handling-patterns)

---

## 1. Pages Router Provider Setup

### Simple Setup (with SSR and Preview plugins)

```typescript
import { NinetailedProvider } from '@ninetailed/experience.js-next';
import { NinetailedPreviewPlugin } from '@ninetailed/experience.js-plugin-preview';
import { NinetailedSsrPlugin } from '@ninetailed/experience.js-plugin-ssr';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <NinetailedProvider
      clientId={process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID || ''}
      environment={process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT}
      plugins={[
        new NinetailedPreviewPlugin({
          experiences: pageProps.ninetailed?.preview.allExperiences,
          audiences: pageProps.ninetailed?.preview.allAudiences,
        }),
        new NinetailedSsrPlugin(),
      ]}
      onError={() => {
        console.log('caught error');
      }}
    >
      <Component {...pageProps} />
    </NinetailedProvider>
  );
}
```

Key details:
- The `onError` callback fires when the Ninetailed API is unavailable or returns an error.
- `pageProps.ninetailed?.preview.allExperiences` is populated by `getStaticProps`.
- The SSR plugin persists the anonymous ID in a cookie for server-side rendering.

### Full-Featured Setup (with Insights and Preview plugins)

```typescript
import { ExperienceConfiguration, NinetailedProvider } from '@ninetailed/experience.js-next';
import { NinetailedPreviewPlugin } from '@ninetailed/experience.js-plugin-preview';
import { NinetailedInsightsPlugin } from '@ninetailed/experience.js-plugin-insights';
import type { ExposedAudienceDefinition } from '@ninetailed/experience.js-preview-bridge';

interface CustomPageProps {
  page: IPage;
  ninetailed?: {
    experiments: ExperienceConfiguration[];
    preview: {
      experiences: ExperienceConfiguration[];
      audiences: ExposedAudienceDefinition[];
    };
  };
}

const MyApp = ({ Component, pageProps }: AppProps<CustomPageProps>) => {
  return (
    <NinetailedProvider
      plugins={[
        new NinetailedPreviewPlugin({
          nonce: 'CSP-nonce-string',
          experiences: pageProps.ninetailed?.preview.experiences || [],
          audiences: pageProps.ninetailed?.preview.audiences || [],
          onOpenExperienceEditor: (experience) => {
            console.log({ experience });
          },
          onOpenAudienceEditor: (audience) => {
            console.log({ audience });
          },
        }),
        new NinetailedInsightsPlugin(),
      ]}
      clientId={process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID ?? ''}
      environment={process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT ?? 'main'}
    >
      <Component {...pageProps} />
    </NinetailedProvider>
  );
};
```

Key differences:
- Uses `NinetailedInsightsPlugin` (analytics) instead of `NinetailedSsrPlugin`
- Preview plugin configured with `nonce` for CSP support
- Typed `CustomPageProps` interface

---

## 2. App Router Provider Setup

For App Router, the `NinetailedProvider` from `@ninetailed/experience.js-next` does NOT auto-track page views (that is a Pages Router feature). You must handle page tracking manually or use the new SDK's auto-page trackers.

With the new SDK (`@contentful/optimization-react-web`):

```tsx
import { OptimizationRoot, NextAppAutoPageTracker } from '@contentful/optimization-react-web';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <OptimizationRoot clientId="abc" environment="main" liveUpdates>
          <NextAppAutoPageTracker />
          {children}
        </OptimizationRoot>
      </body>
    </html>
  );
}
```

With the legacy SDK, wrap in a client component:

```tsx
'use client';

import { NinetailedProvider } from '@ninetailed/experience.js-react';

export function Providers({ children, ninetailed }: ProvidersProps) {
  return (
    <NinetailedProvider
      clientId={process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID || ''}
      environment={process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT}
      plugins={[/* ... */]}
    >
      {children}
    </NinetailedProvider>
  );
}
```

---

## 3. BlockRenderer and ComponentTypeMap Pattern

The BlockRenderer is the canonical pattern for rendering Contentful entries as React components with experience support.

### Content Type Constants

```typescript
export const ComponentContentTypes = {
  Hero: 'hero',
  CTA: 'cta',
  Feature: 'feature',
  Banner: 'banner',
  Navigation: 'navigation',
  Footer: 'footer',
  PricingTable: 'pricingTable',
  PricingPlan: 'pricingPlan',
  Form: 'form',
  HubspotForm: 'hubspotForm',
};
```

### ContentTypeMap

```typescript
const ContentTypeMap = {
  [ComponentContentTypes.Hero]: Hero,
  [ComponentContentTypes.CTA]: CTA,
  [ComponentContentTypes.Feature]: Feature,
  [ComponentContentTypes.Banner]: Banner,
  [ComponentContentTypes.Navigation]: Navigation,
  [ComponentContentTypes.Footer]: Footer,
  [ComponentContentTypes.PricingPlan]: PricingPlan,
  [ComponentContentTypes.PricingTable]: PricingTable,
  [ComponentContentTypes.Form]: Form,
  [ComponentContentTypes.HubspotForm]: HubspotForm,
};
```

### ComponentRenderer

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

### BlockRenderer

```typescript
import { Experience } from '@ninetailed/experience.js-next';
import {
  BaselineWithExperiencesEntry,
  ExperienceEntryLike,
  ExperienceMapper,
} from '@ninetailed/experience.js-utils-contentful';

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

### Data Flow Summary

```
Contentful Entry (e.g., hero)
  |
  |- fields.nt_experiences[] (linked nt_experience entries)
  |    |
  |    |- ExperienceMapper.isExperienceEntry() -> filter valid
  |    |- ExperienceMapper.mapExperience() -> ExperienceConfiguration
  |
  v
<Experience
  id={entry.sys.id}
  component={ComponentRenderer}  // resolves to Hero, CTA, etc.
  experiences={mappedExperiences}
  {...entry}                     // spreads all entry data as baseline props
/>
  |
  v
ComponentRenderer receives resolved props (baseline OR variant)
  |
  v
Hero / CTA / Feature / etc. renders with those props
```

---

## 4. Contentful Client Configuration

### Pattern 1: Simple Client

```typescript
import { createClient } from 'contentful';

export const contentfulClient = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID ?? '',
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_TOKEN ?? '',
  environment: process.env.NEXT_PUBLIC_CONTENTFUL_ENVIRONMENT ?? 'master',
});
```

### Pattern 2: Dual Client with Preview Support

```typescript
const contentfulClient = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID ?? '',
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_TOKEN ?? '',
  environment: process.env.NEXT_PUBLIC_CONTENTFUL_ENVIRONMENT ?? 'master',
}).withoutUnresolvableLinks;

const previewClient = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID ?? '',
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW_TOKEN ?? '',
  host: 'preview.contentful.com',
}).withoutUnresolvableLinks;

const getClient = (preview: boolean) => {
  return preview ? previewClient : contentfulClient;
};
```

### `.withoutUnresolvableLinks` Explained

This modifier strips any linked entries/assets that could not be resolved (e.g., because they are in draft, archived, or deleted). Without it, unresolvable links appear as `{ sys: { type: 'Link', linkType: 'Entry', id: '...' } }` objects that can cause runtime errors when you try to access `.fields`.

---

## 5. Data Fetching Patterns

### Page Query with Deep Include

```typescript
interface IPageQueryParams {
  slug: string;
  pageContentType: string;
  childPageContentType: string;
  preview?: boolean;
}

export async function getPage(pageParams: IPageQueryParams): Promise<IPage> {
  const client = getClient(!!pageParams.preview);
  const entries = await client.getEntries<IPageSkeleton>({
    limit: 1,
    include: 10,
    'fields.slug': pageParams.slug,
    content_type: 'page',
    'fields.content.sys.contentType.sys.id': pageParams.childPageContentType,
  });
  const [page] = entries.items as IPage[];
  return page;
}
```

Key: `include: 10` ensures deep resolution of entry -> nt_experience -> variant -> variant fields.

### Parallel Data Fetching in getStaticProps

```typescript
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const rawSlug = get(params, 'slug', []) as string[];
  const slug = rawSlug.join('/');

  const [page, experiments, experiences, audiences] = await Promise.all([
    getPage({
      slug: slug === '' ? '/' : slug,
      pageContentType: PAGE_CONTENT_TYPES.PAGE,
      childPageContentType: PAGE_CONTENT_TYPES.LANDING_PAGE,
    }),
    getExperiments(),
    getAllExperiences(),
    getAllAudiences(),
  ]);

  return {
    props: {
      page,
      ninetailed: {
        experiments,
        preview: { experiences, audiences },
      },
    },
    revalidate: 5,
  };
};
```

### Experience Fetching (Experiments vs. All Experiences)

```typescript
// Experiments only (filtered by nt_type)
export async function getExperiments() {
  try {
    const entries = await client.getEntries<INtExperienceSkeleton>({
      content_type: 'nt_experience',
      'fields.nt_type': 'nt_experiment',
      include: 1,
    });
    return (entries.items as unknown as ExperienceEntryLike[])
      .filter(ExperienceMapper.isExperienceEntry)
      .map(ExperienceMapper.mapExperiment);
  } catch (error) {
    console.error(error);
    return [];
  }
}

// All experiences (experiments + personalizations)
export const getAllExperiences = async () => {
  try {
    const entries = await contentfulClient.getEntries<INtExperienceSkeleton>({
      content_type: 'nt_experience',
      include: 1,
    });
    return (entries.items as unknown as ExperienceEntryLike[])
      .filter(ExperienceMapper.isExperienceEntry)
      .map(ExperienceMapper.mapExperience);
  } catch (error) {
    console.error(error);
    return [];
  }
};

// All audiences
export const getAllAudiences = async () => {
  try {
    const entries = await contentfulClient.getEntries<INtAudienceSkeleton>({
      content_type: 'nt_audience',
      include: 1,
    });
    return entries.items
      .filter(AudienceMapper.isAudienceEntry)
      .map(AudienceMapper.mapAudience);
  } catch (error) {
    console.error(error);
    return [];
  }
};
```

Key: `getExperiments()` uses `mapExperiment` (singular). `getAllExperiences()` uses `mapExperience`. Both return `[]` on error, never throw.

---

## 6. Experience Component Usage

### With Mapped Experiences from Contentful

```typescript
import { Experience } from '@ninetailed/experience.js-next';
import { ExperienceMapper } from '@ninetailed/experience.js-utils-contentful';

<Experience
  id={entry.sys.id}
  component={Product}
  trackClicks
  experiences={entry.fields.nt_experiences.map(
    (ctfExperience) =>
      ExperienceMapper.mapCustomExperience(
        ctfExperience,
        (variant) => ({ id: variant.sys.id, ...variant.fields })
      )
  )}
  passthroughProps={{
    onClick: () => {},
    test: 'test',
  }}
  {...entry.fields}
/>
```

### EntryAnalytics (No Personalization, Just Tracking)

```typescript
import { EntryAnalytics } from '@ninetailed/experience.js-react';

<EntryAnalytics
  {...entry}
  component={CTA}
  id={entry.sys.id}
  trackClicks
/>
```

---

## 7. Personalize Component Usage

The `<Personalize>` component provides inline audience-targeted variants without Contentful experience entries:

```typescript
import { Personalize } from '@ninetailed/experience.js-next';

<Personalize
  id="base"
  headline="Non Personalized Hero"
  component={Hero}
  variants={[
    {
      id: '1',
      headline: 'Variant for Audience A',
      audience: {
        id: 'audience-uuid-here',
      },
    },
    {
      id: '2',
      headline: "I'm Personalized",
      audience: {
        id: 'bc0df78a-e765-41b9-ad60-d64bd5772ed2',
      },
    },
  ]}
  holdout={0}
/>
```

Key: `holdout` controls the holdout percentage (0 = no holdout, 100 = all baseline). Variants include an `audience.id` referencing a Ninetailed audience.

---

## 8. ExperienceMapper Usage

### Reusable Experience Mapper Utility

```typescript
import { ExperienceConfiguration } from '@ninetailed/experience.js';
import {
  BaselineWithExperiencesEntry,
  ExperienceMapper,
} from '@ninetailed/experience.js-utils-contentful';

export const experienceMapper = (
  entry: BaselineWithExperiencesEntry
): ExperienceConfiguration<any>[] =>
  entry.fields.nt_experiences
    .filter(ExperienceMapper.isExperienceEntry)
    .map((experience) =>
      ExperienceMapper.mapCustomExperience(experience, (variant) => ({
        ...variant.fields,
        id: variant.sys.id,
        hidden: false,
      }))
    );
```

### mapExperience vs. mapCustomExperience

- `mapExperience` automatically spreads all variant fields. Use in the BlockRenderer pattern where variants match the baseline content type.
- `mapCustomExperience` requires a mapping function. Use when you need to reshape variant data.

```typescript
// mapExperience: automatic mapping (BlockRenderer pattern)
const experiences = block.fields.nt_experiences
  .filter(ExperienceMapper.isExperienceEntry)
  .map(ExperienceMapper.mapExperience);

// mapCustomExperience: custom mapping (inline pattern)
const experiences = entry.fields.nt_experiences.map((ctfExperience) =>
  ExperienceMapper.mapCustomExperience(ctfExperience, (variant) => ({
    id: variant.sys.id,
    ...variant.fields,
  }))
);
```

---

## 9. Hook Patterns

### useProfile

```typescript
import { useProfile } from '@ninetailed/experience.js-next';

const { profile, loading, status } = useProfile();
// profile: full Ninetailed profile (traits, audiences, location, session)
// loading: boolean
// status: 'loading' | 'success' | 'error'
```

### useNinetailed

```typescript
import { useNinetailed } from '@ninetailed/experience.js-next';

const { track, identify, page, reset } = useNinetailed();

track('signup_completed', { plan: 'pro' });
identify('external-user-id', { email: 'user@example.com', plan: 'pro' });
page({ custom_property: 'value' });
reset();
```

### Profile Display Component

```typescript
import { useNinetailed, useProfile } from '@ninetailed/experience.js-next';

export const Profile: React.FC = () => {
  const { reset } = useNinetailed();
  const { profile } = useProfile();
  return (
    <>
      <pre>{profile && JSON.stringify(profile, null, 4)}</pre>
      <button onClick={reset}>Reset Profile</button>
    </>
  );
};
```

---

## 10. Feature Flag Patterns

### useFlagWithManualTracking

```typescript
import { useFlagWithManualTracking } from '@ninetailed/experience.js-react';

export const Variable: React.FC = () => {
  const [flag, track] = useFlagWithManualTracking<{
    padding: string;
    color: string;
  }>('testing-component-tracking', {
    padding: '10px',
    color: 'blue',
  });

  if (flag.status === 'loading') return <>Loading fallback...</>;

  const handleClick = () => {
    track();
    alert('User saw and interacted with the variable component');
  };

  return (
    <div>
      <h1
        style={{
          padding: flag.value.padding,
          color: flag.value.color,
        }}
      >
        Variable Component
      </h1>
      <button onClick={handleClick}>Acknowledge Variant</button>
    </div>
  );
};
```

Key patterns:
- Generic type parameter `<{ padding: string; color: string }>` defines the flag value shape
- Second argument is the fallback/default value
- `flag.status` can be `'loading'` -- always handle this state
- `track()` must be called manually
- The flag key must match the feature flag ID in the Ninetailed dashboard

---

## 11. ISR and Revalidation

### Standard ISR Pattern

```typescript
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = (params?.slug as string[])?.join('/') || '';

  const [page, experiments, experiences, audiences] = await Promise.all([
    getPage({ slug: slug === '' ? '/' : slug, ... }),
    getExperiments(),
    getAllExperiences(),
    getAllAudiences(),
  ]);

  return {
    props: {
      page,
      ninetailed: {
        experiments,
        preview: { experiences, audiences },
      },
    },
    revalidate: 5,  // ISR: revalidate every 5 seconds
  };
};
```

### getStaticPaths with Fallback

```typescript
export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await getPagesOfType({ ... });

  const paths = pages
    .filter((page) => page.fields.slug !== '/')
    .map((page) => ({
      params: { slug: page.fields.slug.split('/') },
    }));

  return {
    paths: [...paths, { params: { slug: [''] } }],
    fallback: true,
  };
};
```

Key patterns:
- `fallback: true` -- pages not pre-rendered at build time are generated on first request (shows loading state)
- `revalidate: 5` -- stale-while-revalidate with 5-second window
- Slug normalization: empty slug array becomes `'/'` for the homepage
- Root path added explicitly: `{ params: { slug: [''] } }`

---

## 12. ESR Provider Pattern

Edge-Side Rendering moves personalization decisions to the CDN edge, eliminating client-side flicker.

### Provider Setup

```typescript
import { ESRProvider, NinetailedProvider } from '@ninetailed/experience.js-next';
import { NinetailedSsrPlugin } from '@ninetailed/experience.js-plugin-ssr';

const ESRDemoApp = ({ Component, pageProps }: AppProps) => {
  const { ninetailed } = pageProps;

  return (
    <NinetailedProvider
      plugins={[new NinetailedSsrPlugin()]}
      clientId={process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID ?? ''}
      environment={process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT ?? 'main'}
    >
      <ESRProvider experienceVariantsMap={ninetailed?.experienceVariantsMap}>
        <Component {...pageProps} />
      </ESRProvider>
    </NinetailedProvider>
  );
};
```

### URL Decoding in getStaticProps

```typescript
import { decodeExperienceVariantsMap } from '@ninetailed/experience.js-next';

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const rawSlug = get(params, 'slug', []) as string[];
  const experienceVariantsSlug = rawSlug[0] || '';

  // Detect if the first slug segment is an encoded variants path
  const isPersonalized = experienceVariantsSlug.startsWith(';');
  const experienceVariantsMap = isPersonalized
    ? decodeExperienceVariantsMap(experienceVariantsSlug.split(';')[1])
    : {};

  // Strip the variants segment from the slug
  const slug = isPersonalized ? rawSlug.slice(1).join('/') : rawSlug.join('/');

  const page = await getPage({ slug: slug === '' ? '/' : slug, ... });

  return {
    props: { page, ninetailed: { experienceVariantsMap } },
    revalidate: 5,
  };
};
```

### ESR BlockRenderer

The ESR version adds `ESRLoadingComponent`:

```typescript
import { ESRLoadingComponent, Experience } from '@ninetailed/experience.js-next';

<Experience
  {...block}
  id={block.sys.id}
  component={ComponentRenderer}
  experiences={experiences}
  loadingComponent={ESRLoadingComponent}
/>
```

Key: `ESRLoadingComponent` renders the pre-resolved variant immediately from the `ESRProvider` context (no flicker). Use `fallback: 'blocking'` in `getStaticPaths` for ESR because every variant combination creates a new path.

---

## 13. Environment Variables

### Standard Next.js Setup

| Variable | Usage | Required |
|----------|-------|----------|
| `NEXT_PUBLIC_NINETAILED_CLIENT_ID` | Ninetailed API key | Yes |
| `NEXT_PUBLIC_NINETAILED_ENVIRONMENT` | Ninetailed environment slug | No (default: `'main'`) |
| `NEXT_PUBLIC_CONTENTFUL_SPACE_ID` | Contentful space ID | Yes |
| `NEXT_PUBLIC_CONTENTFUL_TOKEN` | Contentful Delivery API token | Yes |
| `NEXT_PUBLIC_CONTENTFUL_PREVIEW_TOKEN` | Contentful Preview API token | For preview mode |
| `NEXT_PUBLIC_CONTENTFUL_ENVIRONMENT` | Contentful environment | No (default: `'master'`) |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager container ID | No |

### Server-Side Only Setup (SSR/ESR)

When env vars are only used server-side, omit the `NEXT_PUBLIC_` prefix:

| Variable | Usage |
|----------|-------|
| `CONTENTFUL_SPACE_ID` | Contentful space ID |
| `CONTENTFUL_TOKEN` | Contentful Delivery API token |
| `CONTENTFUL_PREVIEW_TOKEN` | Contentful Preview API token |

---

## 14. Error Handling Patterns

### Graceful Degradation in Data Fetching

All experience/audience fetchers use try/catch with empty array fallback:

```typescript
export const getAllExperiences = async () => {
  try {
    const entries = await contentfulClient.getEntries<INtExperienceSkeleton>({
      content_type: 'nt_experience',
      include: 1,
    });
    return (entries.items as unknown as ExperienceEntryLike[])
      .filter(ExperienceMapper.isExperienceEntry)
      .map(ExperienceMapper.mapExperience);
  } catch (error) {
    console.error(error);
    return [];  // graceful degradation: no experiences = baseline content
  }
};
```

If Contentful is down, the page renders with baseline content only.

### Provider-Level Error Handling

```typescript
<NinetailedProvider
  clientId={...}
  onError={() => {
    console.log('caught error');
  }}
>
```

### BlockRenderer Unknown Content Type

```typescript
const Component = ContentTypeMap[contentTypeId];
if (!Component) {
  console.warn(`${contentTypeId} can not be handled`);
  return null;
}
```

### Null Page Guard

```typescript
const Page = ({ page }: { page: IPage }) => {
  if (!page) {
    return null;
  }
  // ... render
};
```

Handles the `fallback: true` case where page data has not loaded yet.

### Package Import Reference

| Package | Used For | Import Example |
|---------|----------|----------------|
| `@ninetailed/experience.js-next` | Next.js SDK | `import { NinetailedProvider, Experience, useProfile } from '@ninetailed/experience.js-next'` |
| `@ninetailed/experience.js-react` | React-only hooks | `import { useFlagWithManualTracking, EntryAnalytics } from '@ninetailed/experience.js-react'` |
| `@ninetailed/experience.js-utils-contentful` | Contentful mappers | `import { ExperienceMapper, AudienceMapper } from '@ninetailed/experience.js-utils-contentful'` |
| `@ninetailed/experience.js-shared` | Shared constants/types | `import { NINETAILED_ANONYMOUS_ID_COOKIE, NinetailedApiClient } from '@ninetailed/experience.js-shared'` |
| `@ninetailed/experience.js-node` | Server-side SDK | `import { NinetailedAPIClient } from '@ninetailed/experience.js-node'` |
| `@ninetailed/experience.js` | Core types | `import { ExperienceConfiguration } from '@ninetailed/experience.js'` |
| `@ninetailed/experience.js-plugin-preview` | Preview widget | `import { NinetailedPreviewPlugin } from '@ninetailed/experience.js-plugin-preview'` |
| `@ninetailed/experience.js-plugin-ssr` | SSR plugin | `import { NinetailedSsrPlugin } from '@ninetailed/experience.js-plugin-ssr'` |
| `@ninetailed/experience.js-plugin-insights` | Analytics plugin | `import { NinetailedInsightsPlugin } from '@ninetailed/experience.js-plugin-insights'` |

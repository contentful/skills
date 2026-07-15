<!-- Agent context: Current Node.js integration contract for @contentful/optimization-node. Load optimization-shared.md first. -->

# Optimization SDK: Node.js

`@contentful/optimization-node` is stateless. Create one process-level SDK and derive a new request
client for every incoming request. Event methods exist on the request client, not the singleton.

## Install and initialize

```bash
pnpm add @contentful/optimization-node contentful
```

```ts
// lib/optimization.ts
import ContentfulOptimization from '@contentful/optimization-node';
import { createClient } from 'contentful';

export const contentfulClient = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN!,
  environment: process.env.CONTENTFUL_ENVIRONMENT ?? 'master',
});

export const optimization = new ContentfulOptimization({
  clientId: process.env.CONTENTFUL_OPTIMIZATION_CLIENT_ID!,
  environment: process.env.CONTENTFUL_OPTIMIZATION_ENVIRONMENT ?? 'main',
  locale: 'en-US',
  contentful: { client: contentfulClient },
});
```

Do not construct the SDK inside the request handler. The process singleton is safe to reuse because
visitor state is bound only by `forRequest()`.

## Bind the request

Build consent, profile, locale, user agent, and page context from the application's incoming request:

```ts
const requestOptimization = optimization.forRequest({
  consent: { events: consent.events, persistence: consent.persistence },
  profile: profileId ? { id: profileId } : undefined,
  locale: 'en-US',
  eventContext: {
    userAgent: request.headers.get('user-agent') ?? undefined,
    page: {
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      referrer: request.headers.get('referer') ?? '',
      search: url.search,
      url: url.toString(),
    },
  },
});
```

`consent` is required. It accepts a boolean or split `{ events?, persistence? }` permissions.
Top-level request `locale` wins over `experienceOptions.locale`. The SDK does not derive page fields
from a framework request; the application must supply them.

## Evaluate and resolve

For a known user, identify before rendering the route. Then emit `page()` and branch on the result:

```ts
if (user) {
  await requestOptimization.identify({
    userId: user.id,
    traits: { plan: user.plan },
  });
}

const pageResult = await requestOptimization.page();

if (!pageResult.accepted) {
  // Render baseline; consent policy blocked the event.
}

const resolved = await requestOptimization.fetchOptimizedEntry('hero-entry-id');
renderHero(resolved.entry);
```

`fetchOptimizedEntry()` requires `contentful: { client }`. It fetches the baseline with the request
locale, resolves with the latest selections returned during this request, and returns both
`baselineEntry` and `entry`.

Manual alternative:

```ts
const baselineEntry = await contentfulClient.getEntry('hero-entry-id', {
  locale: 'en-US',
  include: 10,
});

const selectedOptimizations = pageResult.accepted ? pageResult.data?.selectedOptimizations : undefined;

const { entry } = optimization.resolveOptimizedEntry(baselineEntry, selectedOptimizations);
```

On the singleton, omitting `selectedOptimizations` means no visitor state and therefore baseline.
`resolveOptimizedEntry()` does not clone its input; its result points at either the original baseline
or a nested variant object. Clone before mutating when the Contentful payload came from a shared
cache.

## Persist continuity in the application

The Node SDK manages no cookies or storage. Import `ANONYMOUS_ID_COOKIE` from
`@contentful/optimization-node/constants`, read that cookie into `forRequest({ profile })`, and write
the updated `requestOptimization.profile.id` only when `requestOptimization.canPersistProfile` is
true.

In a Node plus browser integration, use the same `ctfl-opt-aid` cookie and keep it browser-readable.
Also choose whether server or browser owns the initial page event.

## Events and interactions

Await request-bound Experience methods:

```ts
await requestOptimization.page();
await requestOptimization.identify({ userId, traits });
await requestOptimization.screen({ name, properties });
await requestOptimization.track({ event: 'purchase', properties: { value: 42 } });
```

Default pre-consent admission is `identify` and `page`. Blocked Experience events return
`{ accepted: false }` and invoke `onEventBlocked` when configured; they do not throw.

Server-side Insights methods include `trackView`, `trackClick`, `trackHover`, and `trackFlagView`.
Non-sticky interactions require a request-bound `profile.id`. A sticky `trackView` can establish one
through its Experience response. `getFlag()` itself is a side-effect-free read in Node.

## Merge tags and cache safety

Import `isMergeTagEntry` from `@contentful/optimization-node/api-schemas`, then resolve with the
request profile:

```ts
const value = isMergeTagEntry(entry) ? optimization.getMergeTagValue(entry, requestOptimization.profile) : undefined;
```

Shared caches may hold raw Contentful baseline payloads. Never share-cache event responses, request
profiles, selected optimizations, or merge-tag output. A resolved entry is reusable only with a key
that includes the baseline version and the exact selection fingerprint.

## Verify and debug

- Confirm one singleton and one `forRequest()` client per incoming request.
- Log `accepted` before assuming `result.data` exists.
- Confirm the app passes consent, profile, locale, and full page context.
- Confirm profile persistence is gated by `canPersistProfile`.
- Confirm managed fetching has a configured Contentful client.
- Confirm manual resolution passes request selections explicitly.
- Treat a missing profile error from Insights calls as an ordering or continuity problem.

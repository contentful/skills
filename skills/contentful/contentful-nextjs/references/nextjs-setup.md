# Next.js Setup

Use this as the baseline setup for adding Contentful to an existing Next.js project.

## 1) Install SDK

```bash
npm install contentful
```

## 2) Configure environment variables

Add to `.env.local`:

```bash
CONTENTFUL_SPACE_ID=your_space_id
CONTENTFUL_ACCESS_TOKEN=your_cda_access_token
CONTENTFUL_PREVIEW_ACCESS_TOKEN=your_cpa_access_token
CONTENTFUL_ENVIRONMENT_ALIAS=master
# optional fallback if alias is not used
CONTENTFUL_ENVIRONMENT_ID=master
```

Get values in Contentful at **Settings -> API keys**.

## 3) Create a shared client factory

```ts
// lib/contentful/client.ts
import { createClient } from "contentful";

export function createContentfulClient(preview = false) {
  return createClient({
    space: process.env.CONTENTFUL_SPACE_ID as string,
    environment:
      process.env.CONTENTFUL_ENVIRONMENT_ALIAS ||
      process.env.CONTENTFUL_ENVIRONMENT_ID ||
      "master",
    accessToken: preview
      ? (process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN as string)
      : (process.env.CONTENTFUL_ACCESS_TOKEN as string),
    host: preview ? "preview.contentful.com" : undefined,
  });
}
```

## 4) Query entries in server context

```ts
// lib/contentful/queries.ts
import { createContentfulClient } from "./client";

export async function getEntryById(entryId: string, preview = false) {
  const client = createContentfulClient(preview);
  return client.getEntry(entryId);
}
```

For production content, call with `preview = false`.

## 5) Keep tokens server-side

- Do not expose delivery/preview tokens in browser bundles.
- Fetch from server components, route handlers, or API routes.

## 6) Prefer aliases for deployments

- Point clients to an alias (for example `master`) instead of hardcoding release environment IDs.
- Switch alias targets during rollout/rollback without changing application config.

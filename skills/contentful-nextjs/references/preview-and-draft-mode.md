# Preview and Draft Mode

Use this pattern when editors need to preview unpublished content in Next.js.

## Core approach

1. Enable a route handler that turns on Next.js Draft Mode.
2. Detect Draft Mode state in the request lifecycle.
3. When enabled, switch to preview token + preview host.
4. Disable cache for preview requests where required.

## Environment alias pattern

- Keep the client `environment` set to a stable alias (for example `master`).
- Move alias targets between release environments to control rollout/rollback.
- Ensure API keys have access to the alias/target used by your preview and delivery flows.

## App Router pattern

```ts
// app/blog/[slug]/page.tsx
import { draftMode } from "next/headers";
import { getEntryById } from "@/lib/contentful/queries";

export default async function Page({ params }: { params: { slug: string } }) {
  const { isEnabled } = draftMode();
  const entry = await getEntryById(params.slug, isEnabled);
  return <main>{entry?.fields?.title as string}</main>;
}
```

## Preview-aware GraphQL guidance

If using GraphQL:

- pass a `preview` argument in the query when Draft Mode is on,
- use preview access token in Draft Mode,
- disable cache in preview mode.

## Vercel toolkit guidance

When hosted on Vercel, use the official Vercel/Next.js guidance and toolkit route handlers for draft activation.

## Requested canonical references

- `https://www.contentful.com/developers/docs/tools/vercel/content-source-maps-with-vercel/`
- `https://www.contentful.com/developers/docs/tools/vercel/vercel-nextjs/`
- `https://www.contentful.com/developers/docs/tools/vercel/vercel-nextjs/using-draft-mode-to-fetch-unpublished-content-from-contentfuls-apis/`
- `https://www.contentful.com/developers/docs/concepts/environment-aliases/`

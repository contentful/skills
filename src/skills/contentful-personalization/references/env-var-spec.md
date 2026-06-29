# Environment Variables

Set environment variables by runtime. Do not treat browser, server, preview, and edge requirements
as interchangeable.

## Where to Obtain Credentials

The Client ID and environment slug come from the **Contentful Personalization app** installed in your
Contentful space (the same source for both SDK families). There is no separate Ninetailed dashboard —
`app.ninetailed.io` is outdated and should not be referenced.

To find your credentials:

1. Open Contentful.
2. Go to **Organization settings** > **Optimization** > **Data sources and metrics** > **SDK keys**.
3. Copy the **Client ID**.
4. The **Environment** is also visible on this screen.

## Current default SDKs: `@ninetailed/experience.js`

### Browser and Next.js

| Variable | Purpose | Typical runtime |
|---------|---------|-----------------|
| `NEXT_PUBLIC_NINETAILED_CLIENT_ID` | SDK client ID / API key for browser init | Browser |
| `NEXT_PUBLIC_NINETAILED_ENVIRONMENT` | Personalization environment slug, often `main` | Browser |
| `NEXT_PUBLIC_CONTENTFUL_SPACE_ID` | Contentful space ID | Browser or shared |
| `NEXT_PUBLIC_CONTENTFUL_TOKEN` | Contentful Delivery API token | Browser or shared |
| `NEXT_PUBLIC_CONTENTFUL_ENVIRONMENT` | Contentful environment, often `master` | Browser or shared |

### Edge runtime variables

| Variable | Format | Purpose |
|---------|--------|---------|
| `NINETAILED_API_KEY` | `nt_production_*` or `nt_development_*` | API key for edge-side calls. Prefix indicates environment type. |
| `NINETAILED_ENVIRONMENT` | String, usually `main` | Personalization environment slug |

Edge runtimes often do not use the `NEXT_PUBLIC_` naming pattern.

## Modern SDKs: `@contentful/optimization`

The new SDKs take `clientId` and `environment` directly and do not impose one official environment
variable naming scheme. Pick clear, project-local names and use them consistently.

Suggested Next.js names:

| Variable | Purpose | Typical runtime |
|---------|---------|-----------------|
| `NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID` | SDK `clientId` for browser-facing initialization | Browser |
| `NEXT_PUBLIC_OPTIMIZATION_ENVIRONMENT` | Personalization environment slug, often `main` | Browser |
| `NEXT_PUBLIC_CONTENTFUL_SPACE_ID` | Contentful space ID | Browser or shared |
| `NEXT_PUBLIC_CONTENTFUL_TOKEN` | Contentful Delivery API token | Browser or shared |
| `NEXT_PUBLIC_CONTENTFUL_ENVIRONMENT` | Contentful environment, often `master` | Browser or shared |

For other frameworks, use the framework's public-variable convention (e.g.
`VITE_OPTIMIZATION_CLIENT_ID`, `PUBLIC_OPTIMIZATION_CLIENT_ID`). For the Node SDK and the Next.js
adapter's server path, the same `clientId` can be read from a non-public server variable
(`OPTIMIZATION_CLIENT_ID`) when it is only used server-side.

Rules:

- Pick one naming scheme and use it consistently across browser, server, and deployment config.
- Keep Contentful preview tokens server-only unless the preview architecture requires otherwise.

## Preview Support (both families)

| Variable | Purpose | Typical runtime |
|---------|---------|-----------------|
| `NEXT_PUBLIC_CONTENTFUL_PREVIEW_TOKEN` | Contentful Preview API token for preview-capable fetching | Browser or shared, when preview is intentionally enabled |

Keep preview-only behavior behind explicit preview checks.

## Server-Side Contentful Fetching (both families)

Use server-only names when the app fetches Contentful content on the server or in an ESR-style setup.

| Variable | Purpose |
|---------|---------|
| `CONTENTFUL_SPACE_ID` | Contentful space ID |
| `CONTENTFUL_TOKEN` | Contentful Delivery API token |
| `CONTENTFUL_PREVIEW_TOKEN` | Contentful Preview API token |

Do not expose server-only preview tokens to the browser unless that is an intentional part of the
architecture.

## Common Mistakes

- Missing `NEXT_PUBLIC_` prefix in Next.js (key won't be available client-side).
- Duplicate definitions across `.env` and `.env.local` with conflicting values.
- Trailing whitespace or quotes in `.env` values.
- (Ninetailed) Using `NINETAILED_KEY` instead of `NINETAILED_API_KEY`, or a production key
  (`nt_production_*`) in development (or vice versa).

## Rules

1. Add real values to `.env.local`.
2. Add placeholders and comments to `.env.example`.
3. Keep preview and server-only secrets out of committed source.
4. Ensure middleware or edge code receives the variables it needs through the deployment platform,
   not only local `.env` files.

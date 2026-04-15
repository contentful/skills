# Environment Variables

Set environment variables by runtime. Do not treat browser, server, preview, and edge requirements as interchangeable.

## Current Production SDKs: Browser and Next.js

| Variable | Purpose | Typical runtime |
|---------|---------|-----------------|
| `NEXT_PUBLIC_NINETAILED_CLIENT_ID` | SDK client ID or API key for browser-facing SDK initialization | Browser |
| `NEXT_PUBLIC_NINETAILED_ENVIRONMENT` | Personalization environment slug, often `main` | Browser |
| `NEXT_PUBLIC_CONTENTFUL_SPACE_ID` | Contentful space ID | Browser or shared Next.js code |
| `NEXT_PUBLIC_CONTENTFUL_TOKEN` | Contentful Delivery API token | Browser or shared Next.js code |
| `NEXT_PUBLIC_CONTENTFUL_ENVIRONMENT` | Contentful environment, often `master` | Browser or shared Next.js code |

## Preview Support

| Variable | Purpose | Typical runtime |
|---------|---------|-----------------|
| `NEXT_PUBLIC_CONTENTFUL_PREVIEW_TOKEN` | Contentful Preview API token for preview-capable fetching | Browser or shared Next.js code when preview is intentionally enabled |

Keep preview-only behavior behind explicit preview checks.

## Server-Side Contentful Fetching

Use server-only names when the app fetches Contentful content on the server or in an ESR-style setup.

| Variable | Purpose |
|---------|---------|
| `CONTENTFUL_SPACE_ID` | Contentful space ID |
| `CONTENTFUL_TOKEN` | Contentful Delivery API token |
| `CONTENTFUL_PREVIEW_TOKEN` | Contentful Preview API token |

Do not expose server-only preview tokens to the browser unless that is an intentional part of the architecture.

## Edge Runtime Variables

| Variable | Purpose |
|---------|---------|
| `NINETAILED_API_KEY` | API key for edge-side calls |
| `NINETAILED_ENVIRONMENT` | Personalization environment slug |

Edge runtimes often do not use the `NEXT_PUBLIC_` naming pattern.

## Modern SDKs: `@contentful/optimization`

The new SDKs do not impose one official environment variable naming scheme.

Recommended approach:

- pick clear project-local names such as `NEXT_PUBLIC_OPTIMIZATION_CLIENT_ID`
- use one naming scheme consistently across browser, server, and deployment config
- keep Contentful preview tokens server-only unless preview architecture requires otherwise

## Rules

1. Add real values to `.env.local`.
2. Add placeholders and comments to `.env.example`.
3. Keep preview and server-only secrets out of committed source.
4. Ensure middleware or edge code receives the variables it needs through the deployment platform, not only local `.env` files.

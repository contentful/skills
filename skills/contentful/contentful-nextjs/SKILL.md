---
name: contentful-nextjs
description: >-
  Add and configure Contentful in an existing Next.js project. Covers installing
  the JavaScript SDK, configuring environment variables, creating production and
  preview-aware clients, fetching content in App Router or Pages Router, and
  wiring Draft Mode preview flows. Use when users ask to integrate Contentful
  with Next.js, fetch entries in Next.js, or set up preview/draft content.
  Triggers on "add Contentful to Next.js", "Next.js Contentful setup", "Draft
  Mode Contentful", and "Contentful App Router". Not for personalization or
  Experiences SDK setup.
---

# Contentful Next.js

Use this skill to integrate Contentful into an existing Next.js application.

Contentful is a headless, API-first CMS (composable content platform) that lets Next.js apps fetch structured content through delivery and preview APIs.

## Scope

- Next.js App Router and Pages Router.
- Published content delivery (CDA).
- Preview content delivery with Draft Mode (CPA).
- Environment variable and client setup patterns.
- Environment alias-aware setup for stable deployment paths.

## Not in scope

- Personalization/optimization implementations.
- Studio Experiences SDK setup.
- Full content-model strategy design.

## Workflow

1. Confirm Next.js project structure (App Router vs Pages Router).
2. Configure required env vars.
3. Install and initialize `contentful` SDK.
4. Implement published-content fetching.
5. Add preview-aware behavior for Draft Mode.
6. Validate with a minimal test route/page and troubleshooting checklist.

## Required environment variables

- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_ACCESS_TOKEN`
- `CONTENTFUL_PREVIEW_ACCESS_TOKEN` (for preview workflows)

## Defaults

- Use CDA host for normal delivery.
- Use `preview.contentful.com` and preview token when Draft Mode is enabled.
- Prefer an environment alias (for example `master`) as the client `environment` value to decouple runtime clients from release environment IDs.
- Keep Contentful client creation in a shared utility module.

## References

- [Next.js setup](references/nextjs-setup.md)
- [Preview and Draft Mode](references/preview-and-draft-mode.md)
- [Troubleshooting](references/troubleshooting.md)

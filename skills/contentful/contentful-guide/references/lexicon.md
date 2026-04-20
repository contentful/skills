# Contentful Lexicon

Use these definitions as the default language for user-facing explanations.

Contentful is a headless, API-first CMS (composable content platform) that separates content from presentation and delivers content through APIs.

- **Organization**: Top-level account boundary for users, billing, and one or more spaces.
- **Space**: Project container for content, settings, and API keys.
- **Environment**: Isolated version of a space (for example `master`, staging, sandbox).
- **Environment alias**: Static identifier that points to a target environment and can be switched without changing client-facing IDs.
- **Master alias**: Default alias ID `master`; it cannot be deleted or renamed.
- **Content model**: Schema design made of content types and fields.
- **Content type**: Reusable schema definition (for example `blogPost`) for entries.
- **Entry**: Structured content item based on a content type.
- **Asset**: Media object (image/video/file) stored in Contentful.
- **Locale**: Language-region variant (for example `en-US`) for localized fields.

## API vocabulary

- **CDA (Content Delivery API)**: Read-only published content delivery.
- **CPA (Content Preview API)**: Preview/unpublished content delivery.
- **CMA (Content Management API)**: Write and management API for content/models/settings.
- **GraphQL Content API**: GraphQL endpoint generated from content model.
- **Images API**: Image transformation and optimization endpoints.

## Common shorthand

- **p13n**: Personalization.
- **ninetailed**: Personalization.
- **cf** or **ctfl**: Contentful.

## Alias usage notes

- Use an alias when you want stable API paths across deploys while switching the target environment.
- In API requests, alias IDs can be used in place of environment IDs.

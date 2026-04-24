# Ninetailed SDK Packages

## Core SDK

| Package | Purpose | Required |
|---------|---------|----------|
| `@ninetailed/experience.js` | Core SDK — profile management, experience resolution | Yes |

## Framework Integrations

Install exactly one based on your framework:

| Package | Framework |
|---------|-----------|
| `@ninetailed/experience.js-next` | Next.js (App Router and Pages Router) |
| `@ninetailed/experience.js-react` | React (non-Next.js) |
| `@ninetailed/experience.js-gatsby` | Gatsby |
| `@ninetailed/experience.js-remix` | Remix |

## Plugins (optional)

| Package | Purpose |
|---------|---------|
| `@ninetailed/experience.js-plugin-insights` | Built-in analytics dashboard |
| `@ninetailed/experience.js-plugin-preview` | Visual preview in Contentful |
| `@ninetailed/experience.js-plugin-google-tagmanager` | GTM event forwarding |
| `@ninetailed/experience.js-plugin-segment` | Segment event forwarding |
| `@ninetailed/experience.js-plugin-contentsquare` | Contentsquare integration |
| `@ninetailed/experience.js-plugin-ssr` | Server-side rendering support |

## Version Compatibility

- All `@ninetailed/experience.js-*` packages should use the same major version
- The framework package has a peer dependency on the core SDK
- Plugin packages have peer dependencies on the core SDK

## Common Issues

- Mismatched versions between core and plugins (causes runtime errors)
- Installing `@ninetailed/experience.js-react` instead of `-next` in a Next.js project
- Missing framework-specific package (core alone doesn't provide React components)

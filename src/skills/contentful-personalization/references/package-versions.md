# Personalization SDK Packages

## Optimization SDK family (`@contentful/optimization-*`)

Choose by runtime first:

| Runtime | Recommended package |
|---------|---------------------|
| React web app | `@contentful/optimization-react-web` |
| Browser app (non-React) | `@contentful/optimization-web` |
| Node/SSR runtime | `@contentful/optimization-node` |
| Preview tooling | `@contentful/optimization-web-preview-panel` |

Lower-level packages (`@contentful/optimization-core`, `@contentful/optimization-api-client`,
`@contentful/optimization-api-schemas`) are usually not app entry points.

## Legacy Ninetailed SDK family (`@ninetailed/experience.js*`)

Use this family by default unless the user explicitly asks for optimization or the repo already uses
optimization packages.

### Core SDK

| Package | Purpose | Required |
|---------|---------|----------|
| `@ninetailed/experience.js` | Core SDK — profile management, experience resolution | Yes |

### Framework Integrations

Install exactly one based on your framework:

| Package | Framework |
|---------|-----------|
| `@ninetailed/experience.js-next` | Next.js (App Router and Pages Router) |
| `@ninetailed/experience.js-react` | React (non-Next.js) |
| `@ninetailed/experience.js-gatsby` | Gatsby |
| `@ninetailed/experience.js-remix` | Remix |

### Plugins (optional)

| Package | Purpose |
|---------|---------|
| `@ninetailed/experience.js-plugin-insights` | Built-in analytics dashboard |
| `@ninetailed/experience.js-plugin-preview` | Visual preview in Contentful |
| `@ninetailed/experience.js-plugin-google-tagmanager` | GTM event forwarding |
| `@ninetailed/experience.js-plugin-segment` | Segment event forwarding |
| `@ninetailed/experience.js-plugin-contentsquare` | Contentsquare integration |
| `@ninetailed/experience.js-plugin-ssr` | Server-side rendering support |

### Version Compatibility

- All `@ninetailed/experience.js-*` packages should use the same major version
- The framework package has a peer dependency on the core SDK
- Plugin packages have peer dependencies on the core SDK

### Common Issues

- Mismatched versions between core and plugins (causes runtime errors)
- Installing `@ninetailed/experience.js-react` instead of `-next` in a Next.js project
- Missing framework-specific package (core alone doesn't provide React components)

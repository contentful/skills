# SDK Packages

Use `@contentful/optimization-*` for new integrations. The `@ninetailed/experience.js*` packages
remain documented only for diagnosing, repairing, or extending repositories that already use them.

## Recommended: `@contentful/optimization-*`

Read versions from the target project's lockfile. Keep packages in the same dependency graph
compatible; do not force React Native to the same version as the Web family because it can use a
different release cadence.

### Pick by runtime

Install the narrowest package for your runtime:

| Package                                 | Runtime / Use                                      |
| --------------------------------------- | -------------------------------------------------- |
| `@contentful/optimization-react-web`    | React on the web (React, Gatsby, Remix, Vite, CRA) |
| `@contentful/optimization-nextjs`       | Next.js App Router or Pages Router adapter         |
| `@contentful/optimization-web`          | Non-React browser apps and custom adapters         |
| `@contentful/optimization-node`         | Stateless server / SSR / server functions          |
| `@contentful/optimization-react-native` | React Native mobile apps                           |

### Supporting and lower-level packages

| Package                                      | Purpose                                                 |
| -------------------------------------------- | ------------------------------------------------------- |
| `@contentful/optimization-web-preview-panel` | Author preview tooling for an existing Web SDK instance |
| `@contentful/optimization-core`              | Shared foundation — **not used directly** by app code   |
| `@contentful/optimization-api-client`        | Direct Experience API + Insights API client             |
| `@contentful/optimization-api-schemas`       | Zod Mini validation schemas and inferred types          |

### Selection rules

- React on the web → `@contentful/optimization-react-web` (wraps the Web SDK transitively).
- Next.js App Router → `@contentful/optimization-nextjs`; create the bound integration from
  `/app-router`.
- Next.js Pages Router → `@contentful/optimization-nextjs`; create separate bindings from
  `/pages-router` and `/pages-router/server`.
- Non-React browser app → `@contentful/optimization-web`.
- Stateless server / SSR layer → `@contentful/optimization-node`.
- Hybrid SSR + browser follow-up → Node SDK on the server plus the React Web (or Web) SDK in the
  browser.

### Common issues

- Incompatible versions inside one runtime dependency graph; verify the target lockfile rather than
  assuming every platform package shares one version.
- Reaching for `@contentful/optimization-core` directly instead of an environment or framework SDK.
- Wiring `@contentful/optimization-node` + `@contentful/optimization-react-web` by hand in Next.js
  instead of using the `@contentful/optimization-nextjs` adapter.

---

## Existing legacy deployments: `@ninetailed/experience.js`

Install or change these packages only when maintaining a detected legacy deployment. Do not use
them to start a new integration. See `sdk-legacy-guide.md` for the legacy API.

### Core SDK

| Package                     | Purpose                                              | Required |
| --------------------------- | ---------------------------------------------------- | -------- |
| `@ninetailed/experience.js` | Core SDK — profile management, experience resolution | Yes      |

### Framework integrations

Install exactly one based on your framework:

| Package                            | Framework                             |
| ---------------------------------- | ------------------------------------- |
| `@ninetailed/experience.js-next`   | Next.js (App Router and Pages Router) |
| `@ninetailed/experience.js-react`  | React (non-Next.js)                   |
| `@ninetailed/experience.js-gatsby` | Gatsby                                |
| `@ninetailed/experience.js-remix`  | Remix                                 |

### Plugins (optional)

| Package                                              | Purpose                       |
| ---------------------------------------------------- | ----------------------------- |
| `@ninetailed/experience.js-plugin-insights`          | Built-in analytics dashboard  |
| `@ninetailed/experience.js-plugin-preview`           | Visual preview in Contentful  |
| `@ninetailed/experience.js-plugin-google-tagmanager` | GTM event forwarding          |
| `@ninetailed/experience.js-plugin-segment`           | Segment event forwarding      |
| `@ninetailed/experience.js-plugin-contentsquare`     | Contentsquare integration     |
| `@ninetailed/experience.js-plugin-ssr`               | Server-side rendering support |

### Version compatibility

- All `@ninetailed/experience.js-*` packages should use the same major version.
- The framework package has a peer dependency on the core SDK.
- Plugin packages have peer dependencies on the core SDK.

### Common issues

- Mismatched versions between core and plugins (causes runtime errors).
- Installing `@ninetailed/experience.js-react` instead of `-next` in a Next.js project.
- Missing framework-specific package (core alone doesn't provide React components).

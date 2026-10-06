# App Planning

Use this reference when an app idea needs to become a concrete App Framework
build plan.

## Brief Template

- Goal: What job should the app do for editors, admins, developers, or operators?
- User: Who opens the app and how often?
- Surface: Which Contentful locations are needed?
- Content model: Which content types, fields, validations, locales, and
  environments matter?
- Data flow: What data is read, written, synced, or displayed?
- External systems: Which APIs, auth flows, webhooks, or accounts are involved?
- Configuration: Which values belong in installation parameters, instance
  parameters, environment variables, or backend secret storage?
- V1 scope: What is required, what is intentionally deferred, and what must be
  confirmed before coding?
- Validation: What can be tested locally, in a sandbox, and in the Contentful web
  app?

## App Archetypes

### Editor workflow app

Improves how editors work inside Contentful. Common locations:

- `entry-sidebar` for guidance, status, and entry-level actions,
- `entry-field` for specialized field editing,
- `dialog` for pickers and focused workflows,
- `entry-editor` only when the default editor needs substantial replacement.

### Operational app

Helps admins or operators inspect, configure, or process content. Common
locations:

- `app-config` for setup,
- `page` for bulk tools, dashboards, audits, and reports,
- `home` for space-level onboarding or high-visibility workflows.

### Integration app

Connects Contentful to an external system. Common pieces:

- `app-config` for connection setup,
- `entry-sidebar`, `entry-field`, `dialog`, or `page` for user interaction,
- App Actions, Functions, or an external backend for server-side work,
- secret installation parameters for sensitive credentials.

## Location Selection Notes

- `app-config`: recommended for most configurable apps because it gives users a
  UI for installation-time setup.
- `page`: best for full-screen tools that need Contentful data and custom UI.
- `home`: best for replacing a space's Home tab with onboarding, dashboards, or
  learning content.
- `dialog`: best for flows that should open from another app location and then
  return a selection, confirmation, or result.
- `entry-sidebar`: best for small entry-level panels and actions.
- `entry-field`: best when the app owns one field's editing experience.
- `entry-editor`: powerful but high-maintenance; use only when extending one or
  more fields is not enough.

## Architecture Choices

Use client-only App SDK code when:

- the app only reads or writes data the signed-in user can access,
- no sensitive credential is needed,
- the behavior can run in the browser,
- Contentful permissions are enough.

Use the CMA from the app when:

- the app needs structured content management operations,
- those operations should happen as the current user,
- the code can safely run in the browser without exposing secrets,
- the operation is not just reading installation parameters already available
  through `sdk.parameters.installation`.

Use a backend, App Action, or Function when:

- the app needs secret values,
- requests must be verified,
- work is asynchronous or long-running,
- the app handles events or external callbacks,
- another app or service needs a stable server-side endpoint.

Functions are available only for eligible accounts and plans, so confirm
availability before making them a v1 requirement.

## Security Checks

- Treat non-secret installation and instance parameters as readable by space
  members.
- In runtime locations, read non-secret installation parameters from
  `sdk.parameters.installation` instead of fetching app installation records
  through CMA.
- Use secret installation parameters for access tokens and private credentials.
- Do not write tokens into source files, test fixtures, screenshots, logs, or PR
  descriptions.
- Prefer sandbox environments and minimal sample content for development.
- Verify third-party auth and webhook handling against official provider docs
  before implementation.

## Useful Official Docs

- Create a custom app:
  `https://www.contentful.com/developers/docs/extensibility/app-framework/tutorial/`
- App locations:
  `https://www.contentful.com/developers/docs/extensibility/app-framework/locations/`
- App parameters:
  `https://www.contentful.com/developers/docs/extensibility/app-framework/app-parameters/`
- App Actions:
  `https://www.contentful.com/developers/docs/extensibility/app-framework/app-actions/`
- Functions:
  `https://www.contentful.com/developers/docs/extensibility/app-framework/functions/`
- AI app building recommendations:
  `https://www.contentful.com/developers/docs/extensibility/app-framework/ai-recommendations/`

# Repository and Validation

Use this reference once the app plan is ready for implementation.

## Existing Repository Intake

Inspect before editing:

- `package.json` and lockfile to identify package manager and scripts,
- app definition, manifest, or Contentful deployment config if present,
- `src/locations/`, `src/components/`, `src/hooks/`, or equivalent app folders,
- tests and setup files,
- lint, typecheck, build, and preview scripts,
- existing UI library and design conventions,
- README or contributor notes for local Contentful setup.

Preserve the user's existing stack unless there is a clear blocker.

## New Project Defaults

When scaffolding from scratch:

- use `npx create-contentful-app@latest <app-name>`,
- prefer TypeScript,
- keep generated structure recognizable,
- add only dependencies needed by the v1 workflow,
- create a small README or setup note only if the repo lacks one and the app
  needs Contentful-specific local setup.

## Local Development Setup

Typical local loop:

1. Install dependencies with the repo's package manager.
2. Start the app dev server.
3. Create an app definition in a development organization.
4. Set the frontend URL to the local server.
5. Select implemented locations.
6. Install the app into a sandbox or non-production environment.
7. Assign the app to the intended content type, field, sidebar, home, or page
   location.
8. Exercise the main workflow with minimal test content.

## Validation Matrix

Run the checks that exist in the project:

- Install: dependency install succeeds after dependency changes.
- Type safety: `typecheck`, `tsc --noEmit`, or equivalent.
- Lint/format: `lint`, formatter check, or equivalent.
- Tests: unit, component, or integration tests for critical app behavior.
- Build: production build or app bundle command.
- Manual smoke: Contentful web app flow with local app URL.
- Security: no secrets in code, logs, test data, screenshots, or docs.
- Runtime config: if app code reads installation parameters, search for
  `appInstallation.getForOrganization`, `appInstallation.get`, and
  `getForOrganization`; runtime reads should come from
  `sdk.parameters.installation` unless a CMA app-installation call is explicitly
  needed for remote installation records.

If a check is missing, do not invent a passing result. State the gap and run the
closest meaningful alternative.

## Handoff Format

Summarize:

- app name and implemented locations,
- install/config parameters,
- commands to run locally,
- app definition and assignment steps,
- validation run,
- known limitations,
- recommended next work.

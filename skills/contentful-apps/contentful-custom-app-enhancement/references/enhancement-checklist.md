# Enhancement Checklist

Use this reference while improving an existing Contentful custom app.

## Triage Questions

- What user workflow is affected?
- Which location is involved: app config, page, home, dialog, entry editor,
  entry field, entry sidebar, App Action, Function, or backend endpoint?
- Is the issue reproducible locally, in a sandbox, or only in production?
- Does the app read or write entry fields, assets, content types, tags, releases,
  or external system data?
- Are installation or instance parameters involved?
- Are any values sensitive and therefore required to be secret parameters or
  backend-only configuration?
- Does the change need a content model migration, or can it be handled inside the
  app?

## Prioritization

When a report or review contains several issues, address them in this order
unless the user says otherwise:

1. Broken or confusing core workflow.
2. Major mismatch with Forma 36 or Contentful UI patterns.
3. Missing installation, configuration, loading, empty, or error handling.
4. Accessibility and clarity.
5. Tests, build reliability, and maintainability.
6. Visual polish.

Fix the highest item that fits in one small change, and list the rest as
follow-up.

## Code Areas to Inspect

- Location entrypoints such as `src/locations/*`.
- Shared components, hooks, services, and SDK wrappers.
- App definition, deployment, or bundle configuration.
- Installation parameter schemas and config screens.
- Content Management API usage.
- Runtime reads of installation parameters; these should use
  `sdk.parameters.installation` instead of CMA app-installation calls unless the
  app truly needs remote installation records.
- App Action or Function handlers.
- Custom components that recreate Forma 36 components or mix icon systems.
- Tests for the changed flow.
- README or setup docs that explain local Contentful wiring.

## Location-Specific Checks

### App configuration

- Validate required settings before installation.
- Explain connection failures clearly.
- Store only safe values in non-secret parameters.
- Keep the app installable without production-only credentials when possible.
- Follow the configuration screen layout in
  [UI conventions](ui-conventions.md#configuration-screens).

### Entry sidebar

- Keep panels compact and scannable.
- Avoid blocking entry editing unless the app must prevent unsafe action.
- Handle unpublished, archived, localized, and permission-limited entries.

### Entry field

- Preserve field value shape and validation expectations.
- Respect locale handling and disabled/read-only states.
- Avoid replacing built-in field editor behavior unless the app's value justifies
  the maintenance cost.

### Dialog

- Make the launch point and returned result explicit.
- Handle cancel, close, loading, empty, and error states.
- Avoid persisting partial work unless the flow is designed for it.
- Keep layout consistent with any configuration screen that solves the same
  task.

### Page or home

- Support deep links and reloads where possible.
- Paginate or search large Contentful datasets.
- Make destructive or bulk actions previewable and confirmable.

### App Actions, Functions, and backends

- Verify request signatures when accepting Contentful-originated requests.
- Validate payloads at the boundary.
- Keep secrets server-side.
- Test success, retry, and failure states.

## Platform Fit

- Is the chosen location still appropriate for the workflow?
- Are permissions and API access as narrow as the feature allows?
- Are App Actions or Functions used where the platform docs recommend them?

## Validation Matrix

Choose the checks that match the change:

- Unit/component tests for logic and UI state changes.
- Typecheck for SDK and field-shape changes.
- Lint/format for touched files.
- Production build for dependency or bundling changes.
- Manual local app flow in the Contentful web app, after confirming the app
  definition points at the local URL.
- Keyboard and label check for UI changes.
- Runtime config search for `appInstallation.getForOrganization`,
  `appInstallation.get`, and `getForOrganization` when installation-parameter
  access is touched.
- CMA smoke test for write operations.
- App Action, Function, webhook, or backend endpoint smoke test for server-side
  changes.

## PR or Handoff Notes

Include:

- request source and user pain,
- changed locations and files,
- behavior before and after,
- validation run,
- assumptions and access gaps,
- rollout or sandbox testing notes,
- any follow-up that should not block this small improvement.

## Official Docs to Check When Needed

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
- Forma 36:
  `https://f36.contentful.com/`

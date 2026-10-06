---
name: contentful-custom-app-enhancement
description: >-
  Improve, debug, and extend an existing Contentful App Framework custom app in
  a customer's own repository. Use when users provide a bug report, feature
  request, support note, customer feedback, or direct change request for an
  existing custom app, including app configuration, sidebar, field editor,
  dialog, page, home, App Action, Function, installation parameters, local
  validation, or PR preparation. Also triggers on "fix my Contentful app",
  "improve a custom app", "enhance App Framework app", "debug custom app",
  "update sidebar app", and "custom app feature request". Not for creating a
  brand new app from scratch (contentful-custom-app-from-scratch), generic API
  examples (contentful-api), migrations (contentful-migration), or website
  integration (contentful-nextjs).
license: MIT
metadata:
  author: contentful
  version: "2.0.0"
allowed-tools: mcp__contentful-mcp__* mcp__plugin_contentful_contentful-mcp__*
---

# Contentful Custom App Enhancement

Use this skill to turn a bug report, support note, or feature request into a
small, reviewable improvement for an existing Contentful custom app.

Default to the user's app repository and workflow. Do not assume a specific
repository convention, publication process, or review policy unless the user
provides one.

When a comparable public Contentful Marketplace app or example in Contentful's
public apps repository (`https://github.com/contentful/apps`) exists, use it as
a best practice reference for App Framework patterns and UX polish without
inheriting its release or distribution workflow.

## Inputs

Accept:

- bug reports,
- customer or editor feedback,
- support tickets or issue links,
- screenshots or screen recordings,
- direct requests to change a known custom app,
- partial notes about an App Framework behavior.

If the source material is incomplete, continue with local code and provided
context when the risk is low. Ask a targeted question when the missing answer
could change the user-facing behavior, data writes, authentication, or
deployment path.

## Workflow

### 1. Build the Request Context

Identify:

- original request and affected users,
- current app behavior versus expected behavior,
- Contentful location and workflow affected,
- space, environment, content type, field, locale, and role assumptions,
- external service or credential dependencies,
- evidence available locally and evidence still missing.

Separate confirmed facts from assumptions.

### 2. Inspect the Existing App

Before editing:

- check repository status and avoid overwriting user changes,
- inspect `package.json`, scripts, lockfile, and framework conventions,
- locate the relevant app locations and SDK usage,
- review existing tests and nearby components,
- identify app definition, installation parameters, and deployment notes if they
  exist,
- confirm whether the app uses App SDK, React Apps Toolkit, Forma 36,
  contentful-management, App Actions, Functions, or an external backend.

For a reusable checklist, use
[Enhancement checklist](references/enhancement-checklist.md).

### 3. Decide Whether the Change Is Small Enough

Proceed with implementation when the change can plausibly be:

- scoped to one app,
- explained in one short PR,
- validated locally or in a sandbox,
- reviewed without broad product redesign,
- implemented without risky migrations or secret-handling changes.

Pause and clarify when the request requires:

- production data changes,
- a new external auth model,
- major content model redesign,
- multi-app coordination,
- new backend infrastructure,
- unavailable Function or plan capabilities,
- ambiguous editor behavior.

### 4. Plan the Smallest Useful Change

Write a short plan before editing:

- files or app locations likely to change,
- data read/write behavior,
- UI and validation updates,
- tests or manual verification to run,
- risks and rollback path.

Prefer improving the existing flow over replacing it.

### 5. Implement in the App's Existing Style

- Reuse current framework, routing, hooks, components, and package manager.
- Keep TypeScript precise and avoid broad `any` types.
- Use Forma 36 for Contentful web app UI unless the app already uses another
  deliberate design system.
- Preserve editor trust: show loading, empty, error, permission, and destructive
  action states when relevant.
- Keep configuration UI explicit about what values are stored at installation
  versus instance scope.
- Treat non-secret parameters as readable by space members.
- When runtime locations need installation parameters, prefer
  `sdk.parameters.installation`. Do not add or preserve CMA app-installation
  reads in sidebar, field editor, entry editor, page, dialog, home, mount
  effects, render paths, or click handlers just to retrieve app configuration.
- Do not expose tokens or private credentials in client code.
- Keep changes narrow; avoid unrelated formatting, dependency churn, or
  refactors.

### 6. Validate the Improvement

Run the closest available validation:

- targeted unit or component tests,
- typecheck,
- lint or formatter check,
- production build,
- local dev server smoke test,
- Contentful web app manual flow in a non-production space,
- grep or ripgrep for `appInstallation.getForOrganization`,
  `appInstallation.get`, and `getForOrganization` when installation-parameter
  access is touched, confirming runtime config reads use
  `sdk.parameters.installation` or documenting why a CMA app-installation call
  remains,
- App Action, Function, or backend endpoint test when the change touches
  server-side behavior.

When validation requires credentials or access the agent does not have, explain
exactly what remains for the user to verify.

### 7. Prepare Reviewable Output

If the user wants a commit or PR:

- create a focused branch using the user's repo convention when known,
- keep commits small and conventional,
- do not stage unrelated local files,
- include request context, implementation summary, validation, and open
  questions in the PR draft.

If the user only asked for the fix, end with:

- context,
- assessment,
- implementation summary,
- validation,
- remaining risks or follow-up.

## Guardrails

- Do not force a code change when the better answer is product clarification.
- Do not overfit one vague report without saying what is uncertain.
- Do not widen the scope into a rewrite unless the user asks.
- Do not assume app users have publication or distribution requirements unless
  they say so.
- Do not claim Contentful plan features, SDK behavior, or API limits from memory
  when current official docs should be checked.

## Related Skills

- `contentful-custom-app-from-scratch` - design and build a new custom app.
- `contentful-api` - concrete REST and GraphQL API examples.
- `contentful-migration` - content model migration scripts.
- `contentful-guide` - Contentful concepts and API routing.

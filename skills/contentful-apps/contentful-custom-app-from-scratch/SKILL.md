---
name: contentful-custom-app-from-scratch
description: >-
  Design, scaffold, build, and validate a new Contentful App Framework custom
  app for a customer's own repository or workspace. Use when users want to
  create a custom app from an idea, choose App Framework locations, build a
  sidebar app, field editor app, page app, dialog, configuration screen, App
  Action, or Function-backed app, scaffold with create-contentful-app, or make a
  locally testable app for an organization-specific Contentful workflow. Also
  triggers on "build a Contentful app", "custom app from scratch", "App
  Framework app", "sidebar app", "field editor app", "page app", "app action",
  and "app function". Not for generic Contentful API examples (contentful-api),
  content model migrations (contentful-migration), or website integration
  (contentful-nextjs).
license: MIT
metadata:
  author: contentful
  version: "2.0.0"
allowed-tools: mcp__contentful-mcp__* mcp__plugin_contentful_contentful-mcp__*
---

# Contentful Custom App From Scratch

Use this skill to turn a customer app idea into a small, locally testable
Contentful App Framework implementation.

Default to the user's own repository, Contentful organization, and app delivery
workflow unless they explicitly choose another destination.

Public Contentful Marketplace apps and Contentful's public apps repository
(`https://github.com/contentful/apps`) can be useful references for mature App
Framework patterns, UX conventions, and configuration flows. Use them as
examples to adapt, not as required repo structure or publication process.

## Working Style

- Start with the app's job, primary users, affected content model, and target
  Contentful surface before writing code.
- Ask only for information that changes the architecture or prevents a wrong
  build.
- Prefer the smallest version that proves the value in a non-production space.
- Ground capability decisions in official App Framework docs and the current
  project structure.
- Keep user-owned secrets, tokens, and production content out of generated code,
  logs, and examples.

## Workflow

### 1. Create the Implementation Brief

Capture a short brief before scaffolding:

- app concept in one sentence,
- target users and the workflow they need to improve,
- Contentful locations needed for v1,
- content types, fields, locales, and environments involved,
- external systems, authentication, or APIs involved,
- expected installation and configuration model,
- must-have v1 behavior,
- assumptions and non-goals,
- validation plan for local and sandbox testing.

If the idea is still broad, propose 2-3 feasible v1 options and recommend the
smallest useful one.

For planning details, use [App planning](references/app-planning.md).

### 2. Choose the App Shape

Choose locations by user workflow:

- Use `app-config` when the app needs installation-time setup.
- Use `entry-sidebar` for entry-level context, status, helper actions, and
  lightweight insights.
- Use `entry-field` to replace or enhance a field's editing experience.
- Use `dialog` for focused picker, confirmation, or multi-step flows launched
  from another location.
- Use `page` or `home` for dashboards, bulk tools, onboarding, or full-screen
  operational workflows.
- Use `entry-editor` only when replacing or heavily extending the full entry
  editing experience is worth the maintenance cost.
- Use App Actions or Functions only when the app needs asynchronous behavior,
  server-side execution, verified inbound requests, event handling, or access to
  secret values outside the browser.

If sensitive credentials are required, model them as secret installation
parameters and consume raw values only in a backend or Function-backed path.

### 3. Inspect or Scaffold the Project

If the user already has a repo:

1. Inspect `package.json`, app-related docs, existing app locations, build
   scripts, tests, and style conventions.
2. Reuse the repo's framework, package manager, lint/test setup, and component
   patterns.
3. Identify whether the app already uses `@contentful/app-sdk`,
   `@contentful/react-apps-toolkit`, `@contentful/f36-components`, or
   `contentful-management`.

If the user does not have a repo:

1. Scaffold with `npx create-contentful-app@latest <app-name>`.
2. Prefer TypeScript unless the user requests JavaScript.
3. Keep the first scaffold close to the generated project until the local app is
   wired into Contentful and verified.

### 4. Build in Contentful-Native Style

- Use the App SDK or React Apps Toolkit to access the current location SDK.
- Use Forma 36 components for Contentful web app UI.
- Keep UI dense, clear, and editor-friendly; avoid marketing layouts inside the
  Contentful web app.
- Include loading, empty, permission, and error states when they affect the main
  workflow.
- Keep field and entry writes explicit, reversible where possible, and easy for
  editors to understand.
- When runtime locations need app configuration, read installation parameters
  from `sdk.parameters.installation`. Do not fetch app installation records
  through CMA from mount effects, render paths, hooks, or user interactions just
  to retrieve configured parameters.
- Avoid broad abstractions until the app has more than one real usage path.
- Do not expose management tokens, API keys, or third-party credentials in
  browser code.

### 5. Wire the Local App into Contentful

Create or update the app definition in a development organization or sandbox:

- set the frontend URL to the local dev server, commonly
  `http://localhost:3000`,
- select only the locations implemented in v1,
- define required installation or instance parameters,
- install the app into a non-production space or environment,
- assign the app to the relevant content types, fields, sidebar, home page, or
  page location,
- seed minimal test content when needed.

For local test and handoff steps, use
[Repository and validation](references/repo-and-validation.md).

### 6. Verify Before Handoff

Run the closest meaningful checks available in the user's project:

- package install check when dependencies changed,
- typecheck and lint,
- unit or component tests,
- production build,
- local dev server smoke test,
- manual Contentful web app flow in a non-production space.
- `rg -n "appInstallation\\.(getForOrganization|get)\\(|getForOrganization"`
  over the app source when runtime code reads installation parameters, with any
  remaining CMA app-installation call explained.

Do not claim the app works unless you ran the relevant validation or clearly
state what could not be run.

### 7. Hand Off the Result

End with:

- what was built,
- how to run it locally,
- how to install or assign it in Contentful,
- validation performed,
- remaining assumptions, limitations, or credentials needed,
- suggested next iteration.

## Related Skills

- `contentful-custom-app-enhancement` - improve or debug an existing custom app.
- `contentful-api` - concrete CMA, CDA, CPA, Images API, and GraphQL examples.
- `contentful-migration` - content model migration scripts.
- `contentful-guide` - Contentful concepts and API routing.

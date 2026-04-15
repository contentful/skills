---
name: optimization-readiness
description: >-
  Assess whether a codebase is ready for Contentful optimization and personalization.
  Analyzes framework, Contentful SDK setup, component architecture, and rendering
  pipeline by reading code — no execution, no API calls. Produces a readiness report
  with actionable recommendations. Use when asked to check optimization readiness,
  audit personalization setup, evaluate prerequisites, determine if a project can
  support personalization or A/B testing. Also triggers on "am I ready for
  personalization", "can I install Ninetailed", "is my project ready", "evaluate my
  codebase", "readiness check", "can my app support A/B testing". Not for installing
  or configuring SDKs — use $optimization-setup for that. Not for diagnosing issues
  in an existing setup — use $optimization-doctor for that.
---

# Optimization Readiness

Analyze a customer's codebase and produce a readiness report for Contentful
personalization, optimization, and analytics.

This is a **read-only analysis** — read files, search code, inspect configs.
Do not run the project, execute scripts, or call external APIs.

## Procedure

Run checks A through E in order. For each check, report what you found and
assess readiness. Then produce the final report.

### A. Framework Detection

**Goal**: Identify the framework, version, router type, and rendering mode.

1. Read `package.json` — look for `next`, `gatsby`, `remix`, `react-scripts`,
   `vite` in dependencies or devDependencies
2. If Next.js:
   - Check version in package.json (App Router requires 13.4+)
   - Check for `app/` directory → App Router; `pages/` directory → Pages Router;
     both may coexist
   - Search for rendering indicators:
     - `getServerSideProps` → SSR
     - `getStaticProps` / `generateStaticParams` → SSG
     - `revalidate` in getStaticProps return → ISR
     - `'use client'` directives → Client Components (App Router)
     - Server Components (default in App Router `app/` dir)
3. If Gatsby: check for `gatsby-config.js/ts`, `gatsby-browser.js/ts`
4. If Remix: check for `remix.config.js`, `app/routes/` directory
5. If none of the above: plain React (CRA, Vite, custom)

**Assess**:
- Next.js (any version) → Fully supported
- Gatsby → Supported (client-side only)
- Remix → Partially supported (community patterns)
- Plain React → Supported (client-side only)
- Non-React framework → Not currently supported

### B. Contentful SDK Setup

**Goal**: Determine if Contentful is integrated and how.

1. Check `package.json` for:
   - `contentful` (Delivery/Preview SDK)
   - `@contentful/rich-text-react-renderer` (rich text)
   - `contentful-management` (Management API)
2. Search source code for `createClient` calls from `contentful` package
3. If client found, check:
   - Is `space` configured? (hardcoded or env var)
   - Is `accessToken` configured?
   - Is there a preview client? (look for `host: 'preview.contentful.com'`)
4. Check for environment variables in `.env*` files and code:
   - `CONTENTFUL_SPACE_ID` or `NEXT_PUBLIC_CONTENTFUL_SPACE_ID`
   - `CONTENTFUL_TOKEN` or `NEXT_PUBLIC_CONTENTFUL_TOKEN` (delivery)
   - `CONTENTFUL_PREVIEW_TOKEN` or `NEXT_PUBLIC_CONTENTFUL_PREVIEW_TOKEN`
5. Check the `include` depth in Contentful queries — personalization needs
   at least 2 levels of reference resolution

**Assess**:
- SDK installed + client configured + env vars present → Ready
- SDK installed but client not found → Needs configuration
- No Contentful SDK → Must install first

### C. Existing Ninetailed Setup

**Goal**: Detect if personalization is already (partially) installed.

1. Check `package.json` for any `@ninetailed/experience.js*` packages:
   - `@ninetailed/experience.js` (core)
   - `@ninetailed/experience.js-react` (React bindings)
   - `@ninetailed/experience.js-next` (Next.js)
   - `@ninetailed/experience.js-plugin-*` (plugins)
   - `@ninetailed/experience.js-utils-contentful` (Contentful utilities)
2. Search for `NinetailedProvider` in source files
3. Search for `<Experience` component usage
4. Check for environment variables:
   - `NINETAILED_CLIENT_ID` or `NEXT_PUBLIC_NINETAILED_CLIENT_ID`
   - `NINETAILED_ENVIRONMENT` or `NEXT_PUBLIC_NINETAILED_ENVIRONMENT`
5. If provider found, check which plugins are configured:
   - `NinetailedInsightsPlugin` or `NinetailedAnalyticsPlugin` → analytics
   - `NinetailedPreviewPlugin` → preview editor
   - `NinetailedSsrPlugin` → server-side rendering
   - `NinetailedPrivacyPlugin` → consent management

**Assess**:
- No packages installed → Fresh setup (use $optimization-setup)
- Packages installed but no provider → Partially configured, needs completion
- Provider configured with plugins → Already set up (check completeness)

### D. Component Architecture

**This is the most important check.** Personalization wraps components with
an `<Experience>` component that swaps the baseline for a variant. This only
works if components are self-contained and rendered via a content type mapper.

1. **Search for the component mapper pattern**:
   - Object maps: `{ hero: Hero, cta: CTA, ... }` or similar
   - Switch statements on `sys.contentType.sys.id` or `__typename`
   - Dynamic imports or lookups based on content type
   - Common file names: `BlockRenderer`, `ComponentRenderer`, `ContentTypeMapper`,
     `DynamicComponent`, `SectionRenderer`

2. **Assess component isolation**:
   - Do components receive all data via props? (good)
   - Do components fetch their own data internally? (problem — can't swap variants)
   - Are components tightly coupled to parent state? (problem)
   - Do components have side effects that depend on specific content? (problem)

3. **Check for existing experience integration**:
   - Search for `nt_experiences` field references in code
   - Search for `ExperienceMapper` usage
   - Search for `<Experience` component usage
   - If found: which content types are already wrapped?

4. **Identify personalizable content types**:
   - Look at the component mapper — which content types have corresponding components?
   - Which of these represent above-the-fold or high-value content?
     (heroes, banners, CTAs, pricing tables, feature sections)
   - Are there content types with no component mapping?

**Assess**:
- Component mapper found + components are isolated → Ready for personalization
- No mapper but components are isolated → Needs a mapper (moderate effort)
- Components fetch their own data → Needs refactoring (significant effort)
- No clear component/content type structure → Significant restructuring needed

For detailed patterns, see [references/component-patterns.md](references/component-patterns.md).

### E. Rendering Pipeline

**Goal**: Assess whether the data-fetching pattern supports personalization.

1. **Identify the data-fetching layer**:
   - Next.js Pages Router: `getStaticProps`, `getServerSideProps`
   - Next.js App Router: server components, `fetch()` in RSC
   - Gatsby: `gatsby-node.js` + GraphQL queries
   - Remix: `loader` functions
   - Client-only: `useEffect` + API calls

2. **Check fetching location**:
   - Page level (good) — content fetched once, passed down to components
   - Component level (harder) — each component fetches its own data
   - Mixed — some page-level, some component-level

3. **Check for hard-coded content**:
   - Components with literal text/images that should come from Contentful
   - These can't be personalized until migrated to CMS content

4. **Check Contentful query depth**:
   - The `include` parameter in `getEntries` calls
   - Needs at least 2 for experiences to resolve (entry → experience → variant)
   - Check if `.withoutUnresolvableLinks` is used (recommended)

5. **Check for ISR/revalidation**:
   - `revalidate` in `getStaticProps` return value
   - ISR is ideal for personalization — static generation with incremental updates

**Assess**:
- Page-level fetching + sufficient include depth → Ready
- Component-level fetching → Needs restructuring
- Hard-coded content → Needs CMS migration
- Include depth < 2 → Simple fix (increase include value)

For framework-specific notes, see [references/framework-notes.md](references/framework-notes.md).

## Report Format

After completing all checks, produce a report in this format:

```markdown
## Optimization Readiness Report

### Framework: [Name] [Version] ([Router Type]) [STATUS]
- [Rendering mode detected]
- [Compatibility assessment]

### Contentful Setup: [STATUS]
- [SDK + version status]
- [Client configuration status]
- [Environment variables status]
- [Include depth assessment]

### Existing Ninetailed Setup: [STATUS]
- [Packages found / not found]
- [Provider status]
- [Plugin status]

### Component Architecture: [STATUS]
- [Mapper pattern found/not]
- [Component isolation assessment]
- [Content types with/without mappings]
- [Personalizable content types identified]

### Rendering Pipeline: [STATUS]
- [Data fetching pattern]
- [Fetching location assessment]
- [Hard-coded content identified]

### Overall: [READY / READY WITH MINOR CHANGES / NEEDS WORK / SIGNIFICANT RESTRUCTURING NEEDED]

### Recommendations
1. [Specific, actionable next step]
2. [...]
3. [...]

Use $optimization-setup for guided installation and configuration.
```

**Status markers**: Use these consistently:
- `READY` — No changes needed for this area
- `MINOR CHANGES` — Small fixes (config tweaks, increasing include depth)
- `NEEDS WORK` — Moderate effort (add mapper, restructure fetching)
- `NOT READY` — Significant restructuring required

## Assessment Criteria

For the detailed rubric for each check, see
[references/readiness-criteria.md](references/readiness-criteria.md).

The **overall assessment** is determined by the worst-performing area:
- All READY → **READY**
- Worst is MINOR CHANGES → **READY WITH MINOR CHANGES**
- Worst is NEEDS WORK → **NEEDS WORK**
- Any NOT READY → **SIGNIFICANT RESTRUCTURING NEEDED**

Exception: if the only issue is "no Ninetailed packages installed" but
everything else is ready, the overall assessment is still **READY** — that's
what $optimization-setup is for.

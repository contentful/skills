---
name: contentful-personalization-readiness
description: >-
  Assess whether a codebase is ready for Contentful optimization and personalization.
  Analyzes framework, Contentful SDK setup, component architecture, and rendering
  pipeline by reading code — no execution, no API calls. Produces a readiness report
  with actionable recommendations. Use when asked to check optimization readiness,
  audit personalization setup, evaluate prerequisites, validate setup, determine if
  a project can support personalization or A/B testing. Also triggers on "am I ready
  for personalization", "can I install Ninetailed", "is my project ready", "evaluate
  my codebase", "readiness check", "can my app support A/B testing", "pre-check",
  "prerequisites for personalization". Not for installing or configuring SDKs — use
  the contentful-personalization-setup skill for that. Not for diagnosing issues in an existing setup — use
  the contentful-personalization-doctor skill for that.
license: MIT
---

# Optimization Readiness

Analyze a customer's codebase and produce a readiness report for Contentful
personalization, optimization, and analytics.

This is a **read-only analysis** — read files, search code, inspect configs.
Do not run the project, execute scripts, or call external APIs.

For background on how personalization works (the content model, rendering
flow, and why each check matters), see
[references/how-personalization-works.md](references/how-personalization-works.md).
Read it before starting if you're unfamiliar with Ninetailed.

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
- Next.js 13.4+ → Fully supported (App Router stable)
- Next.js 13.0 to 13.3 → Supported with caution (App Router is experimental; prefer Pages Router patterns)
- Next.js < 13 (for example Next.js 10/11/12) → `NOT READY` for setup; recommend framework upgrade first
- Gatsby → Supported (client-side only)
- Remix → Partially supported (community patterns)
- Plain React → Supported (client-side only)
- Non-React framework → Not currently supported

If the framework baseline is below supported levels, explicitly block setup work and route the user to prerequisite upgrades before running the contentful-personalization-setup skill.

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
- No packages installed → `NOT INSTALLED` (expected baseline for first-time adoption; use the contentful-personalization-setup skill)
- Packages installed but no provider → `PARTIAL SETUP` (installation started, wiring still needed)
- Provider configured with plugins → `CONFIGURED` (check completeness and plugin fit)

Important tone guidance for this section:
- Treat "no Ninetailed packages" as neutral, not a failure.
- Do **not** label check C as `NOT READY` when a project simply has no existing personalization SDK.
- Prefer wording like "Fresh setup" or "Not installed yet".

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

3. **Check for existing experience integration** (presence is a positive signal;
   absence tells us nothing — content types may be extended in Contentful
   without any explicit code references):
   - Search for `nt_experiences` field references in code or type definitions
   - Search for `ExperienceMapper` usage
   - Search for `<Experience` component usage
   - If found: which content types are already wrapped? This means
     personalization is already partially integrated.

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

4. **Check Contentful query depth** (critical — see how-personalization-works.md):
   - Search for `.include(` or `include:` in `getEntries`/`getEntry` calls
   - Parse the actual numeric value:
     - `include: 3` or higher → good (entry → experience → variant all resolved)
     - `include: 2` → minimum viable (works with `.withoutUnresolvableLinks`)
     - `include: 1` or `include: 0` → experiences won't resolve; MINOR CHANGES
     - No include parameter → defaults vary by SDK version; flag for review
   - No Contentful queries found at all → content not from CMS; NEEDS WORK
   - Check if `.withoutUnresolvableLinks` is used (recommended)

5. **Check for ISR/revalidation**:
   - `revalidate` in `getStaticProps` return value
   - ISR is ideal for personalization — static generation with incremental updates

6. **Note SSR/edge capability** (not a blocker — just capability assessment):
   - Search for `middleware.ts` or `middleware.js` → Next.js edge middleware
   - Search for `wrangler.toml` → Cloudflare Workers
   - Search for `@ninetailed/experience.js-plugin-ssr` in package.json
   - If any found: note "SSR/edge-side personalization possible (no flash of default content)"
   - If none: note "Client-side personalization only (baseline shows briefly before variant swap)"

**Assess**:
- Page-level fetching + include ≥ 2 → Ready
- Component-level fetching → Needs restructuring
- Hard-coded content → Needs CMS migration
- Include depth < 2 → Simple fix (increase include value)
- No Contentful queries → Content not from CMS; needs migration

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

### Existing Ninetailed Setup: [NOT INSTALLED / PARTIAL SETUP / CONFIGURED]
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

Use the contentful-personalization-setup skill for guided installation and configuration.
```

**Status markers**: Use these consistently for framework/contentful/component/rendering checks:
- `READY` — No changes needed for this area
- `MINOR CHANGES` — Small fixes (config tweaks, increasing include depth)
- `NEEDS WORK` — Moderate effort (add mapper, restructure fetching)
- `NOT READY` — Significant restructuring required

For **Existing Ninetailed Setup** only (check C), use:
- `NOT INSTALLED` — Neutral baseline; setup not started yet
- `PARTIAL SETUP` — Installation started but incomplete
- `CONFIGURED` — Provider and core wiring present

## Example Report

```markdown
## Optimization Readiness Report

### Framework: Next.js 14.1.0 (App Router) READY
- App Router detected (`app/` directory with `layout.tsx`)
- Server Components with `'use client'` boundaries in place
- ISR via `revalidate: 5` in multiple routes
- Compatible with both client-side and server-side personalization

### Contentful Setup: READY
- `contentful` v10.6.21 installed
- Client configured in `lib/contentful.ts` with space ID from env var
- Preview client configured (preview.contentful.com)
- Include depth: 10 (sufficient)
- `.withoutUnresolvableLinks` used

### Existing Ninetailed Setup: NOT INSTALLED
- No `@ninetailed/*` packages in package.json
- No NinetailedProvider in source
- Fresh setup — use the contentful-personalization-setup skill for guided installation

### Component Architecture: MINOR CHANGES
- Component mapper found in `components/Renderer/BlockRenderer.tsx`
  - Maps 8 content types: hero, cta, feature, banner, pricing, faq, testimonial, footer
  - Components are well-isolated (props → JSX, no internal data fetching)
- No `nt_experiences` field references (expected — Ninetailed not yet installed)
- 2 content types (`callout`, `stat-grid`) have components but are not in the mapper
- Recommendation: Add `callout` and `stat-grid` to ContentTypeMap

### Rendering Pipeline: READY
- Data fetched at page level in Server Components
- Entries passed down as props to Client Component wrappers
- No hard-coded content detected in personalizable components
- SSR/edge capability: `middleware.ts` present (edge middleware ready)

### Overall: READY WITH MINOR CHANGES

### Recommendations
1. Add `callout` and `stat-grid` to the ContentTypeMap in BlockRenderer.tsx
2. Run the contentful-personalization-setup skill for guided Ninetailed SDK installation
3. Edge middleware detected — consider server-side personalization for no-flash experience
```

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
what the contentful-personalization-setup skill is for.

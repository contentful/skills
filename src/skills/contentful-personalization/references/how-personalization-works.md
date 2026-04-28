# How Contentful Personalization Works

Use this reference to explain your readiness findings to the user. When
reporting what you found, explain **why** it matters — not just what's
present or missing.

## Common shorthand

- **p13n** or **ninetailed** means personalization.
- **cf** or **ctfl** means Contentful.

## The Core Idea

Contentful Personalization (powered by Ninetailed) lets content authors
create **experiences** — rules that swap content for specific audiences.
For example: visitors from Germany see a German hero banner, while everyone
else sees the default.

On the code side, this works by wrapping React components with an
`<Experience>` component that:

1. Checks which audience the current visitor belongs to
2. Selects the matching variant (or falls back to baseline)
3. Renders the same component with the variant's content instead

This is why **component isolation** is the most important readiness factor —
the component must render identically whether it receives baseline or
variant content.

## Content Model

Three Contentful content types are installed by the Ninetailed app:

### nt_experience

An experience defines the personalization rule:
- Which **audience** to target (reference to `nt_audience`)
- Which **variants** to show (references to your own content entries)
- **Distribution** weights (e.g., 50/50 for A/B tests)
- **Type**: `nt_personalization` (deterministic) or `nt_experiment` (random split)

### nt_audience

An audience defines targeting rules (e.g., "visitors from Germany",
"returning users", "users with trait plan=enterprise"). Rules are
evaluated server-side by the Experience API.

### nt_mergetag

A merge tag is a content entry that maps a display name to a profile data
path. Content editors create these in Contentful (e.g., "City of the visitor"
→ `location.city`). Fields:

| Field | Purpose |
|-------|---------|
| `nt_name` | Display name (e.g., "First Name", "City of the visitor") |
| `nt_mergetag_id` | Dot-notation path into the visitor profile (e.g., `traits.firstName`, `location.city`, `session.count`) |
| `nt_fallback` | Optional fallback text when the profile value is unavailable |

Merge tags provide **inline personalization** — inserting visitor-specific
values into content, as opposed to the `<Experience>` component which swaps
entire component variants.

Two usage paths:
1. **In rich text** (CMS-authored): editors embed `nt_mergetag` entries
   inline in Contentful rich text fields. The rich text renderer detects
   embedded entries with content type `nt_mergetag` and renders a `<MergeTag>`
   component.
2. **Direct in code** (developer-authored): use `<MergeTag id="traits.firstName"
   fallback="friend" />` anywhere in JSX. This bypasses Contentful entries
   entirely — just reads from the visitor profile.

The `<MergeTag>` React component resolves the `id` path against the current
visitor profile (via `useProfile()` hook) and renders the value or fallback.
The path supports both dot notation (`traits.firstName`) and underscore
notation (`traits_firstName`) — underscores are treated as potential dots
for backward compatibility.

### The `nt_experiences` field (on your own content types)

Regular content types (hero, banner, CTA, etc.) get an `nt_experiences`
field added in Contentful — an array of references to `nt_experience`
entries. This links a piece of content to the experiences that can
personalize it. The field is added via the Ninetailed app in the
Contentful UI, not in code.

When the SDK's `BlockRenderer` accesses `block.fields.nt_experiences`,
it handles absence gracefully (`|| []`). The field silently appears in
API responses once the content type is extended — no code changes needed
for it to show up.

**What finding `nt_experiences` references in code tells you**: the customer
has already done integration work — they built a BlockRenderer or typed
their entries to include this field. This means they're **past the setup
phase** and personalization is wired into their rendering pipeline.

**What NOT finding it tells you**: very little. The content types may or
may not be extended in Contentful — we can't tell from code alone because
this skill doesn't make API calls. Many customers use dynamic typing
and never explicitly reference `nt_experiences` in their TypeScript types.
The absence is not a problem — it just means we can't assess CMS-side
readiness from the codebase.

## The Rendering Flow

```
1. Page fetches entries from Contentful (including nested nt_experiences)
          |
2. For each entry, extract nt_experiences and map them:
   ExperienceMapper.isExperienceEntry() → filter valid ones
   ExperienceMapper.mapExperience()     → convert to SDK format
          |
3. Wrap the component with <Experience>:
   <Experience
     id={entry.sys.id}
     component={MyComponent}
     experiences={mappedExperiences}
     {...entry.fields}
   />
          |
4. The SDK resolves which variant to show:
   - Checks visitor profile against experience audiences
   - Selects variant based on distribution weights
   - Renders MyComponent with variant entry fields (or baseline if no match)
```

## Why Component Isolation Matters

The `<Experience>` wrapper works by passing different **entry data** to
the same component. The baseline hero entry has `{ headline: "Welcome" }`,
and the variant has `{ headline: "Willkommen" }`. The wrapper swaps which
entry the component receives.

This breaks if the component:
- **Fetches its own data** — it ignores the variant data passed via props
- **Has hardcoded content** — there's no entry to swap
- **Depends on parent state** — can't be wrapped independently

Components that work: receive all content via props, render it, return JSX.
Pure functions of their input.

## Why the Component Mapper Matters

The `ContentTypeMap` pattern (mapping Contentful content type IDs to React
components) is important because:

1. It centralizes the content type → component mapping in one place
2. The `BlockRenderer` can wrap **every** component with `<Experience>`
   automatically — you don't add wrappers manually per-page
3. It supports variant rendering: the variant entry has the same content
   type, so it resolves to the same component

Without a mapper, you'd need to add `<Experience>` wrappers individually
in every page template for every personalizable component.

## Why Include Depth Matters

When you fetch a page from Contentful, the `include` parameter controls
how many levels of referenced entries are resolved:

```
include: 1  →  Page → Section entries (resolved)
                       ↳ nt_experiences (NOT resolved — just links)

include: 2  →  Page → Section entries (resolved)
                       ↳ nt_experiences → Experience entries (resolved)
                                          ↳ Variant entries (NOT resolved)

include: 3  →  Page → Section entries (resolved)
                       ↳ nt_experiences → Experience entries (resolved)
                                          ↳ Variant entries (resolved) ✓
```

With `include < 2`, the `nt_experiences` field contains unresolved links
instead of full entries. `ExperienceMapper.isExperienceEntry()` filters
these out, so personalization silently does nothing — the component always
shows the baseline.

**Recommendation**: `include: 3` or higher for reliable experience resolution.
At minimum `include: 2` with `.withoutUnresolvableLinks`.

## Why Publishing State Matters

The Contentful Delivery API (CDA) only returns published content. The
Preview API (CPA) returns both draft and published content.

When an editor attaches an experience to a baseline entry:

1. The `nt_experiences` field is updated on the entry
2. This is a **draft change** until the entry is re-published
3. The CDA response for this entry will NOT include the new experience
4. The CPA response WILL include it

This means personalization can appear to work in preview mode but fail
in production. The same applies to experience entries and variant entries:
all must be published for the CDA to resolve the complete chain.

**Publishing order matters**: publish variant entries first, then
experience entries, then the baseline entry. If you publish the baseline
before its experiences are published, the CDA will see `nt_experiences`
as unresolved links.

**Diagnostic approach**: Compare the same entry fetched from CDA vs CPA.
If the CPA has `nt_experiences` data that the CDA lacks, the entry needs
to be republished. The doctor's content inspection automates this check.

## Client-Side vs Server-Side Personalization

### Client-side (default)

1. Server sends static HTML with baseline content
2. Browser loads, SDK initializes, contacts Experience API
3. SDK resolves experiences and swaps components to show variants
4. **Flash of default content** — user briefly sees baseline before swap

### Server-side / Edge (SSR/ESR)

1. Server/edge contacts Experience API before rendering HTML
2. HTML is rendered with the personalized variant already in place
3. Browser receives pre-personalized HTML — **no flash**
4. Client SDK hydrates for ongoing interactions

Server-side requires:
- Edge middleware (`middleware.ts`) or a Cloudflare Worker
- The `@ninetailed/experience.js-plugin-ssr` package
- Cookie management (`ntaid` cookie for profile identification)
- Preflight mode (`?type=preflight`) to prevent double-counting events

**This is why the readiness check notes SSR/edge capability** — it's not
required, but it's the path to the best user experience.

## The Provider

`NinetailedProvider` is a React context provider that:
- Initializes the Ninetailed SDK with the API key
- Manages the visitor's profile state
- Communicates with the Experience API to resolve variants
- Provides hooks (`useProfile`, `useNinetailed`) to child components
- Loads plugins (analytics, preview, SSR, privacy)

It must wrap the entire component tree — typically in `_app.tsx` (Pages
Router) or `app/layout.tsx` (App Router via a Client Component wrapper).

## Package Quick Reference

| Package | What it does |
|---------|-------------|
| `@ninetailed/experience.js` | Core SDK — profile management, event tracking, variant resolution |
| `@ninetailed/experience.js-react` | React integration — Provider, `<Experience>`, hooks |
| `@ninetailed/experience.js-next` | Next.js auto-page-tracking, ESR support, re-exports React SDK |
| `@ninetailed/experience.js-shared` | API client, event builders, type definitions |
| `@ninetailed/experience.js-utils-contentful` | `ExperienceMapper`, `AudienceMapper` for Contentful entries |
| `@ninetailed/experience.js-plugin-insights` | Tracks component views/clicks/hovers (required for experiment results) |
| `@ninetailed/experience.js-plugin-preview` | Preview editor UI for testing audiences/experiences in-browser |
| `@ninetailed/experience.js-plugin-ssr` | Server-side rendering support (cookie-based profile persistence) |
| `@ninetailed/experience.js-plugin-privacy` | GDPR consent management — filters events based on consent state |
| `@ninetailed/experience.js-plugin-google-tagmanager` | Pushes personalization events to GTM data layer |
| `@ninetailed/experience.js-plugin-segment` | Forwards events to Segment CDP |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_NINETAILED_CLIENT_ID` | API key for the Ninetailed Experience API |
| `NEXT_PUBLIC_NINETAILED_ENVIRONMENT` | Environment slug (default: `main`) |
| `NEXT_PUBLIC_CONTENTFUL_SPACE_ID` | Contentful Space ID |
| `NEXT_PUBLIC_CONTENTFUL_TOKEN` | Contentful Delivery API token |
| `NEXT_PUBLIC_CONTENTFUL_PREVIEW_TOKEN` | Contentful Preview API token (optional) |
| `NEXT_PUBLIC_CONTENTFUL_ENVIRONMENT` | Contentful environment (default: `master`) |

Variable prefix depends on framework: `NEXT_PUBLIC_` (Next.js), `GATSBY_`
(Gatsby), or no prefix (server-only / Remix / plain React).

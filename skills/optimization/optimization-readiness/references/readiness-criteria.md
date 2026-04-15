# Readiness Criteria

Detailed rubric for each readiness check.

## Framework Compatibility

| Framework | Version | Support Level | Notes |
|-----------|---------|--------------|-------|
| Next.js (Pages Router) | Any | Full | SSR, SSG, ISR all supported |
| Next.js (App Router) | 13.4+ | Full | Server Components require client boundary for provider |
| Gatsby | 4+ | Full (client-side) | No SSR personalization; plugin-based provider |
| Remix | 1+ | Partial | Community patterns; loader-based data fetching compatible |
| React (CRA) | 16.8+ | Full (client-side) | Hooks required; no SSR |
| React (Vite) | 16.8+ | Full (client-side) | Same as CRA |
| Vue, Svelte, Angular | Any | Not supported | No SDK available |
| Non-JS frameworks | Any | Not supported | API-only integration possible but no skill coverage |

### Next.js Version Details

- **< 13.0**: Pages Router only. Fully supported.
- **13.0-13.3**: App Router experimental. Pages Router recommended.
- **13.4+**: App Router stable. Both routers supported.
- **14+**: App Router preferred. Server Actions available but not required.

### Rendering Mode Assessment

| Mode | Personalization Support | Notes |
|------|------------------------|-------|
| SSR (`getServerSideProps`) | Full + server-side | Can personalize before HTML reaches browser |
| SSG (`getStaticProps`) | Client-side only | Static HTML, personalization applied after hydration |
| ISR (`revalidate`) | Client-side + cacheable | Best balance of performance and personalization |
| Client-only (`useEffect`) | Client-side only | Simplest setup but flash-of-default-content |
| RSC (Server Components) | Emerging | Provider must be in a Client Component boundary |
| Edge Middleware | Full + edge-side | Fastest server-side personalization |

## Contentful Setup Rubric

| Criterion | READY | MINOR CHANGES | NEEDS WORK |
|-----------|-------|---------------|------------|
| SDK installed | `contentful` in deps | — | Not installed |
| Client configured | `createClient()` found | Multiple clients not unified | No client setup |
| Env vars | Space ID + token in .env | Hardcoded values | Neither .env nor hardcoded |
| Include depth | ≥ 2 in queries | < 2 (easy fix) | No Contentful queries found |
| Preview client | Configured | — | Not configured (optional) |

## Component Architecture Rubric

This is the most important assessment — it determines how much work is needed.

### Component Isolation

| Level | Description | Assessment |
|-------|-------------|------------|
| **Fully isolated** | Props in, JSX out. No internal data fetching. No side effects dependent on specific content. | READY |
| **Mostly isolated** | Small amount of internal state (e.g., open/close toggle) but content comes from props. | READY |
| **Partially coupled** | Some data fetching inside component but main content via props. | MINOR CHANGES — extract data fetching |
| **Tightly coupled** | Component fetches its own content from Contentful internally. | NEEDS WORK — must restructure |
| **Hardcoded** | Content is literal strings/images in the component. | NOT READY — must migrate to CMS |

### Component Mapper Pattern

| Pattern | Assessment |
|---------|-----------|
| Object map (`{ hero: Hero, cta: CTA }`) | READY — standard pattern |
| Switch statement on content type ID | READY — works but object map is cleaner |
| Dynamic imports based on content type | READY — works with personalization |
| No mapper — components rendered manually in page | NEEDS WORK — add a mapper layer |
| No clear content type → component relationship | NOT READY — need to establish mapping |

### Content Type Coverage

Count how many content types have:
- A corresponding React component in the mapper
- All props coming from Contentful entry fields

Report any gaps:
- Content types with no component → can't personalize these
- Components not in the mapper → won't receive experience variants

## Rendering Pipeline Rubric

| Criterion | READY | MINOR CHANGES | NEEDS WORK | NOT READY |
|-----------|-------|---------------|------------|-----------|
| Fetching location | Page level | Mix of page + some component | All component-level | No clear pattern |
| Content source | All from Contentful | Mostly CMS, some hardcoded | Mix | Mostly hardcoded |
| Include depth | ≥ 2 | 1 (increase it) | 0 or not set | No Contentful queries |
| Data flow | Props down from page | Some context, mostly props | Heavy context/global state | Chaotic |

## Environment Variables Checklist

### Required for Ninetailed (will be needed by $optimization-setup)

```
NEXT_PUBLIC_NINETAILED_CLIENT_ID    # Ninetailed API key
NEXT_PUBLIC_NINETAILED_ENVIRONMENT  # Environment slug (default: 'main')
```

### Required for Contentful (should already exist)

```
NEXT_PUBLIC_CONTENTFUL_SPACE_ID     # Contentful Space ID
NEXT_PUBLIC_CONTENTFUL_TOKEN        # Delivery API token
```

### Recommended

```
NEXT_PUBLIC_CONTENTFUL_PREVIEW_TOKEN  # Preview API token
NEXT_PUBLIC_CONTENTFUL_ENVIRONMENT    # Contentful environment (default: 'master')
CONTENTFUL_MANAGEMENT_TOKEN           # For content type setup
```

Note: Variable names may use `CONTENTFUL_*` instead of `NEXT_PUBLIC_CONTENTFUL_*`
depending on whether they're needed client-side. Both patterns are common.

## Overall Assessment Logic

The overall verdict is the **worst** individual assessment, with one exception:

- If the only issue is "no Ninetailed packages installed" (check C) but all
  other checks pass, the overall is still **READY** — installing packages is
  what $optimization-setup handles.

| Worst Individual | Overall |
|-----------------|---------|
| All READY | **READY** |
| MINOR CHANGES | **READY WITH MINOR CHANGES** |
| NEEDS WORK | **NEEDS WORK** |
| NOT READY | **SIGNIFICANT RESTRUCTURING NEEDED** |

---
name: contentful-nextjs
description: >-
  Add and configure Contentful in an existing Next.js project. Covers installing
  the JavaScript SDK, configuring environment variables, creating production and
  preview-aware clients, fetching content in App Router or Pages Router, and
  wiring Draft Mode preview flows. Use when users ask to integrate Contentful
  with Next.js, fetch entries, set up preview or draft content, or configure
  the Contentful client. Also triggers on "Contentful SDK Next.js",
  "contentful.js", "fetch Contentful entries", "get content from Contentful",
  "Contentful preview", "preview mode", "Contentful environment variables",
  "Contentful client setup", "create Contentful client", "Pages Router
  Contentful", "getStaticProps Contentful", "Server Components Contentful",
  "revalidate Contentful", "ISR Contentful". Not for personalization or
  Experiences SDK setup (contentful-personalization). Not for non-Next.js
  frameworks (contentful-guide can route to platform docs).
argument-hint: "[what to set up]"
allowed-tools: Bash(npm install contentful) Bash(npm install @contentful/rich-text-*) mcp__contentful-mcp__* mcp__plugin_contentful_contentful-mcp__*
---

# Contentful Next.js

Use this skill to integrate Contentful into an existing Next.js application.

Contentful is a headless, API-first CMS (composable content platform) that lets Next.js apps fetch structured content through delivery and preview APIs.

## Scope

- Next.js App Router and Pages Router.
- Published content delivery (CDA).
- Preview content delivery with Draft Mode (CPA).
- Environment variable and client setup patterns.
- Environment alias-aware setup for stable deployment paths.

## Not in scope

- Personalization/optimization implementations.
- Studio Experiences SDK setup.
- Full content-model strategy design.

## Contentful MCP note

- If the user wants easier agent-driven interaction with Contentful during setup, suggest the Contentful MCP server docs: `https://www.contentful.com/developers/docs/tools/mcp-server/`.
- Keep this skill focused on Next.js implementation. MCP guidance complements setup but does not replace app-side client wiring.

## Project state

```!
echo "=== Contentful packages ===" && node -e "try{const p=require('./package.json');const d={...p.dependencies,...p.devDependencies};const c=Object.entries(d).filter(([k])=>k.includes('contentful'));console.log(c.length?c.map(([k,v])=>k+'@'+v).join('\n'):'(Contentful SDK not installed)')}catch{console.log('(no package.json)')}" 2>/dev/null
echo ""
echo "=== Contentful env vars ===" && grep -h CONTENTFUL .env.local .env 2>/dev/null | sed 's/=.*/=<set>/' || echo "(no Contentful env vars found in .env.local or .env)"
echo ""
echo "=== Router type ===" && ([ -d "app" ] && echo "App Router detected (app/ directory exists)" || ([ -d "pages" ] && echo "Pages Router detected (pages/ directory exists)" || echo "(could not detect router type)"))
```

## Workflow

1. Check the latest stable Next.js release online at `https://github.com/vercel/next.js/releases` when version-specific guidance is needed.
2. Confirm Next.js project structure (App Router vs Pages Router).
3. Configure required env vars. If they are missing, ask the user to add them to `.env.local` before continuing, and explain where to find each value.
4. Install and initialize `contentful` SDK.
5. Implement published-content fetching.
6. Add preview-aware behavior for Draft Mode.
7. Validate with a minimal test route/page and troubleshooting checklist.

## Version-check policy

- Do not rely on memory for "latest Next.js version" claims.
- Verify against `https://github.com/vercel/next.js/releases` before recommending upgrades, compatibility workarounds, or version-specific fixes.
- Treat the latest non-prerelease tag as default unless the user explicitly asks for canary/RC guidance.

## Required environment variables

- `CONTENTFUL_SPACE_ID` - Find it in the Contentful URL (`/spaces/<SPACE_ID>/...`) or in **Space settings -> API keys**.
- `CONTENTFUL_ACCESS_TOKEN` - CDA token from **Space settings -> API keys**.
- `CONTENTFUL_PREVIEW_ACCESS_TOKEN` (for preview workflows) - CPA token from **Space settings -> API keys**.

Creating an API key in Contentful provides both tokens needed here:
- CDA token -> `CONTENTFUL_ACCESS_TOKEN`
- CPA token -> `CONTENTFUL_PREVIEW_ACCESS_TOKEN`

## Defaults

- If the user does not specify router type, default to Next.js App Router guidance.
- Use CDA host for normal delivery.
- Use `preview.contentful.com` and preview token when Draft Mode is enabled.
- Prefer an environment alias (for example `master`) as the client `environment` value to decouple runtime clients from release environment IDs.
- Keep Contentful client creation in a shared utility module.

## References

- [Next.js setup](references/nextjs-setup.md)
- [Preview and Draft Mode](references/preview-and-draft-mode.md)
- [Troubleshooting](references/troubleshooting.md)

---
name: contentful-guide
description: >-
  Explain core Contentful concepts and route users to the right implementation
  skill or documentation. Use when users ask conceptual questions, need
  terminology clarified, want help choosing between APIs (CDA/CMA/CPA/GraphQL),
  or need guidance on the Contentful MCP server. Also triggers on "Contentful
  101", "which Contentful API", "how do I get started", "which skill should I
  use", "what does X mean in Contentful", "Contentful glossary", "CDA vs CPA",
  "CDA vs GraphQL", "how does Contentful work", "Contentful architecture",
  "explain environments", "what are aliases", "content model design",
  "headless CMS", "Contentful MCP", "MCP server", "set up MCP",
  "Remix Contentful", "Astro Contentful", "Gatsby Contentful",
  "SvelteKit Contentful", "Nuxt Contentful". Not for framework-specific
  implementation (contentful-nextjs), migrations (contentful-migration),
  personalization (contentful-personalization), or hands-on REST/GraphQL
  request examples (contentful-api).
argument-hint: "[concept or API name]"
allowed-tools: mcp__contentful-mcp__* mcp__plugin_contentful_contentful-mcp__*
---

# Contentful Guide

Use this skill as the routing and vocabulary layer for Contentful tasks.

Contentful is a headless, API-first CMS (composable content platform) where teams model content once and deliver it to many channels.

## What this skill does

1. Clarifies core terms (space, environment, environment alias, content model, content type, entry, asset, locale).
2. Maps user intent to the right API (CDA, CPA, CMA, GraphQL, Images API).
3. Routes implementation requests to the right skill and docs.
4. Prevents incorrect setup by identifying when a request is not in this skill's scope.

## Routing rules

- If the user asks to add Contentful to a Next.js project, use the contentful-nextjs skill.
- If the user asks about optimization/personalization/analytics setup or debugging, route to the `contentful-personalization` skill.
- If the user asks to write content type migrations or schema changes, route to the `contentful-migration` skill.
- If the user asks for concrete REST/GraphQL requests (curl examples, headers, query parameters, payload shapes for CMA/CDA/CPA/Images/GraphQL), route to the `contentful-api` skill.
- If the user asks for conceptual guidance, architecture tradeoffs, or where to read docs, stay in this skill.
- If the user asks about environment aliases and deployment workflows, stay in this skill unless they also ask for framework implementation.

## API chooser

- Use **CDA** for published delivery content in websites/apps.
- Use **CPA** for unpublished preview content.
- Use **CMA** for write operations (create/update/manage content and models).
- Use **GraphQL Content API** when query shape control is preferred over REST payloads.
- Use **Images API** for image transformations.

## Contentful MCP note

- The Contentful MCP server is often the easiest way to let an agent interact with Contentful.
- Use it when the user wants conversational access to spaces, entries, and content model context without wiring SDK code first.
- Canonical docs: `https://www.contentful.com/developers/docs/tools/mcp-server/`

## Operating pattern

When answering with this skill:

1. Define terms using shared vocabulary from `references/lexicon.md`.
2. Pick the right docs path from `references/docs-map.md`.
3. If implementation is requested, hand off using `references/skill-routing.md`.
4. Keep answers concise and cite canonical docs paths.

## Guardrails

- Do not invent product capabilities, API behavior, or limits.
- Do not provide framework code unless routing to the specialized implementation skill.
- Prefer official docs over memory when details may be version-sensitive.

## References

- [Lexicon](references/lexicon.md)
- [Docs map](references/docs-map.md)
- [Skill routing](references/skill-routing.md)

---
name: contentful-guide
description: >-
  Explain core Contentful concepts and route users to the right implementation skill
  or documentation. Use when users ask "what is" questions, need Contentful
  terminology clarified, need help choosing between APIs (CDA/CMA/CPA/GraphQL),
  ask about the Contentful MCP server, or want easier agent-driven interaction with
  Contentful,
  or ask where to find the correct docs for a task. Also triggers on "Contentful
  101", "which Contentful API should I use", "how do I get started", and
  "which skill should I use". Not for framework-specific implementation steps;
  route those to the contentful-nextjs skill or other specialized skills.
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
- If the user asks about optimization/personalization/analytics setup or debugging, route to contentful-personalization skills.
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

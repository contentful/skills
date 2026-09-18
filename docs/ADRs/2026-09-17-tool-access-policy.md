# Tool access policy for skills that call the Contentful Management API

- **Status:** Accepted
- **Date:** 2026-09-17

## Context

Skills that operate on live Contentful spaces (e.g. `exo-content-bindings`, `contentful-migration`) need to call the Contentful Management API. An agent running a skill may have different tools available depending on the host platform: a shell/exec tool (for `curl`), the `contentful-mcp` MCP server, both, or neither.

Each `SKILL.md`'s `allowed-tools` frontmatter and its reference docs need one consistent, statable rule for which tool to reach for, rather than leaving each skill to invent its own ordering or silently assume a tool is present.

## Decision

Skills that call the CMA follow this order:

1. **Favor `curl` (via a shell/exec tool) when one is available.** Examples in reference docs are written as `curl` commands against CMA endpoints.
2. **Fall back to the `contentful-mcp` MCP tools if no shell/exec tool is available.** Same endpoints and payloads, translated to whatever tool the server exposes.
3. **Fail gracefully if neither is available.** Tell the user the API can't be reached and stop — never guess at space state or fabricate a plan without introspecting first.

## Consequences

- `allowed-tools` frontmatter declares both `Bash(curl *)` and the relevant `mcp__*contentful-mcp__*` tool patterns, so either path is permitted without over-scoping to unrelated tools.
- Reference docs write procedural steps as `curl` examples first, with a short preamble noting the MCP fallback and the fail-stop behavior, instead of duplicating every step twice.
- A skill author adding a new CMA-calling skill can reuse this ordering without re-deriving it — see [exo-content-bindings/references/api-workflow.md](../../skills/exo-content-bindings/references/api-workflow.md) for the applied pattern.

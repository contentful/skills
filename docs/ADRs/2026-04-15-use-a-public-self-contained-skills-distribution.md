# Use a public, self-contained skills distribution

## Status

Accepted

## Context

Contentful guidance must work across multiple AI coding agents without requiring each platform to maintain a separate copy. Skill installers copy individual skill directories, so customer-facing skills cannot rely on repository-relative files outside their own directory.

Commit `f074345` (2026-04-15) established the repository structure, distribution boundary, plugin metadata, and validation foundation.

## Decision

Use the public `skills/` tree as the customer distribution boundary. Package each skill as a self-contained agentskills-compatible directory, allow recursive domain grouping, and project the same content through platform-specific Claude and Cursor plugin manifests.

Keep contributor-only authoring skills and implementation source outside `skills/`. Validate both skill structure and recursive installer discovery in CI.

## Consequences

- One repository serves Claude, Cursor, Codex, and other agentskills-compatible consumers.
- Every distributed skill must carry its own instructions, scripts, and references.
- Shared repository-local files cannot become hidden runtime dependencies of a customer skill.
- Platform manifests must remain synchronized with the distributed skill set and release version.

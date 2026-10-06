# Build interactive personalization with Skill Kit

## Status

Accepted

## Context

Personalization setup, diagnosis, and development require structured multi-step workflows, validation, user-facing presentation, and optional MCP execution. A prose-only skill could describe those operations but could not enforce the same typed workflow and protocol behavior.

Commit `fdf720c` (2026-04-23) introduced the composite `contentful-personalization` skill. Its current implementation keeps TypeScript source under `src/skills/contentful-personalization/` and generated customer output under `skills/contentful-personalization/`.

## Decision

Author the interactive personalization workflow with `@contentful/skill-kit`, test and typecheck the TypeScript source, and compile it in Node mode into the public `skills/` distribution tree. Commit source and generated output together.

Expose the generated workflow through its run script so the Claude plugin can launch a local stdio MCP server, while retaining `SKILL.md` and reference documents for ordinary skill discovery.

## Consequences

- Workflow states, actions, validation, presentation, CLI behavior, and MCP behavior share one typed source.
- The distribution includes a generated Node bundle and therefore requires Node.js 24+ at runtime for that interactive skill.
- Reviewers must inspect both source changes and generated diffs.
- Hand-editing generated output creates drift and is not a supported authoring path.

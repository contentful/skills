# Architecture

## What this repo is

`contentful/skills` is a **distribution repo**, not a running service. It packages [Agent Skills](https://agentskills.io) — Markdown instructions plus reference docs — that teach AI coding agents how to work with Contentful. There is no server, no deployed application; the "runtime" is whatever coding agent (Claude Code, Cursor, Copilot, Gemini CLI, and 35+ other platforms) loads a skill's `SKILL.md` into context.

## Distribution boundary

Two directories hold skills with different visibility:

- **`skills/`** — public, distributed skills. Installed via the `contentful-skills` Claude Code plugin, `npx skills add contentful/skills`, or the agentskills.io spec on any supporting platform. Every skill here must be safe to ship to customers: no internal-only references, no unpublished APIs.
- **`.agents/skills/`** (symlinked to `.claude/skills` for Claude Code discovery) — internal contributor tooling, such as `skill-authoring`. Never distributed.

A skill moving from draft to public means moving (and scrubbing) it from internal tooling into `skills/`.

## Skill anatomy

Each skill under `skills/<name>/` follows the same shape:

- `SKILL.md` — YAML frontmatter (name, description with explicit triggers, license, `allowed-tools`) plus a Markdown body. Kept under ~500 lines; the body is the "judgment layer" — when to use what, decision guides, common mistakes.
- `package.json` — `@contentful/skill-<name>`, version, license, `files` allowlist.
- `references/*.md` — on-demand detail (API call sequences, resolver patterns, worked examples) linked from `SKILL.md` rather than inlined, per the progressive-disclosure model: metadata is cheap to scan, instructions stay small, references load only when needed.

Two skills (`contentful-personalization`) are built with `@contentful/skill-kit`: TypeScript source in `src/skills/<name>/` compiles to the CLI binaries and generated `SKILL.md` that ship in `skills/<name>/`. Most skills are plain Markdown with no build step.

## Packaging and distribution paths

- **Claude Code plugin** — `.claude-plugin/plugin.json` points at `./skills` and declares two bundled MCP servers: `contentful-mcp` (hosted, `mcp.contentful.com`) for live CMS access, and `contentful-personalization` (a local stdio server built from the skill-kit skill) for structured personalization workflows.
- **Universal CLI / other platforms** — `npx skills add contentful/skills` (optionally `--skill <name>`) reads the same `skills/` directory directly; no plugin manifest required.
- **Cursor** — added as a remote GitHub rule, same source directory.

## Validation and CI

- `local-skills/skills/skill-authoring/scripts/quick_validate.py skills --all` checks every skill in `skills/` against the frontmatter/structure conventions (naming regex, required fields, description length, line-count budget). This is the primary content gate — run it before opening a PR.
- `pnpm typecheck` / `pnpm test` cover the skill-kit-built skills' TypeScript source under `src/skills/`.
- GitHub Actions run CodeQL and Wiz scanning (SAST, IaC, secrets, vulnerabilities, data) on every PR, plus an org-wide "Governance Controls" check (ARCHITECTURE.md, decision records, AGENTS.md, CONTRIBUTING.md, Renovate usage).

## Where decisions live

Non-obvious, repo-scoped decisions (tool-access policy for a skill, format choices that aren't derivable from reading the code) are recorded as ADRs under `docs/ADRs/`.

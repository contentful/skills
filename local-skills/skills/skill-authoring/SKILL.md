---
name: skill-authoring
description: >-
  Create, modify, review, and fix Agent Skills in the contentful/skills repository.
  Use when creating a new skill from scratch, editing an existing SKILL.md or package.json,
  reviewing skill structure for correctness, fixing skill formatting or naming issues,
  or looking up skill conventions. Triggers on "create a skill", "add a skill",
  "skill template", "review this skill", "fix skill structure", "SKILL.md format",
  "naming convention", "how do I make a skill". Not for general development or non-skill work.
---

# Skill Authoring

How to create, modify, and review [Agent Skills](https://agentskills.io) for the
`contentful/skills` repository.

For the full conventions document with templates, detailed rules, and examples, see
[references/conventions.md](references/conventions.md).

## What is an Agent Skill?

An Agent Skill is a directory containing a `SKILL.md` file with YAML frontmatter
and markdown instructions. It can optionally include scripts, reference documents,
and assets. The format is portable across Claude Code, Cursor, GitHub Copilot,
OpenAI Codex, Gemini CLI, and other agent platforms.

Skills use **progressive disclosure** — three tiers of context loading:

1. **Metadata** (~100 tokens): `name` and `description` fields loaded at startup
   for all installed skills. This is how the agent decides which skills are relevant.
2. **Instructions** (< 5000 tokens recommended): The full `SKILL.md` body loaded
   when the agent activates the skill.
3. **Resources** (on demand): Files in `scripts/`, `references/`, and `assets/`
   loaded only when the instructions reference them.

The `description` field is the most important piece — it's always in context and
determines whether the skill activates. Keep the `SKILL.md` body concise (under
500 lines). Heavy reference material goes in separate files.

## Repository Layout

```
skills/                         Distributed to customers (distribution boundary)
  contentful-personalization/   A skill — name field is "contentful-personalization"
    SKILL.md
    package.json
    references/
    scripts/
    bin/
.agents/skills/                 Internal contributor skills (never distributed)
  skill-authoring/
    SKILL.md
    package.json
    references/
```

`skills/` is the distribution boundary. Only its contents are installed via
`npx skills add contentful/skills`. Internal skills in `.agents/skills/` stay
in the repo. `.claude/skills` is a symlink to `.agents/skills/` for Claude Code
discovery.

## SKILL.md Format

### Required Frontmatter

| Field | Constraints |
|-------|-------------|
| `name` | 1-64 chars. Lowercase letters, numbers, hyphens only. No leading/trailing/consecutive hyphens. **Must match parent directory name.** |
| `description` | 1-1024 chars. What the skill does AND when to use it. This is the sole activation trigger — make it count. |

### Optional Frontmatter

| Field | Purpose |
|-------|---------|
| `license` | License name or reference to bundled file |
| `compatibility` | 1-500 chars. Environment requirements (e.g., "Requires Node.js 18+") |
| `metadata` | Arbitrary key-value map. Use `metadata.author` and `metadata.version`. |
| `allowed-tools` | Space-delimited pre-approved tools (experimental) |

### Claude Code Extensions

These fields are beyond the base agentskills.io spec — use for skills in this repo:

| Field | Description |
|-------|-------------|
| `disable-model-invocation` | `true` prevents auto-loading; user invokes via `/<name>` |
| `user-invocable` | `false` hides from `/` menu; Claude can still auto-load |
| `context` | `fork` runs in an isolated subagent |
| `agent` | Subagent type when `context: fork` |
| `model` | Model override when skill is active |
| `effort` | Effort level override (`low`, `medium`, `high`, `max`) |

### Body Content

Markdown after the frontmatter. No format restrictions, but recommended sections:

- Step-by-step instructions
- Examples of inputs and outputs
- Common edge cases and gotchas
- Pointers to reference files (loaded on demand)

Reference scripts and docs with relative paths from the skill root:

```markdown
Run the diagnostic:
    ${CLAUDE_SKILL_DIR}/scripts/check.sh --env production

For API details, see [references/api.md](references/api.md).
```

## Writing Effective Descriptions

The description is the **sole activation trigger**. The agent scans all installed
skills at startup and loads only `name` + `description` (~100 tokens each). The
full SKILL.md body loads only when the agent judges the skill relevant.

Write descriptions that are slightly "pushy" — it's better to activate too often
than to miss a relevant trigger.

**Best pattern:**
```
Use this skill when [explicit scenarios]. Triggers on [keyword list].
Does NOT apply to [boundary conditions].
```

**Good:**
```yaml
description: >-
  Diagnose and fix Contentful optimization and personalization issues.
  Validates configuration, SDK versions, API connectivity. Use when
  troubleshooting optimization problems, debugging personalization behavior,
  or checking why experiments aren't running. Also triggers on "why isn't
  personalization working" or "check my config". Not for initial end-to-end
  setup from scratch — that is covered by the onboard flow in the same
  `contentful-personalization` skill.
```

**Bad:**
```yaml
description: Helps with optimization issues.
```

Include:
- Imperative phrasing ("Diagnose and fix", not "A skill for diagnosing")
- Direct trigger keywords the user would naturally say
- Indirect keywords (e.g., for a deploy skill, also mention "ship", "release")
- Negative scope to prevent false activations
- Cross-references to related skills with explicit phrasing (for example, `the contentful-guide skill` for general CMS help)

## Directory Structure

### Documentation-only skill (minimum)

```
my-skill/
  SKILL.md              Required
  package.json          Required (even for docs-only)
```

### Skill with references

```
my-skill/
  SKILL.md              Required
  package.json          Required
  references/           On-demand documentation
    api.md
    patterns.md
  assets/               Templates, data files, static resources
```

### Skill with scripts

```
my-skill/
  SKILL.md              Required
  package.json          Required
  scripts/              Stable public interface (SKILL.md references these)
    check               Executable (chmod +x)
    fix                 Executable (chmod +x)
  src/                  Optional — implementation behind scripts/
    ...
  references/           On-demand documentation
```

## package.json

Required for every skill, even documentation-only. Provides versioning and
npm-compatible metadata.

**Distributed skills** (in `skills/`):
```json
{
  "name": "@contentful/skill-<domain>-<skill-name>",
  "version": "1.0.0",
  "description": "Same as SKILL.md description (short form)",
  "license": "MIT",
  "files": ["SKILL.md", "references/**", "scripts/**", "assets/**"]
}
```

**Internal skills** (in `.agents/skills/`):
```json
{
  "name": "skill-name",
  "version": "1.0.0"
}
```

Versioning happens at the package level — `metadata.version` in SKILL.md
frontmatter should mirror `package.json` version.

## Naming Conventions

| Context | Pattern | Example |
|---------|---------|---------|
| Directory name | `<domain>-<product-or-topic>`, lowercase-hyphen | `contentful-personalization` |
| `name` field | must match directory | `contentful-personalization` |
| npm package | `@contentful/skill-<skill-name>` | `@contentful/skill-contentful-personalization` |

Name validation rules: 1-64 chars, `[a-z0-9-]` only, no leading/trailing/consecutive
hyphens, must match parent directory name exactly.

Skills live in a flat structure directly under `skills/`. The name must be globally
unambiguous (not just `readiness`) — the domain prefix makes this possible while
remaining compatible with the agentskills.io spec.

## Script Conventions

### The key pattern

`scripts/` is the skill's **stable public interface**. SKILL.md references
only `scripts/<name>`, never internal paths.

Scripts can be anything executable: bash, Python, compiled binaries, Node.js,
etc. The only requirement is that they are executable (`chmod +x`) and follow
the design rules below.

**Simple skills** — executables directly in `scripts/`:

```
contentful-personalization/
  scripts/
    run                 Entry script (chmod +x) or thin wrapper
```

**Complex skills** — wrappers in `scripts/` delegate to an implementation
directory (e.g., `src/`, `bin/`):

```
my-code-skill/
  scripts/
    check                 Thin wrapper → delegates to src/ or bin/
  src/                    Optional — TypeScript source for skill-kit builds
    ...
  bin/                    Optional — compiled output
```

The wrapper decouples the skill's contract from its implementation. You can
refactor `src/` freely without updating SKILL.md. SKILL.md never references
`src/` paths — only `scripts/<name>`.

### Wrapper example

A wrapper is a thin executable that delegates to the real implementation:

```bash
#!/usr/bin/env bash
exec node "$(dirname "$0")/../src/check.js" "$@"
```

Make wrappers executable: `chmod +x scripts/check`

For a complete TypeScript project setup (tsconfig, src/ layout, dependencies,
testing), see [references/typescript-scripts.md](references/typescript-scripts.md).

### Script design rules

Scripts are invoked by agents in non-interactive shells. Design them so the
agent can read stdout/stderr and decide what to do next.

**Hard requirements:**
- **Non-interactive**: no TTY prompts, password dialogs, or confirmation menus.
  All input via flags, env vars, or stdin.
- **`--help` / `-h`**: print usage to stderr, exit 0. This is the primary way
  an agent learns the script's interface.
- **JSON to stdout**: this is what the agent consumes. Never mix data and
  diagnostics on the same stream.
- **Non-zero exit on failure** with a descriptive error message to stderr.
  Say what went wrong, what was expected, and what to try.

**Best practices:**
- **Idempotent** where possible — agents may retry
- **`--dry-run`** for destructive operations
- **`--long-name`** flags (no single-letter flags except `-h`)
- **Predictable output size**: many agent harnesses truncate beyond 10-30K chars.
  Default to summaries; support `--limit`/`--offset` for pagination.
- **Safe defaults**: destructive operations require explicit `--confirm` or `--force`

For output patterns, exit code conventions, and `--help` templates, see
[references/conventions.md](references/conventions.md).

## Cross-Skill References

Use explicit phrasing in SKILL.md body to reference related skills:

```markdown
For personalization, use the contentful-personalization skill. Its onboard
flow covers readiness and SDK install; the doctor flow covers troubleshooting.
For "which API should I use", use the contentful-guide skill.
```

This is a documentation convention for the agent — no runtime enforcement.

## Independence Rule

- No cross-skill imports — each skill is independently packageable
- The `skills/` directory is the distribution boundary
- Shared code becomes a separate npm package
- Each skill directory must be fully self-contained

## Creating a New Skill

### Checklist

1. Choose the right location:
   - Customer-facing skill → `skills/<skill-name>/` (flat, one directory per skill)
   - Internal contributor skill → `.agents/skills/<skill-name>/`

2. Create the directory with the skill name as directory name

3. Write `SKILL.md`:
   - Add frontmatter with `name` (matching directory) and `description`
   - Write the body with clear instructions, examples, edge cases
   - Keep under 500 lines — move heavy content to `references/`

4. Write `package.json`:
   - Distributed: `@contentful/skill-<domain>-<name>`, version, files array
   - Internal: just name and version

5. Add supporting files as needed:
   - `references/` for on-demand documentation
   - `scripts/` for executable code
   - `assets/` for templates and static resources

6. Verify discovery: `npx skills add . --list --full-depth`

7. Update `README.md` if it's a distributed skill

## Reviewing an Existing Skill

### Checklist

- [ ] `name` field matches parent directory name exactly
- [ ] `description` is 1-1024 chars, specific about triggers and scope
- [ ] `description` includes negative scope ("Not for X")
- [ ] SKILL.md body is under 500 lines
- [ ] Heavy content is in `references/`, not inline
- [ ] `package.json` exists with name and version
- [ ] For distributed skills: package name follows `@contentful/skill-<domain>-<name>`
- [ ] Scripts are non-interactive with `--help` support
- [ ] No cross-skill imports — skill is self-contained
- [ ] Reference file paths are relative from skill root

## Improving a Description

If a skill isn't triggering when it should (or triggers when it shouldn't):

1. Check that the description includes the keywords users actually say
2. Add indirect triggers (synonyms, related phrases)
3. Add negative scope to prevent false activations
4. Make the description slightly "pushy" — better to over-trigger
5. Test by asking the agent varied prompts and checking if the skill activates

For automated description optimization with evals, see
[Anthropic's skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator).

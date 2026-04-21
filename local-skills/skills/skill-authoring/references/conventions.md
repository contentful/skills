# Skill Authoring Conventions

Detailed reference for creating and maintaining Agent Skills in the
`contentful/skills` repository. This document supplements the main
SKILL.md instructions with templates, examples, and complete rules.

## SKILL.md Template

### Documentation-only skill

```markdown
---
name: contentful-personalization-example
description: >-
  One to three sentences describing what this skill does and when to use it.
  Include specific trigger keywords and negative scope. Use when [scenarios].
  Also triggers on [phrases]. Not for [boundary conditions].
license: MIT
metadata:
  author: contentful
  version: "1.0.0"
---

# Skill Title

Brief overview of what this skill does.

## When to Use

- Scenario 1
- Scenario 2
- NOT for: scenario that seems related but belongs to another skill

## Instructions

Step-by-step guidance for the agent.

### Step 1: Assess

Describe what to check first.

### Step 2: Execute

Describe the main workflow.

### Step 3: Verify

Describe how to validate the result.

## Common Edge Cases

- Edge case 1: how to handle it
- Edge case 2: how to handle it

## Related Skills

- the contentful-personalization-setup skill — for initial SDK installation
- the contentful-personalization-doctor skill — for troubleshooting issues
```

### Code skill with scripts

```markdown
---
name: contentful-personalization-example
description: >-
  Description with triggers and scope. Use when [scenarios].
  Also triggers on [phrases]. Not for [boundary conditions].
license: MIT
compatibility: Requires Node.js 18+
metadata:
  author: contentful
  version: "1.0.0"
---

# Skill Title

Brief overview.

## Quick Start

Run the diagnostic:

    ${CLAUDE_SKILL_DIR}/scripts/check --env production

## Scripts

### check

Validates the current configuration.

    ${CLAUDE_SKILL_DIR}/scripts/check [--env <environment>] [--verbose]

**Flags:**
- `--env <name>` — target environment (default: development)
- `--verbose` — include detailed output
- `--dry-run` — show what would be checked without running

**Output:** JSON to stdout with validation results.

### fix

Applies automatic fixes for common issues.

    ${CLAUDE_SKILL_DIR}/scripts/fix [--dry-run]

## Workflow

1. Run `check` to identify issues
2. Review the JSON output
3. Run `fix --dry-run` to preview changes
4. Run `fix` to apply

## References

For API details, see [references/api.md](references/api.md).
```

## package.json Templates

### Distributed skill (in skills/)

```json
{
  "name": "@contentful/skill-contentful-personalization-readiness",
  "version": "1.0.0",
  "description": "Assess optimization and personalization readiness for a Contentful project",
  "license": "MIT",
  "files": ["SKILL.md", "references/**", "scripts/**", "assets/**"]
}
```

The `files` array documents the skill's public surface. Include only the
directories that actually exist. The `skills` CLI copies the entire directory,
so `files` has no runtime effect today but signals intent.

### Internal skill (in .agents/skills/)

```json
{
  "name": "skill-authoring",
  "version": "1.0.0"
}
```

Internal skills don't use the `@contentful/skill-*` namespace since they're
never distributed via npm.

## Description Writing Guide

The description is the **sole activation trigger**. At startup, the agent loads
only `name` + `description` for every installed skill (~100 tokens each). The
full SKILL.md body loads only when the agent judges the skill relevant based on
the description.

### Structure

```
[What the skill does — 1 sentence, imperative voice]
[Specific capabilities — what it covers]
[When to use — explicit trigger scenarios]
[Trigger keywords — phrases users naturally say]
[Negative scope — what it does NOT cover]
```

### Good Examples

```yaml
# Specific triggers, clear scope, negative boundary
description: >-
  Assess whether a codebase is ready for Contentful optimization and
  personalization. Analyzes component structure, rendering patterns, and
  SDK compatibility. Use when asked to check optimization readiness, audit
  personalization setup, or evaluate prerequisites. Also triggers on "am I
  ready for personalization" or "can my app support A/B testing". Not for
  setting up SDKs — use the contentful-personalization-setup skill for that.
```

```yaml
# Good indirect triggers, covers synonyms
description: >-
  Guide the installation and configuration of Contentful optimization SDKs.
  Covers server-side and edge rendering setup, middleware placement, cookie
  handling, and hydration. Use when asked to set up optimization, configure
  personalization, install Ninetailed SDK, or initialize A/B testing. Also
  triggers on "add personalization to my project", "configure edge rendering",
  or "set up experiments". Not for diagnosing issues — use the contentful-personalization-doctor skill.
```

### Bad Examples

```yaml
# Too vague — agent can't decide when to activate
description: Helps with optimization.
```

```yaml
# Missing triggers and scope — no keywords for the agent to match
description: A skill for working with Contentful personalization features.
```

```yaml
# Too narrow — only triggers on exact phrasing
description: Use when the user says "run the optimization readiness check".
```

### Tips

- **Be pushy**: better to activate too often than to miss relevant triggers
- **Use imperative voice**: "Diagnose and fix" not "A tool for diagnosing"
- **Include synonyms**: users say "personalization", "p13n", "targeting", "segments"
- **Add indirect triggers**: for a deploy skill, also mention "ship", "release", "go live"
- **Negative scope prevents false activations**: "Not for X — use the other-skill skill"
- **Hard limit**: 1024 characters. Aim for 200-400 in practice.

## Script Design

### Architecture

The key principle: `scripts/` is the **stable public interface**. SKILL.md
references only `scripts/<name>`. Implementation lives behind that boundary.

Scripts can be anything executable — bash, Python, Node.js, compiled binaries,
etc. The only requirements are `chmod +x` and following the design rules below.

**Simple skills** put executables directly in `scripts/`:

```
scripts/
  check               Bash script, Python, etc.
  fix
```

**Complex skills** use thin wrappers in `scripts/` that delegate to an
implementation directory:

```
scripts/
  check               Wrapper → delegates to implementation
  fix                 Wrapper → delegates to implementation
src/                  Implementation (any language/structure)
  ...
```

The wrapper decouples the contract from the implementation. Refactoring
internals doesn't break SKILL.md. SKILL.md never references implementation
paths — only `scripts/<name>`.

### --help output pattern

```
Usage: check [OPTIONS]

Validate Contentful optimization configuration.

Options:
  --env <name>       Target environment (default: development)
  --verbose          Include detailed diagnostic output
  --dry-run          Show what would be checked without running
  --output <file>    Write results to file instead of stdout
  -h, --help         Show this help message

Examples:
  check --env production
  check --verbose --output results.json
```

Print to stderr, exit 0. This is the primary way agents learn the interface.

### JSON output pattern

```json
{
  "status": "warning",
  "checks": [
    {
      "name": "sdk-version",
      "status": "pass",
      "message": "Ninetailed SDK 1.5.0 is up to date"
    },
    {
      "name": "middleware-placement",
      "status": "warning",
      "message": "Middleware is placed after auth — should be before for edge personalization",
      "suggestion": "Move ninetailedMiddleware() before authMiddleware() in middleware.ts"
    }
  ],
  "summary": {
    "total": 2,
    "pass": 1,
    "warning": 1,
    "fail": 0
  }
}
```

### Error output pattern

```
Error: --env must be one of: development, staging, production. Received: "prod"

Did you mean: production?
```

Non-zero exit, descriptive message to stderr, say what went wrong and what to try.

### Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Not found (missing config, missing SDK) |
| 4 | Authentication / permission error |

Document exit codes in `--help` output.

## Directory Structure Reference

### Minimum (documentation-only)

```
contentful-personalization-readiness/
  SKILL.md
  package.json
```

### With references

```
contentful-personalization-readiness/
  SKILL.md
  package.json
  references/
    checklist.md
    component-patterns.md
```

### With scripts (simple)

```
contentful-personalization-doctor/
  SKILL.md
  package.json
  scripts/
    check               Executable (chmod +x)
    fix                 Executable (chmod +x)
```

Use this when scripts are small and self-contained.

### With scripts (complex — with implementation dir)

```
contentful-personalization-doctor/
  SKILL.md
  package.json
  scripts/
    check               Wrapper (chmod +x) → delegates to src/
    fix                 Wrapper (chmod +x) → delegates to src/
  src/                  Implementation (language of your choice)
    ...
  references/
    api.md
```

Use this when scripts share code or the implementation warrants
a build step or unit tests.

### Full skill with everything

```
contentful-personalization-setup/
  SKILL.md
  package.json
  scripts/
    setup               Wrapper → delegates to src/
    validate            Wrapper → delegates to src/
  src/
    ...
  references/
    edge-setup.md
    middleware-guide.md
    cookie-handling.md
  assets/
    middleware-template.ts
    config-template.json
```

## Naming Rules

### Validation regex

```
^[a-z0-9]([a-z0-9-]*[a-z0-9])?$
```

With additional constraint: no consecutive hyphens (`--`).

### Valid names

- `contentful-personalization-readiness`
- `contentful-personalization-setup`
- `contentful-personalization-dev`
- `contentful-personalization-doctor`
- `content-audit`
- `a`
- `my-skill-2`

### Invalid names

- `Optimization-Readiness` — uppercase not allowed
- `-readiness` — cannot start with hyphen
- `readiness-` — cannot end with hyphen
- `optimization--readiness` — consecutive hyphens not allowed
- `optimization readiness` — spaces not allowed
- `optimization_readiness` — underscores not allowed

### How directory names map to identifiers

```
skills/contentful-personalization-readiness/SKILL.md
       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
       skill directory = name field

name: contentful-personalization-readiness                     (SKILL.md frontmatter)
"name": "@contentful/skill-contentful-personalization-readiness"  (package.json)
```

The skill's identity comes from its immediate parent directory. The agentskills.io
spec requires `name` to match the parent directory exactly, and the name must be
globally unambiguous across all installed skills. A short name like `readiness`
would collide if another Contentful product also has a readiness skill.

## Distribution Boundary

```
contentful/skills/
├── skills/                    ← DISTRIBUTED (npx skills add)
│   ├── contentful-guide/
│   ├── contentful-migration/
│   ├── contentful-nextjs/
│   ├── contentful-personalization-readiness/
│   ├── contentful-personalization-setup/
│   ├── contentful-personalization-dev/
│   └── contentful-personalization-doctor/
├── .agents/skills/            ← INTERNAL (never distributed)
│   └── skill-authoring/
├── .claude/skills             ← Symlink to .agents/skills/
├── .claude-plugin/            ← Plugin config (not distributed as skill)
├── AGENTS.md                  ← Repo docs (not distributed)
├── CLAUDE.md                  ← Repo docs (not distributed)
└── README.md                  ← Repo docs (not distributed)
```

The `skills` CLI copies skill directories in isolation. Everything outside
`skills/` stays in the repo. Each skill must be fully self-contained.

## Progressive Disclosure Token Budgets

| Tier | What loads | When | Budget |
|------|-----------|------|--------|
| Metadata | `name` + `description` | Session start | ~50-100 tokens per skill |
| Instructions | Full SKILL.md body | When skill activates | < 5000 tokens (~500 lines) |
| Resources | scripts/, references/, assets/ | When referenced | On demand, no fixed limit |

**Keep SKILL.md under 500 lines.** If approaching this limit, move detail into
`references/` with clear pointers about when the agent should read each file.

For large reference files (>300 lines), include a table of contents at the top.

## Claude Code Frontmatter Extensions

These fields extend the base agentskills.io spec for Claude Code:

| Field | Type | Description |
|-------|------|-------------|
| `disable-model-invocation` | boolean | `true` prevents Claude from auto-loading the skill. User must invoke via `/<name>`. |
| `user-invocable` | boolean | `false` hides from the `/` menu. Claude can still auto-load based on description. |
| `context` | string | `fork` runs in an isolated subagent with its own context. |
| `agent` | string | Subagent type when `context: fork`. Values: `Explore`, `Plan`, `general-purpose`, or custom agent name. |
| `model` | string | Model override when skill is active. |
| `effort` | string | Effort level override: `low`, `medium`, `high`, `max`. |
| `argument-hint` | string | Autocomplete hint shown after `/<name>`, e.g., `[issue-number]`. |
| `hooks` | object | Hooks scoped to this skill's lifecycle. |

### String substitutions

- `$ARGUMENTS` — all arguments passed when user invokes `/<name> args`
- `$0`, `$1`, etc. — positional arguments
- `${CLAUDE_SESSION_ID}` — current session ID
- `${CLAUDE_SKILL_DIR}` — resolves to the skill's directory path at runtime

### Dynamic context injection

Use `` !`command` `` in SKILL.md to run a shell command before sending skill
content to Claude:

```markdown
## Current Status

!`git status --short`
```

## Review Checklist

Use this when auditing an existing skill:

- [ ] **Name**: `name` field matches parent directory name exactly
- [ ] **Name format**: lowercase, [a-z0-9-], no leading/trailing/consecutive hyphens
- [ ] **Description**: present, 1-1024 chars
- [ ] **Description quality**: specific triggers, negative scope, includes keywords
- [ ] **Body length**: SKILL.md under 500 lines
- [ ] **Heavy content**: moved to `references/`, not inline
- [ ] **package.json**: exists with `name` and `version`
- [ ] **Package naming**: distributed skills use `@contentful/skill-<domain>-<name>`
- [ ] **Scripts**: non-interactive, `--help` support, JSON stdout
- [ ] **Self-contained**: no imports from other skills
- [ ] **File references**: relative paths from skill root
- [ ] **README.md**: updated if it's a new distributed skill

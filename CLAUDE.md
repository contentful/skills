# Contentful Skills — Claude Code

Read [AGENTS.md](AGENTS.md) for general project conventions (naming, structure, distribution boundary, commit format).

This file covers Claude Code-specific configuration.

## Internal Skills

Internal contributor skills live in `.agents/skills/` and are symlinked at `.claude/skills` for Claude Code discovery. Use `/skill-authoring` to get guidance on creating, modifying, or reviewing skills.

## Claude Code Frontmatter Extensions

When authoring skills for this repo, these Claude Code-specific frontmatter fields are available beyond the base agentskills.io spec:

| Field | Description |
|-------|-------------|
| `disable-model-invocation` | `true` prevents auto-loading; user must invoke via `/<name>` |
| `user-invocable` | `false` hides from `/` menu; Claude can still auto-load |
| `context` | `fork` runs in an isolated subagent |
| `agent` | Subagent type when `context: fork` (`Explore`, `Plan`, `general-purpose`, or custom) |
| `model` | Model override when skill is active |
| `effort` | Effort level override (`low`, `medium`, `high`, `max`) |
| `argument-hint` | Autocomplete hint, e.g., `[issue-number]` |
| `hooks` | Hooks scoped to this skill's lifecycle |

## String Substitutions

- `$ARGUMENTS` — all arguments passed to the skill
- `$0`, `$1`, etc. — positional arguments
- `${CLAUDE_SESSION_ID}` — current session ID
- `${CLAUDE_SKILL_DIR}` — the skill's directory path

## Dynamic Context

Use `` !`command` `` in SKILL.md to run a shell command before sending skill content to Claude.

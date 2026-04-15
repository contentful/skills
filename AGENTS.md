# Contentful Skills

Agent-agnostic project conventions for the `contentful/skills` repository.

## Repository Structure

```
skills/                    Distributed to customers via `npx skills add contentful/skills`
.agents/skills/            Internal contributor skills — never distributed
.claude/skills             Symlink to .agents/skills/ for Claude Code discovery
.claude-plugin/            Plugin marketplace configuration
```

`skills/` is the **distribution boundary**. Only its contents are installed to customer environments. Everything outside (`AGENTS.md`, `.agents/`, `.claude-plugin/`) stays in the repo.

The `skills` CLI discovers skills recursively, so organizational grouping directories (e.g., `skills/optimization/optimization-readiness/`) work correctly.

## Skill Requirements

Every skill needs at minimum:

- `SKILL.md` with valid YAML frontmatter (`name` + `description`)
- `package.json` with name and version

Even documentation-only skills require both files.

## Naming Conventions

- **Directory names**: lowercase, hyphen-separated, prefixed with the domain (e.g., `optimization-readiness`, `optimization-setup`)
- **`name` field** in SKILL.md frontmatter: must exactly match the immediate parent directory name
- **`package.json` name**: `@contentful/skill-<domain>-<skill-name>` (e.g., `@contentful/skill-optimization-readiness`)
- **Organizational grouping directories** (e.g., `optimization/`) group related skills by domain

### Name Rules (agentskills.io spec)

- 1-64 characters
- Lowercase letters, numbers, and hyphens only
- Must not start or end with a hyphen
- Must not contain consecutive hyphens
- Must match the parent directory name

## Creating a New Skill

Use the `skill-authoring` internal skill for guidance. It covers SKILL.md authoring, directory structure, package.json format, script conventions, naming rules, and review checklists.

For code skills with scripts, see `skill-authoring`'s script conventions section.

## Validation

```bash
npx skills validate
```

## Commit Conventions

Commit frequently — after every logical step, not in large batches. Small, focused commits make reviews easier, bisection possible, and reverts safe.

Use [conventional commits](https://www.conventionalcommits.org/) with a Jira ticket key:

```
<type>(<optional-scope>): <short description> [<TICKET-KEY>]
```

**Types**: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `build`, `ci`, `deps`, `perf`, `style`, `revert`

**Examples**:
```
feat(optimization): add readiness skill [NT-2950]
fix(optimization-doctor): correct SDK version detection [NT-2955]
docs: update README with new install commands [NT-2960]
```

## Distribution

Skills are installed by customers via the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add contentful/skills                          # all skills
npx skills add contentful/skills --skill optimization-readiness  # one skill
```

The CLI copies skill directories in isolation. Each skill must be fully self-contained — no dependencies on files outside its own directory.

## Agent Skills Format

Skills follow the [agentskills.io](https://agentskills.io) open specification. Key concepts:

- **Progressive disclosure**: metadata (~100 tokens) at startup, full SKILL.md when activated, references/scripts on demand
- **SKILL.md body**: recommended under 500 lines; heavy content goes in `references/`
- **Scripts**: non-interactive, JSON to stdout, diagnostics to stderr, `--help` flag required
- **Independence**: no cross-skill imports; shared code becomes a separate npm package

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

The `skills` CLI discovers skills recursively, so subdirectories work correctly. Most skills are organized in a flat structure directly under `skills/` (e.g., `skills/contentful-personalization/`). Closely related skills can be grouped under a domain folder, such as `skills/contentful-apps/`.

## Skill Requirements

Every skill needs at minimum:

- `SKILL.md` with valid YAML frontmatter (`name` + `description`)
- `package.json` with name and version

Even documentation-only skills require both files.

## Naming Conventions

- **Directory names**: lowercase, hyphen-separated, prefixed with the domain (e.g., `contentful-personalization`, `contentful-migration`)
- **`name` field** in SKILL.md frontmatter: must exactly match the immediate parent directory name
- **`package.json` name**: `@contentful/skill-<skill-name>` (e.g., `@contentful/skill-contentful-personalization`)

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

Verify all skills are discoverable:

```bash
npx skills add . --list --full-depth
```

This should list every skill in the repo with its name and description. CI runs this automatically on PRs.

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
fix(contentful-personalization): correct SDK version detection [NT-2955]
docs: update README with new install commands [NT-2960]
```

## skill-kit Skills

Some skills are built with [`@contentful/skill-kit`](https://github.com/contentful/skill-kit) — TypeScript state machines compiled to JavaScript bundles. These coexist with prose skills in `skills/`.

### Source and output

- **Source**: `src/skills/<skill-name>/` — TypeScript, tests, reference docs
- **Output**: `skills/<skill-name>/` — generated SKILL.md, JS bundle, references

Build maps source to distribution:

```
skill-kit build src/skills/contentful-personalization/skill.ts -o skills/contentful-personalization --mode node
```

The `--mode node` flag produces a single `.mjs` bundle that runs on the host's Node.js (≥24) instead of self-contained platform binaries. This keeps the repo lightweight.

### Adding a new skill-kit skill

1. Create source at `src/skills/<skill-name>/skill.ts`
2. Add a build script to `package.json`
3. Build: `pnpm run build`
4. Verify: `python3 local-skills/skills/skill-authoring/scripts/quick_validate.py skills/<skill-name>`
5. Commit both source and build output

## Distribution

Skills are installed by customers via the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add contentful/skills                          # all skills
npx skills add contentful/skills --skill contentful-personalization  # one skill
```

The CLI copies skill directories in isolation. Each skill must be fully self-contained — no dependencies on files outside its own directory.

## Agent Skills Format

Skills follow the [agentskills.io](https://agentskills.io) open specification. Key concepts:

- **Progressive disclosure**: metadata (~100 tokens) at startup, full SKILL.md when activated, references/scripts on demand
- **SKILL.md body**: recommended under 500 lines; heavy content goes in `references/`
- **Scripts**: non-interactive, JSON to stdout, diagnostics to stderr, `--help` flag required
- **Independence**: no cross-skill imports; shared code becomes a separate npm package

## Claude Code Compatibility

Internal contributor skills live in `.agents/skills/` and are symlinked at `.claude/skills` for
Claude Code discovery. Claude users can invoke `/skill-authoring` for guidance on creating,
modifying, or reviewing skills.

Claude Code supports these frontmatter extensions beyond the base agentskills.io specification:

| Field                      | Description                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `disable-model-invocation` | `true` prevents automatic loading; the user must invoke the skill                  |
| `user-invocable`           | `false` hides the skill from the user menu while retaining automatic model loading |
| `context`                  | `fork` runs the skill in an isolated subagent                                      |
| `agent`                    | Subagent type used with `context: fork`                                            |
| `model`                    | Model override while the skill is active                                           |
| `effort`                   | Effort-level override                                                              |
| `argument-hint`            | Autocomplete hint such as `[issue-number]`                                         |
| `hooks`                    | Hooks scoped to the skill lifecycle                                                |

Claude substitutions include `$ARGUMENTS`, positional arguments such as `$0`,
`${CLAUDE_SESSION_ID}`, and `${CLAUDE_SKILL_DIR}`. In a Claude-targeted `SKILL.md`, the
`` !`command` `` form injects dynamic command output before the skill content is sent to the model.

## Skill Kit Contributor Workflow

Use these commands when changing a Skill Kit-backed skill:

- `pnpm install` — install dependencies
- `pnpm run typecheck` — type-check TypeScript source
- `pnpm run test` — run all skill tests
- `pnpm run build` — regenerate distributed skill output

Source lives under `src/skills/<skill-name>/`; generated output lives under
`skills/<skill-name>/`. Keep `skill.ts`, tests, schemas, actions, references, generated `SKILL.md`,
runtime bundle, wrapper, and copied references aligned.

`skill-kit build` merges into an existing `package.json` or creates one. Set repository package
metadata through the skill definition's `package` field. Each Skill Kit-backed skill keeps its
version in `src/skills/<skill-name>/version.ts`; release-it updates those files through
`.release-it.json`, and the subsequent build propagates the version. Before committing a newly
added skill, confirm that its generated `package.json` version matches the source version.

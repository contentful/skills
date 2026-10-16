# Contributing to Contentful Skills

Thanks for your interest in contributing.

## How to contribute

- Open an issue to report bugs or suggest enhancements.
- For larger changes, start with an issue before opening a PR.
- For smaller fixes and docs updates, feel free to open a PR directly.

## Local development

To edit skills locally, symlink them into `.agents/skills`:

```sh
mkdir -p .agents
ln -sn "$(pwd)/local-skills/skills" .agents/skills
```

To test the Claude plugin locally from this repository root:

```sh
claude --plugin-dir "$PWD"
```

This loads the local plugin directly without installing it from a marketplace.

## Validate your changes

Run the checks before opening a PR:

```sh
pnpm typecheck
pnpm test
pnpm validate
```

If you changed dependencies, also refresh licensing files:

```sh
pnpm run update-licenses
```

## Updating the environment analysis skill

This repo owns the environment-analysis implementation and its public distribution.
Edit instructions and references in `skills/contentful-env-analysis/`; edit TypeScript and
its tests in `src/skills/contentful-env-analysis/`. Do not hand-edit `scripts/main.js` or
`THIRD-PARTY-NOTICES.md`: they are generated locally from this source and installed dependency licenses.

1. Change the instructions, references, or TypeScript here.
2. Run `pnpm build:env-analysis` to regenerate the self-contained JavaScript bundle and notices.
3. Run `pnpm typecheck`, `pnpm test`, and `pnpm validate`. Tests check that committed output
   matches the source and run the bundled CLI without a source checkout or node_modules.
4. Commit source, tests, and regenerated files together and open a normal PR in this repo.
5. After merge, new installs use the updated files; existing users run `npx skills update`.

No ExO release tag, ZIP import, sync command, manual copying between repositories, or separate
version-bump PR is needed. The existing release process maintains the public package version.
The ExO Upgrade Agent's switch to invoking the public skill is a separate follow-up; it does not
change this ownership. Breaking CLI or database-schema changes must be coordinated with consumers.

Contributor prerequisites: Node.js 24.21+ and pnpm. The analysis build uses only local source and
installed dependencies: no private ExO checkout, release access, or GitHub CLI authentication.
The repo's existing Skill Kit dependency still follows the normal repository installation setup.
No extra runtime dependency install is required for users of the finished skill.

`pnpm build` builds both executable skills. `pnpm build:env-analysis --check` checks generated
analysis output without changing it; the same check runs in `pnpm test`.

### Deterministic CLI for consumers

Use `node <installed-skill>/scripts/main.js --help`. Standalone defaults stay unchanged.
Consumers can select an explicit `--dir`, `--env-file`, and fetch `--out-dir`/`--result-file`.
Scoped refresh uses `fetch --refresh-db <db> --content-type <id>` (repeat for each content type).
Validation and queries also accept `--db <file>`; inventory accepts `--snapshot <folder> --render json`.
Its JSON envelope is `{ "schemaVersion": 1, "inventory": { ... } }`, containing the same deterministic
metrics and warnings as the human rendering, without credentials or upgrade instructions.
Pass credential-file paths, never CMA tokens in command arguments.

## Pull request checklist

- Keep PRs focused and easy to review.
- Use conventional commits where possible.
- Update docs when behavior or usage changes.
- Do not include secrets or credentials.

## Contribution license

By submitting a contribution to this project, you agree that your contribution is licensed under the MIT License that applies to this repository.

## Code of conduct

By participating in this project, you agree to follow the Contentful Developer Code of Conduct:
https://www.contentful.com/developers/code-of-conduct/

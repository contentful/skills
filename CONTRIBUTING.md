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

`skills/contentful-env-analysis/` is generated from a released standalone bundle in
`contentful/exo-upgrade-agent`. Keep runtime and prompt changes in that source repository,
where the ExO Upgrade Agent also reuses the implementation. Do not hand-edit the imported files.

For the initial import or an update, use Node.js 24.21+, pnpm, and the GitHub CLI authenticated
with read access to `contentful/exo-upgrade-agent` (`gh auth login`). These are contributor
requirements; customers do not need access to that repository.

1. Merge and release the source change in `exo-upgrade-agent`.
2. Change only `release` in `src/skills/contentful-env-analysis/source.json` to the new DPP tag.
3. Run `pnpm sync:env-analysis`. It downloads the ZIP, verifies its SHA-256 digest, imports only
   the skill's instructions, bundled JavaScript and references, and collects third-party licenses.
   It records the upstream commit, asset digest, and generated file hashes in the same manifest.
4. Run the checks above and review the generated diff. Commit the manifest and generated files
   together, then open a normal PR. No automatic PR bot or private CI token is needed.

The importer adapts `bin/main.js` to `scripts/main.js` and adds customer prerequisites to the
instructions. It does not rebuild or change runtime code. PDFs and outer release guides are not
installed. Network access to GitHub and the public npm registry is needed only while syncing;
ordinary builds and tests use the committed files and need no upstream repository access.
`pnpm sync:env-analysis --check` verifies those files offline and also runs as part of `pnpm test`.

Upstream DPP tags and this repository's package version are separate. The existing release process
continues to version `skills/*/package.json`; do not put a DPP tag in its `version` field.
Upstream retains only recent DPP releases, so use an available release when updating. Old imported
files remain usable from this repository's Git history even after the upstream ZIP is removed.

After merge, customers can install from `contentful/skills` using the skills CLI. Existing installs
can be refreshed with `npx skills update`. The skills.sh directory is populated through installation
telemetry; merging a PR does not guarantee an immediate listing or update existing local installs.

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

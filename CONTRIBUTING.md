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

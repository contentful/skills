---
name: optimization-sdk-sync
description: Synchronize the Contentful Optimization SDK's public API, behavior, and implementation guidance into concise, runtime-specific references for the contentful-personalization skill. Use when the optimization repository or SDK documentation changes, when modern SDK guidance appears stale, or when validating that the skill matches an immutable upstream revision.
---

# Optimization SDK Sync

Update the modern Optimization SDK knowledge in `contentful-personalization` from a verified upstream revision. Optimize the result for an agent solving implementation tasks: concise, explicit, runtime-specific, and grounded in public API and maintained examples.

Do not copy upstream guides wholesale. Treat this as a knowledge compilation workflow.

## Scope

This skill owns modern `@contentful/optimization*` guidance. Preserve legacy `@ninetailed/*` guidance unless upstream evidence requires a compatibility correction.

Supported runtime references:

- shared concepts and behavior
- React Web
- Next.js App Router
- Next.js Pages Router
- browser Web
- Node.js
- React Native

Do not synthesize iOS or Android guidance until upstream provides equivalent knowledge-base facts, public API declarations, and guide blueprints.

## Source resolution

Use the public repository by default:

```text
https://github.com/contentful/optimization.git
```

Resolve sources in this order:

1. An explicit local path supplied by the user.
2. The managed remote cache at `.docs/optimization-sdk-sync/repository`.
3. A fresh clone of the official HTTPS repository into that cache.

For the default remote flow:

1. Inspect the managed cache's origin and worktree status before checkout.
2. Verify `origin` is exactly the official HTTPS repository before fetching.
3. If the origin differs or the cache has local changes, do not repoint, reset, delete, or clean it.
   Stop and report the conflict, or use a separately approved clean cache.
4. Fetch the requested ref, defaulting to `main`.
5. Resolve it to a full immutable commit SHA.
6. Inspect a detached checkout of that SHA. Do not use `git pull` or merge upstream history.

For an explicit local path:

1. Resolve and record `HEAD`.
2. Record the origin URL when present.
3. If tracked or untracked files are present, treat the run as preview-only unless the user explicitly asks to use dirty state.
4. Never edit, clean, stash, reset, or otherwise mutate the source repository.

## Read repository policy first

Before interpreting upstream files, read every applicable `AGENTS.md` from the repository root down to each source directory. Follow upstream-generated-file and validation rules.

## Evidence hierarchy

Use all four evidence layers. Knowledge-base facts and types alone are not sufficient for complete agent guidance.

1. **Knowledge base** — behavioral contracts, caveats, lifecycle, architecture, platform differences, and source pointers under `documentation/internal/sdk-knowledge/`.
2. **Public exports and types** — exact import paths, names, signatures, option shapes, return values, and deprecations under `packages/`.
3. **Guide blueprints** — task coverage, prerequisite ordering, validation expectations, and troubleshooting branches under `documentation/authoring/blueprints/`.
4. **Maintained implementations and public docs** — canonical composition, file boundaries, realistic usage, edge cases, and completeness checks.

Resolve conflicts using the most authoritative source for the claim:

- exact API shape: public exports and types
- behavioral semantics: knowledge-base fact backed by its source pointer
- implementation topology: maintained first-party implementation
- task completeness: blueprint
- public wording: public docs, only after checking the layers above

Never infer an API from prose when an exported type or implementation is available.

Treat repository knowledge and guide validators as structural integrity gates. They verify pointers,
templates, links, and planned structure; they do not prove that two valid sources agree semantically.
When a knowledge fact conflicts with an exported public type, record the discrepancy and follow the
public type for downstream API guidance.

## Validate upstream inputs

From the resolved checkout, run the repository's documented dependency setup if required, then:

```bash
pnpm knowledge:check
pnpm guides:check
```

Record each result as `passed`, `failed`, or `blocked`. A sandbox, dependency, or runtime restriction
is `blocked`, not `failed`, but both are non-passing. Stop authoritative downstream writes unless
both checks pass; report the immutable SHA, command, status, and concrete failure or blocking reason.

## Determine the delta

Read `src/skills/contentful-personalization/optimization-sdk-sync.json` when it exists. Compare its previous upstream SHA with the newly resolved SHA.

Use the changed-file set to prioritize inspection, but always revalidate:

- public entry points and declarations for affected packages
- fact files that point to changed code
- affected blueprints
- maintained examples referenced by those facts or blueprints

A file delta narrows review; it never replaces the evidence hierarchy.

## Parallel execution

When sub-agents are available, use isolated ownership:

1. The coordinator resolves and validates the upstream SHA, computes the delta, and owns the
   overview, shared reference, provenance manifest, and consumer wiring.
2. Give each runtime worker only its matching knowledge file, blueprint, public entry points and
   types, linked maintained implementation, and public guide. Each worker writes one runtime file.
3. No two workers edit the same file.
4. After integration, run an independent read-only worker that source-verifies the complete pack and
   searches consumers for stale or contradictory modern guidance.

Workers must follow the same immutable SHA and evidence hierarchy. A worker's report is review
input, not a substitute for coordinator validation.

## Compile the reference pack

Write source references under `src/skills/contentful-personalization/references/`:

```text
optimization-overview.md
optimization-shared.md
optimization-react-web.md
optimization-nextjs-app-router.md
optimization-nextjs-pages-router.md
optimization-web.md
optimization-node.md
optimization-react-native.md
```

Each runtime reference should stand alone after `optimization-shared.md` is loaded. Include only what materially helps an agent implement, review, or debug that runtime:

- correct package and public import paths
- initialization and provider or factory boundaries
- minimal canonical setup
- user, consent, page or screen, event, and reset lifecycle where supported
- content fetching or prefetch behavior where supported
- server/client boundaries and request handling where relevant
- runtime-specific validation and common failure modes

The overview should route an agent to the right runtime and summarize package selection. Shared concepts belong in `optimization-shared.md`; do not repeat them in every runtime file.

Writing rules:

- Aim for at most 120 lines in the overview, 200 in shared concepts, and 300 per runtime. Exceed a
  target only when removing material would hide a public API boundary or production failure mode.
- Prefer short declarative sections and small canonical snippets.
- Use current exported names exactly.
- State unsupported behavior explicitly rather than implying parity.
- Distinguish required setup from optional integration.
- Remove historical narrative unless it prevents a migration mistake.
- Do not expose internal source-pointer syntax in distributed references.
- Do not create a second downstream blueprint system.
- Do not add repo-specific editorial overrides unless required by the consuming workflow.

## Update consumers

After compiling the pack:

1. Route modern SDK topics to the overview or a runtime-specific reference.
2. Make onboarding and development workflows load `optimization-shared.md` plus only the detected
   runtime reference or references.
3. Keep legacy SDK paths on legacy references.
4. Remove or rewrite stale modern claims in shared references so they cannot override the generated pack.
5. Keep modern product policy owned by downstream workflows; synchronize only SDK facts and implementation guidance.

## Record provenance

Update `src/skills/contentful-personalization/optimization-sdk-sync.json` with:

- schema version
- official repository URL
- resolved ref and full commit SHA
- generation timestamp in UTC
- source mode (`remote` or `local`)
- whether the source tree was dirty
- validation commands and `passed` / `failed` / `blocked` results
- generated reference paths
- upstream source paths consulted for each generated reference

Do not put machine-specific local paths in the manifest.

## Build and verify

The source tree is authoritative. Generate distribution output only after source references and workflow code are updated:

```bash
pnpm run build
pnpm run lint
pnpm run typecheck
pnpm run test
python3 local-skills/skills/skill-authoring/scripts/quick_validate.py local-skills/skills/optimization-sdk-sync
python3 local-skills/skills/skill-authoring/scripts/quick_validate.py skills/contentful-personalization
npx skills add . --list --full-depth
```

Also search the distributed skill for removed API names and obsolete import paths discovered during the sync. Review the generated diff for accidental duplication and machine-specific provenance.

Do not commit, push, or open a pull request unless the user asks.

## Completion report

Report:

- upstream repository, resolved ref, and immutable SHA
- upstream validation results
- runtimes updated or deliberately excluded
- material API or behavioral corrections
- downstream validation results
- any unresolved ambiguity, with the competing evidence named

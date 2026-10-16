---
name: contentful-env-analysis
description: Download a Contentful space and environment into a local read-only SQLite snapshot, inspect its content model and ExO entities, or answer data questions without starting an ExO upgrade.
compatibility: Requires Node.js 24.21+, an agent with shell access, and a Contentful CMA token for downloads.
---

# Contentful Environment Analysis

Create and inspect a local snapshot. This skill is analysis-only: it must not change the Contentful space or start an ExO upgrade.

When this skill is invoked directly, start the download workflow immediately. Do not ask the user to
repeat their request or choose a mode before running `init`.

`scripts/main.js` lives in this skill's directory beside `SKILL.md`. Resolve its absolute path from this
file and use that absolute path in every `node .../scripts/main.js` command below. Keep the command's working
directory at the project or folder where the user wants the visible `.contentful-env-analysis/` folder.

## Prerequisites

Requires Node.js 24.21 or newer on Windows, macOS, or Linux and an AI agent with shell access.
Before running commands, check the Node version. If it is too old or missing, ask the user to install
a supported Node version. npm/npx is needed only to install or update the skill. Downloads need network
access, a CMA token with read access, a Space ID, and an Environment ID. Python, an external SQLite
installation, GitHub access, and a local dependency install are not needed. Later analysis runs offline.

## Download the snapshot

1. Run `node scripts/main.js init`.
2. Tell the user that `.contentful-env-analysis/` now contains only `.env`, `.gitignore`, and an empty
   `snapshots/` folder. It does not create upgrade runs or codebase-analysis state.
3. Explain that the CMA token needs read access to the selected space and environment. Give the user two
   choices: they can edit `.contentful-env-analysis/.env` themselves, or provide the CMA token, Space ID,
   and environment ID for you to write there. Never echo the token, put it in a command argument, or store
   it outside that ignored `.env` file.
4. Run `node scripts/main.js snapshots`.
5. If compatible snapshots already exist, ask whether to reuse one or download a fresh snapshot. Do not choose silently.
6. Reuse with `node scripts/main.js fetch --snapshot <snapshot-path>`. Download a new copy with `node scripts/main.js fetch`.

Do not stop after loading this skill. Unless a compatible snapshot needs a reuse choice or credentials are
missing, complete the download and orientation steps in the same interaction.

The fetch creates a timestamped folder under `.contentful-env-analysis/snapshots/`. It includes
`contentful-unified.db`, `summary.json`, and the raw API responses used to build the database. It fetches
content types, entries, assets, referenced tags and taxonomy concepts, Components, Experience Templates,
Experiences, Fragments, and linked Data Assemblies.

## Orient the user

Run `node scripts/main.js validate-db --snapshot <snapshot-path>`. Stop and explain the error if validation
fails. Then run `node scripts/main.js inventory --snapshot <snapshot-path>` and proactively summarize the
deterministic overview: space and environment, content types, published and draft-only entries, assets,
tags, taxonomy concepts, locales, Rich Text fields, Components, Experience Templates, Experiences,
Fragments, and Data Assemblies. Call out the content types with the most entries.

Present the inventory as compact Markdown tables, not only prose or bullet counts:

- Show content types with total, published, draft-only, potentially unreferenced entries, and field count.
- Show every ExO Component with its ID, coded/composite kind, content/design property and slot counts,
  and Fragment instance count.
- Show every Experience Template with its ID, property and slot counts, and Experience instance count.
- Show the names and IDs of Experiences, Fragments, and Data Assemblies, including the template or
  component used by each instance where available.
- When Rich Text fields exist, show total, populated, empty, and Entry-link counts for each field. If no
  Rich Text fields exist, say so explicitly.

Treat “potentially unreferenced” as a discovery signal, not proof that an entry is unused: page roots and
entries loaded directly by an application may correctly have no incoming Contentful entry links.

Then offer concrete questions based on the actual names in that inventory. Useful examples include:

- Which content types have the most entries?
- Which fields are rarely populated for `<actual content type>`?
- For `<actual content type>.<actual Rich Text field>`, how many entries are empty or populated, and how many contain Entry links?
- Which entries are potentially unreferenced, and could any be page roots or loaded directly by the application?
- What entry types link to `<actual content type>`?
- Which locales have gaps for `<actual content type>`?
- Which ExO Components and Experience Templates already exist, and how many instances use each one?
- Which Data Assemblies exist, and which ExO entities refer to them?

Tell the user that the snapshot is ready, show four to six relevant examples, and invite them to ask any
other question about the space. Always include the Rich Text completeness and potentially-unreferenced-entry
examples so users discover those capabilities; when the snapshot has no Rich Text fields, make the example
conditional instead of implying that one exists. The deterministic metrics above are expected; do not invent
business meaning that the data does not show.

## Analyze the snapshot

Read [references/database.md](references/database.md) when writing a query. Run one read-only query at a time.
For example, if the user asks which Rich Text fields are empty or contain Entry links, identify the field
from the inventory and query its localized values rather than guessing from the raw payload:

```bash
node scripts/main.js query --snapshot <snapshot-path> --sql '<SELECT statement>'
```

The command permits only `SELECT`, `WITH`, and `EXPLAIN`, caps returned rows, disables extensions, and opens SQLite read-only. Prefer counts and grouped summaries before requesting large row sets. Avoid selecting `raw_json` unless the question needs the full resource payload, because it may contain customer content.

For questions about ExO terms and relationships, read [references/exo-domain.md](references/exo-domain.md). Keep factual domain explanation separate from what the snapshot proves.

## Refresh

A snapshot is immutable evidence from one point in time. If the user needs current data, create a new snapshot with `node scripts/main.js fetch`; do not overwrite the prior one.

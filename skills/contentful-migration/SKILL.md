---
name: contentful-migration
description: >-
  Write and run Contentful content model migration scripts using the
  contentful-migration library and the Contentful CLI. Covers creating,
  editing, and deleting content types and fields, validations, editor interface
  configuration, editor layouts, sidebar widgets, entry transformations, tags,
  annotations, and the migration context object. Use when asked to write a
  migration, create or add a content type, add, rename, or delete fields,
  change or update a content model, transform entries, derive linked entries,
  configure editor controls, or run a migration script. Also triggers on
  "migration script", "contentful-migration", "schema migration",
  "content model migration", "field validation", "editor interface",
  "editor layout", "sidebar widget", "moveField", "changeFieldId",
  "rich text field", "reference field", "link field". Not for SDK client
  setup or Next.js integration (contentful-nextjs). Not for Contentful
  terminology or API routing (contentful-guide).
license: MIT
argument-hint: "[task description]"
allowed-tools: Bash(npx contentful-migration *) Bash(npx contentful space migration *) mcp__contentful-mcp__* mcp__plugin_contentful_contentful-mcp__*
paths: "migrations/**"
---

# Contentful Migration

The `contentful-migration` tool lets you describe and execute content model changes as code. Migrations are TypeScript scripts that create, edit, or delete content types, fields, editor interfaces, and entries.

**Install:**

```bash
npm install contentful-migration
```

GitHub: https://github.com/contentful/contentful-migration

## Scope

This skill covers:
- Content type and field CRUD operations
- Field types, validations, and editor interface configuration
- Entry transformations (in-place transforms, deriving linked entries, cross-type transforms)
- Tags, annotations, taxonomy validations
- Editor layouts, sidebar widgets
- Running migrations via `npx contentful space migration` (Contentful CLI) and programmatic API

Do not run migrations with `npx contentful-migration`. Use `contentful-cli` for CLI execution, install it as a dev dependency when needed, and run via `npx contentful ...`.

Not covered: SDK client setup (the contentful-nextjs skill), Contentful concepts and API routing (the contentful-guide skill).

## Contentful MCP note

- For users who want easier agent interaction with Contentful while planning or reviewing migrations, point them to the Contentful MCP server docs: `https://www.contentful.com/developers/docs/tools/mcp-server/`.
- Continue to use `contentful-migration` scripts and `contentful-cli` for actual migration execution.

## Migration Script Format

Every migration file exports a function that receives a `migration` object:

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  const blogPost = migration.createContentType('blogPost', {
    name: 'Blog Post',
    description: 'A blog post entry',
    displayField: 'title',
  })

  blogPost.createField('title')
    .name('Title')
    .type('Symbol')
    .required(true)
}

export = migration
```

The function also receives a `context` object as its second parameter, providing `makeRequest` (direct CMA access), `spaceId`, and `accessToken`. Use `makeRequest` when you need data not available through the migration API.

## Project state

```!
echo "=== Existing migrations ===" && ls migrations/ 2>/dev/null || echo "(no migrations/ directory found)"
echo ""
echo "=== Contentful env vars ===" && grep -h CONTENTFUL .env .env.local 2>/dev/null | sed 's/=.*/=<set>/' || echo "(no Contentful env vars found in .env or .env.local)"
```

## Workflow

When writing a migration:

1. **Confirm required env vars first.** If values are missing, ask the user to add them to a local `.env` file before proceeding.
2. **Assess the change.** Identify which content types and fields need to change. Check the current content model in the Contentful web app or via CMA.
3. **Write the migration script.** Use the operations below. Prefer chaining over object notation — it gives better error messages with line numbers.
4. **Test in a sandbox environment.** Never run untested migrations against production. Create a sandbox environment first: `contentful environment create --name sandbox --source master`.
5. **Run the migration.** See [Running Migrations](references/running-migrations.md) for CLI and programmatic options.
6. **Verify.** Check the content model in the web app. Confirm entries are intact.

## Required environment variables

- `CONTENTFUL_SPACE_ID` - Space ID. Find it in the Contentful web app URL (`/spaces/<SPACE_ID>/...`) or in **Space settings -> API keys**.
- `CONTENTFUL_MANAGEMENT_ACCESS_TOKEN` - CMA token used for migrations. Create it in **Account settings -> CMA tokens** (`https://app.contentful.com/account/profile/cma_tokens`) or from a space-scoped CMA tokens page (`https://app.contentful.com/spaces/<SPACE_ID>/api/cma_tokens`).
- `CONTENTFUL_ENVIRONMENT_ID` (optional) - Target environment ID (for example `master` or `sandbox`) when you want to avoid passing `--environment-id`.

If any required value is missing, explicitly ask the user for the missing values and tell them where to find each one.

## Content Type Operations

**Create a content type:**

```typescript
const page = migration.createContentType('page', {
  name: 'Page',
  description: 'A generic page',
  displayField: 'title',
})
```

**Edit an existing content type:**

```typescript
const page = migration.editContentType('page')
page.description('Updated description')
page.displayField('internalName')
```

**Delete a content type:**

```typescript
migration.deleteContentType('page')
```

Content type must have zero entries before deletion. Delete all entries first, or use `transformEntriesToType` to move them.

## Field Operations

**Create a field:**

```typescript
page.createField('title')
  .name('Title')
  .type('Symbol')
  .required(true)
  .localized(true)
```

**Edit an existing field:**

```typescript
page.editField('title')
  .name('Page Title')
  .required(false)
```

**Delete a field:**

```typescript
page.deleteField('legacyField')
```

Deleting a field permanently removes its content from all entries.

**Change a field ID:**

```typescript
page.changeFieldId('oldName', 'newName')
```

Existing content is preserved — only the ID changes.

**Move a field:**

```typescript
page.moveField('slug').afterField('title')
page.moveField('featured').toTheTop()
page.moveField('metadata').toTheBottom()
page.moveField('author').beforeField('publishDate')
```

## Field Types Quick Reference

| Type | Description | Extra config |
|------|-------------|--------------|
| `Symbol` | Short text (max 256 chars) | — |
| `Text` | Long text (max 50,000 chars) | — |
| `Integer` | Whole number | — |
| `Number` | Decimal number | — |
| `Date` | ISO 8601 date/time | — |
| `Boolean` | True/false | — |
| `Object` | Arbitrary JSON | — |
| `Location` | Lat/lon coordinates | — |
| `RichText` | Structured rich text | `enabledNodeTypes`, `enabledMarks` validations |
| `Array` | List of values or references | Requires `items`: `{ type, linkType?, validations? }` |
| `Link` | Single reference | Requires `linkType`: `'Asset'` or `'Entry'` |
| `ResourceLink` | Cross-space reference | Requires `allowedResources` |

See [API Reference — Field Types](references/api-reference.md#field-types) for full configuration details.

## Validations Quick Reference

| Validation | Applies to | Example |
|------------|-----------|---------|
| `in` | Symbol, Integer, Number | `{ in: ['draft', 'published', 'archived'] }` |
| `unique` | Symbol, Integer, Number | `{ unique: true }` |
| `size` | Array, Text, Symbol | `{ size: { min: 1, max: 5 } }` |
| `range` | Integer, Number | `{ range: { min: 0, max: 100 } }` |
| `regexp` | Symbol, Text | `{ regexp: { pattern: '^[a-z0-9-]+$' } }` |
| `dateRange` | Date | `{ dateRange: { min: '2020-01-01', max: '2030-12-31' } }` |
| `linkContentType` | Link, Array of Links | `{ linkContentType: ['author', 'organization'] }` |
| `linkMimetypeGroup` | Link (Asset) | `{ linkMimetypeGroup: ['image', 'video'] }` |
| `assetFileSize` | Link (Asset) | `{ assetFileSize: { min: 0, max: 5242880 } }` |
| `assetImageDimensions` | Link (Asset) | `{ assetImageDimensions: { width: { min: 100, max: 2000 } } }` |

Apply validations via `.validations([...])` on a field. See [API Reference — Validations](references/api-reference.md#validations) for all options.

## Entry Transformations

**Transform entries in place:**

```typescript
migration.transformEntries({
  contentType: 'blogPost',
  from: ['firstName', 'lastName'],
  to: ['fullName'],
  transformEntryForLocale: (fields, locale) => {
    const first = fields.firstName[locale]
    const last = fields.lastName[locale]
    if (!first && !last) return
    return { fullName: `${first || ''} ${last || ''}`.trim() }
  },
})
```

Options: `shouldPublish` (`true`, `false`, or `'preserve'` — default `'preserve'`).

**Derive linked entries:**

```typescript
migration.deriveLinkedEntries({
  contentType: 'blogPost',
  derivedContentType: 'author',
  from: ['authorName'],
  toReferenceField: 'authorRef',
  derivedFields: ['name'],
  identityKey: (fields) =>
    fields.authorName['en-US'].toLowerCase().replace(/\s+/g, '-'),
  deriveEntryForLocale: (fields, locale) => {
    if (locale !== 'en-US') return
    return { name: fields.authorName[locale] }
  },
})
```

This creates new `author` entries from existing `blogPost.authorName` data and links them via `authorRef`.

See [Patterns — Transform Entries](references/patterns.md#transform-entries) and [Patterns — Derive Linked Entries](references/patterns.md#derive-linked-entries) for more examples.

## Editor Interface

**Change the widget for a field:**

```typescript
const page = migration.editContentType('page')

page.changeFieldControl('slug', 'builtin', 'slugEditor', {
  helpText: 'URL-friendly identifier',
  trackingFieldId: 'title',
})

page.changeFieldControl('category', 'builtin', 'dropdown')
page.changeFieldControl('publishDate', 'builtin', 'datePicker', { format: 'dateonly' })
```

Widget namespaces: `builtin`, `extension` (UI extensions), `app` (custom apps).

See [API Reference — Editor Interface](references/api-reference.md#editor-interface) for all built-in widgets and their settings.

## Best Practices

1. **Number migration files sequentially:** `001-create-blog-post.ts`, `002-add-author-field.ts`, `003-transform-categories.ts`.
2. **One logical change per migration.** Easier to debug, revert, and review.
3. **Always test in a sandbox environment** before running against production.
4. **Use `shouldPublish: 'preserve'`** (the default) to maintain existing publish states during transforms.
5. **Prefer chaining over object notation** — chaining gives line-level error messages.
6. **Split data transforms from schema changes.** First migration changes the schema, second transforms data. This makes each step independently verifiable.
7. **Use `context.makeRequest`** sparingly — only when the migration API doesn't cover your use case.

## Common Mistakes

- **Forgetting `items` on Array fields.** `type: 'Array'` requires an `items` property specifying the element type.
- **Deleting a content type with entries.** You must delete all entries first, or move them with `transformEntriesToType`.
- **Missing `linkType` on Link fields.** `type: 'Link'` requires `linkType: 'Asset'` or `linkType: 'Entry'`.
- **Running against master.** Always test in a sandbox environment. Use `--environment-id sandbox` on the CLI.
- **Not handling missing locales in transforms.** `transformEntryForLocale` is called for every locale — return `undefined` to skip.
- **Setting `displayField` to a non-Symbol field.** The display field must be of type `Symbol`.

## References

- [API Reference](references/api-reference.md) — complete migration API surface
- [Patterns](references/patterns.md) — common migration examples
- [Running Migrations](references/running-migrations.md) — CLI, programmatic API, CI/CD

## Related Skills

- the contentful-guide skill — Contentful concepts, terminology, API routing
- the contentful-nextjs skill — Next.js integration with Contentful

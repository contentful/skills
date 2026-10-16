# Pointer Expressions, GraphQL Conventions, RichText, and Type Mapping

Reference material for [SKILL.md](../SKILL.md). Read this before writing any `return` mapping or GraphQL query, and especially before touching a RichText field.

## Pointer Expression Reference

All `return` mappings and resolver `parameters` use pointer expressions. **Default to `$from` syntax** — it's the only form the BindingPanel editor can round-trip.

| Form | Use when | Example |
|------|----------|---------|
| `$from` | Reading a value from a resolver or parameter | `{ "$from": { "source": "$resolvers/r1", "select": "_node/title" } }` |
| `$on` | Branching on `__typename` (polymorphic) | `{ "$on": { "type": { "Article": "headline", "Page": "title" } } }` |
| `$literal` | Fixed value, no resolver needed | `{ "$literal": "Read more" }` |
| `$object` | Building a structured record explicitly | `{ "$object": { "url": "...", "alt": "..." } }` |

**`$from` vs. bare pointers:**
- **`$from` (default):** Use for all non-RichText fields. Required if the DA will be editable in the BindingPanel UI.
- **Bare pointers** (e.g., `"$resolvers/main/capability/headline"`): Valid and used by some reference implementations. They work for API-created DAs that won't be edited via the BindingPanel. If a reference space uses bare pointers, you can replicate that style.
- **RichText exception:** RichText fields MUST use bare pointers. `$from` is incompatible with `RichText` dataType — the platform needs a pointer to the parent object to recognize the type. See RichText Handling below.

## GraphQL Query Conventions

- **Two query styles** — both are valid:
  - `_node(id: $id)` — generic, works for any content type. Requires a `... on TypeName` fragment.
  - `contentTypeName(id: $id)` — direct, returns the typed object immediately. Simpler queries, no fragment needed.

  Example (direct style):
  ```graphql
  query ($id: String!) { capability(id: $id) { headline body { json } } }
  ```

  Example (`_node` style):
  ```graphql
  query ($id: ID!) { _node(id: $id) { __typename ... on Capability { headline body { json } } } }
  ```

  If a reference space uses direct queries, replicate that style. Otherwise default to `_node` — it's more portable across content types.

- **Root alias convention:** You can alias the root query (e.g., `entry: capability(id: $id)`) but it's not required. Trade-offs:
  - **No alias** (e.g., `capability(id: $id)`): return paths include the content type name (`$resolvers/main/capability/headline`) — self-documenting. This is what Contentful's tooling generates.
  - **With alias** (e.g., `entry: capability(id: $id)`): shorter paths (`$resolvers/r1/entry/headline`) but less informative.

  Recommend: match the reference space. If none, use no alias.

- Always include `__typename` in the query when using `_node` (required for `$on` branching)
- For collections: query the `...Collection { items { ... } }` pattern
- Field names in GraphQL are **camelCase versions** of the content type field IDs
- Asset fields expose: `url`, `width`, `height`, `description`, `title`, `contentType`. **Alt text comes from `description`, falling back to `title`** — select both, see [resolver-patterns.md](resolver-patterns.md) "Asset (Media) fields"
- Reference fields require their own fragment: `... on ReferencedType { fields... }`
- **RichText fields** — see dedicated section below

## RichText Handling

**RichText is the ONE exception to "default to `$from`."** The platform requires a bare string pointer to the parent object (not the `/json` leaf) to recognize and resolve the RichText type. Using `$from` for RichText fields causes type validation errors.

### Correct pattern: `RichText` dataType + `{ document: json }` alias + bare pointer

```json
// sys.dataType entry
{ "id": "description", "name": "Description", "type": "RichText", "required": false }
```

```graphql
// GraphQL query — MUST alias json to "document"
query ($id: String!) {
  capability(id: $id) {
    subline { document: json }
  }
}
```

```json
// Return mapping — MUST be bare pointer to PARENT object (not /json, not /document)
"description": "$resolvers/main/capability/subline"
```

**Why this works:** The platform sees the parent object (which has a `document` key from the alias), recognizes it as RichText, and resolves it natively. The component receives a parsed RichText document object.

**What breaks:**
- `$from` + select to `/json` → API rejects: "expected RichText, got String"
- Bare pointer to `/json` leaf → platform can't recognize the RichText structure
- Missing `document: json` alias → platform can't find the document key

### Fallback: `String` dataType (when component expects raw JSON)

If the component's content property is typed as `String` (not `RichText`), deliver the raw JSON:

```json
// sys.dataType entry
{ "id": "body", "name": "Body", "type": "String", "required": false }
```

```json
// Return — $from is fine here because dataType is String
"body": { "$from": { "source": "$resolvers/r1", "select": "capability/body/json" } }
```

The component receives a JSON string and must parse it.

### Which to use

| Signal | Use |
|--------|-----|
| Content property type is `RichText` | **Bare pointer** pattern (alias + parent pointer) |
| Reference space uses `RichText` dataType | **Bare pointer** pattern |
| Content property type is `String` | `$from` + select to `/json` leaf |
| Legacy components expecting raw JSON strings | `$from` + String dataType |

## Type Mapping Reference

| Content type field | DA dataType | Notes |
|-------------------|-------------|-------|
| `Symbol` | `String` | Short text |
| `Text` | `String` | Long text (may contain markdown) |
| `Integer` | `Number` | — |
| `Number` | `Number` | — |
| `Boolean` | `Boolean` | — |
| `Date` | `String` | ISO 8601 string |
| `Location` | `Record` (lat/lon) | Rare in ExO |
| `RichText` | `RichText` (primary) or `String` (fallback) | See RichText Handling above — prefer `RichText` dataType with alias query |
| `Link<Asset>` | `Record` (Media) | url/width/height/alt/contentType |
| `Link<Entry>` | Nested DA or `Record` | Depends on target type complexity |
| `Array<Link<Entry>>` | `Array` of `Record` | Collection resolver |
| `Array<Symbol>` | `Array` of `String` | Tags, categories |

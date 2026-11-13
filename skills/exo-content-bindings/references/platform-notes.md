# Platform notes

Facts about the ExO Management API and the component editor that the scripts rely on, each verified against a live environment on 2026-10-21 and re-verified on 2026-11-12. When something behaves differently, the API wins; update this file and the script comment together.

## Endpoints (all under `/spaces/{space}/environments/{env}`)

| Entity | Draft | Published | Notes |
|---|---|---|---|
| Components | `/components`, `/components/{id}` | `/public/components` | `/component_types` is an alias |
| Templates | `/experience_templates`, `/templates` | **404** on both `/public/...` forms | Published templates cannot be listed |
| Experience fragments | `/experience_fragments` | `/public/experience_fragments` | Instance layer; carries `contentBindings` |
| Experiences | `/experiences` | `/public/experiences` | Instance layer |
| Data Assemblies | `/data_assemblies`, `/data_assemblies/{id}` | `/public/data_assemblies` | `PUT .../{id}/published` with `X-Contentful-Version` publishes |
| Content types / entries / assets | classic CMA | | skip/limit paging with `total` |

ExO collections page with a cursor: the response has `pages.next`; send it back as `?pageNext=<cursor>`. Classic collections use `skip`/`limit`/`total`. The scripts handle both.

`PUT /data_assemblies/{id}` is an upsert: no version header on create, `X-Contentful-Version` on update, `409 VersionMismatch` if stale. The body needs `sys.id` and `sys.type: "DataAssembly"`; `sys.dataType` is inferred on save from the return map but it is good practice to send the component's contract. `sys.version` and audit fields are server-managed. Linking: add `{ sys: { type: "ResourceLink", linkType: "Contentful:DataAssembly", urn: "crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/{id}" } }` to the owner's `dataAssemblies[]` and PUT the owner without its `sys`.

Permissions: by default only space admins see ExO entities; others need the Experience Editor or Presentation Editor role. A 401/403 on `/components` is a permissions problem.

## Component and template definitions

- `metadata.annotations.ComponentType[0].sys.id` is `Contentful:CodedImplementation` or `Contentful:ComposedImplementation`. Use it; don't infer from `componentTree`.
- `contentProperties[]` and `designProperties[]` are separate arrays. Only the former are bindable. Design properties carry `fallbackValue` and validations (often design-token regexps).
- Content property types seen: `String`, `RichText`, `Boolean`, `Number`, `Array` (with `items: { type: "Record", fields: [...] }`), `TypeRef` (with `ref` → a component type; a whole child component).
- Composed components reference `$contentProperties/<id>` inside `componentTree` nodes; a `Looper` node repeats a child over an Array property (`items: "$contentProperties/cp_..."`, children read `$item/<field>`).
- Slots list `allowedResources[].allowedTypes` (component ids) and size validations.
- Since 9 Oct 2026 all content properties are public by default.

## How the scripts read the model and write recipes

`scripts/main.js` is self-contained; the only library bundled into it is the public `graphql` package.

- **The content model comes from the GraphQL schema.** `GET /spaces/{id}/environments/{id}/graphql_schema` returns the environment's schema as SDL. Every content type carries `@typeIdentifier(contentTypeId)`; every bindable field carries `@fieldResolver(kind, data)` with its CMA field id, requiredness and, for references, the allowed content types. That is where the GraphQL names (`itemsCursorCollection`, not `items`), types and allowed types come from. The endpoint is rate-limited like the rest of the Management API; the scripts retry on 429.
- **Unions decide where `$on` is needed.** A reference field whose validation lists more than one content type is typed in the schema as a union (`union Section3UpTitle = ComponentTitle`), even when only one of those types exists in this environment, and a reference list likewise (`union SectionTextWithMediaItemsItem = ComponentTextWithMedia`). The GraphQL API rejects an unbranched selection through a union (`Cannot query field "x" on type "Section3UpTitle"`), and it rejects `$on` on a reference that is *not* a union (`$on.type input data type must be a discriminated union`). The scripts mark union-typed references; `build` requires `$on` exactly there. A reference field with no allowed-type restriction is typed as any entry; `discover` labels it "any entry type".
- **Queries are generated, then validated.** `build` collects the field paths a recipe reads from each resolver, writes `query ($id: ID!) { _node(id: $id) { __typename ... on <Type> { … } } }` (fields in alphabetical order, `__typename` wherever a union is branched, `document: json` under rich text fields, `_id` for a reference handed to a nested recipe), rewrites return sources to `$resolvers/<r>/_node`, and validates the result against the schema before anything is saved. A query that does not fit the schema is a build error, not a 422.
- **Query collections.** The collection shorthand writes a `<type>CursorCollection(limit: $limit, order: [...])` query and a locked `Record` parameter holding the limit. An editor-editable order (an `$order` variable bound to an `OrderExpression` parameter field) is rejected by the Management API with `Invalid input at "parameters"`, so the order is written into the query.
- `allowedTypes` in a plan take PascalCase GraphQL names or content type ids; the body stores content type ids.
- The pointer language has no list indexing (`items/0`) and no coalesce.
- **Not verified, so don't promise it:** whether a query collection includes draft or changed entries, where a never-published entry sorts under `sys_publishedAt_DESC`, how a required list property renders when the query returns nothing, and whether experience editors see a locked parameter (the collection's limit) in the binding panel. Put these to the user as open questions when they matter.
- **Not covered:** fields that reference another space or an external resource (`@fieldResolver` kind `resource-link…`). `discover` lists them under "Fields this skill cannot bind".

## What the component editor needs from a recipe (learned 2026-10-22 by comparing against a UI-authored environment)

The API accepts recipes the editor cannot render. Two things the editor checks that the save-time validator does not:

1. **`sys.dataType` must mirror the owner's full content-property contract**, including item fields the recipe never fills. A recipe that declared 6 of a list's 7 item fields saved fine and made the Items binding unusable in the component editor. `sys.dataType` is also required on write (omitting it is a 422), so there is no "let the API infer it".
2. **A `TypeRef` entry in `sys.dataType` points at the child Data Assembly that fills it**, never at the component type. Pointing it at `componentTypes/x` saved fine and broke the component's rendering. The *component's* own `contentProperties[].ref` keeps pointing at `components/x`; the two are different references for the same property.

Publishing components is bottom-up and checked against published state:
- `Cannot publish: component tree references components that have unpublished changes` / `slot configuration references components that have unpublished changes`: publish every component in the tree and in slot `allowedTypes` first. Tree nodes name their component under `component` (older payloads: `componentType`).
- `Cannot publish: content properties are not compatible with referenced published DataAssemblies`: a `TypeRef` property is checked against the child's **published** binding sets. Publish the child with its recipe linked, then the parent. Linking a recipe to a component bumps the component's version, so after an apply every touched component shows unpublished changes until it is published.

Return-expression shape the editor writes (and that `build` now emits): a selection from an entry resolver is wrapped in a root `$on` branch on the entry's content type (`$from: { source: "$resolvers/r", select: { $on: { type: { SectionTextWithMedia: … } } } }`), whole-resolver returns are `{ $from: "$resolvers/x" }`, and a nested reference is branched **only** when its field allows more than one content type; `$on` on a single-type reference is rejected (`$on.type input data type must be a discriminated union`).

## API-only recipes (the editor shows them read-only; verified 2026-11-03)

The component editor opens a binding set for editing only when the recipe fits its editing rules; otherwise it shows it as **API only**. You can't tell from the Management API, so the scripts apply a copy of those rules and returns one of three states:

| State | Meaning | What the scripts do |
|---|---|---|
| `editable` | Fits the rules and is exactly the shape the editor saves (reading it back and regenerating it gives the same recipe) | `build` requires this of everything it writes |
| `unverified` | Fits the rules, but in another shape; the editor should open it and would rewrite it on first save | `discover` marks an existing recipe "not written by the component editor"; ask the user to confirm it opens |
| `apiOnly` | Breaks a rule, or cannot be read back as field mappings at all | build error unless `apiOnly.reason` is declared; `apply` needs `--allow-api-only <id>` |

The rules were taken from the editor's behaviour in November 2026 and tested against it: the same verdict on 54 saved recipes (18 written by the editor, 5 API only) and on 2,963 variants of them that each probe one rule. **It is a copy, so it can fall behind the editor.** If the editor's rules tighten, a recipe this check passes could still show as API only; that is why the skill asks the user to open the component after applying. Recipes `build` writes are less exposed than hand-written ones, because they use only the shapes the editor itself saves.

Ruleset rejections seen or confirmed:

| Shape | Seen in |
|---|---|
| Resolver parameter that indexes a list: `$resolvers/main/_node/cardsCursorCollection/items/0/sys/id` (index, and > 4 levels) | `ctaSection`, both runs of exo-content-bindings 1.0 (2026-10-21) |
| Entity resolver whose hand-written query is rooted at the type (`section3Up(id: $id) { … }`) instead of `_node(id: $id) { … on Section3Up }` | `copyBlockColumns`, `mediaTextColumnsComposed` in an earlier snapshot of the test environment |
| Top-level `$literal` in the return | probe on `media-text-col-default` |
| Return reading `$parameters/…` directly | probe |
| Top-level explicit `$object` | probe |
| Raw API resolver in a plan (`{ source, query }`) | `build` rejects such resolvers up front |

The full rule list the check applies:

- In the return: no fixed value (`$literal`), no explicit `$object`, and no `$parameters/…` read, except inside a resolver selection.
- No pointer deeper than 4 levels: 4 fields after `$resolvers/<r>/_node`, after `$parameters/<p>`, or in a relative path. This applies to resolver parameters too.
- A bare string return may not be a whole GraphQL resolver (`"$resolvers/main"`), a path on a pick that allows several content types, or a path into a nested recipe (`"$resolvers/card1/title"`).
- An entry resolver's query must be exactly `query ($id: ID!) { _node(id: $id) { … } }` with `parameters.id` bound.
- A collection resolver must be one `<type>CursorCollection` root field with only `limit` and `order`, the limit bound to a `Record` parameter field (or a plain number).
- A `limit` on a reference list inside a query must be a whole number from 1 to 1000, alone, on an unaliased selection.
- The query must parse, and the whole recipe must read back as field mappings.

A bare number, `true` or `null` as a return value is not a rule violation: the editor opens the recipe and drops the value on first save.

Still editable (checked): `$literal` *inside* a resolver selection, `$object` inside a selection, two picks of one type feeding the same child recipe, deriving a child's entry from a parent field (`basicCardId: "$resolvers/group/cards"`). Every recipe the editor itself wrote (18 across two snapshots of the test environment) is `editable` and regenerates byte-for-byte. Recipes built by `build` are `editable` and regenerate byte-for-byte too.

## Validation messages worth recognising

| API message | Cause | Fix |
|---|---|---|
| `Cannot query field "itemsCollection" … Did you mean "itemsCursorCollection"?` | hand-written query used the skip/limit collection name | let `build` generate the query |
| `$from.source cannot traverse through a discriminated union data type` | selecting inside a multi-type list without `$on` | branch per type |
| `must map every allowed content type for multi-content-type array field … Missing mappings for: X` | required list, one member type unmapped | add the branch (even if no entry of that type exists yet) |
| `Cannot query field "title" on type "Section3UpTitle". Did you mean to use an inline fragment on "ComponentTitle"?` | single reference whose allowed list has >1 type, unbranched | `$on: { type: { ComponentTitle: "title" } }` |
| `Invalid input at "parameters"` | `OrderExpression` parameter field (editable ordering) | bake the order into the query |
| `expected RichText, got String` | `$from` into a RichText property with a leaf select | select the rich text field itself; `build` aliases `document: json` |
| `Invalid input at sys.id` / `Invalid input at "sys.dataType"` | PUT body without `sys.id` or `sys.dataType` | include both; dataType mirrors the owner's content properties |
| `$on.type input data type must be a discriminated union` | `$on` on a reference that allows exactly one content type | use the plain path (`title/title`) |
| `Cannot publish: … components that have unpublished changes` | parent published before its tree/slot children | publish children first (`apply --publish-owners`) |
| `Cannot publish: content properties are not compatible with referenced published DataAssemblies` | TypeRef child not yet published with its recipe linked | publish the child component first |

## Known limitations to tell users about

- Rich text: embedded entries and assets inside a bound Rich Text field are not rendered automatically; the component must fetch and render them.
- No per-value fallback (asset `description` else `title`). Resolve at design time by sampling; say which one you chose and why.
- Draft vs published: a parameter's allowed types filter by content type only; nothing in a recipe prefers published entries.
- Reference-list order through a cursor collection is not guaranteed to match authored order on every path; verify before promising.
- Looper children cannot carry nested binding configurations or nested collection properties.
- Unhoisted child properties of a composed component are unreachable; hoisting is a component change (for imported design systems, possibly in code and re-import).

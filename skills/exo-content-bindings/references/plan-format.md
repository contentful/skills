# plan.json format

`plan.json` is what `build` turns into Management API request bodies and `propose` turns into the review page. Each recipe is a Data Assembly as the API stores it, with the queries left out (`build` writes them), plus skill-specific keys: `linkTo`, `collection`, `review`, `apiOnly`. `discover` writes every existing recipe in this same shape to `discovery.json` (`existingBindingSets[].interim`), so an existing recipe can be copied into a plan and changed.

```jsonc
{
  "intent": {                                   // optional, shown at the top of the proposal
    "summary": "Editors assemble marketing pages from reusable sections…",
    "contract": { "Editors choose": "…", "The system derives": "…", "Editors may vary": "…", "It prevents": "…", "Exceptions go through": "…" },   // the labels are shown as written
    "assumptions": ["Quote attribution shows the company (house convention)"]
  },
  "recipes": [ /* Recipe, ordered so that any child recipe comes before its parent */ ]
}
```

Shapes you will meet in the wild: the API returns `parameters` as an **array** of `{ id, … }` (older examples show a keyed object; both are accepted on write) and `componentTree` as a **list** of nodes. The scripts handle both; if you write your own helper, don't assume dicts.

## Recipe

| Key | Required | Meaning |
|---|---|---|
| `id` | yes | Data Assembly id. Stable contract; pick something readable: `quote-default`, `section-3up-from-section`, `related-features-latest-templates` |
| `name` | yes | What the experience editor sees in the binding panel. The editor's own recipes are usually called `Default`; alternatives get a purpose name (`Use Recently Published Templates`) |
| `description` | no | One line |
| `apiOnly` | no | `{ "reason": "…" }`. Set it **only** after the user explicitly agreed to a recipe the component editor cannot edit (SKILL.md, "Keep every binding set editable in the UI"). Without it an API-only recipe is a build error; with it, a warning, a confirmation block on the proposal, and `apply --allow-api-only <id>` is still required |
| `linkTo` | yes | `[{ "kind": "components" \| "templates", "id": "…" }]`: who offers this recipe. Several owners are fine when they share the same content property ids |
| `parameters` | yes* | Editor picks. Array of `{ id, name, allowedTypes: [...], required? }` (`required` defaults to `true`). `allowedTypes` takes content type ids or PascalCase GraphQL names; `type`/`source` are filled in. *May be empty for a pure query collection |
| `resolvers` | no | Omit for the common case: a `main` entry resolver is created from the first entry parameter. Add explicitly for several picks, nested recipes, or a collection with a heading |
| `collection` | no | Shorthand for a query-driven list: `{ resolver, contentTypeName, limit, order, name? }`. Compiled into a resolver plus a locked `Record` parameter holding the limit |
| `return` | yes | `{ contentPropertyId: expression }`. Every key must be a content property of every owner in `linkTo` |
| `review` | yes | Plain-language text for the proposal. See below |

## Expressions in `return`

Always start from a resolver. `select` paths are field ids as the GraphQL schema names them (`discover` prints them); `/` traverses a reference; `…CursorCollection/items` enters a multi-reference list.

```jsonc
// a field on the picked entry
"title": { "$from": { "source": "$resolvers/main", "select": "headline" } }

// an asset url (String property)
"imageSrc": { "$from": { "source": "$resolvers/main", "select": "image/url" } }

// a field on a referenced entry whose field allows exactly one content type
"ctaLabel": { "$from": { "source": "$resolvers/main", "select": "link/label" } }

// a referenced entry the schema types as a union: its field allows several content types (even if some are absent
// from the environment, and even if only one is left). Branch, or the API refuses the query. build tells you
// when this applies; the same goes for a reference LIST whose items are a union of one type.
"heading": { "$from": { "source": "$resolvers/main/title", "select": { "$on": { "type": { "ComponentTitle": "title" } } } } }

// rich text into a RichText property (`build` adds `document: json`)
"body": { "$from": { "source": "$resolvers/main", "select": "bodyRichText" } }

// a list property (Array of Record) from a reference list; map every member type that exists
"cp_items": { "$from": { "source": "$resolvers/main/itemsCursorCollection/items", "select": { "$on": { "type": {
  "ComponentCopyBlock": { "title": "title", "description": "description", "imageSrc": "logo/url" },
  "ComponentBasicCard": { "title": "title", "description": "description", "imageSrc": "icon/url" }
} } } } }

// a list property from a query collection (single type, so no $on)
"cp_items": { "$from": { "source": "$resolvers/latest/aiActionTemplateCursorCollection/items",
              "select": { "title": "title", "eyebrow": "eyebrow", "ctaLabel": "link/label", "imageSrc": "media/image/url" } } }

// a whole child component (TypeRef property) from a nested recipe
"cp_card1": { "$from": "$resolvers/card1" }

// no fixed values: a top-level { "$literal": … } is rejected by build and is API only in the editor.
// Leave the property unbound (the component default applies) or fill it from a field.
```

## Resolvers

```jsonc
"resolvers": {
  // entry resolver: reads the entry an editor picked
  "main":    { "resolverType": "graphql", "parameters": { "id": "$parameters/sectionId" } },
  "heading": { "resolverType": "graphql", "parameters": { "id": "$parameters/titleId" } },

  // nested recipe fed from an editor pick
  "card1": { "resolverType": "dataAssembly",
             "dataAssembly": { "sys": { "type": "ResourceLink", "linkType": "Contentful:DataAssembly",
                               "urn": "crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/cta-card-default" } },
             "parameters": { "basicCardId": "$parameters/card1Id" } },

  // nested recipe fed from a reference on the picked entry (`build` passes the referenced entry's id to the child)
  "media": { "resolverType": "dataAssembly", "dataAssembly": { "...": "media-block-default link" },
             "parameters": { "mediaId": { "$from": { "source": "$resolvers/main", "select": "media" } } } }
}
```

The child recipe's parameter id (`basicCardId`, `mediaId`) is the child's own parameter name; `discover` prints it under "editor picks". The child must exist in the environment or earlier in the same plan, and must be published before the parent is saved (`apply` orders this).

Indexing into a list (`cards/0`) is not supported by the query language. If a parent must hand *the first card* to a child, that is a modelling conversation: either the parent entry gets distinct reference fields (`primaryCard`, `secondaryCard`), or the editor picks the cards (two parameters), or the whole thing becomes a collection.

## `collection` shorthand

```jsonc
"collection": { "resolver": "latest", "contentTypeName": "aiActionTemplate", "limit": 3,
                "order": [{ "path": "sys.publishedAt", "direction": "DESC" }], "name": "Latest templates" }
```

Produces a `latest` collection resolver and a locked `Record` parameter `latest { limit = 3 }`. The ordering is baked into the query because the Management API currently rejects an editor-editable `OrderExpression` parameter. `discover` can tell you which fields a type can be ordered by if you need something other than `sys.publishedAt`, `sys.firstPublishedAt` or a scalar field. Read the list as `$resolvers/<resolver>/<type>CursorCollection/items`.

## `review`

```jsonc
"review": {
  "summary": "Pick one 3-Up section entry; its heading and its three items fill themselves.",
  "picks": "One pick. The section entry owns which items appear; content editors maintain that list.",
  "derived": { "author": "Attributed to the company, matching the existing Quote binding set." },
  "notUsed": { "cp_items.imageSrc": "Items in this space have no consistent image: logo is filled on 3 of 6 copy blocks and icon on none." ,
               "hideCta": "Editors flip this per placement; the source entries never set it." },
  "alternatives": [ "Pick each card separately: rejected because the cards must match the section's heading." ],
  "questions": [ "Should the items also show the copy block's eyebrow? No entry fills it today." ]
}
```

`notUsed` and `derived` keys are content property ids, or `listProperty.itemField` for one item field of a list (a key on the list property itself repeats its text on every item row). The validator treats a *required* content property that is neither filled nor in `notUsed` as an error, and an optional one as a warning that shows on the proposal.

## Worked recipes

Three recipes taken from a real environment (all accepted by the API on 2026-10-21).

### Entry → component, following a house convention

```jsonc
{ "id": "quote-default", "name": "Default", "linkTo": [{ "kind": "components", "id": "quote" }],
  "parameters": [{ "id": "quoteId", "name": "Quote", "allowedTypes": ["componentQuote"] }],
  "return": { "quote":   { "$from": { "source": "$resolvers/main", "select": "quote" } },
              "author":  { "$from": { "source": "$resolvers/main", "select": "company" } },
              "logoSrc": { "$from": { "source": "$resolvers/main", "select": "logo/url" } } },
  "review": { "summary": "Pick one Quote; text, attribution and logo fill themselves.",
              "derived": { "author": "Attributed to the company: quotes are credited to the customer logo in this space." },
              "alternatives": ["Attribute to the person (author field): rejected, conflicts with the existing Quote recipe."] } }
```

### Composed section: one pick, heading derived through a branched reference, polymorphic item list

```jsonc
{ "id": "section-3up-default", "name": "Default", "linkTo": [{ "kind": "components", "id": "section3Up" }],
  "parameters": [{ "id": "sectionId", "name": "Section: 3-up", "allowedTypes": ["section3Up"] }],
  "return": {
    "id_dvnFgxGZCI": { "$from": { "source": "$resolvers/main/title", "select": { "$on": { "type": { "ComponentTitle": "title" } } } } },
    "id_TV3hWcpmyI": { "$from": { "source": "$resolvers/main/title", "select": { "$on": { "type": { "ComponentTitle": "eyebrowText" } } } } },
    "id_03nKHHYEz6": { "$from": { "source": "$resolvers/main/title", "select": { "$on": { "type": { "ComponentTitle": "subtitle" } } } } },
    "cp_huA9Y7PMfU": { "$from": { "source": "$resolvers/main/itemsCursorCollection/items", "select": { "$on": { "type": {
      "ComponentCopyBlock": { "title": "title", "description": "description" },
      "ComponentBasicCard": { "title": "title", "description": "description" } } } } } } },
  "review": { "summary": "Pick one 3-Up section; its heading and items fill themselves.",
              "notUsed": { "cp_huA9Y7PMfU.imageSrc": "No consistent image on items.", "cp_huA9Y7PMfU.richDescription": "No entry fills it." } } }
```

### Alternative recipe: heading picked, items from a query

```jsonc
{ "id": "related-features-latest", "name": "Use Recently Published Templates", "linkTo": [{ "kind": "components", "id": "sectionTextWithMedia" }],
  "parameters": [{ "id": "titleId", "name": "Title", "allowedTypes": ["componentTitle"] }],
  "collection": { "resolver": "latest", "contentTypeName": "aiActionTemplate", "limit": 3, "order": [{ "path": "sys.publishedAt", "direction": "DESC" }] },
  "resolvers": { "heading": { "resolverType": "graphql", "parameters": { "id": "$parameters/titleId" } } },
  "return": {
    "id_HcbMt5FA0m": { "$from": { "source": "$resolvers/heading", "select": "title" } },
    "id__EfjPwCad4": { "$from": { "source": "$resolvers/heading", "select": "eyebrowText" } },
    "id_h0hRk7592S": { "$from": { "source": "$resolvers/heading", "select": "subtitle" } },
    "cp_AHXK-ed7Lu": { "$from": { "source": "$resolvers/latest/aiActionTemplateCursorCollection/items",
                       "select": { "title": "title", "eyebrow": "eyebrow", "description": "description", "ctaLabel": "link/label", "imageSrc": "media/image/url" } } } },
  "review": { "summary": "Pick a heading; the three most recently published templates appear below it, no curation.",
              "picks": "Membership follows publication date. An empty list renders no items.",
              "notUsed": { "cp_AHXK-ed7Lu.hideCta": "Templates have no such flag; editors control it per placement.", "cp_AHXK-ed7Lu.richDescription": "Templates have no rich description." } } }
```

### Two independent picks plus a shared group, children through nested recipes

```jsonc
{ "id": "cta-section-default", "name": "Default", "linkTo": [{ "kind": "components", "id": "ctaSection" }],
  "parameters": [ { "id": "card1Id", "name": "Basic Card 1", "allowedTypes": ["componentBasicCard"] },
                  { "id": "card2Id", "name": "Basic Card 2", "allowedTypes": ["componentBasicCard"] },
                  { "id": "groupId", "name": "CTA Group",    "allowedTypes": ["sectionCallToAction"] } ],
  "resolvers": { "group": { "resolverType": "graphql", "parameters": { "id": "$parameters/groupId" } },
                 "c1": { "resolverType": "dataAssembly", "dataAssembly": { "sys": { "type": "ResourceLink", "linkType": "Contentful:DataAssembly", "urn": "crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/cta-card-default" } }, "parameters": { "basicCardId": "$parameters/card1Id" } },
                 "c2": { "resolverType": "dataAssembly", "dataAssembly": { "sys": { "type": "ResourceLink", "linkType": "Contentful:DataAssembly", "urn": "crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/cta-card-default" } }, "parameters": { "basicCardId": "$parameters/card2Id" } } },
  "return": { "id_mm_GJnDU5H": { "$from": { "source": "$resolvers/group", "select": "title" } },
              "id_7w70N-trJX": { "$from": { "source": "$resolvers/group", "select": "icon/url" } },
              "cp_nM0ySeVbTQ": { "$from": "$resolvers/c1" }, "cp_LrbIMtnSXM": { "$from": "$resolvers/c2" } },
  "review": { "summary": "Pick the CTA group for heading and icon, then each card independently.",
              "alternatives": ["Derive both cards from the group's card list: rejected, editors swap one card per page without editing the shared group."] } }
```

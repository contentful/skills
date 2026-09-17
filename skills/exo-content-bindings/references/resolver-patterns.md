# Resolver Patterns

Full request bodies for each resolver shape, referenced from [SKILL.md](../SKILL.md) and [api-workflow.md](api-workflow.md) step 6.

## Entity resolver (single entry → flat properties)

Used for: coded components, composites with direct/hoisted string properties.

```bash
curl -s -X PUT \
  -H "Authorization: Bearer $CMA_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/data_assemblies/$DA_ID" \
  -d '{
  "sys": {
    "id": "'$DA_ID'",
    "type": "DataAssembly",
    "dataType": [
      { "id": "title", "name": "Title", "type": "String", "required": false },
      { "id": "subtitle", "name": "Subtitle", "type": "String", "required": false }
    ]
  },
  "metadata": { "tags": [] },
  "name": "Hero Banner — Page Hero",
  "description": "Hydrates hero banner from a pageHero entry.",
  "parameters": {
    "pageHeroId": {
      "name": "Page Hero",
      "type": "ResourceLink",
      "linkType": "Contentful:Entry",
      "allowedResources": [{
        "type": "Contentful:Entry",
        "source": "crn:contentful:::content:spaces/$self/environments/$self",
        "allowedTypes": ["pageHero"]
      }]
    }
  },
  "resolvers": {
    "main": {
      "source": "Contentful:GraphQL",
      "query": "query ($id: ID!) { _node(id: $id) { __typename ... on PageHero { headline subline ctaText ctaLink } } }",
      "parameters": { "id": "$parameters/pageHeroId" }
    }
  },
  "return": {
    "title": {
      "$from": { "source": "$resolvers/main", "select": "_node/headline" }
    },
    "subtitle": {
      "$from": { "source": "$resolvers/main", "select": "_node/subline" }
    }
  }
}'
```

## Collection resolver (multi-reference → array of records)

Used for: coded components with `Array<Record>` content properties (e.g., grids, lists).

```bash
curl -s -X PUT \
  -H "Authorization: Bearer $CMA_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/data_assemblies/$DA_ID" \
  -d '{
  "sys": {
    "id": "'$DA_ID'",
    "type": "DataAssembly",
    "dataType": [
      {
        "id": "items",
        "name": "Items",
        "type": "Array",
        "required": false,
        "items": {
          "type": "Record",
          "fields": [
            { "id": "title", "name": "Title", "type": "String" },
            { "id": "price", "name": "Price", "type": "String" }
          ]
        }
      }
    ]
  },
  "metadata": { "tags": [] },
  "name": "Product Grid — Catalog",
  "description": "Hydrates product grid from a catalog entry products collection.",
  "parameters": {
    "catalogId": {
      "name": "Catalog",
      "type": "ResourceLink",
      "linkType": "Contentful:Entry",
      "allowedResources": [{
        "type": "Contentful:Entry",
        "source": "crn:contentful:::content:spaces/$self/environments/$self",
        "allowedTypes": ["catalog"]
      }]
    }
  },
  "resolvers": {
    "gridResolver": {
      "source": "Contentful:GraphQL",
      "kind": "collection",
      "query": "query ($id: ID!) { _node(id: $id) { __typename ... on Catalog { productsCollection { items { title price } } } } }",
      "parameters": { "id": "$parameters/catalogId" }
    }
  },
  "return": {
    "items": {
      "$from": {
        "source": "$resolvers/gridResolver",
        "select": {
          "$on": {
            "type": {
              "Catalog": {
                "$from": {
                  "source": "productsCollection/items",
                  "select": { "title": "title", "price": "price" }
                }
              }
            }
          }
        }
      }
    }
  }
}'
```

## Nested Data Assembly resolver

Used for: `TypeRef` (whole-component hoisting) or reusing an existing DA for a linked entry.

```bash
curl -s -X PUT \
  -H "Authorization: Bearer $CMA_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/data_assemblies/$DA_ID" \
  -d '{
  "sys": {
    "id": "'$DA_ID'",
    "type": "DataAssembly",
    "dataType": [
      { "id": "authorName", "name": "Author Name", "type": "String", "required": false }
    ]
  },
  "metadata": { "tags": [] },
  "name": "Article Card — With Author",
  "description": "Hydrates article card, delegating author resolution to the shared author DA.",
  "parameters": {
    "articleId": {
      "name": "Article",
      "type": "ResourceLink",
      "linkType": "Contentful:Entry",
      "allowedResources": [{
        "type": "Contentful:Entry",
        "source": "crn:contentful:::content:spaces/$self/environments/$self",
        "allowedTypes": ["article"]
      }]
    }
  },
  "resolvers": {
    "authorResolver": {
      "source": "Contentful:DataAssembly",
      "dataAssembly": {
        "sys": {
          "type": "ResourceLink",
          "linkType": "Contentful:DataAssembly",
          "urn": "crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/author-default"
        }
      },
      "parameters": { "item": "$parameters/articleId" }
    }
  },
  "return": {
    "authorName": {
      "$from": { "source": "$resolvers/authorResolver", "select": "name" }
    }
  }
}'
```

## Asset (Media) fields

For `Link<Asset>` fields mapped to a structured Media content property:

**Model a standalone asset field as a structured `Record`, never a bare `String` URL** — so dimensions and alt text survive to delivery. A URL-only `String` renders blank in any consumer that needs intrinsic dimensions (e.g. `next/image`).

**Alt text comes from the asset's `description`, falling back to `title`.** The `description` field is where editors write alternative text; `title` is a filename-derived label and is frequently something like `hero-bg-final-v3`. Shipping `title` as alt text is an accessibility defect, not a cosmetic one.

GraphQL query fragment — always select **both**:
```graphql
query ($id: ID!) {
  _node(id: $id) {
    __typename
    ... on PageHero {
      backgroundImage {
        url
        width
        height
        description
        title
        contentType
      }
    }
  }
}
```

Return mapping:
```json
"image": {
  "$from": {
    "source": "$resolvers/heroResolver",
    "select": {
      "$on": {
        "type": {
          "PageHero": {
            "$object": {
              "url": { "$from": { "source": "backgroundImage/url" } },
              "width": { "$from": { "source": "backgroundImage/width" } },
              "height": { "$from": { "source": "backgroundImage/height" } },
              "alt": { "$from": { "source": "backgroundImage/description" } },
              "contentType": { "$from": { "source": "backgroundImage/contentType" } }
            }
          }
        }
      }
    }
  }
}
```

**Resolving the fallback.** The pointer language has no coalesce operator — `$from` cannot express "description, else title" in one expression, and neither can GraphQL. So resolve the fallback **at design time**, in api-workflow.md step 5.2:

1. Sample the assets actually linked by the source content type's asset field.
2. If `description` is populated on all or most of them, map `alt` ← `description` (above). This is the default.
3. If `description` is empty across the sample, map `alt` ← `title` **and record that substitution explicitly in the Binding Plan**, flagged as an accessibility gap for the content team to fill in. Do not present it as equivalent.
4. Keep `description` and `title` both in the GraphQL selection either way — the query costs nothing extra and the second field is needed the moment the choice is revisited.

Per-asset fallback is not achievable in the DA. If the source assets are genuinely mixed, say so rather than picking silently: the correct fix is populating `description` on the assets, not a cleverer mapping.

**One exception to the `Record` shape:** an asset *inside a collection* `Array` stays a flat URL `String`, because a `Record` cannot nest inside a collection item yet. See the Collection resolver section above.

`sys.dataType` for a Media field:
```json
{
  "id": "image",
  "name": "Image",
  "type": "Record",
  "required": false,
  "fields": [
    { "id": "url", "name": "URL", "type": "String" },
    { "id": "width", "name": "Width", "type": "Number" },
    { "id": "height", "name": "Height", "type": "Number" },
    { "id": "alt", "name": "Alt text", "type": "String" },
    { "id": "contentType", "name": "Content Type", "type": "String" }
  ]
}
```

## Deep binding (reference traversal)

**Deep binding** crosses one or more Entry reference fields before reaching the value. Use it when a content property needs data from a linked entry (e.g., `Book → Author → name`).

**Hop limit: ≤ 3 hops.** The root entry is hop 1; each subsequent Entry reference adds one hop.

```
Book entry → author → mentor → name
hop 1        hop 2    hop 3    scalar (OK — 3 hops)

Catalog → publisher → author → imprint → name
hop 1     hop 2       hop 3    hop 4 ✗   (REJECTED — 4 hops)
```

### Pattern 1: Scalar deep bind (inline reference traversal)

Read a field on a linked entry by traversing the reference in the GraphQL query:

```bash
curl -s -X PUT \
  -H "Authorization: Bearer $CMA_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/data_assemblies/$DA_ID" \
  -d '{
  "sys": {
    "id": "'$DA_ID'",
    "type": "DataAssembly",
    "dataType": [
      { "id": "title", "name": "Title", "type": "String", "required": true },
      { "id": "authorName", "name": "Author Name", "type": "String", "required": false }
    ]
  },
  "metadata": { "tags": [] },
  "name": "Book Card — With Author",
  "description": "Hydrates book card including the linked author name (2 hops).",
  "parameters": {
    "bookId": {
      "name": "Book",
      "type": "ResourceLink",
      "linkType": "Contentful:Entry",
      "allowedResources": [{
        "type": "Contentful:Entry",
        "source": "crn:contentful:::content:spaces/$self/environments/$self",
        "allowedTypes": ["book"]
      }]
    }
  },
  "resolvers": {
    "item": {
      "source": "Contentful:GraphQL",
      "query": "query ($id: ID!) { _node(id: $id) { __typename ... on Book { title author { name } } } }",
      "parameters": { "id": "$parameters/bookId" }
    }
  },
  "return": {
    "title": { "$from": { "source": "$resolvers/item", "select": "_node/title" } },
    "authorName": { "$from": { "source": "$resolvers/item", "select": "_node/author/name" } }
  }
}'
```

The path `_node/author/name` traverses the `author` reference (hop 2) and reads `name` (scalar). The GraphQL query **must** select `author { name }` — validation only allows paths that match selected fields.

### Pattern 2: TypeRef deep bind (nested DA for linked entry)

When the linked entry is complex enough to warrant its own DA, use a nested `Contentful:DataAssembly` resolver. Pass the linked entry's `sys.id` as the child's parameter:

```bash
curl -s -X PUT \
  -H "Authorization: Bearer $CMA_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/data_assemblies/$DA_ID" \
  -d '{
  "sys": {
    "id": "'$DA_ID'",
    "type": "DataAssembly",
    "dataType": [
      { "id": "title", "name": "Title", "type": "String", "required": true },
      { "id": "author", "name": "Author", "type": "TypeRef", "required": false }
    ]
  },
  "metadata": { "tags": [] },
  "name": "Book — With Author DA",
  "description": "Hydrates book fields + delegates author to child DA (2 hops).",
  "parameters": {
    "bookId": {
      "name": "Book",
      "type": "ResourceLink",
      "linkType": "Contentful:Entry",
      "allowedResources": [{
        "type": "Contentful:Entry",
        "source": "crn:contentful:::content:spaces/$self/environments/$self",
        "allowedTypes": ["book"]
      }]
    }
  },
  "resolvers": {
    "item": {
      "source": "Contentful:GraphQL",
      "query": "query ($id: ID!) { _node(id: $id) { __typename ... on Book { title author { sys { id } } } } }",
      "parameters": { "id": "$parameters/bookId" }
    },
    "authorResolver": {
      "source": "Contentful:DataAssembly",
      "dataAssembly": {
        "sys": {
          "type": "ResourceLink",
          "linkType": "Contentful:DataAssembly",
          "urn": "crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/author-default"
        }
      },
      "parameters": { "item": "$resolvers/item/_node/author/sys/id" }
    }
  },
  "return": {
    "title": { "$from": { "source": "$resolvers/item", "select": "_node/title" } },
    "author": "$resolvers/authorResolver"
  }
}'
```

The child DA (`author-default`) receives the author entry ID and resolves it independently. The parent's `author` return field gets the child DA's full output.

### When to use scalar vs. TypeRef deep binding

| Scenario | Use |
|----------|-----|
| Need 1-2 fields from the linked entry | Scalar (inline in GraphQL query) |
| Linked entry is used by multiple parent DAs | TypeRef (shared child DA, reusable) |
| Linked entry maps to its own component with content properties | TypeRef (child DA matches child component) |
| > 3 fields from the linked entry | TypeRef (keeps parent query clean) |

### Polymorphic deep binding (`$on.type`)

When a parameter accepts multiple content types and you need a deep bind that differs per type:

```json
"return": {
  "displayLabel": {
    "$from": {
      "source": "$resolvers/item/_node",
      "select": {
        "$on": {
          "type": {
            "Book": "title",
            "Magazine": "editor/name"
          }
        }
      }
    }
  }
}
```

- `Book` branch: shallow (field on root — 1 hop)
- `Magazine` branch: deep (Magazine → Editor → name — 2 hops)

**Rules for `$on.type` with required fields:** every allowed content type MUST have a branch. For optional fields, partial branch coverage is allowed.

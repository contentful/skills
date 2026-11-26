# Resolver patterns

Use a complete persisted body after the Binding Plan is approved. Adapt names,
content types, fields, and `$on.type` branches only after tracing the current
target GraphQL schema. These bodies are sys-free; CMA assigns `sys` after save.

## Entity resolver: selected Entry to scalar properties

Use this for one selected Entry. `_node` is abstract in this schema, so it is a
transport boundary in `$from.source` and needs a `$on.type` branch.

```json
{
  "metadata": { "tags": [] },
  "name": "Page highlights",
  "description": "Uses one Page Hero entry to populate the primary content.",
  "parameters": [
    {
      "id": "pageHero",
      "name": "Page Hero",
      "required": true,
      "type": "ResourceLink",
      "allowedResources": [
        {
          "type": "Contentful:Entry",
          "source": "crn:contentful:::content:spaces/$self/environments/$self",
          "allowedTypes": ["pageHero"]
        }
      ]
    }
  ],
  "resolvers": {
    "hero": {
      "source": "Contentful:GraphQL",
      "query": "query ($id: ID!) { _node(id: $id) { __typename ... on PageHero { headline subline ctaText ctaLink } } }",
      "parameters": { "id": "$parameters/pageHero" }
    }
  },
  "return": {
    "title": { "$from": { "source": "$resolvers/hero/_node", "select": { "$on": { "type": { "PageHero": "headline" } } } } },
    "subtitle": { "$from": { "source": "$resolvers/hero/_node", "select": { "$on": { "type": { "PageHero": "subline" } } } } },
    "ctaLabel": { "$from": { "source": "$resolvers/hero/_node", "select": { "$on": { "type": { "PageHero": "ctaText" } } } } },
    "ctaUrl": { "$from": { "source": "$resolvers/hero/_node", "select": { "$on": { "type": { "PageHero": "ctaLink" } } } } }
  }
}
```

## Independent selected sources

Use separate parameters when the sources have no declared CMS relationship.
Do not invent a parent-child relationship just to produce one resolver.

```json
{
  "metadata": { "tags": [] },
  "name": "Article with author details",
  "description": "Combines independently selected article and author content.",
  "parameters": [
    {
      "id": "article",
      "required": true,
      "type": "ResourceLink",
      "allowedResources": [{ "type": "Contentful:Entry", "source": "crn:contentful:::content:spaces/$self/environments/$self", "allowedTypes": ["article"] }]
    },
    {
      "id": "author",
      "required": true,
      "type": "ResourceLink",
      "allowedResources": [{ "type": "Contentful:Entry", "source": "crn:contentful:::content:spaces/$self/environments/$self", "allowedTypes": ["author"] }]
    }
  ],
  "resolvers": {
    "article": { "source": "Contentful:GraphQL", "query": "query ($id: ID!) { _node(id: $id) { __typename ... on Article { headline } } }", "parameters": { "id": "$parameters/article" } },
    "author": { "source": "Contentful:GraphQL", "query": "query ($id: ID!) { _node(id: $id) { __typename ... on Author { name } } }", "parameters": { "id": "$parameters/author" } }
  },
  "return": {
    "title": { "$from": { "source": "$resolvers/article/_node", "select": { "$on": { "type": { "Article": "headline" } } } } },
    "authorName": { "$from": { "source": "$resolvers/author/_node", "select": { "$on": { "type": { "Author": "name" } } } } }
  }
}
```

## Nested collection below a selected Entry

This is an entity resolver returning an `Array<Record>`, not a root collection.
Keep the collection envelope in the inner `$from.source`.

```json
{
  "metadata": { "tags": [] },
  "name": "Product collection",
  "description": "Shows product records from one Catalog entry.",
  "parameters": [
    {
      "id": "catalog",
      "required": true,
      "type": "ResourceLink",
      "allowedResources": [{ "type": "Contentful:Entry", "source": "crn:contentful:::content:spaces/$self/environments/$self", "allowedTypes": ["catalog"] }]
    }
  ],
  "resolvers": {
    "catalog": {
      "source": "Contentful:GraphQL",
      "query": "query ($id: ID!) { _node(id: $id) { __typename ... on Catalog { productsCollection { items { title price } } } } }",
      "parameters": { "id": "$parameters/catalog" }
    }
  },
  "return": {
    "items": {
      "$from": {
        "source": "$resolvers/catalog/_node",
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
}
```

## Static root collection

Use a root collection only for a static, editor-compatible collection. Validate
the collection field and `sys_publishedAt_DESC` enum in the target schema.

```json
{
  "metadata": { "tags": [] },
  "name": "Recent AI actions",
  "description": "Displays the three most recently published AI actions.",
  "parameters": [{
    "id": "actions",
    "type": "Record",
    "required": true,
    "locked": true,
    "fields": [
      { "id": "limit", "type": "Number", "fallbackValue": 3 },
      {
        "id": "order",
        "type": "OrderExpression",
        "fallbackValue": [{ "path": "sys.publishedAt", "direction": "desc" }],
        "target": {
          "resourceLink": "crn:contentful:::content:spaces/$self/environments/$self/contentTypes/aiActionTemplate"
        }
      }
    ]
  }],
  "resolvers": {
    "actions": {
      "source": "Contentful:GraphQL",
      "query": "query ($limit: Int!, $order: [AiActionTemplateOrder]) { aiActionTemplateCursorCollection(limit: $limit, order: $order) { items { title description } } }",
      "parameters": {
        "limit": "$parameters/actions/limit",
        "order": "$parameters/actions/order"
      }
    }
  },
  "return": {
    "actions": {
      "$from": {
        "source": "$resolvers/actions/aiActionTemplateCursorCollection/items",
        "select": { "title": "title", "description": "description" }
      }
    }
  }
}
```

Use the complete locked Record shape for both query variables. See
[UI-compatible mappings](ui-compatible-mappings.md#root-collections-ui-shaped-fixed-order).

## Direct Asset to scalar properties

Map individual Asset fields to the Component's declared contract. There is no
generic `Media` content-property type.

```json
{
  "metadata": { "tags": [] },
  "name": "Selected visual",
  "description": "Maps fields from one selected Asset.",
  "parameters": [
    {
      "id": "asset",
      "required": true,
      "type": "ResourceLink",
      "allowedResources": [{ "type": "Contentful:Asset", "source": "crn:contentful:::content:spaces/$self/environments/$self" }]
    }
  ],
  "resolvers": {
    "asset": {
      "source": "Contentful:GraphQL",
      "query": "query ($id: ID!) { _node(id: $id) { __typename ... on Asset { url description width height } } }",
      "parameters": { "id": "$parameters/asset" }
    }
  },
  "return": {
    "url": { "$from": { "source": "$resolvers/asset/_node", "select": { "$on": { "type": { "Asset": "url" } } } } },
    "alt": { "$from": { "source": "$resolvers/asset/_node", "select": { "$on": { "type": { "Asset": "description" } } } } },
    "width": { "$from": { "source": "$resolvers/asset/_node", "select": { "$on": { "type": { "Asset": "width" } } } } },
    "height": { "$from": { "source": "$resolvers/asset/_node", "select": { "$on": { "type": { "Asset": "height" } } } } }
  }
}
```

Sample Assets first. Choose one safe source for alt text; a DA does not express
a per-Asset description-to-title fallback.

## RichText and nested Data Assemblies

RichText maps only to a `RichText` content property. Query a `document: json`
alias and return its parent object, not the `json` leaf:

```graphql
query ($id: ID!) {
  _node(id: $id) {
    __typename
    ... on Article { body { document: json } }
  }
}
```

For a nested Component contract (`TypeRef`), create the child DA first. The
parent uses a `Contentful:DataAssembly` resolver, passes a compatible source ID
to the child parameter, and returns the whole nested resolver. Do not treat a
`TypeRef` as a plain `Link<Entry>` or select individual child fields from the
parent return map.

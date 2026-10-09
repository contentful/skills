# Worked Example: Hero + Card from Promotion Entry

This example (from [contentful/experiences](https://github.com/contentful/experiences/tree/main/examples/scripts/fixture)) shows two coded components hydrated from the same content type. Referenced from [SKILL.md](../SKILL.md).

## Source content type: `promotion`

```
Fields:
  title: Symbol (required)
  teaser: Text
  ctaLabel: Symbol
  ctaUrl: Symbol
  image: Link<Asset>
```

## Component Type: `hero-plain` (coded)

```
contentProperties:
  ✓ title: String (required)
  ○ ctaLabel: String
  ○ ctaUrl: String
  ○ image: String
```

## Data Assembly: `hero-from-promotion`

```json
{
  "sys": {
    "id": "hero-from-promotion",
    "type": "DataAssembly",
    "dataType": [
      { "id": "title", "name": "Title", "type": "String", "required": true },
      { "id": "ctaLabel", "name": "CTA label", "type": "String", "required": false },
      { "id": "ctaUrl", "name": "CTA URL", "type": "String", "required": false },
      { "id": "image", "name": "Image URL", "type": "String", "required": false }
    ]
  },
  "metadata": { "tags": [] },
  "name": "Hero from Promotion",
  "description": "Maps a promotion entry into the hero-plain ComponentType",
  "parameters": {
    "promotionId": {
      "name": "Promotion",
      "type": "ResourceLink",
      "linkType": "Contentful:Entry",
      "allowedResources": [{
        "type": "Contentful:Entry",
        "source": "crn:contentful:::content:spaces/$self/environments/$self",
        "allowedTypes": ["promotion"]
      }]
    }
  },
  "resolvers": {
    "main": {
      "source": "Contentful:GraphQL",
      "query": "query ($id: ID!) { _node(id: $id) { __typename ... on Promotion { title ctaLabel ctaUrl image { url } } } }",
      "parameters": { "id": "$parameters/promotionId" }
    }
  },
  "return": {
    "title": { "$from": { "source": "$resolvers/main", "select": "_node/title" } },
    "ctaLabel": { "$from": { "source": "$resolvers/main", "select": "_node/ctaLabel" } },
    "ctaUrl": { "$from": { "source": "$resolvers/main", "select": "_node/ctaUrl" } },
    "image": { "$from": { "source": "$resolvers/main", "select": "_node/image/url" } }
  }
}
```

## Component Type: `card` (coded)

```
contentProperties:
  ✓ title: String (required)
  ○ teaser: String
  ○ ctaLabel: String
  ○ ctaUrl: String
  ○ image: String
```

## Data Assembly: `card-from-promotion`

Same source content type, different set of mapped fields (adds `teaser`):

```json
{
  "sys": {
    "id": "card-from-promotion",
    "type": "DataAssembly",
    "dataType": [
      { "id": "title", "name": "Title", "type": "String", "required": true },
      { "id": "teaser", "name": "Teaser", "type": "String", "required": false },
      { "id": "ctaLabel", "name": "CTA label", "type": "String", "required": false },
      { "id": "ctaUrl", "name": "CTA URL", "type": "String", "required": false },
      { "id": "image", "name": "Image URL", "type": "String", "required": false }
    ]
  },
  "metadata": { "tags": [] },
  "name": "Card from Promotion",
  "description": "Maps a promotion entry into the card ComponentType",
  "parameters": {
    "promotionId": {
      "name": "Promotion",
      "type": "ResourceLink",
      "linkType": "Contentful:Entry",
      "allowedResources": [{
        "type": "Contentful:Entry",
        "source": "crn:contentful:::content:spaces/$self/environments/$self",
        "allowedTypes": ["promotion"]
      }]
    }
  },
  "resolvers": {
    "main": {
      "source": "Contentful:GraphQL",
      "query": "query ($id: ID!) { _node(id: $id) { __typename ... on Promotion { title teaser ctaLabel ctaUrl image { url } } } }",
      "parameters": { "id": "$parameters/promotionId" }
    }
  },
  "return": {
    "title": { "$from": { "source": "$resolvers/main", "select": "_node/title" } },
    "teaser": { "$from": { "source": "$resolvers/main", "select": "_node/teaser" } },
    "ctaLabel": { "$from": { "source": "$resolvers/main", "select": "_node/ctaLabel" } },
    "ctaUrl": { "$from": { "source": "$resolvers/main", "select": "_node/ctaUrl" } },
    "image": { "$from": { "source": "$resolvers/main", "select": "_node/image/url" } }
  }
}
```

## Linking DAs to Component Types

After creation, each DA is added to its target component type's `dataAssemblies` array:

```json
{
  "dataAssemblies": [
    {
      "sys": {
        "type": "ResourceLink",
        "linkType": "Contentful:DataAssembly",
        "urn": "crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/hero-from-promotion"
      }
    }
  ]
}
```

## Content Binding on an Experience Node

When a marketer uses this DA in an experience, the node stores:

```json
{
  "id": "node:hero",
  "nodeType": "InlineFragment",
  "componentType": {
    "sys": {
      "type": "ResourceLink",
      "linkType": "Contentful:ComponentType",
      "urn": "crn:contentful:::experience:spaces/$self/environments/$self/componentTypes/hero-plain"
    }
  },
  "contentBindings": {
    "sys": {
      "type": "ResourceLink",
      "linkType": "Contentful:DataAssembly",
      "urn": "crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/hero-from-promotion"
    },
    "parameters": {
      "promo": {
        "sys": {
          "type": "ResourceLink",
          "linkType": "Contentful:Entry",
          "urn": "crn:contentful:::content:spaces/$self/environments/$self/entries/abc123"
        }
      }
    }
  }
}
```

At runtime, ExO executes the DA's GraphQL resolver with entry `abc123`, maps the result through the return expressions, and writes the resolved values into the component's content properties.

## Key Patterns from This Example

1. **`sys.dataType` mirrors `contentProperties`** — the DA's dataType IDs must match the component's content property IDs exactly
2. **One content type can feed multiple DAs** — `promotion` feeds both `hero-from-promotion` and `card-from-promotion`
3. **One component type can have multiple DAs (binding sets)** — different source content types produce different DAs for the same component; the marketer chooses which DA to use per instance
4. **Asset fields traversed with path notation** — `image { url }` in GraphQL, `_node/image/url` in the return select
5. **URN format is consistent** — `crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/{id}`

## Binding Sets: Multiple DAs Per Component

A component type's `dataAssemblies` array can hold multiple DAs — each is an alternative **binding set**. The marketer picks one when configuring an instance:

```json
{
  "dataAssemblies": [
    { "sys": { "type": "ResourceLink", "linkType": "Contentful:DataAssembly", "urn": "...dataAssemblies/card-from-promotion" } },
    { "sys": { "type": "ResourceLink", "linkType": "Contentful:DataAssembly", "urn": "...dataAssemblies/card-from-blog-post" } },
    { "sys": { "type": "ResourceLink", "linkType": "Contentful:DataAssembly", "urn": "...dataAssemblies/card-from-product" } }
  ]
}
```

Each DA is a complete binding set (parameters + resolvers + return). They are **not** composed together — the marketer selects ONE per instance. Design multiple DAs when:
- The same component can be hydrated from different content types
- Different content types expose different subsets of fields
- You want to offer the marketer a choice of "what feeds this component"

## Reusing One DA Across Multiple Component Types

If two or more component types have the **same content property IDs** and you want the same source → target mapping, create ONE DA and link it to both component types (see [api-workflow.md](api-workflow.md) step 7). Don't duplicate.

Example: `hero` and `mediaTextRow` both have `eyebrow`, `title`, `description`, `imageSrc` — a single `capability-da` linked to both is correct.

**When to reuse vs. duplicate:**

| Situation | Action |
|-----------|--------|
| Same content property IDs, same source content type | Reuse — link one DA to multiple component types |
| Same source content type, different property IDs | Create separate DAs (different return mappings) |
| Same property IDs but different source content types | Create separate DAs (different parameters) |

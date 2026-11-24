# Advanced resolver patterns

Read this reference for RichText, polymorphic inputs, and nested Component
contracts. Validate each query and every `$on.type` branch against the current
target GraphQL schema before using it.

## RichText with scalar siblings

RichText maps only to a target `RichText` property. Query the `document: json`
alias and return the parent `body` object, not a `json` or `document` leaf.

```json
{
  "metadata": { "tags": [] },
  "name": "Article story",
  "description": "Uses one Article entry for the title and rich-text body.",
  "parameters": [
    {
      "id": "article",
      "required": true,
      "type": "ResourceLink",
      "allowedResources": [{ "type": "Contentful:Entry", "source": "crn:contentful:::content:spaces/$self/environments/$self", "allowedTypes": ["article"] }]
    }
  ],
  "resolvers": {
    "article": {
      "source": "Contentful:GraphQL",
      "query": "query ($id: ID!) { _node(id: $id) { __typename ... on Article { title body { document: json } } } }",
      "parameters": { "id": "$parameters/article" }
    }
  },
  "return": {
    "title": { "$from": { "source": "$resolvers/article/_node", "select": { "$on": { "type": { "Article": "title" } } } } },
    "body": { "$from": { "source": "$resolvers/article/_node", "select": { "$on": { "type": { "Article": "body" } } } } }
  }
}
```

## One parameter, multiple possible Entry types

Only use multiple allowed types when one DA contract supports every branch. The
`_node` result is abstract, so this mapping branches by GraphQL type.

```json
{
  "metadata": { "tags": [] },
  "name": "Headline and summary",
  "description": "Derives presentation content from the selected source.",
  "parameters": [
    {
      "id": "content",
      "required": true,
      "type": "ResourceLink",
      "allowedResources": [{ "type": "Contentful:Entry", "source": "crn:contentful:::content:spaces/$self/environments/$self", "allowedTypes": ["componentTitle", "componentCopyBlock"] }]
    }
  ],
  "resolvers": {
    "content": {
      "source": "Contentful:GraphQL",
      "query": "query ($id: ID!) { _node(id: $id) { __typename ... on ComponentTitle { title subtitle } ... on ComponentCopyBlock { title description } } }",
      "parameters": { "id": "$parameters/content" }
    }
  },
  "return": {
    "title": { "$from": { "source": "$resolvers/content/_node", "select": { "$on": { "type": { "ComponentTitle": "title", "ComponentCopyBlock": "title" } } } } },
    "summary": { "$from": { "source": "$resolvers/content/_node", "select": { "$on": { "type": { "ComponentTitle": "subtitle", "ComponentCopyBlock": "description" } } } } }
  }
}
```

## Nested Data Assembly for a nested Component contract

Use a nested DA only when the target property represents a child Component's
complete contract. Create and link the child DA before the parent. The parent
returns the whole child resolver, not a child field.

```json
{
  "metadata": { "tags": [] },
  "name": "Book details with author",
  "description": "Uses a book and its linked author to populate nested author content.",
  "parameters": [
    {
      "id": "book",
      "required": true,
      "type": "ResourceLink",
      "allowedResources": [{ "type": "Contentful:Entry", "source": "crn:contentful:::content:spaces/$self/environments/$self", "allowedTypes": ["book"] }]
    }
  ],
  "resolvers": {
    "book": {
      "source": "Contentful:GraphQL",
      "query": "query ($id: ID!) { _node(id: $id) { __typename ... on Book { title author { sys { id } } } } }",
      "parameters": { "id": "$parameters/book" }
    },
    "author": {
      "source": "Contentful:DataAssembly",
      "dataAssembly": {
        "sys": {
          "type": "ResourceLink",
          "linkType": "Contentful:DataAssembly",
          "urn": "crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/author-default"
        }
      },
      "parameters": {
        "author": {
          "$from": {
            "source": "$resolvers/book/_node",
            "select": { "$on": { "type": { "Book": "author/sys/id" } } }
          }
        }
      }
    }
  },
  "return": {
    "title": { "$from": { "source": "$resolvers/book/_node", "select": { "$on": { "type": { "Book": "title" } } } } },
    "author": "$resolvers/author"
  }
}
```

The `sys` object above identifies an existing child DA ResourceLink. It is the
only permitted `sys` object within a persisted parent write body; never put
`sys` at the DA root.

## Polymorphic collection items

For collection items that are a union or interface, preserve the collection
transport boundary and use an inner branch for each selected item type:

```json
{
  "$from": {
    "source": "$resolvers/section/_node",
    "select": {
      "$on": {
        "type": {
          "SectionWithCards": {
            "$from": {
              "source": "cardsCursorCollection/items",
              "select": {
                "$on": {
                  "type": {
                    "PromoCard": { "title": "title" },
                    "ArticleCard": { "title": "headline" }
                  }
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

The matching resolver query must select `__typename` and inline fragments at
both abstract boundaries. If the target schema instead exposes concrete item
objects, remove this inner `$on.type` and use a plain item selector.

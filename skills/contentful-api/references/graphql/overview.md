# GraphQL Content API

Contentful provides a GraphQL endpoint for querying published content. It uses CDA tokens and supports the same content as the Content Delivery API.

## Table of Contents
- [Endpoint](#endpoint)
- [Authentication](#authentication)
- [Basic Query](#basic-query)
- [Query Patterns](#query-patterns)
- [Filtering](#filtering)
- [Pagination](#pagination)
- [Preview Content](#preview-content)
- [Complexity Limits](#complexity-limits)

## Endpoint

```
POST https://graphql.contentful.com/content/v1/spaces/{space_id}/environments/{environment_id}
```

- **US**: `graphql.contentful.com`
- **EU**: `graphql.eu.contentful.com`

## Authentication

Use a CDA access token:

```bash
curl -X POST https://graphql.contentful.com/content/v1/spaces/{space_id}/environments/master \
  -H "Authorization: Bearer {cda_token}" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ blogPostCollection { items { sys { id } } } }"}'
```

## Basic Query

### Single Entry

```bash
curl -X POST https://graphql.contentful.com/content/v1/spaces/{space_id}/environments/master \
  -H "Authorization: Bearer {cda_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { blogPost(id: \"entry-id\") { title slug body { json } author { name } } }"
  }'
```

### Collection Query

```bash
curl -X POST https://graphql.contentful.com/content/v1/spaces/{space_id}/environments/master \
  -H "Authorization: Bearer {cda_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { blogPostCollection(limit: 10, order: publishDate_DESC) { total items { sys { id } title slug publishDate } } }"
  }'
```

## Query Patterns

### Schema Convention

Contentful auto-generates the GraphQL schema from your content types:

| Content Type ID | Single entry | Collection |
|----------------|-------------|------------|
| `blogPost` | `blogPost(id: "...")` | `blogPostCollection(...)` |
| `author` | `author(id: "...")` | `authorCollection(...)` |
| `category` | `category(id: "...")` | `categoryCollection(...)` |

Field names match content type field IDs.

### Nested References

References are resolved inline — no separate `includes` object:

```graphql
query {
  blogPostCollection(limit: 5) {
    items {
      title
      author {
        name
        photo {
          url
          width
          height
        }
      }
      heroImage {
        url
        width
        height
      }
    }
  }
}
```

### Rich Text

Rich text fields return a `json` property containing the document:

```graphql
query {
  blogPost(id: "entry-id") {
    body {
      json
      links {
        entries {
          block { sys { id } __typename }
          inline { sys { id } __typename }
        }
        assets {
          block { sys { id } url title }
        }
      }
    }
  }
}
```

## Filtering

### Where Clause

```graphql
query {
  blogPostCollection(where: { slug: "hello-world" }) {
    items { title }
  }
}
```

### Operators

```graphql
# Equality
where: { slug: "hello-world" }

# Not equal
where: { slug_not: "hello-world" }

# In list
where: { slug_in: ["post-1", "post-2"] }

# Not in list
where: { slug_not_in: ["post-1"] }

# Contains (text search)
where: { title_contains: "contentful" }

# Exists
where: { author_exists: true }

# Greater/less than (numbers, dates)
where: { publishDate_gt: "2024-01-01" }
where: { publishDate_gte: "2024-01-01" }
where: { publishDate_lt: "2024-12-31" }
where: { publishDate_lte: "2024-12-31" }
```

### Combined Filters (AND)

```graphql
query {
  blogPostCollection(
    where: {
      featured: true,
      publishDate_gte: "2024-01-01"
    }
  ) {
    items { title }
  }
}
```

### OR Queries

```graphql
query {
  blogPostCollection(
    where: {
      OR: [
        { slug: "post-1" },
        { slug: "post-2" }
      ]
    }
  ) {
    items { title }
  }
}
```

## Pagination

```graphql
query {
  blogPostCollection(limit: 10, skip: 0) {
    total
    skip
    limit
    items { title }
  }
}
```

Maximum `limit`: 1000.

## Preview Content

Use a Preview token and add `preview: true` to queries:

```bash
curl -X POST https://graphql.contentful.com/content/v1/spaces/{space_id}/environments/master \
  -H "Authorization: Bearer {preview_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { blogPostCollection(preview: true) { items { title sys { publishedAt } } } }"
  }'
```

This returns draft and changed content (equivalent to using the Preview API host with REST).

## Complexity Limits

GraphQL queries are subject to complexity limits:

- **Max complexity**: 11,000 points
- Each field costs points based on type and depth
- Collection queries cost more than single-entry queries
- Deeply nested reference queries increase complexity quickly

If a query exceeds the limit, the API returns an error with the calculated complexity.

### Reducing Complexity

1. Limit collection sizes with `limit`
2. Avoid deeply nested reference chains
3. Use `sys { id }` instead of fetching full referenced entries when you only need IDs
4. Split large queries into multiple smaller queries

## Rate Limits

Same as CDA: ~78 requests/second per space (varies by plan). Each GraphQL request counts as one request regardless of query complexity.

## Best Practices

1. **Use variables** for dynamic values instead of string interpolation
2. **Limit collection sizes** — always set `limit`
3. **Watch complexity** — monitor query complexity scores
4. **Use fragments** for reusable field selections
5. **Prefer REST for simple queries** — GraphQL overhead isn't worth it for single entry fetches
6. **Use `preview: true`** with preview token for draft content

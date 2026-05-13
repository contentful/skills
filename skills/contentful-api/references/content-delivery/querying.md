# Querying

Comprehensive guide to querying entries and assets via the Content Delivery API.

## Table of Contents
- [Basic Query](#basic-query)
- [Pagination](#pagination)
- [Ordering](#ordering)
- [Select Fields](#select-fields)
- [Equality and Inequality](#equality-and-inequality)
- [Inclusion Operators](#inclusion-operators)
- [Existence Check](#existence-check)
- [Comparison Operators](#comparison-operators)
- [Date Ranges](#date-ranges)
- [Full-Text Search](#full-text-search)
- [Array Fields](#array-fields)
- [Location Queries](#location-queries)
- [Link Queries](#link-queries)
- [System Field Queries](#system-field-queries)
- [Asset Queries](#asset-queries)
- [Complex Examples](#complex-examples)

## Basic Query

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/entries?content_type=blogPost" \
  -H "Authorization: Bearer {cda_token}"
```

Always specify `content_type` when querying by field — it's required for field-based filters and improves performance.

## Pagination

```bash
# Page 1
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/entries?content_type=blogPost&limit=100&skip=0" \
  -H "Authorization: Bearer {cda_token}"

# Page 2
curl "...?content_type=blogPost&limit=100&skip=100" \
  -H "Authorization: Bearer {cda_token}"
```

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `limit` | 100 | 1000 | Items per page |
| `skip` | 0 | — | Items to skip |

Continue until `items.length < limit` or `skip >= total`.

## Ordering

```bash
# Ascending
...?order=fields.publishDate

# Descending (prefix with -)
...?order=-fields.publishDate

# Multiple fields
...?order=-fields.publishDate,fields.title

# System fields
...?order=sys.createdAt
...?order=-sys.updatedAt
```

Ordering by field requires `content_type` parameter.

## Select Fields

Return only specific fields to reduce payload:

```bash
# Select specific fields (sys.id is always included)
...?content_type=blogPost&select=fields.title,fields.slug,sys.id

# Only sys metadata
...?content_type=blogPost&select=sys
```

## Equality and Inequality

```bash
# Exact match
...?content_type=blogPost&fields.slug=hello-world

# Not equal
...?content_type=blogPost&fields.slug[ne]=hello-world
```

## Inclusion Operators

```bash
# In list (OR)
...?content_type=blogPost&fields.slug[in]=post-1,post-2,post-3

# Not in list
...?content_type=blogPost&fields.slug[nin]=post-1,post-2
```

## Existence Check

```bash
# Field exists (has value)
...?content_type=blogPost&fields.author[exists]=true

# Field doesn't exist (is empty)
...?content_type=blogPost&fields.author[exists]=false
```

## Comparison Operators

```bash
# Greater than
...?content_type=blogPost&fields.viewCount[gt]=1000

# Greater than or equal
...?content_type=blogPost&fields.viewCount[gte]=1000

# Less than
...?content_type=blogPost&fields.viewCount[lt]=1000

# Less than or equal
...?content_type=blogPost&fields.viewCount[lte]=1000
```

## Date Ranges

```bash
# After date
...?content_type=blogPost&fields.publishDate[gte]=2024-01-01

# Before date
...?content_type=blogPost&fields.publishDate[lte]=2024-12-31

# Date range
...?content_type=blogPost&fields.publishDate[gte]=2024-01-01&fields.publishDate[lte]=2024-12-31

# System date fields (use ISO 8601)
...?sys.createdAt[gte]=2024-01-01T00:00:00Z
```

## Full-Text Search

### Across all text fields

```bash
...?content_type=blogPost&query=contentful+cms
```

Multiple terms are AND-ed (both must match).

### On a specific field

```bash
...?content_type=blogPost&fields.title[match]=contentful
```

`[match]` performs a full-text search on the field value using Contentful's text search semantics and is not limited to prefix matches.

## Array Fields

### Contains all values

```bash
...?content_type=blogPost&fields.tags[all]=tech,javascript
```

### Contains any value

```bash
...?content_type=blogPost&fields.tags[in]=tech,design,business
```

## Location Queries

### Near a point

Results sorted by distance from the point:

```bash
...?content_type=venue&fields.location[near]=40.7128,-74.0060
```

### Within a bounding box

```bash
# lat1,lon1 = bottom-left, lat2,lon2 = top-right
...?content_type=venue&fields.location[within]=40.7,-74.1,40.8,-73.9
```

## Link Queries

### By linked entry ID

```bash
# Entries where author field links to specific entry
...?content_type=blogPost&fields.author.sys.id=author-id
```

### Find all entries linking to a specific entry

```bash
...?links_to_entry=entry-id
```

### Find all entries linking to a specific asset

```bash
...?links_to_asset=asset-id
```

Maximum reference depth for queries: 2 levels.

## System Field Queries

```bash
# By entry ID
...?sys.id=entry-id
...?sys.id[in]=id1,id2,id3

# By content type
...?sys.contentType.sys.id=blogPost

# By creation date
...?sys.createdAt[gte]=2024-01-01T00:00:00Z

# By update date
...?sys.updatedAt[gte]=2024-01-01T00:00:00Z

# By revision
...?sys.revision[gte]=2
```

## Asset Queries

```bash
# By MIME type
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/assets?fields.file.contentType=image/png" \
  -H "Authorization: Bearer {cda_token}"

# Images only
...?fields.file.contentType[in]=image/jpeg,image/png,image/gif,image/webp

# By file size (bytes)
...?fields.file.details.size[lt]=1048576

# By image dimensions
...?fields.file.details.image.width[gte]=1920
...?fields.file.details.image.height[gte]=1080

# By title
...?fields.title[match]=hero
```

## Complex Examples

### Latest featured blog posts

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/entries?content_type=blogPost&fields.featured=true&fields.publishDate[gte]=2024-01-01&order=-fields.publishDate&limit=10" \
  -H "Authorization: Bearer {cda_token}"
```

### Posts by author

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/entries?content_type=blogPost&fields.author.sys.id=author-id&order=-fields.publishDate" \
  -H "Authorization: Bearer {cda_token}"
```

### Search with pagination

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/entries?content_type=blogPost&query=contentful&limit=20&skip=0" \
  -H "Authorization: Bearer {cda_token}"
```

### Recent images

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/assets?fields.file.contentType[in]=image/jpeg,image/png&order=-sys.createdAt&limit=20" \
  -H "Authorization: Bearer {cda_token}"
```

## Query Limits

- Maximum `limit` per request: 1000
- Maximum `include` depth: 10
- Maximum reference query depth: 2 levels
- Default `limit`: 100
- Multiple filters are AND-ed together

## Best Practices

1. **Always specify `content_type`** for field-based queries
2. **Use `select`** to reduce payload size
3. **Use `limit` and `skip`** for pagination
4. **Prefer equality over `[match]`** for better performance
5. **Use `sys` field queries** for filtering by metadata
6. **Combine filters** — all query parameters are AND-ed

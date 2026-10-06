# Entries

Entries are instances of content types. They follow the locale structure and require explicit publishing.

## Table of Contents
- [Get Entry](#get-entry)
- [List Entries](#list-entries)
- [Create Entry](#create-entry)
- [Create Entry with ID](#create-entry-with-id)
- [Update Entry](#update-entry)
- [Publish / Unpublish](#publish--unpublish)
- [Archive / Unarchive](#archive--unarchive)
- [Delete Entry](#delete-entry)
- [Query Parameters](#query-parameters)
- [Links and References](#links-and-references)
- [Complete Workflow](#complete-workflow)

## Get Entry

```bash
curl https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries/{entry_id} \
  -H "Authorization: Bearer {cma_token}"
```

Response includes `sys.version` needed for updates.

## List Entries

```bash
curl "https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries?content_type=blogPost&limit=100&skip=0" \
  -H "Authorization: Bearer {cma_token}"
```

Returns `{ "sys": { "type": "Array" }, "total": N, "skip": 0, "limit": 100, "items": [...] }`.

## Create Entry

Auto-generated ID. Requires `X-Contentful-Content-Type` header:

```bash
curl -X POST https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Content-Type: blogPost" \
  -d '{
    "fields": {
      "title": { "en-US": "My First Post" },
      "body": { "en-US": "Post content here." }
    }
  }'
```

## Create Entry with ID

Use PUT with the desired ID for idempotent creation:

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries/{entry_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Content-Type: blogPost" \
  -d '{
    "fields": {
      "title": { "en-US": "My First Post" }
    }
  }'
```

## Update Entry

**CRITICAL**: Include `X-Contentful-Version` header with current `sys.version`. Omitting fields removes them.

```bash
# 1. Get current entry to obtain version
curl https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries/{entry_id} \
  -H "Authorization: Bearer {cma_token}"
# Response: { "sys": { "version": 5, ... }, "fields": { ... } }

# 2. Update with version header — include ALL fields you want to keep
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries/{entry_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Version: 5" \
  -d '{
    "fields": {
      "title": { "en-US": "Updated Title" },
      "body": { "en-US": "Keep existing or update." }
    }
  }'
```

Returns updated entry with `sys.version: 6`.

## Publish / Unpublish

### Publish

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries/{entry_id}/published \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 6"
```

### Unpublish

```bash
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries/{entry_id}/published \
  -H "Authorization: Bearer {cma_token}"
```

## Archive / Unarchive

### Archive

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries/{entry_id}/archived \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 7"
```

### Unarchive

```bash
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries/{entry_id}/archived \
  -H "Authorization: Bearer {cma_token}"
```

## Delete Entry

Must unpublish before deleting:

```bash
# 1. Unpublish
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries/{entry_id}/published \
  -H "Authorization: Bearer {cma_token}"

# 2. Delete
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries/{entry_id} \
  -H "Authorization: Bearer {cma_token}"
```

## Query Parameters

Use as URL query parameters when listing entries:

### Filtering

```
content_type=blogPost                     # filter by content type
fields.title=Exact+Title                  # exact match (requires content_type)
fields.title[match]=search+term           # full-text match
fields.title[ne]=Not+This                 # not equal
fields.count[gt]=10                       # greater than
fields.count[gte]=10                      # greater than or equal
fields.count[lt]=100                      # less than
fields.count[lte]=100                     # less than or equal
fields.slug[in]=post-1,post-2,post-3     # in list
fields.slug[nin]=post-1,post-2           # not in list
fields.author[exists]=true                # field exists
```

### System Fields

```
sys.id=entry-id
sys.id[in]=id1,id2,id3
sys.createdAt[gte]=2024-01-01
sys.updatedAt[gte]=2024-01-01T00:00:00Z
```

### Full-Text Search

```
query=search+across+all+fields
```

### Pagination and Ordering

```
limit=100                    # max 1000
skip=0                       # offset
order=sys.createdAt          # ascending
order=-sys.createdAt         # descending
order=fields.title           # by field (requires content_type)
select=fields.title,sys.id   # return only these fields
```

### Complete Example

```bash
curl "https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries?content_type=blogPost&fields.title[match]=hello&order=-sys.createdAt&limit=10&skip=0" \
  -H "Authorization: Bearer {cma_token}"
```

## Links and References

### Entry Reference

```json
{
  "fields": {
    "author": {
      "en-US": {
        "sys": { "type": "Link", "linkType": "Entry", "id": "author-entry-id" }
      }
    }
  }
}
```

### Asset Reference

```json
{
  "fields": {
    "image": {
      "en-US": {
        "sys": { "type": "Link", "linkType": "Asset", "id": "asset-id" }
      }
    }
  }
}
```

### Array of References

```json
{
  "fields": {
    "relatedPosts": {
      "en-US": [
        { "sys": { "type": "Link", "linkType": "Entry", "id": "post-1" } },
        { "sys": { "type": "Link", "linkType": "Entry", "id": "post-2" } }
      ]
    }
  }
}
```

## Multiple Locales

```json
{
  "fields": {
    "title": {
      "en-US": "English Title",
      "de-DE": "German Title",
      "fr-FR": "French Title"
    }
  }
}
```

## Complete Workflow

```bash
# 1. Create entry
curl -X POST https://api.contentful.com/spaces/{space_id}/environments/master/entries \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Content-Type: blogPost" \
  -d '{"fields":{"title":{"en-US":"New Post"},"slug":{"en-US":"new-post"}}}'
# Note the sys.id and sys.version from response

# 2. Publish
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id}/published \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 1"

# 3. Update
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Version: 2" \
  -d '{"fields":{"title":{"en-US":"Updated Post"},"slug":{"en-US":"new-post"}}}'

# 4. Republish
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id}/published \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 3"

# 5. Unpublish
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id}/published \
  -H "Authorization: Bearer {cma_token}"

# 6. Delete
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id} \
  -H "Authorization: Bearer {cma_token}"
```

## Best Practices

1. **Always include all fields** when updating — omitted fields are removed
2. **Use `X-Contentful-Version`** for every update — prevents conflicts
3. **Publish explicitly** — entries are drafts until published
4. **Unpublish before delete** — published entries cannot be deleted directly
5. **Use `content_type` in queries** — improves performance
6. **Handle 409 conflicts** — refetch entry, get new version, retry
7. **Use PUT with ID** for idempotent creates (migrations, imports)

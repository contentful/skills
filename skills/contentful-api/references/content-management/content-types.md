# Content Types

Content types define the structure of your content. They must be published before entries can be created.

## Table of Contents
- [Get Content Type](#get-content-type)
- [List Content Types](#list-content-types)
- [Create Content Type](#create-content-type)
- [Update Content Type](#update-content-type)
- [Publish / Unpublish](#publish--unpublish)
- [Delete Content Type](#delete-content-type)
- [Field Types](#field-types)
- [Validations](#validations)

## Get Content Type

```bash
curl https://api.contentful.com/spaces/{space_id}/environments/{env_id}/content_types/{content_type_id} \
  -H "Authorization: Bearer {cma_token}"
```

## List Content Types

```bash
curl "https://api.contentful.com/spaces/{space_id}/environments/{env_id}/content_types?limit=100" \
  -H "Authorization: Bearer {cma_token}"
```

## Create Content Type

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/content_types/{content_type_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -d '{
    "name": "Blog Post",
    "displayField": "title",
    "fields": [
      {
        "id": "title",
        "name": "Title",
        "type": "Symbol",
        "required": true,
        "localized": false
      },
      {
        "id": "body",
        "name": "Body",
        "type": "Text",
        "required": false,
        "localized": true
      },
      {
        "id": "slug",
        "name": "Slug",
        "type": "Symbol",
        "required": true,
        "validations": [
          { "unique": true },
          { "regexp": { "pattern": "^[a-z0-9-]+$" } }
        ]
      }
    ]
  }'
```

**CRITICAL**: Publish after creation to make it usable:

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/content_types/{content_type_id}/published \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 1"
```

## Update Content Type

```bash
# 1. Get current version
curl https://api.contentful.com/spaces/{space_id}/environments/{env_id}/content_types/{content_type_id} \
  -H "Authorization: Bearer {cma_token}"

# 2. Update — include ALL fields (existing + new)
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/content_types/{content_type_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Version: 2" \
  -d '{
    "name": "Blog Post",
    "displayField": "title",
    "fields": [
      { "id": "title", "name": "Title", "type": "Symbol", "required": true },
      { "id": "body", "name": "Body", "type": "Text" },
      { "id": "slug", "name": "Slug", "type": "Symbol", "required": true },
      { "id": "summary", "name": "Summary", "type": "Symbol" }
    ]
  }'

# 3. Publish updated content type
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/content_types/{content_type_id}/published \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 3"
```

## Publish / Unpublish

### Publish

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/content_types/{content_type_id}/published \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: {version}"
```

### Unpublish

```bash
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/{env_id}/content_types/{content_type_id}/published \
  -H "Authorization: Bearer {cma_token}"
```

Cannot unpublish if entries exist for this content type.

## Delete Content Type

Must unpublish first. Cannot delete if entries exist.

```bash
# 1. Unpublish
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/{env_id}/content_types/{content_type_id}/published \
  -H "Authorization: Bearer {cma_token}"

# 2. Delete
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/{env_id}/content_types/{content_type_id} \
  -H "Authorization: Bearer {cma_token}"
```

## Field Types

| Type | Description | Example Value |
|------|-------------|---------------|
| `Symbol` | Short text (max 256 chars) | `"Hello World"` |
| `Text` | Long text (max 50,000 chars) | `"Long content..."` |
| `Integer` | Whole number | `42` |
| `Number` | Decimal number | `3.14` |
| `Boolean` | True/false | `true` |
| `Date` | ISO 8601 date | `"2024-01-15T10:30:00Z"` |
| `Location` | Lat/lon coordinates | `{"lat": 40.71, "lon": -74.00}` |
| `Object` | Arbitrary JSON | `{"key": "value"}` |
| `RichText` | Structured rich text | Rich text document |
| `Link` | Reference to entry or asset | `{"sys": {"type": "Link", ...}}` |
| `Array` | Array of symbols or links | `["tag1", "tag2"]` |

### Link Field

```json
{
  "id": "author",
  "name": "Author",
  "type": "Link",
  "linkType": "Entry",
  "validations": [
    { "linkContentType": ["author", "contributor"] }
  ]
}
```

### Asset Link Field

```json
{
  "id": "image",
  "name": "Image",
  "type": "Link",
  "linkType": "Asset"
}
```

### Array of Links

```json
{
  "id": "relatedPosts",
  "name": "Related Posts",
  "type": "Array",
  "items": {
    "type": "Link",
    "linkType": "Entry",
    "validations": [
      { "linkContentType": ["blogPost"] }
    ]
  }
}
```

### Array of Symbols

```json
{
  "id": "tags",
  "name": "Tags",
  "type": "Array",
  "items": { "type": "Symbol" }
}
```

### Rich Text Field

```json
{
  "id": "richBody",
  "name": "Rich Body",
  "type": "RichText",
  "validations": [
    {
      "nodes": {
        "embedded-entry-block": [
          { "linkContentType": ["quote", "callout"] }
        ]
      }
    }
  ]
}
```

## Validations

### Symbol/Text

```json
{ "unique": true }
{ "regexp": { "pattern": "^[a-z0-9-]+$" } }
{ "size": { "min": 3, "max": 100 } }
{ "in": ["tech", "design", "business"] }
```

### Number

```json
{ "range": { "min": 1, "max": 5 } }
{ "in": [1, 5, 10, 25, 50, 100] }
```

### Array

```json
{ "size": { "min": 1, "max": 10 } }
```

### Link

```json
{ "linkContentType": ["author", "contributor"] }
{ "assetFileSize": { "min": 1024, "max": 10485760 } }
{ "assetImageDimensions": { "width": { "min": 100, "max": 2000 }, "height": { "min": 100, "max": 2000 } } }
```

## Best Practices

1. **Always publish** — content types must be published to create entries
2. **Use descriptive field IDs** — field IDs are permanent, choose carefully
3. **Add validations early** — harder to add constraints with existing content
4. **Use `linkContentType`** — restrict references to specific content types
5. **Set `localized: true`** — only for fields that need translation
6. **Set `displayField`** — identifies content in the Contentful web app
7. **Test in staging** — create content types in a non-production environment first

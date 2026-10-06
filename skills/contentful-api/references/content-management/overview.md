# Content Management API Overview

The CMA is a read/write API for managing content, content types, assets, and environments.

## Base URL

- **US**: `https://api.contentful.com`
- **EU**: `https://api.eu.contentful.com`

Most endpoints follow: `https://api.contentful.com/spaces/{space_id}/environments/{environment_id}/...`. Some are space-scoped and omit the environment segment (e.g., `/spaces/{space_id}/environment_aliases/...`).

## Required Headers

```bash
Authorization: Bearer {cma_token}
Content-Type: application/vnd.contentful.management.v1+json   # for write requests
X-Contentful-Version: {version}                                # for updates (optimistic locking)
X-Contentful-Content-Type: {content_type_id}                   # when creating entries
```

## Quick Start

### Get an entry

```bash
curl https://api.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id} \
  -H "Authorization: Bearer {cma_token}"
```

### Create an entry

```bash
curl -X POST https://api.contentful.com/spaces/{space_id}/environments/master/entries \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Content-Type: blogPost" \
  -d '{
    "fields": {
      "title": { "en-US": "Hello World" },
      "body": { "en-US": "First post content." }
    }
  }'
```

### Update an entry

```bash
# First GET the entry to obtain sys.version, then:
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Version: 5" \
  -d '{
    "fields": {
      "title": { "en-US": "Updated Title" },
      "body": { "en-US": "Updated content." }
    }
  }'
```

### Publish an entry

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id}/published \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 6"
```

## Critical Patterns

1. **Version locking** — every update requires `X-Contentful-Version` header matching current `sys.version`. See [http-conventions.md](../http-conventions.md).
2. **Locale structure** — all field values are keyed by locale: `{"en-US": "value"}`. See [http-conventions.md](../http-conventions.md).
3. **Publish workflow** — entities are drafts until explicitly published via `PUT .../published`.

## Topics

- **[Entries](entries.md)** — CRUD, publish/unpublish, versioning, query parameters
- **[Content Types](content-types.md)** — Define and update content models with field types and validations
- **[Assets](assets.md)** — Upload, process, and publish media files
- **[Environments](environments.md)** — Create, clone, manage environments and aliases
- **[Bulk Actions](bulk-actions.md)** — Bulk publish, unpublish, and validate via API

## Reference

- [CMA API Reference](https://www.contentful.com/developers/docs/references/content-management-api/)
- [Authentication](../authentication.md)
- [HTTP Conventions](../http-conventions.md)

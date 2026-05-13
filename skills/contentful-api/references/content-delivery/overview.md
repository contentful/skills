# Content Delivery API Overview

The CDA is a read-only API for delivering published content to apps and websites.

## Base URL

- **US**: `https://cdn.contentful.com`
- **EU**: `https://cdn.eu.contentful.com`

Most endpoints follow: `https://cdn.contentful.com/spaces/{space_id}/environments/{environment_id}/...`. The space info endpoint uses `/spaces/{space_id}` without an environment segment.

## Authentication

Use a CDA access token via Authorization header or query parameter:

```bash
curl https://cdn.contentful.com/spaces/{space_id}/environments/master/entries \
  -H "Authorization: Bearer {cda_token}"
```

See [authentication.md](../authentication.md) for token types and creation.

## Available Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET .../entries` | List/query entries |
| `GET .../entries/{id}` | Get single entry |
| `GET .../assets` | List/query assets |
| `GET .../assets/{id}` | Get single asset |
| `GET .../content_types` | List content types |
| `GET .../content_types/{id}` | Get single content type |
| `GET .../locales` | List available locales |
| `GET .../tags` | List content tags |
| `GET .../sync` | Sync API for incremental updates |
| `GET /spaces/{space_id}` | Get space info |

## Quick Start

### Get entries

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/entries?content_type=blogPost&limit=10" \
  -H "Authorization: Bearer {cda_token}"
```

Response:

```json
{
  "sys": { "type": "Array" },
  "total": 42,
  "skip": 0,
  "limit": 10,
  "items": [
    {
      "sys": { "id": "entry-id", "type": "Entry", "contentType": { "sys": { "id": "blogPost" } }, ... },
      "fields": { "title": "Hello World", "slug": "hello-world" }
    }
  ],
  "includes": {
    "Entry": [ ... ],
    "Asset": [ ... ]
  }
}
```

### Get single entry

```bash
curl https://cdn.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id} \
  -H "Authorization: Bearer {cda_token}"
```

### Get assets

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/assets?limit=10" \
  -H "Authorization: Bearer {cda_token}"
```

## CDA vs CMA Response Differences

- CDA fields return the resolved locale value directly: `"title": "Hello"`
- CMA fields are always locale-keyed: `"title": { "en-US": "Hello" }`
- CDA resolves linked entries/assets into an `includes` object
- CDA only returns published content (use Preview API for drafts)

## Topics

- **[Querying](querying.md)** — Filters, search, pagination, ordering
- **[Includes & Links](includes-links.md)** — Include parameter, link resolution
- **[Localization](localization.md)** — Locale parameter, fallback chains
- **[Sync](sync.md)** — Incremental content synchronization

## Reference

- [CDA API Reference](https://www.contentful.com/developers/docs/references/content-delivery-api/)
- [Authentication](../authentication.md)
- [HTTP Conventions](../http-conventions.md)

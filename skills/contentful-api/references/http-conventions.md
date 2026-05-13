# HTTP Conventions

Common patterns across all Contentful REST APIs.

## Table of Contents
- [Headers](#headers)
- [Version Locking](#version-locking)
- [Rate Limiting](#rate-limiting)
- [Pagination](#pagination)
- [Error Responses](#error-responses)
- [Locale Structure](#locale-structure)
- [Link Format](#link-format)

## Headers

### CMA Requests (Write)

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries/{entry_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Version: {version}"
```

Required headers for CMA write operations:
- `Authorization: Bearer {cma_token}` — authentication
- `Content-Type: application/vnd.contentful.management.v1+json` — request body format
- `X-Contentful-Version: {version}` — optimistic locking (for updates)
- `X-Contentful-Content-Type: {content_type_id}` — required when creating entries

### CDA/Preview Requests (Read)

```bash
curl https://cdn.contentful.com/spaces/{space_id}/environments/{env_id}/entries \
  -H "Authorization: Bearer {cda_token}"
```

Only `Authorization` header required. Responses are always `application/json`.

## Version Locking

The CMA uses optimistic concurrency control. Every entity has a version number in `sys.version`.

**To update an entity, pass its current version in the `X-Contentful-Version` header.** If the version doesn't match (someone else changed it), the API returns `409 Conflict`.

```bash
# 1. Get entry (note the version in sys.version)
curl https://api.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id} \
  -H "Authorization: Bearer {cma_token}"
# Response: { "sys": { "version": 5, ... }, "fields": { ... } }

# 2. Update with version header — include ALL fields you want to keep
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Version: 5" \
  -d '{"fields":{"title":{"en-US":"Updated Title"},"body":{"en-US":"Existing body"}}}'
# NOTE: CMA PUT replaces the entire `fields` object. Omitted fields are removed.
```

On success, the response contains `sys.version: 6`. Use that version for subsequent updates.

## Rate Limiting

### CMA Limits
- **Default**: 10 requests/second per space
- Response headers track usage:

| Header | Description |
|--------|-------------|
| `X-Contentful-RateLimit-Second-Limit` | Max requests per second |
| `X-Contentful-RateLimit-Second-Remaining` | Remaining requests this second |
| `X-Contentful-RateLimit-Reset` | Seconds until rate limit resets |

### CDA Limits
- **Default**: 78 requests/second per space (varies by plan)
- Same rate limit headers as CMA

### Handling 429 Too Many Requests

```bash
# When rate limited, check Retry-After or X-Contentful-RateLimit-Reset header
# HTTP/1.1 429 Too Many Requests
# X-Contentful-RateLimit-Reset: 1
```

Retry after the number of seconds indicated. Use exponential backoff for repeated 429s.

## Pagination

All collection endpoints return paginated results:

```json
{
  "sys": { "type": "Array" },
  "total": 250,
  "skip": 0,
  "limit": 100,
  "items": [ ... ]
}
```

### Parameters

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `limit` | 100 | 1000 | Items per page |
| `skip` | 0 | — | Items to skip |

### Paginating Through All Results

```bash
# Page 1
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/entries?limit=100&skip=0" \
  -H "Authorization: Bearer {cda_token}"

# Page 2
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/entries?limit=100&skip=100" \
  -H "Authorization: Bearer {cda_token}"

# Continue until items.length < limit or skip >= total
```

## Error Responses

All errors follow a consistent format:

```json
{
  "sys": {
    "type": "Error",
    "id": "NotFound"
  },
  "message": "The resource could not be found.",
  "details": { ... },
  "requestId": "abc123"
}
```

### Common Error Codes

| Status | Error ID | Description | Action |
|--------|----------|-------------|--------|
| 400 | `BadRequest` | Invalid request body or parameters | Fix request format |
| 401 | `AccessTokenInvalid` | Invalid or expired token | Check/refresh token |
| 403 | `AccessDenied` | Insufficient permissions | Check token scope |
| 404 | `NotFound` | Resource doesn't exist | Check IDs |
| 409 | `VersionMismatch` | Version conflict on update | Refetch, get new version, retry |
| 422 | `ValidationFailed` | Content validation failed | Check `details.errors` array |
| 429 | `RateLimitExceeded` | Too many requests | Wait and retry with backoff |
| 500 | `ServerError` | Internal server error | Retry with backoff |
| 502 | `ServiceUnavailable` | Temporary service issue | Retry with backoff |

### 409 Version Conflict Pattern

```bash
# 1. GET the entry to get current version
# 2. Update with the correct X-Contentful-Version
# 3. If 409 again, repeat from step 1
```

### 422 Validation Error Details

```json
{
  "sys": { "type": "Error", "id": "ValidationFailed" },
  "message": "Validation error",
  "details": {
    "errors": [
      {
        "name": "required",
        "path": ["fields", "title", "en-US"],
        "details": "The property \"title\" is required."
      }
    ]
  }
}
```

## Locale Structure

In the CMA, all field values are keyed by locale:

```json
{
  "fields": {
    "title": {
      "en-US": "English Title",
      "de-DE": "German Title"
    },
    "body": {
      "en-US": "English content"
    }
  }
}
```

In the CDA (without `locale=*`), fields return the resolved locale value directly:

```json
{
  "fields": {
    "title": "English Title",
    "body": "English content"
  }
}
```

With `locale=*` on the CDA, fields use the same locale-keyed structure as the CMA.

## Link Format

References between entries/assets use a standard link object:

```json
{
  "sys": {
    "type": "Link",
    "linkType": "Entry",
    "id": "referenced-entry-id"
  }
}
```

Link types: `Entry`, `Asset`, `Environment`, `Upload`, `ContentType`, `Space`.

In CMA request bodies, set references as:

```json
{
  "fields": {
    "author": {
      "en-US": {
        "sys": { "type": "Link", "linkType": "Entry", "id": "author-id" }
      }
    },
    "gallery": {
      "en-US": [
        { "sys": { "type": "Link", "linkType": "Asset", "id": "image-1" } },
        { "sys": { "type": "Link", "linkType": "Asset", "id": "image-2" } }
      ]
    }
  }
}
```

# Bulk Actions

The Bulk Actions API lets you publish, unpublish, or validate multiple entities in a single request.

## Table of Contents
- [Bulk Publish](#bulk-publish)
- [Bulk Unpublish](#bulk-unpublish)
- [Bulk Validate](#bulk-validate)
- [Check Bulk Action Status](#check-bulk-action-status)
- [Request Format](#request-format)

## Bulk Publish

Publish multiple entries and/or assets in one request:

```bash
curl -X POST https://api.contentful.com/spaces/{space_id}/environments/{env_id}/bulk_actions/publish \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -d '{
    "entities": {
      "items": [
        {
          "sys": {
            "type": "Link",
            "linkType": "Entry",
            "id": "entry-1",
            "version": 5
          }
        },
        {
          "sys": {
            "type": "Link",
            "linkType": "Entry",
            "id": "entry-2",
            "version": 3
          }
        },
        {
          "sys": {
            "type": "Link",
            "linkType": "Asset",
            "id": "asset-1",
            "version": 2
          }
        }
      ]
    }
  }'
```

Response returns a bulk action object with status:

```json
{
  "sys": {
    "type": "BulkAction",
    "id": "bulk-action-id",
    "status": "created",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

## Bulk Unpublish

```bash
curl -X POST https://api.contentful.com/spaces/{space_id}/environments/{env_id}/bulk_actions/unpublish \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -d '{
    "entities": {
      "items": [
        { "sys": { "type": "Link", "linkType": "Entry", "id": "entry-1" } },
        { "sys": { "type": "Link", "linkType": "Entry", "id": "entry-2" } }
      ]
    }
  }'
```

Note: Unpublish does not require version numbers.

## Bulk Validate

Validate multiple entries without publishing:

```bash
curl -X POST https://api.contentful.com/spaces/{space_id}/environments/{env_id}/bulk_actions/validate \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -d '{
    "entities": {
      "items": [
        { "sys": { "type": "Link", "linkType": "Entry", "id": "entry-1" } },
        { "sys": { "type": "Link", "linkType": "Entry", "id": "entry-2" } }
      ]
    }
  }'
```

## Check Bulk Action Status

Bulk actions run asynchronously. Poll the status endpoint:

```bash
curl https://api.contentful.com/spaces/{space_id}/environments/{env_id}/bulk_actions/actions/{bulk_action_id} \
  -H "Authorization: Bearer {cma_token}"
```

Response:

```json
{
  "sys": {
    "type": "BulkAction",
    "id": "bulk-action-id",
    "status": "succeeded",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:05Z"
  }
}
```

Status values: `created`, `inProgress`, `succeeded`, `failed`.

On failure, the response includes error details per entity.

## Request Format

### Entity Reference (for publish)

Publish requires the entity version for optimistic locking:

```json
{
  "sys": {
    "type": "Link",
    "linkType": "Entry",
    "id": "entry-id",
    "version": 5
  }
}
```

### Entity Reference (for unpublish/validate)

Unpublish and validate don't require version:

```json
{
  "sys": {
    "type": "Link",
    "linkType": "Entry",
    "id": "entry-id"
  }
}
```

### Mixed Entities

A single bulk action can include both entries and assets:

```json
{
  "entities": {
    "items": [
      { "sys": { "type": "Link", "linkType": "Entry", "id": "entry-1", "version": 3 } },
      { "sys": { "type": "Link", "linkType": "Asset", "id": "asset-1", "version": 2 } }
    ]
  }
}
```

## Limits

- Maximum entities per bulk action varies by plan (typically 200)
- Bulk actions are processed asynchronously
- Rate limits still apply per entity within the bulk action

## Best Practices

1. **Include version numbers** for bulk publish — prevents overwriting concurrent changes
2. **Poll for completion** — bulk actions are async, don't assume immediate success
3. **Handle partial failures** — some entities may fail while others succeed
4. **Batch large sets** — split > 200 entities into multiple bulk action requests
5. **Use bulk validate first** — validate before publishing to catch errors early

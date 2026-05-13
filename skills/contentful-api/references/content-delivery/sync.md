# Sync API

The Sync API enables incremental content synchronization. Instead of fetching all content repeatedly, sync once initially, then fetch only changes since the last sync.

## Table of Contents
- [Initial Sync](#initial-sync)
- [Subsequent Sync](#subsequent-sync)
- [Paginated Sync](#paginated-sync)
- [Sync Types](#sync-types)
- [Filtered Sync](#filtered-sync)

## Initial Sync

Fetch all content for the first time:

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/sync?initial=true" \
  -H "Authorization: Bearer {cda_token}"
```

Response:

```json
{
  "sys": { "type": "Array" },
  "items": [
    {
      "sys": { "type": "Entry", "id": "entry-1", "contentType": { "sys": { "id": "blogPost" } }, ... },
      "fields": { "title": "Hello World" }
    },
    {
      "sys": { "type": "Asset", "id": "asset-1", ... },
      "fields": { "title": "Hero Image", "file": { ... } }
    },
    {
      "sys": { "type": "DeletedEntry", "id": "entry-2", ... }
    },
    {
      "sys": { "type": "DeletedAsset", "id": "asset-2", ... }
    }
  ],
  "nextSyncUrl": "https://cdn.contentful.com/spaces/{space_id}/environments/master/sync?sync_token=next-token-here"
}
```

Store the `nextSyncUrl` (or extract `sync_token` from it) for subsequent syncs.

## Subsequent Sync

Fetch only changes since the last sync:

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/sync?sync_token={token}" \
  -H "Authorization: Bearer {cda_token}"
```

Response contains only entries/assets that were created, updated, or deleted since the last sync.

```json
{
  "sys": { "type": "Array" },
  "items": [
    {
      "sys": { "type": "Entry", "id": "entry-3", ... },
      "fields": { "title": "New Post" }
    },
    {
      "sys": { "type": "DeletedEntry", "id": "entry-1", ... }
    }
  ],
  "nextSyncUrl": "https://cdn.contentful.com/spaces/{space_id}/environments/master/sync?sync_token=newer-token"
}
```

## Paginated Sync

If there are too many results for a single response, the response includes `nextPageUrl` instead of (or in addition to) `nextSyncUrl`:

```json
{
  "items": [ ... ],
  "nextPageUrl": "https://cdn.contentful.com/spaces/{space_id}/environments/master/sync?sync_token=page-2-token"
}
```

Follow `nextPageUrl` to get the next page. When `nextPageUrl` is absent and `nextSyncUrl` is present, you've reached the last page. Store `nextSyncUrl` for the next sync cycle.

```
Loop:
  1. Call sync URL
  2. Process items
  3. If nextPageUrl exists → go to step 1 with nextPageUrl
  4. If nextSyncUrl exists → done, store nextSyncUrl for next sync
```

## Sync Types

Items in the sync response have these `sys.type` values:

| Type | Description |
|------|-------------|
| `Entry` | New or updated entry (full entry with fields) |
| `Asset` | New or updated asset (full asset with fields) |
| `DeletedEntry` | Entry was deleted (only sys metadata, no fields) |
| `DeletedAsset` | Asset was deleted (only sys metadata, no fields) |

## Filtered Sync

Limit the initial sync to specific content:

### By type

```bash
# Only entries
...?initial=true&type=Entry

# Only assets
...?initial=true&type=Asset

# Only deletions (both entries and assets)
...?initial=true&type=Deletion
```

### By content type

```bash
# Only entries of a specific content type
...?initial=true&type=Entry&content_type=blogPost
```

**Note**: Filtered sync tokens are separate — a token from a filtered sync can only be used for subsequent syncs with the same filter.

## Important Notes

- Sync always returns all locales (equivalent to `locale=*`)
- Sync does not support `include` — links are not resolved. You get link stubs and must resolve manually
- Sync tokens expire after ~90 days. If expired, start a new initial sync
- Sync returns entries with all fields, ignoring `select`
- Entries in sync responses contain the full entry, not a diff

## Best Practices

1. **Store sync tokens** — persist `nextSyncUrl` or `sync_token` between runs
2. **Handle all item types** — process Entry, Asset, DeletedEntry, DeletedAsset
3. **Follow pagination** — always follow `nextPageUrl` before storing `nextSyncUrl`
4. **Resolve links separately** — sync doesn't include resolved references
5. **Use filtered sync** for large spaces — sync only the content types you need
6. **Handle token expiry** — fall back to initial sync if token is expired (API returns error)

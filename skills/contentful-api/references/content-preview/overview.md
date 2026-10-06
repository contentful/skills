# Content Preview API

The Preview API returns draft and changed content before it's published. Same endpoints and query parameters as the CDA, but with a different base URL and token.

## Base URL

- **US**: `https://preview.contentful.com`
- **EU**: `https://preview.eu.contentful.com`

## Authentication

Use a **Preview access token** (not the CDA token):

```bash
curl https://preview.contentful.com/spaces/{space_id}/environments/master/entries \
  -H "Authorization: Bearer {preview_token}"
```

Create Preview tokens at: **Settings → API keys → Content Preview API - access token**

## How It Differs from CDA

| | CDA (`cdn.contentful.com`) | Preview (`preview.contentful.com`) |
|---|---|---|
| Token | CDA access token | Preview access token |
| Content | Published only | Published + draft + changed |
| Caching | CDN-cached, fast | No caching, slower |
| Use case | Production apps | Content preview, editorial tools |

## Usage

All CDA endpoints, query parameters, and features work identically:

```bash
# Get entries
curl "https://preview.contentful.com/spaces/{space_id}/environments/master/entries?content_type=blogPost" \
  -H "Authorization: Bearer {preview_token}"

# Get single entry (including unpublished drafts)
curl "https://preview.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id}" \
  -H "Authorization: Bearer {preview_token}"

# Query with filters
curl "https://preview.contentful.com/spaces/{space_id}/environments/master/entries?content_type=blogPost&fields.slug=draft-post&include=2" \
  -H "Authorization: Bearer {preview_token}"

# Get assets (including unprocessed/unpublished)
curl "https://preview.contentful.com/spaces/{space_id}/environments/master/assets" \
  -H "Authorization: Bearer {preview_token}"

# Sync API works too
curl "https://preview.contentful.com/spaces/{space_id}/environments/master/sync?initial=true" \
  -H "Authorization: Bearer {preview_token}"
```

## Common Use Cases

- **Content preview** in editorial workflows (show authors what content will look like)
- **Draft content review** before publishing
- **Staging environments** where you need to see unpublished changes
- **Headless CMS previews** integrated into frontend frameworks

## Security

- **Never expose Preview tokens in client-side code** — they reveal unpublished content
- Use Preview API only in server-side code or authenticated admin interfaces
- Preview tokens have read-only access (same as CDA tokens, but for all content states)

## Reference

- All CDA query parameters and features apply — see [content-delivery/](../content-delivery/overview.md)
- [Authentication](../authentication.md) for token types

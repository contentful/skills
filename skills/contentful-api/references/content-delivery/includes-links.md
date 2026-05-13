# Includes & Links

How the CDA handles references between entries and assets.

## Table of Contents
- [Link Structure](#link-structure)
- [Include Parameter](#include-parameter)
- [Response Structure](#response-structure)
- [Resolving Links](#resolving-links)
- [Unresolvable Links](#unresolvable-links)

## Link Structure

References in Contentful use a standard link object:

```json
{
  "sys": {
    "type": "Link",
    "linkType": "Entry",
    "id": "referenced-entry-id"
  }
}
```

`linkType` is either `Entry` or `Asset`.

## Include Parameter

The `include` parameter controls how many levels of linked entries/assets the API resolves and returns in the `includes` object.

```bash
# No link resolution — linked entries returned as link objects only
curl "...?content_type=blogPost&include=0" -H "Authorization: Bearer {cda_token}"

# Default (1 level) — first-level linked entries/assets included
curl "...?content_type=blogPost&include=1" -H "Authorization: Bearer {cda_token}"

# Deep resolution (max 10)
curl "...?content_type=blogPost&include=5" -H "Authorization: Bearer {cda_token}"
```

| Value | Behavior |
|-------|----------|
| `0` | No includes. Links are returned as `{ "sys": { "type": "Link", ... } }` objects |
| `1` (default) | Direct references resolved into `includes` |
| `2-10` | Deeper references resolved (e.g., entry → author → company) |

Maximum include depth is **10**.

## Response Structure

When `include >= 1`, the response contains an `includes` object with resolved entities:

```json
{
  "sys": { "type": "Array" },
  "total": 10,
  "items": [
    {
      "sys": { "id": "post-1", "type": "Entry", ... },
      "fields": {
        "title": "My Post",
        "author": {
          "sys": { "type": "Link", "linkType": "Entry", "id": "author-1" }
        },
        "heroImage": {
          "sys": { "type": "Link", "linkType": "Asset", "id": "image-1" }
        }
      }
    }
  ],
  "includes": {
    "Entry": [
      {
        "sys": { "id": "author-1", "type": "Entry", ... },
        "fields": { "name": "Jane Doe", "email": "jane@example.com" }
      }
    ],
    "Asset": [
      {
        "sys": { "id": "image-1", "type": "Asset", ... },
        "fields": {
          "title": "Hero Image",
          "file": {
            "url": "//images.ctfassets.net/space_id/image-1/token/hero.jpg",
            "contentType": "image/jpeg",
            "details": { "size": 102400, "image": { "width": 1920, "height": 1080 } }
          }
        }
      }
    ]
  }
}
```

Key points:
- `items` contains the queried entries with link stubs in fields
- `includes.Entry` contains all resolved linked entries (flattened)
- `includes.Asset` contains all resolved linked assets (flattened)
- An entity appears in `includes` only once even if referenced multiple times

## Resolving Links

To resolve a link, match the link's `sys.id` against entries in the `includes` object:

```
1. Entry field has: { "sys": { "type": "Link", "linkType": "Entry", "id": "author-1" } }
2. Find in includes.Entry: the object where sys.id === "author-1"
3. That object contains the full entry with fields
```

For arrays of links, resolve each link individually:

```json
{
  "relatedPosts": [
    { "sys": { "type": "Link", "linkType": "Entry", "id": "post-2" } },
    { "sys": { "type": "Link", "linkType": "Entry", "id": "post-3" } }
  ]
}
```

Look up each ID in `includes.Entry`.

### Nested Resolution

With `include=2`, the includes object contains both direct and second-level references. For example, if a post links to an author who links to a company:

```
include=1: includes contains author
include=2: includes contains author AND company
```

All resolved entities are flat in the `includes` arrays regardless of depth.

## Unresolvable Links

A link may be unresolvable if:
- The linked entry/asset was deleted
- The linked entry is not published (CDA only shows published content)
- Insufficient permissions

Unresolvable links remain as link stubs in the response — they won't appear in `includes`:

```json
{
  "fields": {
    "author": {
      "sys": { "type": "Link", "linkType": "Entry", "id": "deleted-author" }
    }
  }
}
```

If `"deleted-author"` is not found in `includes.Entry`, the link is unresolvable.

### Detecting Unresolvable Links

Check if a field value is a link stub (has `sys.type === "Link"`) versus a resolved entry (has `sys.type === "Entry"` and `fields`):

```
If field.sys.type === "Link" → unresolved (look up in includes or mark as missing)
If field.sys.type === "Entry" → resolved (has fields)
```

Note: The raw CDA response always returns link stubs in `items` and resolved entities in `includes`. Some SDKs auto-resolve links inline, but the raw REST response keeps them separate.

## Performance Tips

1. **Use `include=0`** for list views where you only need titles/slugs
2. **Use `include=1`** (default) for detail views with direct references
3. **Avoid high include values** — `include=10` can return very large responses
4. **Use `select`** to limit which fields are returned
5. **Resolve links client-side** — build a lookup map from `includes` for efficient resolution:

```
Map entries from includes.Entry by sys.id → O(1) lookup per link
Map assets from includes.Asset by sys.id → O(1) lookup per link
```

## Common Patterns

### List view (no links needed)

```bash
curl "...?content_type=blogPost&select=fields.title,fields.slug,sys.id&include=0" \
  -H "Authorization: Bearer {cda_token}"
```

### Detail view (resolve author and images)

```bash
curl "...entries/{entry_id}?include=2" \
  -H "Authorization: Bearer {cda_token}"
```

### Find entries referencing a specific entry

```bash
curl "...?links_to_entry={entry_id}" \
  -H "Authorization: Bearer {cda_token}"
```

### Find entries referencing a specific asset

```bash
curl "...?links_to_asset={asset_id}" \
  -H "Authorization: Bearer {cda_token}"
```

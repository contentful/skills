# Assets

Assets are media files (images, videos, documents). They require a three-step workflow: create → process → publish.

## Table of Contents
- [Create Asset from URL](#create-asset-from-url)
- [Upload Binary File](#upload-binary-file)
- [Process Asset](#process-asset)
- [Publish Asset](#publish-asset)
- [Complete Workflow](#complete-workflow)
- [Update Asset](#update-asset)
- [Get / List Assets](#get--list-assets)
- [Delete Asset](#delete-asset)
- [Localized Assets](#localized-assets)

## Create Asset from URL

Create an asset referencing an external file URL:

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets/{asset_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -d '{
    "fields": {
      "title": { "en-US": "Hero Image" },
      "description": { "en-US": "Main hero image for homepage" },
      "file": {
        "en-US": {
          "contentType": "image/png",
          "fileName": "hero.png",
          "upload": "https://example.com/hero.png"
        }
      }
    }
  }'
```

## Upload Binary File

For direct file uploads, first upload to the Upload API, then create the asset referencing the upload:

```bash
# 1. Upload binary file
curl -X POST https://upload.contentful.com/spaces/{space_id}/uploads \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @/path/to/file.png
# Response: { "sys": { "type": "Upload", "id": "upload-id", ... } }

# 2. Create asset referencing the upload
curl -X POST https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -d '{
    "fields": {
      "title": { "en-US": "Uploaded File" },
      "file": {
        "en-US": {
          "contentType": "image/png",
          "fileName": "file.png",
          "uploadFrom": {
            "sys": { "type": "Link", "linkType": "Upload", "id": "upload-id" }
          }
        }
      }
    }
  }'
```

## Process Asset

**CRITICAL**: After creating, process the asset to generate CDN URLs and metadata.

### Process for a specific locale

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets/{asset_id}/files/en-US/process \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 1"
```

### Poll for processing completion

The process endpoint returns `204 No Content`. Poll the asset until `fields.file.{locale}.url` is present:

```bash
# Poll until url field appears
curl https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets/{asset_id} \
  -H "Authorization: Bearer {cma_token}"
# Check: response.fields.file["en-US"].url exists → processing complete
```

## Publish Asset

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets/{asset_id}/published \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 2"
```

## Complete Workflow

```bash
# 1. Create asset from URL
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/master/assets/hero-image \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -d '{
    "fields": {
      "title": { "en-US": "Hero Image" },
      "file": {
        "en-US": {
          "contentType": "image/jpeg",
          "fileName": "hero.jpg",
          "upload": "https://example.com/hero.jpg"
        }
      }
    }
  }'

# 2. Process
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/master/assets/hero-image/files/en-US/process \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 1"

# 3. Wait — poll GET until fields.file["en-US"].url is present

# 4. Publish
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/master/assets/hero-image/published \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 2"
```

## Update Asset

```bash
# 1. Get current version
curl https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets/{asset_id} \
  -H "Authorization: Bearer {cma_token}"

# 2. Update metadata (include ALL fields)
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets/{asset_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Version: 3" \
  -d '{
    "fields": {
      "title": { "en-US": "Updated Title" },
      "description": { "en-US": "Updated description" },
      "file": {
        "en-US": {
          "contentType": "image/jpeg",
          "fileName": "hero.jpg",
          "url": "//images.ctfassets.net/space_id/asset_id/token/hero.jpg"
        }
      }
    }
  }'

# 3. Republish
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets/{asset_id}/published \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 4"
```

To replace the file itself, update `fields.file` with a new `upload` URL or `uploadFrom` reference, then re-process.

## Get / List Assets

```bash
# Get single asset
curl https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets/{asset_id} \
  -H "Authorization: Bearer {cma_token}"

# List assets
curl "https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets?limit=100&order=-sys.createdAt" \
  -H "Authorization: Bearer {cma_token}"

# Query by title
curl "https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets?fields.title[match]=hero" \
  -H "Authorization: Bearer {cma_token}"
```

### Asset Response Structure

```json
{
  "sys": { "id": "asset-id", "version": 3, ... },
  "fields": {
    "title": { "en-US": "Hero Image" },
    "description": { "en-US": "Description" },
    "file": {
      "en-US": {
        "url": "//images.ctfassets.net/{space_id}/{asset_id}/{token}/hero.jpg",
        "fileName": "hero.jpg",
        "contentType": "image/jpeg",
        "details": {
          "size": 102400,
          "image": { "width": 1920, "height": 1080 }
        }
      }
    }
  }
}
```

## Delete Asset

Must unpublish before deleting:

```bash
# 1. Unpublish
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets/{asset_id}/published \
  -H "Authorization: Bearer {cma_token}"

# 2. Delete
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets/{asset_id} \
  -H "Authorization: Bearer {cma_token}"
```

## Archive / Unarchive

```bash
# Archive
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets/{asset_id}/archived \
  -H "Authorization: Bearer {cma_token}" \
  -H "X-Contentful-Version: 3"

# Unarchive
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/{env_id}/assets/{asset_id}/archived \
  -H "Authorization: Bearer {cma_token}"
```

## Localized Assets

Different files per locale:

```json
{
  "fields": {
    "title": {
      "en-US": "User Guide",
      "de-DE": "Benutzerhandbuch"
    },
    "file": {
      "en-US": {
        "contentType": "application/pdf",
        "fileName": "guide-en.pdf",
        "upload": "https://example.com/guide-en.pdf"
      },
      "de-DE": {
        "contentType": "application/pdf",
        "fileName": "guide-de.pdf",
        "upload": "https://example.com/guide-de.pdf"
      }
    }
  }
}
```

Process each locale separately:

```bash
curl -X PUT .../assets/{asset_id}/files/en-US/process -H "Authorization: Bearer {cma_token}" -H "X-Contentful-Version: 1"
curl -X PUT .../assets/{asset_id}/files/de-DE/process -H "Authorization: Bearer {cma_token}" -H "X-Contentful-Version: 2"
```

## Common MIME Types

| Type | Content-Type |
|------|-------------|
| JPEG | `image/jpeg` |
| PNG | `image/png` |
| WebP | `image/webp` |
| GIF | `image/gif` |
| SVG | `image/svg+xml` |
| MP4 | `video/mp4` |
| PDF | `application/pdf` |
| JSON | `application/json` |

## Best Practices

1. **Follow three-step workflow** — create, process, publish
2. **Always process** — assets won't have CDN URLs without processing
3. **Poll for completion** — wait for `url` field before publishing
4. **Include all fields on update** — omitted fields are removed
5. **Use image transformations** — transform via URL parameters instead of uploading variants (see [images/overview.md](../images/overview.md))

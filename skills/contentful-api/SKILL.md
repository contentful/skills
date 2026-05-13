---
name: contentful-api
description: Comprehensive Contentful REST API guide. Covers Content Management API (CMA) for creating/updating content, Content Delivery API (CDA) for fetching published content, Preview API, Images API, and GraphQL API. All examples use curl/HTTP — language-agnostic.
---

# Contentful REST API Guide

Language-agnostic guide for Contentful APIs using HTTP/curl.

## Shared References

- **[Authentication](references/authentication.md)** — Token types, auth headers, API base URLs (US/EU)
- **[HTTP Conventions](references/http-conventions.md)** — Version locking, rate limits, pagination, errors, locale structure

## Content Management API (CMA)

Read/write API for managing content, content types, assets, and environments.

**Start here**: [references/content-management/overview.md](references/content-management/overview.md)

- [**entries.md**](references/content-management/entries.md) — CRUD, publish/unpublish, versioning, query parameters
- [**content-types.md**](references/content-management/content-types.md) — Define/update content models, field types, validations
- [**assets.md**](references/content-management/assets.md) — Upload, process, publish media files
- [**environments.md**](references/content-management/environments.md) — Create, clone, manage environments and aliases

## Content Delivery API (CDA)

Read-only API for fetching published content.

**Start here**: [references/content-delivery/overview.md](references/content-delivery/overview.md)

- [**querying.md**](references/content-delivery/querying.md) — Filters, search operators, pagination, ordering
- [**includes-links.md**](references/content-delivery/includes-links.md) — Include parameter, link resolution
- [**localization.md**](references/content-delivery/localization.md) — Locale parameter, fallback chains
- [**sync.md**](references/content-delivery/sync.md) — Incremental content synchronization

## Content Preview API

Draft + published content via same CDA endpoints, different host/token.

**Reference**: [references/content-preview/overview.md](references/content-preview/overview.md)

## Images API

On-the-fly image transformations via URL parameters. No authentication needed.

**Reference**: [references/images/overview.md](references/images/overview.md)

## GraphQL API

Query content via GraphQL with CDA tokens.

**Reference**: [references/graphql/overview.md](references/graphql/overview.md)

## Quick Reference

```bash
# CMA: Create a draft entry
curl -X POST https://api.contentful.com/spaces/{space_id}/environments/{env_id}/entries \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Content-Type: blogPost" \
  -d '{"fields":{"title":{"en-US":"Hello"}}}'
# Then publish: PUT .../entries/{id}/published with X-Contentful-Version header

# CDA: Fetch entries
curl "https://cdn.contentful.com/spaces/{space_id}/environments/{env_id}/entries?content_type=blogPost" \
  -H "Authorization: Bearer {cda_token}"
```

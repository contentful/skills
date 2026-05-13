# Authentication

All Contentful APIs require authentication except the Images API.

## Table of Contents
- [Token Types](#token-types)
- [Passing Tokens](#passing-tokens)
- [API Base URLs](#api-base-urls)
- [CDA Token](#cda-token)
- [Preview Token](#preview-token)
- [CMA Token](#cma-token-personal-access-token)
- [OAuth Tokens](#oauth-tokens)
- [Token Scopes](#token-scopes)
- [Security](#security)

## Token Types

| Token | Use With | Permissions | Where to Create |
|-------|----------|-------------|-----------------|
| Content Delivery API (CDA) token | CDA, GraphQL, Images (optional) | Read published content | Settings → API keys |
| Content Preview API token | Preview API | Read draft + published content | Settings → API keys |
| Content Management API (CMA) token | CMA | Read/write all content and settings | Settings → CMA tokens |
| OAuth token | CMA | Scoped by OAuth app permissions | OAuth flow |

## Passing Tokens

### Authorization Header (Recommended)

```bash
curl https://cdn.contentful.com/spaces/{space_id}/environments/{environment_id}/entries \
  -H "Authorization: Bearer {access_token}"
```

### Query Parameter

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/{environment_id}/entries?access_token={access_token}"
```

Header method is preferred — query parameters may appear in logs.

## API Base URLs

| API | US (Default) | EU |
|-----|-------------|-----|
| Content Delivery | `cdn.contentful.com` | `cdn.eu.contentful.com` |
| Content Preview | `preview.contentful.com` | `preview.eu.contentful.com` |
| Content Management | `api.contentful.com` | `api.eu.contentful.com` |
| Images | `images.ctfassets.net` | `images.eu.ctfassets.net` |
| Upload | `upload.contentful.com` | `upload.eu.contentful.com` |
| GraphQL | `graphql.contentful.com` | `graphql.eu.contentful.com` |

## CDA Token

Read-only access to published content. Safe to use in client-side code.

```bash
# Fetch published entries
curl https://cdn.contentful.com/spaces/{space_id}/environments/master/entries \
  -H "Authorization: Bearer YOUR_CDA_TOKEN"
```

## Preview Token

Same endpoints as CDA but returns draft and changed content. Never expose in client-side code.

```bash
# Fetch draft + published entries
curl https://preview.contentful.com/spaces/{space_id}/environments/master/entries \
  -H "Authorization: Bearer YOUR_PREVIEW_TOKEN"
```

## CMA Token (Personal Access Token)

Full read/write access to the space. Never expose in client-side code.

```bash
# Create an entry
curl -X POST https://api.contentful.com/spaces/{space_id}/environments/master/entries \
  -H "Authorization: Bearer YOUR_CMA_TOKEN" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Content-Type: blogPost" \
  -d '{"fields":{"title":{"en-US":"Hello World"}}}'
```

Create CMA tokens at: **Settings → CMA tokens → Generate personal token**

## OAuth Tokens

For apps acting on behalf of users. Use the OAuth 2.0 flow:

1. Register app at [Contentful App Definition](https://app.contentful.com)
2. Redirect user to: `https://be.contentful.com/oauth/authorize?response_type=token&client_id={client_id}&redirect_uri={redirect_uri}&scope=content_management_manage`
3. User authorizes, token returned in redirect URL fragment

```bash
# Use OAuth token same as CMA token
curl https://api.contentful.com/spaces/{space_id}/environments/master/entries \
  -H "Authorization: Bearer YOUR_OAUTH_TOKEN"
```

## Token Scopes

- **CDA token**: Read published content only. Cannot read drafts, cannot write.
- **Preview token**: Read all content (published + draft). Cannot write.
- **CMA token**: Full read/write. Can manage content, content types, environments, etc.
- **OAuth token**: Scoped by app permissions. Typically `content_management_manage`.

## Security

- Never commit tokens to version control
- Use environment variables: `CONTENTFUL_DELIVERY_TOKEN`, `CONTENTFUL_MANAGEMENT_TOKEN`
- CDA tokens are safe for client-side use (read-only, published content)
- CMA and Preview tokens must be kept server-side only
- Rotate CMA tokens periodically via Settings → CMA tokens

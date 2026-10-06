# Environments

Environments are isolated content workspaces within a space. Use them for staging, testing, and feature branches.

## Table of Contents
- [Get Environment](#get-environment)
- [List Environments](#list-environments)
- [Create Environment](#create-environment)
- [Clone Environment](#clone-environment)
- [Wait for Ready](#wait-for-ready)
- [Update Environment](#update-environment)
- [Delete Environment](#delete-environment)
- [Environment Aliases](#environment-aliases)
- [Deployment Patterns](#deployment-patterns)

## Get Environment

```bash
curl https://api.contentful.com/spaces/{space_id}/environments/{env_id} \
  -H "Authorization: Bearer {cma_token}"
```

Response includes `sys.status.sys.id` — one of: `queued`, `creating`, `ready`, `failed`.

## List Environments

```bash
curl https://api.contentful.com/spaces/{space_id}/environments \
  -H "Authorization: Bearer {cma_token}"
```

## Create Environment

Creates an empty environment:

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -d '{ "name": "Staging" }'
```

## Clone Environment

Clone from a source environment by providing the source in the request body:

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{new_env_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -d '{
    "name": "Feature Branch",
    "sourceEnvironmentId": "master"
  }'
```

This copies all content types and content from the source environment.

## Wait for Ready

Environments are created asynchronously. Poll until status is `ready`:

```bash
# Poll GET until sys.status.sys.id === "ready"
curl https://api.contentful.com/spaces/{space_id}/environments/{env_id} \
  -H "Authorization: Bearer {cma_token}"
# Check: response.sys.status.sys.id
# Possible values: "queued", "creating", "ready", "failed"
```

## Update Environment

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/{env_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Version: 1" \
  -d '{ "name": "Updated Name" }'
```

## Delete Environment

```bash
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/{env_id} \
  -H "Authorization: Bearer {cma_token}"
```

**Warning**: This permanently deletes all content in the environment.

## Environment Aliases

Aliases provide stable identifiers that point to different environments. Useful for zero-downtime deployments.

### Get Alias

```bash
curl https://api.contentful.com/spaces/{space_id}/environment_aliases/{alias_id} \
  -H "Authorization: Bearer {cma_token}"
```

Response:
```json
{
  "sys": { "id": "master", "type": "EnvironmentAlias", "version": 1, ... },
  "environment": {
    "sys": { "type": "Link", "linkType": "Environment", "id": "production-v2" }
  }
}
```

### List Aliases

```bash
curl https://api.contentful.com/spaces/{space_id}/environment_aliases \
  -H "Authorization: Bearer {cma_token}"
```

### Update Alias (Switch Environment)

Point an alias to a different environment:

```bash
curl -X PUT https://api.contentful.com/spaces/{space_id}/environment_aliases/{alias_id} \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Version: 1" \
  -d '{
    "environment": {
      "sys": { "type": "Link", "linkType": "Environment", "id": "production-v3" }
    }
  }'
```

## Deployment Patterns

### Blue-Green Deployment

```bash
# 1. Create new environment from current production
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/production-blue \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -d '{"name":"Production Blue","sourceEnvironmentId":"master"}'

# 2. Wait for ready (poll until sys.status.sys.id === "ready")

# 3. Make changes in new environment

# 4. Switch alias to new environment
curl -X PUT https://api.contentful.com/spaces/{space_id}/environment_aliases/master \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Version: 1" \
  -d '{"environment":{"sys":{"type":"Link","linkType":"Environment","id":"production-blue"}}}'

# 5. Delete old environment after verification
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/production-green \
  -H "Authorization: Bearer {cma_token}"
```

### Feature Branch Workflow

```bash
# 1. Create feature branch from master
curl -X PUT https://api.contentful.com/spaces/{space_id}/environments/feature-new-layout \
  -H "Authorization: Bearer {cma_token}" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -d '{"name":"New Layout Feature","sourceEnvironmentId":"master"}'

# 2. Wait for ready, make changes, test

# 3. Clean up when done
curl -X DELETE https://api.contentful.com/spaces/{space_id}/environments/feature-new-layout \
  -H "Authorization: Bearer {cma_token}"
```

## Best Practices

1. **Use environment aliases** — avoid hardcoding environment IDs
2. **Always poll after creation** — environments take time to clone
3. **Clone from appropriate source** — staging from master, production from staging
4. **Clean up old environments** — most plans have environment limits
5. **Use feature branches** — create temporary environments for isolated changes
6. **Monitor status** — check `sys.status.sys.id` before using a new environment

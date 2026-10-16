# API operations and lifecycle

Use the current [Destinations Management API reference](https://www.contentful.com/developers/docs/references/experience-management-api/destinations-management/). It is authoritative for request/response schemas, auth, headers, pagination, and current behavior. Endpoint paths below are orientation only; verify the current reference before each operation. Runtime shapes and outcomes labeled **observed** come from a live environment and may differ by version; verify against the target before writing.

## Tool access

Examples use `curl`. If no shell/exec tool is available, make the equivalent calls through the `contentful-mcp` MCP tools: same endpoints, same payloads. If neither is available, tell the user you cannot reach the API and stop rather than guessing at Destination state.

```bash
# Read a Destination tree before planning node changes
curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/destinations/$DESTINATION_ID/tree"

# Update a Destination (replace body; current version required; never send channelId)
curl -s -X PUT -H "Authorization: Bearer $CMA_TOKEN" \
  -H "Content-Type: application/vnd.contentful.management.v1+json" \
  -H "X-Contentful-Version: $VERSION" \
  -d '{"name": "<name>", "properties": [{"id": "<propertyId>", "value": "<value>"}]}' \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/destinations/$DESTINATION_ID"
```

`$API_HOST` is `https://api.contentful.com` (`https://api.eu.contentful.com` for EU data residency). Never echo `$CMA_TOKEN`.

## Resource operations

| Resource | Scope | Common operations |
|---|---|---|
| Channel | Organization | List, create, retrieve, update/upsert, publish, unpublish, delete |
| Destination | Space + environment | List (paginate), create, retrieve, update, retrieve tree, publish, unpublish, delete |
| Destination Node | Within a Destination | Create, retrieve, update/upsert, publish, unpublish, delete |

Typical API path families:

- `/organizations/{organizationId}/channels...`
- `/spaces/{spaceId}/environments/{environmentId}/destinations...`
- `/spaces/{spaceId}/environments/{environmentId}/destinations/{destinationId}/tree`
- `/spaces/{spaceId}/environments/{environmentId}/destinations/{destinationId}/nodes...`

There is no standalone node collection listing in the documented API: use the tree response to inventory nodes. Paginate Destination collections using the API's opaque cursor, following `next` until absent.

## Safe operation sequence

1. Read the target resources, tree, dependencies, and current versions.
2. Validate the plan and request fields against the current schema.
3. Write one resource at a time, using returned IDs and versions.
4. Re-read and verify each result. Follow the resource-specific lifecycle rules below; API acceptance does not prove downstream availability.

## Channel

Create Channels at organization scope. Requests include `properties` (per-Destination configuration) and `nodeProperties` (per-node values); IDs must be unique, and at most one node property may be `Path`. A draft Channel is sufficient to create a draft Destination. Publish the Channel before publishing any Destination or node that uses it; do not publish it solely to create a draft Destination. Before deletion, remove or migrate dependent Destinations, then unpublish and delete the Channel; the live API rejected deletion while it was published or still linked.

## Destination

Create a Destination in the target space/environment using an existing Channel and its declared property IDs/types. The Channel association is fixed; do not send `channelId` when updating. Read the Destination and tree after creation. **Observed:** one live environment returned `sys.channelId` (a string) instead of the documented `sys.channel` link; returned properties included `type`, while requests used `id` and `value` (for example, `{ "id": "<propertyId>", "value": "<value>" }`). If runtime and spec differ, inspect a live read and validate the minimal request on a safe fixture; never copy response-only fields blindly.

## Nodes

Create nodes with explicit types: `DestinationExperienceNode`, `DestinationFolderNode`, or `DestinationRedirectNode`. An omitted parent means the Destination root; verify update-body requirements in the current schema. Set `experience` or `redirectTo` before publishing. Before node publish, confirm the Channel and Destination and every ancestor are published; for Experience nodes, verify `sys.localeStatus` = `published`. A live test showed draft Experience/parent references can yield the misleading `422 "Some of the referenced entities do not exist."` Do not publish prerequisites without authorization. Redirect-to-draft publishability and node-unpublish descendant behavior remain unverified; check the current contract, unpublish leaf-first, and re-read the tree. For deletion, remove inbound redirects, delete children before parents (unpublishing published nodes first), then re-read the tree, GET each deleted ID expecting `404`, and check intended survivors.

Do not treat node-type conversion as a regular update. Current docs constrain folder/experience conversion (complete body, current version, preserve parent/path, unpublish affected nodes and inbound redirects first) and disallow conversion to/from redirect. Re-check the contract and get approval.

## Observed Experience reference shape

A live seeded Experience node used this ResourceLink URN shape; the inspected API reference did not document it. Read the target Experience and confirm the current contract before use.

```json
{
  "sys": {
    "type": "ResourceLink",
    "linkType": "Contentful:Experience",
    "urn": "crn:contentful:::experience:spaces/$self/environments/$self/experiences/<experienceId>"
  }
}
```

A live test returned `DefiningEntityIsDraft` when an Experience's Template was not published. Verify the Template state before publishing; do not publish it without authorization.

## Important operational distinction

The API models structure and references; the consuming application implements routing, redirect status codes, navigation order, and localization coordination. Explain this boundary when relevant.

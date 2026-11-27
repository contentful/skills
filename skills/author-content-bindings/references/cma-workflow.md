# CMA workflow

Use this reference when inspecting, saving, linking, or verifying a Data
Assembly. It documents the current Experience CMA contract.

## 1. Inspect before designing

Set the target only after confirming the space, environment, target kind, and
target ID. Keep the token in the shell or secret store; never place it in a
Binding Plan or DA body.

```bash
: "${CMA_TOKEN:?CMA_TOKEN must be set by a secret store or environment}"
API_HOST="https://api.contentful.com"
BASE_URL="$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID"

case "$TARGET_KIND" in
  component) TARGET_URL="$BASE_URL/components/$TARGET_ID" ;;
  experience-template) TARGET_URL="$BASE_URL/experience_templates/$TARGET_ID" ;;
  *) printf '%s\n' "Unknown target kind: $TARGET_KIND" >&2; exit 1 ;;
esac

curl --fail --silent --show-error \
  -H "Authorization: Bearer $CMA_TOKEN" \
  "$TARGET_URL"

curl --fail --silent --show-error \
  -H "Authorization: Bearer $CMA_TOKEN" \
  "$BASE_URL/content_types"

curl --fail --silent --show-error \
  -H "Authorization: Bearer $CMA_TOKEN" \
  "$BASE_URL/data_assemblies"

curl --fail --silent --show-error \
  -H "Authorization: Bearer $CMA_TOKEN" \
  "$BASE_URL/graphql_schema" > graphql-schema.graphql
test -s graphql-schema.graphql
```

For an Experience Template, use the verified
`$BASE_URL/experience_templates/$TARGET_ID` target endpoint. Do not use
retired `/component_types` or `/templates` CMA endpoints.

Sample one or two Entries for each candidate source type. Field names alone do
not prove semantic fit or requiredness.

For every Content Type proposed in `allowedTypes`, a selected `Link<Entry>`
field's `linkContentType` validation, or an `Array<Link<Entry>>` item's
validation, read `$BASE_URL/content_types/{id}` directly. A `404` may mean the
type was deleted or is unreadable to the user: do not include it in the Binding
Set. Block a required mapping, or remove an optional alternative and obtain
approval for the revised plan.

## 2. OpenAPI-derived write contract

This compact contract covers the shared POST and PUT body. Before writing, use
the current [create Data Assembly schema](https://www.contentful.com/developers/docs/references/experience-management-api/data-assemblies/create-data-assembly/)
or [upsert Data Assembly schema](https://www.contentful.com/developers/docs/references/experience-management-api/data-assemblies/upsert-data-assembly/)
when the API may have changed or any field is uncertain.

```jsonc
{
  "metadata": { "tags": [] },
  "name": "string",
  "description": "string",
  "parameters": [{
    "id": "string",
    "name": "optional display name",
    "required": true,
    "type": "ResourceLink",
    "allowedResources": [{
      "type": "Contentful:Entry",
      "source": "crn:contentful:::content:spaces/$self/environments/$self",
      "allowedTypes": ["<contentTypeId>"]
    }]
  }],
  "resolvers": {
    "<resolverId>": {
      "source": "Contentful:GraphQL",
      "query": "string",
      "parameters": { "<queryVariable>": "<DA pointer or literal>" }
    }
  },
  "return": {
    "<publicContentPropertyId>": {
      "$from": { "source": "$resolvers/<resolverId>/...", "select": "..." }
    }
  }
}
```

Every parameter has an `id` and an explicit `required` value. CMA derives
`sys.dataType`; do not supply it in the body. Resolver kind is derived from the
GraphQL query. Do not set `kind`.

Before each request, generate one complete body and validate it:

```bash
test -s body.json
python3 -m json.tool < body.json >/dev/null
```

## 3. Save and re-read

Create a new DA with POST. For an update, read the existing DA and use its
current version header.

```bash
CREATE_RESPONSE=$(curl --fail-with-body --silent --show-error -X POST \
  -H "Authorization: Bearer $CMA_TOKEN" \
  -H "Content-Type: application/json" \
  "$BASE_URL/data_assemblies" \
  --data @body.json)
DA_ID=$(printf '%s' "$CREATE_RESPONSE" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['sys']['id'])")

curl --fail --silent --show-error \
  -H "Authorization: Bearer $CMA_TOKEN" \
  "$BASE_URL/data_assemblies/$DA_ID" > saved-da.json
```

Compare the inferred `sys.dataType` with the target public content-property
contract, including requiredness. A saved DA with the wrong inferred type is
not complete.

## 4. Link without replacing existing work

Read the target immediately before updating it. Preserve every existing
`dataAssemblies` link and its order. A Data Assembly is owned by one Component
or Experience Template: never attach an existing Data Assembly to another
target. Create a distinct Data Assembly for that target, even when the contract
and mappings are identical. A target normally has one linked DA; append another
only when the approved Binding Plan explicitly asks for an additional Binding
Set.

```bash
TARGET_RESPONSE=$(curl --fail --silent --show-error \
  -H "Authorization: Bearer $CMA_TOKEN" "$TARGET_URL")
TARGET_VERSION=$(printf '%s' "$TARGET_RESPONSE" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['sys']['version'])")

TARGET_WRITE_BODY=$(TARGET_RESPONSE="$TARGET_RESPONSE" DA_ID="$DA_ID" python3 -c '
import json, os
target = json.loads(os.environ["TARGET_RESPONSE"])
links = target.get("dataAssemblies", [])
urn = "crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/" + os.environ["DA_ID"]
if sum(link.get("sys", {}).get("urn") == urn for link in links) > 1:
    raise SystemExit("Data Assembly link is duplicated")
if not any(link.get("sys", {}).get("urn") == urn for link in links):
    links.append({"sys": {"type": "ResourceLink", "linkType": "Contentful:DataAssembly", "urn": urn}})
target["dataAssemblies"] = links
target.pop("sys", None)
print(json.dumps(target))
')

curl --fail-with-body --silent --show-error -X PUT \
  -H "Authorization: Bearer $CMA_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Contentful-Version: $TARGET_VERSION" \
  "$TARGET_URL" \
  --data "$TARGET_WRITE_BODY"
```

Re-read the target. Verify the new DA occurs exactly once and every prior link
remains, in the same order. For an existing, different DA link, stop unless the
approved plan explicitly authorizes an additional link.

## 5. Verify in the Experience UI when a logged-in session is available

Do not publish the DA through CMA or a `/published` endpoint. After the save,
DA re-read, and target-link verification:

When authoring or inspecting through an authenticated browser session, or when
one is already available:

1. Open the exact Component or Experience Template in the Experience UI.
2. Reopen the exact linked Binding Set.
3. Confirm that it loads with its mappings and is editable.
4. Ask the user to review and publish through that editor.

When no authenticated browser session is available, do not attempt automated UI
verification. Report **CMA-valid; UI editability unverified**, ask the user to
open the target and check that the Binding Set renders and is meaningful, and
end the final response with the direct target URL as a clickable Markdown link.
CMA acceptance, inferred types, and a successful link do not alone establish
UI editability.

## 6. Final response

Re-read the saved DA, then render this review projection—not a proposed
fragment. Use the active harness's documented native collapsible mechanism when
it provides one. In Codex, use the `<details>` form below. In another harness,
use its documented expandable mechanism when known; otherwise use the portable
heading and `jsonc` block. Do not invent a collapsible syntax.

````markdown
### Final Data Assembly (review payload)

```jsonc
{
  // … server-assigned sys omitted; it is not relevant for review.
  "metadata": { "tags": [] },
  "name": "…",
  "description": "…",
  "parameters": [],
  "resolvers": {},
  "return": {}
}
```
````

For Codex, wrap the same payload as follows:

````markdown
<details>
<summary>Final Data Assembly (review payload)</summary>

```jsonc
{
  // … server-assigned sys omitted; it is not relevant for review.
  "metadata": { "tags": [] },
  "name": "…",
  "description": "…",
  "parameters": [],
  "resolvers": {},
  "return": {}
}
```

</details>
````

Keep `parameters`, `resolvers`, and `return` complete so the DA remains
reviewable. Follow the block with the target-link result and the UI-check
outcome. When UI verification was unavailable, include the direct Component or
Experience Template URL as a clickable Markdown final handoff link.

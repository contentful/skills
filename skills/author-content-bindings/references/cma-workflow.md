# CMA workflow

Use this reference when inspecting, saving, linking, or verifying a Data
Assembly. It documents the current Experience CMA contract.

## 1. Inspect before designing

Set the target only after confirming the space and environment. Keep the token
in the shell or secret store; never place it in a Binding Plan or DA body.

```bash
: "${CMA_TOKEN:?CMA_TOKEN must be set by a secret store or environment}"
API_HOST="https://api.contentful.com"
BASE_URL="$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID"

curl --fail --silent --show-error \
  -H "Authorization: Bearer $CMA_TOKEN" \
  "$BASE_URL/components/$COMPONENT_ID"

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
`$BASE_URL/experience_templates/$TEMPLATE_ID` target endpoint. Do not use
retired `/component_types` or `/templates` endpoints.

Sample one or two Entries for each candidate source type. Field names alone do
not prove semantic fit or requiredness.

## 2. Current persisted body

A DA POST or PUT body is sys-free and uses this top-level shape:

```json
{
  "metadata": { "tags": [] },
  "name": "Recent AI actions",
  "description": "Displays a selected title and the three most recently published AI actions.",
  "parameters": [],
  "resolvers": {},
  "return": {}
}
```

`parameters` is an ordered array. Every parameter has an `id` and an explicit
`required` value. CMA derives `sys.dataType`; do not supply it in the body.
Resolver kind is derived from the GraphQL query. Do not set `kind`.

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
`dataAssemblies` link and its order. A Component or template normally has one
linked DA; append another only when the approved Binding Plan explicitly asks
for an additional Binding Set.

```bash
TARGET_URL="$BASE_URL/components/$COMPONENT_ID"
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

## 5. Verify in the Experience UI

Do not publish the DA through CMA or a `/published` endpoint. After the save,
DA re-read, and target-link verification:

1. Open the exact Component or Experience Template in the Experience UI.
2. Reopen the exact linked Binding Set.
3. Confirm that it loads with its mappings and is editable.
4. Ask the user to review and publish through that editor.

If the UI cannot be opened in an authenticated session, report the result as
**CMA-valid; UI editability unverified**. CMA acceptance, inferred types, and a
successful link do not alone establish UI editability.

## 6. Final response

Render the saved body—not a proposed fragment—in an expandable container:

````markdown
<details>
<summary>Final submitted Data Assembly</summary>

```json
{ "sys": { "id": "…" }, "parameters": [], "resolvers": {}, "return": {} }
```

</details>
````

Follow it with the target-link result and the UI verification outcome.

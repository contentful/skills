# API Workflow — Step by Step

Full CMA call sequences for the Process steps referenced from [SKILL.md](../SKILL.md). Examples use `curl`. If no shell/exec tool is available, make the equivalent calls through the `contentful-mcp` MCP tools instead — same endpoints, same payloads. If neither is available, tell the user you cannot reach the Contentful API and stop rather than guessing at space state.

## Inputs

| Input | Source | Required | Default |
|-------|--------|----------|---------|
| Space ID | User provides or detect from context | Yes | — |
| Environment ID | User provides | No | `master` |
| CMA token | User provides or `$CMA_TOKEN` env var | Yes | — |
| API host | Domain for CMA requests | No | `api.contentful.com` (`api.flinkly.com` for staging) |

## 1. Introspect the space

Fetch all component types and content types.

```bash
# Fetch component types
curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/component_types"
```

```bash
# Fetch content types (source data)
curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/content_types"
```

## 1.5 Check for a reference space (STRONGLY RECOMMENDED)

Ask: **"Is there a reference space with the same components already wired with DAs? If yes, provide its space ID."**

If a reference exists, fetch its DAs FIRST and replicate their patterns exactly. This eliminates guesswork around query style, pointer syntax, RichText handling, and parameter naming.

```bash
# Fetch DAs from reference space
curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$REF_API_HOST/spaces/$REF_SPACE_ID/environments/$REF_ENVIRONMENT_ID/data_assemblies" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
for da in data.get('items', []):
    print(f\"\n== {da['name']} (id: {da['sys']['id']}) ==\")
    print(f\"  dataType: {json.dumps(da['sys'].get('dataType', []), indent=2)}\")
    print(f\"  parameters: {json.dumps(da.get('parameters', {}), indent=2)}\")
    print(f\"  resolvers: {json.dumps(da.get('resolvers', {}), indent=2)}\")
    print(f\"  return: {json.dumps(da.get('return', {}), indent=2)}\")"
```

**What to extract from the reference:**
- Query style: `_node` vs. direct (`contentType(id: $id)`)
- Pointer syntax: `$from` vs. bare string pointers
- RichText pattern: `{ document: json }` alias + bare parent pointer
- Parameter naming: typically `{contentTypeId}Id`
- Whether `kind` is used in resolvers
- DA reuse: same DA linked to multiple component types?

If no reference space exists, proceed — but flag higher risk of style drift in the binding plan.

## 2. Classify component types: coded vs. composite

This is the primary decision fork. Every component type falls into one of two categories, and the DA design approach differs fundamentally.

### Classification rules

| Signal | Classification |
|--------|---------------|
| No `componentTree` or empty `componentTree` | **Coded** |
| `Contentful:CodedImplementation` annotation | **Coded** |
| Has `componentTree` with children | **Composite** |
| `Contentful:ComposedImplementation` annotation | **Composite** |

```bash
# Classify all component types
curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/component_types" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
coded, composite = [], []
for ct in data.get('items', []):
    tree = ct.get('componentTree', {})
    has_children = bool(tree.get('children', []))
    cps = ct.get('contentProperties', [])
    slots = ct.get('slots', [])
    entry = {
        'id': ct['sys']['id'],
        'name': ct['name'],
        'contentProps': len(cps),
        'slots': len(slots)
    }
    if has_children:
        composite.append(entry)
    else:
        coded.append(entry)

print('=== CODED (leaf components — straightforward DA design) ===')
for c in coded:
    print(f\"  {c['name']} (id: {c['id']}) — {c['contentProps']} content props, {c['slots']} slots\")

print(f\"\n=== COMPOSITE (tree components — check hoisting + slots) ===\")
for c in composite:
    print(f\"  {c['name']} (id: {c['id']}) — {c['contentProps']} content props, {c['slots']} slots\")"
```

### What the classification means for DA design

| | Coded | Composite |
|---|---|---|
| **Content properties** | All direct and public | Mix of direct + hoisted from children |
| **Hoisting** | N/A — no children | Must identify which props are hoisted vs. direct |
| **Slots** | May have slots (rare) | Usually has slots |
| **DA complexity** | Simple: one resolver maps fields → props | Moderate: must respect hoisting + slot boundaries |
| **May not need a DA** | Unlikely (it has content props for a reason) | Possible — if ALL content comes via slot children |

## 3. Design DAs for CODED component types

Coded components are straightforward. All `contentProperties` are public and directly bindable.

**Steps:**
1. List the component's `contentProperties` (all are public)
2. Find a content type whose fields match those properties (by name/type)
3. Design a single entity or collection resolver
4. Map resolver output → content properties via return expressions

```bash
# Inspect a coded component's content properties
curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/component_types/$CT_ID" \
  | python3 -c "
import sys, json
ct = json.load(sys.stdin)
print(f\"== {ct['name']} (CODED) ==\")
print(f\"\\nContent properties (ALL public, ALL bindable):\")
for cp in ct.get('contentProperties', []):
    req = '✓ required' if cp.get('required') else '○ optional'
    print(f\"  {cp['id']}: {cp['type']} ({req})\")
slots = ct.get('slots', [])
if slots:
    print(f\"\\nSlots (children need their own DAs):\")
    for s in slots:
        print(f\"  {s['id']}: {s.get('name', '')}\")"
```

## 4. Design DAs for COMPOSITE component types

Composites require more analysis. Their `contentProperties` array contains a mix of:
- **Direct properties** — declared on the composite itself
- **Hoisted properties** — bubbled up from children in the `componentTree`

Both are public and bindable, but you need to understand the origin to design the GraphQL query correctly.

### Does this composite need a DA at all?

| Situation | Needs DA? |
|-----------|-----------|
| Has `contentProperties` that should be filled from entries | **Yes** |
| All content comes from slot children (each with their own DA) | **No** — skip |
| Only has `designProperties` (no content props) | **No** — skip |
| Has `contentProperties` but all are manually filled (literals) | **No** — use manual values |

```bash
# Inspect a composite component — content properties + tree
curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/component_types/$CT_ID" \
  | python3 -c "
import sys, json
ct = json.load(sys.stdin)
print(f\"== {ct['name']} (COMPOSITE) ==\")

cps = ct.get('contentProperties', [])
print(f\"\\nPublic content properties ({len(cps)} total — all bindable):\")
for cp in cps:
    req = '✓ required' if cp.get('required') else '○ optional'
    print(f\"  {cp['id']}: {cp['type']} ({req})\")

tree = ct.get('componentTree', {})
children = tree.get('children', [])
print(f\"\\nComponent tree ({len(children)} children):\")
for node in children:
    props = node.get('props', {})
    bindings = []
    for key, val in props.items():
        if isinstance(val, str) and '\$contentProperties/' in val:
            bindings.append(f\"{key} ← {val}\")
    ct_ref = node.get('type', node.get('componentType', '?'))
    if bindings:
        print(f\"  {ct_ref}: {', '.join(bindings)}\")
    else:
        print(f\"  {ct_ref}: (no content property bindings)\")

slots = ct.get('slots', [])
if slots:
    print(f\"\\nSlots ({len(slots)} — children here get their OWN DAs):\")
    for s in slots:
        allowed = s.get('allowedTypes', 'any')
        print(f\"  {s['id']}: allows {allowed}\")"
```

## 5.1 Fetch existing DAs in this space

```bash
# Fetch existing data assemblies
curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/data_assemblies" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
for da in data.get('items', []):
    returns = list(da.get('return', {}).keys())
    params = list(da.get('parameters', {}).keys())
    print(f\"  {da['name']} (id: {da['sys']['id']})\")
    print(f\"    params: {params}, returns: {returns}\")"
```

## 5.2 Sample entries to verify field semantics

**Do not skip this step.** Field names are ambiguous — `topic` could be a category tag or a paragraph, `subline` could be a subtitle or body text. Fetch 1-2 sample entries per source content type to see what fields actually contain:

```bash
# Sample entries for a content type
curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/entries?content_type=$CT_ID&limit=2" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
for entry in data.get('items', []):
    print(f\"\\n== {entry['sys']['id']} ==\")
    for field_id, locales in entry.get('fields', {}).items():
        val = next(iter(locales.values()), None)
        if isinstance(val, str):
            preview = val[:80] + ('...' if len(val) > 80 else '')
            print(f\"  {field_id}: \\\"{preview}\\\"\")
        elif isinstance(val, dict) and val.get('sys', {}).get('type') == 'Link':
            print(f\"  {field_id}: → Link<{val['sys'].get('linkType', '?')}> {val['sys'].get('id', '')}\")
        elif isinstance(val, dict) and 'nodeType' in val:
            print(f\"  {field_id}: [RichText document]\")
        elif isinstance(val, list):
            print(f\"  {field_id}: [{len(val)} items]\")
        else:
            print(f\"  {field_id}: {json.dumps(val)[:60]}\")"
```

Use the actual field values to resolve ambiguities:
- A `Symbol` containing "AI & Automation" is a category tag, not a description
- A `Text` containing a full paragraph is body content, not a subtitle
- A `RichText` field contains structured JSON (nodeType, content arrays)

**Flag ambiguous mappings** — if multiple source fields could map to one target property, note the ambiguity in the plan and confirm with the user.

## 5.3 Infer field mappings

**Gate first, then match.** For every candidate pair, in order:

1. **Is the target a content property at all?** Apply the content-vs-design test (see SKILL.md, "Content property vs. design property"). A design property is never a mapping target, no matter how well the source field fits.
2. **Is the target public?** If it is not in the component type's `contentProperties`, stop — the golden rule applies. Record it as blocked-pending-hoisting, and check the required-but-unhoisted contradiction rule.
3. **Is the target on a slot child?** If so it belongs to that child's own DA, not this one.
4. Only then match types and semantics.

Match content type fields to component content properties using these heuristics:

| Content property type | Matching content type field | Resolver kind |
|-----------------------|----------------------------|---------------|
| `String` | `Symbol`, `Text` | `entity` |
| `RichText` | `RichText` or `String` (JSON) | `entity` (see [richtext-and-types.md](richtext-and-types.md)) |
| `Media` (url/width/height/alt) | `Link<Asset>` | `entity` |
| `Array` of `Record` | `Array<Link<Entry>>` (multi-ref) | `collection` |
| `Record` (structured) | `Link<Entry>` (single ref) | `entity` (nested DA or inline) |
| `TypeRef` (whole-component) | `Link<Entry>` | Nested DA |

**Naming conventions:**
- **DA IDs:** `{component-type-id}-{source-content-type-id}` (e.g., `hero-banner-page-hero`)
- **Parameter IDs:** `{contentTypeId}Id` (e.g., `capabilityId`, `testimonialId`) — appears in the marketer-facing binding panel
- **Parameter `name` field:** Human-readable label (e.g., `"name": "Capability"`) — always include this

**Choosing the source when several fields or content types could fill one target:**

1. **Type first.** The source field's type must be able to produce the target's declared type, and a parameter's `allowedTypes` must contain the content type. This is a hard filter, not a preference.
2. **Semantic fit second.** Judge the field's actual content — sampled values and the field name — against the property's intent. Field names are semantic signals, sampled values are evidence. Step 5.2 exists for this.
3. **Context third.** A field that fits the property but contradicts the component's subject is a poor choice even with a perfect type match.
4. **Honor stated constraints.** Focus areas, exclusions, and filters the user stated persist across the whole run, not just the message they appeared in. Carry them forward into every mapping decision.

**Confidence maps to action:** *high* = direct match, map it. *medium* = plausible, map it and mark it for review in the Binding Plan. *low* = weak. **Prefer leaving a property unmapped and naming it over mapping something low-confidence and wrong** — a wrong mapping is much harder for the user to notice than an absent one, because it produces plausible content in the right shape. Unmapped properties are a line item in the Binding Plan; wrong ones are a silent defect.

**Never claim to have removed, replaced, or rewired an existing binding.** Existing DAs found in step 5.1 are left alone unless the user explicitly asks for a change. If a component already has a DA covering the same properties, reuse or extend it (see [worked-example.md](worked-example.md), "Reusing One DA Across Multiple Component Types") — do not create a competing one and do not describe the result as having replaced anything.

## 5.4 Output the Binding Plan

Present the FULL plan as a single table covering every component type. This is the contract the user approves before execution begins.

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           BINDING PLAN                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣

1. HeroBanner (CODED)
   DA: hero-banner-page-hero [NEW]
   Source: pageHero | Parameter: hero
   ┌─────────────────┬────────────────────┬──────────┬──────────────┐
   │ Content Property │ Source Field       │ Type     │ Depth        │
   ├─────────────────┼────────────────────┼──────────┼──────────────┤
   │ title (req)     │ pageHero.headline  │ String   │ shallow      │
   │ subtitle        │ pageHero.subline   │ String   │ shallow      │
   │ image (req)     │ pageHero.bgImage   │ Record   │ shallow      │
   │ ctaLabel        │ pageHero.ctaText   │ String   │ shallow      │
   │ ctaUrl          │ pageHero.ctaLink   │ String   │ shallow      │
   └─────────────────┴────────────────────┴──────────┴──────────────┘

2. BookCard (CODED)
   DA: book-card-book [NEW]
   Source: book | Parameter: bookId
   ┌─────────────────┬────────────────────┬──────────┬──────────────┐
   │ Content Property │ Source Field       │ Type     │ Depth        │
   ├─────────────────┼────────────────────┼──────────┼──────────────┤
   │ title (req)     │ book.title         │ String   │ shallow      │
   │ authorName      │ book.author.name   │ String   │ 2 hops (deep)│
   └─────────────────┴────────────────────┴──────────┴──────────────┘

3. ProductSection (COMPOSITE)
   DA: product-section-data [NEW]
   Source: productSection | Parameter: section
   ┌─────────────────┬──────────────────────────┬──────────┬──────────────┐
   │ Content Property │ Source Field             │ Type     │ Depth        │
   ├─────────────────┼──────────────────────────┼──────────┼──────────────┤
   │ title (req)     │ productSection.headline  │ String   │ shallow      │
   │ internalName    │ productSection.internalNm│ String   │ shallow      │
   └─────────────────┴──────────────────────────┴──────────┴──────────────┘
   Slot "products" → child needs own DA (see #4)

4. ProductGrid (CODED — slot child of #3)
   DA: product-grid-catalog [NEW]
   Source: catalog | Parameter: catalog
   ┌─────────────────────────┬──────────────────────────┬──────────┬─────────┐
   │ Content Property         │ Source Field             │ Type     │ Depth   │
   ├─────────────────────────┼──────────────────────────┼──────────┼─────────┤
   │ trendingProducts (req)  │ catalog.productsCol.items│ Array    │ shallow │
   └─────────────────────────┴──────────────────────────┴──────────┴─────────┘

5. Divider (CODED)
   DA: none needed (no content properties)

╠══════════════════════════════════════════════════════════════════════════════╣
║ PLAN SUMMARY                                                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
  Component types with content properties: 4
  DAs to create: 4
  DAs already existing: 0
  Skipped (no content props): 1
  Deep bindings (>1 hop): 1 (book.author.name — 2 hops ✓)
  Nested DAs required: 0
╚══════════════════════════════════════════════════════════════════════════════╝
```

## 5.5 Get approval

Ask: **"Here's the binding plan. Does this look correct? Any mappings to add, remove, change source content types, or rename DA IDs?"**

**Do NOT proceed to step 6 until the user explicitly approves the plan.**

If the user requests changes, update the plan and present it again. Only proceed once approved.

## 6. Create Data Assemblies

**PUT body structure:** The `sys` object in the request body MUST contain `id`, `type`, and `dataType`. Optionally include `version` for updates. All other `sys` fields (space, environment, createdBy, etc.) are server-managed.

```json
{
  "sys": {
    "id": "my-da-id",
    "type": "DataAssembly",
    "dataType": [...]
  },
  "metadata": { "tags": [] },
  "name": "...",
  "description": "...",
  "parameters": { ... },
  "resolvers": { ... },
  "return": { ... }
}
```

**Notes on optional fields:**
- `kind` (`"entity"` or `"collection"`) is accepted but not required. If replicating from a reference space that omits it, don't add it.
- `name` on parameters (e.g., `"name": "Capability"`) is the human-readable label shown in the binding panel. Always include it.

See [resolver-patterns.md](resolver-patterns.md) for full request bodies covering entity, collection, nested-DA, asset/Media, and deep-binding resolvers.

## 7. Link the DA to its Component Type

**This step is required.** After creating a DA, you must add it to the target component type's `dataAssemblies` array. Without this link, the DA won't appear in the editor's binding panel for that component.

```bash
# Fetch the component type's current state
CT_RESPONSE=$(curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/component_types/$CT_ID")

CT_VERSION=$(echo "$CT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['sys']['version'])")

# Extract existing dataAssemblies links (may be empty array)
EXISTING_DAS=$(echo "$CT_RESPONSE" | python3 -c "
import sys, json
ct = json.load(sys.stdin)
das = ct.get('dataAssemblies', [])
print(json.dumps(das))")

# Add new DA link to the array
NEW_DA_LINK='{
  "sys": {
    "type": "ResourceLink",
    "linkType": "Contentful:DataAssembly",
    "urn": "crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/'$DA_ID'"
  }
}'

UPDATED_DAS=$(echo "$EXISTING_DAS" | python3 -c "
import sys, json
existing = json.load(sys.stdin)
new_link = json.loads('$NEW_DA_LINK')
# Don't add if already linked
if not any(d.get('sys',{}).get('urn','').endswith('/$DA_ID') for d in existing):
    existing.append(new_link)
print(json.dumps(existing))")

# Update the component type
curl -s -X PUT \
  -H "Authorization: Bearer $CMA_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Contentful-Version: $CT_VERSION" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/component_types/$CT_ID" \
  -d "$(echo "$CT_RESPONSE" | python3 -c "
import sys, json
ct = json.load(sys.stdin)
ct['dataAssemblies'] = $UPDATED_DAS
# Remove sys for the PUT body (API rejects it in body)
del ct['sys']
print(json.dumps(ct))")"
```

**URN format for DA links:**
```
crn:contentful:::experience:spaces/$self/environments/$self/dataAssemblies/{da-id}
```

## 8. Publish the Data Assembly

```bash
# Fetch the current version
VERSION=$(curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/data_assemblies/$DA_ID" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['sys']['version'])")

# Publish
curl -s -X PUT \
  -H "Authorization: Bearer $CMA_TOKEN" \
  -H "X-Contentful-Version: $VERSION" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/data_assemblies/$DA_ID/published"
```

## 9. Verify

```bash
curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/data_assemblies/$DA_ID" \
  | python3 -c "
import sys, json
da = json.load(sys.stdin)
print(f\"✓ {da['name']} (v{da['sys']['version']}, published: {'publishedVersion' in da['sys']})\")
print(f\"  Parameters: {list(da.get('parameters', {}).keys())}\")
print(f\"  Resolvers: {list(da.get('resolvers', {}).keys())}\")
print(f\"  Returns: {list(da.get('return', {}).keys())}\")"
```

## 10. Validate against reference (if reference space exists)

If a reference space was identified in step 1.5, compare your created DAs against it before producing the final binding map:

```bash
# Compare created DAs against reference
curl -s -H "Authorization: Bearer $CMA_TOKEN" \
  "$REF_API_HOST/spaces/$REF_SPACE_ID/environments/$REF_ENVIRONMENT_ID/data_assemblies" \
  | python3 -c "
import sys, json
ref = json.load(sys.stdin)
for da in ref.get('items', []):
    print(f\"REF: {da['sys']['id']}\")
    dt = da['sys'].get('dataType', [])
    for d in dt:
        print(f\"  {d['id']}: {d['type']}\")
    ret = da.get('return', {})
    for k, v in ret.items():
        style = 'bare' if isinstance(v, str) else '\$from'
        print(f\"  return.{k}: {style}\")"
```

**Check for:**
- `dataType` alignment — especially `RichText` vs. `String` (most common drift)
- Return mapping style — bare pointers vs. `$from` (should be consistent)
- Field coverage — any fields the reference maps that you don't?
- DA reuse — any reference DAs linked to multiple component types that you duplicated?
- Missing DAs — any reference DAs not replicated?

If discrepancies are found, fix them before producing the binding map.

## Upsert Semantics & Conflict Handling

The `PUT /data_assemblies/:id` endpoint uses **upsert** semantics:
- First call creates the DA (no version header needed)
- Subsequent calls update (require `X-Contentful-Version` header)
- On `409 Conflict`: fetch current version, retry with updated header

```bash
# Upsert pattern with conflict retry
RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
  -H "Authorization: Bearer $CMA_TOKEN" \
  -H "Content-Type: application/json" \
  "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/data_assemblies/$DA_ID" \
  -d "$BODY")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "409" ]; then
  VERSION=$(curl -s -H "Authorization: Bearer $CMA_TOKEN" \
    "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/data_assemblies/$DA_ID" \
    | python3 -c "import sys, json; print(json.load(sys.stdin)['sys']['version'])")
  curl -s -X PUT \
    -H "Authorization: Bearer $CMA_TOKEN" \
    -H "Content-Type: application/json" \
    -H "X-Contentful-Version: $VERSION" \
    "$API_HOST/spaces/$SPACE_ID/environments/$ENVIRONMENT_ID/data_assemblies/$DA_ID" \
    -d "$BODY"
fi
```

## After Creation: Complete Binding Map (MANDATORY)

**You MUST produce this table at the end of every run.** Do not skip it. This is the deliverable that confirms all bindings are accounted for.

After all DAs are created, published, and linked, output a complete binding map covering EVERY component type in the space that has content properties:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                        COMPLETE BINDING MAP                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣

Component Type: HeroBanner (coded)
  DA: hero-banner-page-hero ✓ created ✓ published ✓ linked
  ┌─────────────────┬────────────────────┬───────────────────────────────────┐
  │ Content Property │ Source Field       │ Return Path                       │
  ├─────────────────┼────────────────────┼───────────────────────────────────┤
  │ title (String)  │ pageHero.headline  │ $resolvers/r1 → _node/headline    │
  │ subtitle (Str)  │ pageHero.subline   │ $resolvers/r1 → _node/subline     │
  │ image (Record)  │ pageHero.bgImage   │ $resolvers/r1 → _node/bgImage/*   │
  │ ctaLabel (Str)  │ pageHero.ctaText   │ $resolvers/r1 → _node/ctaText     │
  └─────────────────┴────────────────────┴───────────────────────────────────┘

Component Type: ProductSection (composite)
  DA: product-section-data ✓ created ✓ published ✓ linked
  ┌─────────────────┬─────────────────────────┬────────────────────────────────┐
  │ Content Property │ Source Field            │ Return Path                    │
  ├─────────────────┼─────────────────────────┼────────────────────────────────┤
  │ title (String)  │ productSection.headline │ $resolvers/r1 → _node/headline │
  └─────────────────┴─────────────────────────┴────────────────────────────────┘
  Slots:
    products → ProductGrid (has own DA: product-grid-catalog ✓)

Component Type: ProductGrid (coded, slot child)
  DA: product-grid-catalog ✓ created ✓ published ✓ linked
  ┌─────────────────────────┬──────────────────────────┬───────────────────────┐
  │ Content Property         │ Source Field             │ Return Path           │
  ├─────────────────────────┼──────────────────────────┼───────────────────────┤
  │ trendingProducts (Array)│ catalog.productsCol.items│ $resolvers/r1 → ...   │
  └─────────────────────────┴──────────────────────────┴───────────────────────┘

Component Type: Divider (coded)
  DA: none needed (no content properties)

╠══════════════════════════════════════════════════════════════════════════════╣
║ SUMMARY                                                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
  Total component types: 4
  DAs created: 3
  DAs skipped (no content props): 1
  Unbound content properties: 0  ← MUST be 0 to complete
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Rules for the binding map:**
1. List EVERY component type in the space — even those that need no DA (mark as "none needed")
2. For each DA: show ✓/✗ for created, published, and linked status
3. For each content property: show the source field and return path
4. For composites: show slot children and whether they have their own DAs
5. The **Unbound content properties** count MUST be 0 — if any content property has no DA mapping, either create a DA for it or explicitly note why it's intentionally unbound (e.g., "always manually filled")
6. If any property is unbound without justification, go back and create the missing DA before outputting the final map

**After the map, print:**

1. All DAs created and published: `{list of DA IDs}`
2. To use them: open an Experience or Fragment in the Contentful editor
3. Select a component instance → Content tab → choose the relevant Data Assembly
4. Assign a source entry (of the allowed content type) as the parameter
5. For composites with slots: select each slot child individually and bind its own DA

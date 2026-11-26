# UI-compatible mappings

Use this reference while designing a return map. CMA may accept broader shapes
than the Experience UI can reopen. The target environment's GraphQL schema and
the final UI reopen are the sources of truth.

## Trace the current target schema

Fetch `graphql_schema` immediately before authoring. For every resolver query
and nested `$from`, record the unwrapped GraphQL return type at the selection
boundary:

| Return type | Query and return-map form |
| --- | --- |
| `UNION` or `INTERFACE` | Query `__typename` and inline fragments; use matching `$on.type` branches. A one-member union still needs `$on.type`. |
| `OBJECT` | Use an ordinary selector. Do not add `$on.type` only because the CMA field is a `Link` or permits one content type. |
| Scalar or enum | Use a terminal selector and verify target type and requiredness. |

The type is schema-specific. Do not copy `$on.type` from another environment or
infer it from CMA field validations.

## Preserve transport boundaries

Put transport boundaries in `$from.source`, then make the next typed selection
in `$from.select`.

```json
{
  "$from": {
    "source": "$resolvers/section/_node",
    "select": {
      "$on": { "type": { "SectionTextWithMedia": "title/title" } }
    }
  }
}
```

Do not flatten `_node` into a string selector:

```json
{ "$from": { "source": "$resolvers/section", "select": "_node/title/title" } }
```

Use the same rule for `<field>CursorCollection/items` and for a linked value
that begins an inner mapping. A concrete linked object uses a plain inner
selector; an abstract linked value uses a nested `$on.type` branch.

## Pointer depth and collections

Apply the four-segment editor-compatibility guideline independently within each
pointer-expression scope. `items` is an iteration boundary, not a selected
traversal segment. For example, this is depth four, not five:

```text
itemsCursorCollection → media → image → url
```

```json
{
  "$from": {
    "source": "$resolvers/section/_node/itemsCursorCollection/items",
    "select": { "imageSrc": "media/image/url" }
  }
}
```

This plain selector is correct only if the item and `media` are concrete
objects in the current schema. Use the required nested `$on.type` branches for
union or interface boundaries.

## Requiredness is a gate

Compare source availability with every target requirement, including nested
Record fields and Array items. An optional source cannot satisfy a required
target unless a verified query guarantee makes it present.

For `Array<Link<Entry>>`, do not use array indexes such as `items/0` or
`items/1` to fill separate required nested Component contracts. Collection
items are optional from the mapping's type perspective, even when sampled
entries currently have enough items.

Use separate required inputs only when independently choosing the entries in
an Experience or Experience Fragment is acceptable. If the source relationship
must be retained by position, report a component or content-modeling gap.

Use UI-level language first:

```text
The {fieldName} collection cannot populate these nested Components by position.
Create separate inputs and choose each entry independently when configuring the
Experience or Experience Fragment.
```

## Root collections: UI-shaped fixed order

For a recommended root collection, validate the target schema's order enum and
use the editor's persisted form: a locked `Record` parameter with the same ID
as the resolver. Its fallback values keep the limit and order fixed, while its
fields bind the GraphQL variables:

```jsonc
{
  "parameters": [{
    "id": "actions",
    "type": "Record",
    "required": true,
    "locked": true,
    "fields": [
      { "id": "limit", "type": "Number", "fallbackValue": 3 },
      {
        "id": "order",
        "type": "OrderExpression",
        "fallbackValue": [{ "path": "sys.publishedAt", "direction": "desc" }],
        "target": {
          "resourceLink": "crn:contentful:::content:spaces/$self/environments/$self/contentTypes/aiActionTemplate"
        }
      }
    ]
  }],
  "resolvers": {
    "actions": {
      "source": "Contentful:GraphQL",
      "query": "query ($limit: Int!, $order: [AiActionTemplateOrder]) { aiActionTemplateCursorCollection(limit: $limit, order: $order) { items { title description } } }",
      "parameters": {
        "limit": "$parameters/actions/limit",
        "order": "$parameters/actions/order"
      }
    }
  }
}
```

The locked Record and both bindings are one shape. Do not replace only part of
it with an inline enum or a standalone `$order` pointer. Dynamic `where`
filters, extra root fields, or custom root arguments are API-only exceptions
and require explicit user confirmation.

## API-only exception

When the user requires a non-recommended shape, describe the smallest specific
deviation and ask before writing it:

```text
⚠️ API-only exception proposed

The requested {behavior} requires {specific non-recommended shape}. CMA may
accept it, but the Binding Set may not open or remain editable in the Experience
UI. Future changes could require CMA/API calls rather than the editor.

Proceed with this API-only exception?
```

After any approved exception, reopen the exact Binding Set. If it is not
editable, report it as API-only rather than presenting it as a normal Binding
Set.

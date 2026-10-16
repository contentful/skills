# Snapshot database

Use `contentful-unified.db` through `node scripts/main.js query`. Common tables:

| Table | Purpose | Main key |
| --- | --- | --- |
| `content_type` | Content type definitions | `content_type_id` |
| `field` | Fields declared by each content type | `content_type_id`, `field_id` |
| `entries` | Entry system data and raw payload | `entry_id` |
| `entry_fields` | Localized entry field values | `entry_id`, `field_key`, `locale` |
| `assets` | Asset system data and raw payload | `asset_id` |
| `asset_fields` | Localized asset field values | `asset_id`, `field_key`, `locale` |
| `component` | ExO Components | `component_id` |
| `component_property` | Component content/design properties and slots | `component_id`, `property_id`, `kind` |
| `experience_template` | ExO Experience Templates | `experience_template_id` |
| `experience_template_property` | Template properties and slots | `experience_template_id`, `property_id`, `kind` |
| `exo_experience` | ExO Experience instances | `experience_id` |
| `exo_fragment` | ExO Fragment instances | `fragment_id` |
| `exo_data_assembly` | Data Assemblies | `data_assembly_id` |
| `tags` | Tags referenced by fetched entries/assets | `tag_id` |
| `taxonomy_concepts` | Concepts referenced by fetched entries/assets | `concept_id` |

`entries.content_type_id` joins to `content_type.content_type_id`. Field values join through `entry_fields.entry_id`. Values in field tables are JSON in `value_json`; use SQLite JSON functions such as `json_extract` when needed.

Examples:

```sql
SELECT ct.name, COUNT(e.entry_id) AS entries
FROM content_type ct
LEFT JOIN entries e ON e.content_type_id = ct.content_type_id
GROUP BY ct.content_type_id, ct.name
ORDER BY entries DESC;
```

```sql
SELECT locale, COUNT(DISTINCT entry_id) AS entries
FROM entry_fields
GROUP BY locale
ORDER BY entries DESC;
```

```sql
SELECT c.name, p.kind, COUNT(*) AS properties
FROM component c
JOIN component_property p ON p.component_id = c.component_id
GROUP BY c.component_id, c.name, p.kind
ORDER BY c.name, p.kind;
```

For a Rich Text field, count both missing values and documents without text or Entry links as empty.
Replace the content type, field, and locale with the values from the inventory:

```sql
WITH values_by_entry AS (
  SELECT e.entry_id, ef.value_json
  FROM entries e
  LEFT JOIN entry_fields ef
    ON ef.entry_id = e.entry_id
    AND ef.field_key = 'body'
    AND ef.locale = 'en-US'
  WHERE e.content_type_id = 'article'
)
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN value_json IS NULL OR NOT EXISTS (
    SELECT 1 FROM json_tree(value_json)
    WHERE (key = 'value' AND typeof(value) = 'text' AND trim(value) != '')
       OR (key = 'linkType' AND value = 'Entry')
  ) THEN 1 ELSE 0 END) AS empty,
  SUM(CASE WHEN value_json IS NOT NULL AND EXISTS (
    SELECT 1 FROM json_tree(value_json)
    WHERE (key = 'value' AND typeof(value) = 'text' AND trim(value) != '')
       OR (key = 'linkType' AND value = 'Entry')
  ) THEN 1 ELSE 0 END) AS populated,
  SUM(CASE WHEN EXISTS (
    SELECT 1 FROM json_tree(value_json)
    WHERE key = 'linkType' AND value = 'Entry'
  ) THEN 1 ELSE 0 END) AS with_entry_links
FROM values_by_entry;
```

# Migration API Reference

Complete reference for the `contentful-migration` library API.

## Table of Contents

- [Content Type Operations](#content-type-operations)
- [Field Operations](#field-operations)
- [Field Types](#field-types)
- [Validations](#validations)
- [Editor Interface](#editor-interface)
- [Editor Layouts](#editor-layouts)
- [Sidebar Widgets](#sidebar-widgets)
- [Tags](#tags)
- [Annotations](#annotations)
- [Taxonomy Validations](#taxonomy-validations)
- [Context Object](#context-object)

## Content Type Operations

### `migration.createContentType(id[, opts])`

Creates a new content type. Returns a `ContentType` object for chaining.

Options (also available as chained methods):
- `name` (string) — display name
- `description` (string) — description
- `displayField` (string) — field ID used as the entry title (must be a Symbol field)

```typescript
const post = migration.createContentType('post')
  .name('Post')
  .description('Blog post')
  .displayField('title')
```

### `migration.editContentType(id[, opts])`

Returns an existing content type for modification. Same options as `createContentType`.

### `migration.deleteContentType(id)`

Deletes a content type. The type must have zero published or draft entries.

## Field Operations

All field methods are called on a `ContentType` object.

### `contentType.createField(id[, opts])`

Creates a field. Returns a `Field` object for chaining.

Options (also available as chained methods):
- `name` (string, required) — display name
- `type` (string, required) — field type
- `required` (boolean) — marks as required
- `localized` (boolean) — enables per-locale values
- `disabled` (boolean) — prevents editing in the web app
- `omitted` (boolean) — field is not included in API responses
- `defaultValue` (object) — locale-keyed defaults: `{ 'en-US': 'value' }`
- `validations` (array) — validation rules
- `items` (object) — for Array type: `{ type, linkType?, validations? }`
- `linkType` (string) — for Link type: `'Asset'` or `'Entry'`
- `allowedResources` (array) — for ResourceLink type

### `contentType.editField(id[, opts])`

Edits an existing field. Same options as `createField`.

### `contentType.deleteField(id)`

Deletes a field and its content from all entries. This is irreversible.

### `contentType.changeFieldId(currentId, newId)`

Renames a field ID. Content is preserved.

### `contentType.moveField(id)`

Returns a `Movement` object:
- `.toTheTop()` — move to first position
- `.toTheBottom()` — move to last position
- `.beforeField(fieldId)` — position before another field
- `.afterField(fieldId)` — position after another field

## Field Types

### Symbol

Short text, max 256 characters. Used for titles, slugs, short strings.

```typescript
field.type('Symbol')
```

### Text

Long text, max 50,000 characters. Used for descriptions, body text (plain text).

```typescript
field.type('Text')
```

### Integer

Whole number.

```typescript
field.type('Integer')
```

### Number

Decimal number (floating point).

```typescript
field.type('Number')
```

### Date

ISO 8601 date/time string.

```typescript
field.type('Date')
```

### Boolean

True or false.

```typescript
field.type('Boolean')
```

### Object

Arbitrary JSON object. Useful for structured metadata.

```typescript
field.type('Object')
```

### Location

Geographic coordinates (latitude/longitude).

```typescript
field.type('Location')
```

### RichText

Structured rich text with embedded entries and assets. Configure allowed node types and marks via validations:

```typescript
field.type('RichText').validations([
  {
    enabledNodeTypes: [
      'heading-1', 'heading-2', 'heading-3',
      'ordered-list', 'unordered-list',
      'blockquote', 'hyperlink',
      'embedded-entry-block', 'embedded-asset-block',
    ],
  },
  {
    enabledMarks: ['bold', 'italic', 'underline', 'code'],
  },
])
```

Available node types: `heading-1` through `heading-6`, `ordered-list`, `unordered-list`, `blockquote`, `hr`, `hyperlink`, `entry-hyperlink`, `asset-hyperlink`, `embedded-entry-block`, `embedded-asset-block`, `embedded-entry-inline`, `table`.

Available marks: `bold`, `italic`, `underline`, `code`, `superscript`, `subscript`.

### Array

List of values or references. Requires `items` configuration:

```typescript
// Array of symbols
field.type('Array').items({ type: 'Symbol' })

// Array of entry references
field.type('Array').items({
  type: 'Link',
  linkType: 'Entry',
  validations: [{ linkContentType: ['tag', 'category'] }],
})

// Array of asset references
field.type('Array').items({
  type: 'Link',
  linkType: 'Asset',
  validations: [{ linkMimetypeGroup: ['image'] }],
})
```

### Link

Single reference to an entry or asset. Requires `linkType`:

```typescript
// Entry reference
field.type('Link').linkType('Entry')
  .validations([{ linkContentType: ['author'] }])

// Asset reference
field.type('Link').linkType('Asset')
  .validations([{ linkMimetypeGroup: ['image', 'video'] }])
```

### ResourceLink

Cross-space reference. Requires `allowedResources`:

```typescript
field.type('ResourceLink').allowedResources([{
  type: 'Contentful:Entry',
  source: 'crn:contentful:::content:spaces/other-space-id',
  contentTypes: ['article'],
}])
```

## Validations

Apply validations with `.validations([...])` on a field. Multiple validations can be combined in one array.

### `in`

Restricts to a set of allowed values. Works with Symbol, Integer, Number.

```typescript
field.validations([{ in: ['draft', 'review', 'published'] }])
```

### `unique`

Ensures values are unique across all entries at publication time.

```typescript
field.validations([{ unique: true }])
```

### `size`

Min/max constraint on length (text) or count (array).

```typescript
field.validations([{ size: { min: 1, max: 10 } }])
```

### `range`

Min/max for numeric values.

```typescript
field.validations([{ range: { min: 0, max: 100 } }])
```

### `regexp`

Regular expression pattern match.

```typescript
field.validations([{ regexp: { pattern: '^[a-z0-9-]+$', flags: 'i' } }])
```

### `dateRange`

Min/max date constraint.

```typescript
field.validations([{ dateRange: { min: '2020-01-01T00:00:00Z', max: '2030-12-31T23:59:59Z' } }])
```

### `linkContentType`

Restricts which content types a Link or Array of Links can reference.

```typescript
field.validations([{ linkContentType: ['author', 'organization'] }])
```

### `linkMimetypeGroup`

Restricts asset MIME types. Groups: `attachment`, `plaintext`, `image`, `audio`, `video`, `richtext`, `presentation`, `spreadsheet`, `pdfdocument`, `archive`, `code`, `markup`.

```typescript
field.validations([{ linkMimetypeGroup: ['image', 'video'] }])
```

### `assetFileSize`

Min/max file size in bytes.

```typescript
field.validations([{ assetFileSize: { min: 0, max: 5242880 } }]) // max 5 MB
```

### `assetImageDimensions`

Min/max width/height in pixels.

```typescript
field.validations([{
  assetImageDimensions: {
    width: { min: 100, max: 4000 },
    height: { min: 100, max: 4000 },
  },
}])
```

## Editor Interface

### `contentType.changeFieldControl(fieldId, widgetNamespace, widgetId[, settings])`

Sets the UI widget for a field.

**Widget namespaces:**
- `builtin` — standard Contentful widgets
- `extension` — UI extensions (installed separately)
- `app` — custom Contentful apps

### Built-in Widgets

| Widget ID | Field types | Settings |
|-----------|-------------|----------|
| `singleLine` | Symbol | `helpText` |
| `urlEditor` | Symbol | `helpText` |
| `slugEditor` | Symbol | `helpText`, `trackingFieldId` |
| `dropdown` | Symbol, Integer, Number | `helpText` |
| `radio` | Symbol, Integer, Number | `helpText` |
| `tagEditor` | Symbol (Array) | `helpText` |
| `listInput` | Symbol (Array) | `helpText` |
| `checkbox` | Symbol (Array) | `helpText` |
| `multipleLine` | Text | `helpText` |
| `markdown` | Text | `helpText` |
| `richTextEditor` | RichText | `helpText` |
| `numberEditor` | Integer, Number | `helpText` |
| `rating` | Integer, Number | `helpText`, `stars` (default: 5) |
| `boolean` | Boolean | `helpText`, `trueLabel`, `falseLabel` |
| `datePicker` | Date | `helpText`, `format` (`dateonly`, `time`, `timeZ`), `ampm` (`12`, `24`) |
| `locationEditor` | Location | `helpText` |
| `objectEditor` | Object | `helpText` |
| `entryLinkEditor` | Link (Entry) | `helpText`, `showCreateEntityAction`, `showLinkEntityAction` |
| `entryLinksEditor` | Array (Entry) | `helpText`, `bulkEditing`, `showCreateEntityAction`, `showLinkEntityAction` |
| `entryCardEditor` | Link (Entry) | `helpText`, `showCreateEntityAction`, `showLinkEntityAction` |
| `entryCardsEditor` | Array (Entry) | `helpText`, `bulkEditing`, `showCreateEntityAction`, `showLinkEntityAction` |
| `assetLinkEditor` | Link (Asset) | `helpText`, `showCreateEntityAction`, `showLinkEntityAction` |
| `assetLinksEditor` | Array (Asset) | `helpText`, `showCreateEntityAction`, `showLinkEntityAction` |
| `assetGalleryEditor` | Array (Asset) | `helpText` |

### `contentType.resetFieldControl(fieldId)`

Resets a field to its default widget.

### `contentType.copyFieldControl(sourceFieldId, destinationFieldId)`

Copies widget settings from one field to another.

## Editor Layouts

Editor layouts let you organize fields into tabs and collapsible sections.

### `contentType.createEditorLayout()`

Creates an editor layout. Returns an `EditorLayout` object.

### `editorLayout.createFieldGroup(id[, opts])`

Creates a field group (tab or section). Options: `name` (string).

### `editorLayout.editFieldGroup(id[, opts])`

Edits an existing field group.

### `editorLayout.deleteFieldGroup(id)`

Deletes a field group.

### `editorLayout.changeFieldGroupId(currentId, newId)`

Renames a field group.

### `editorLayout.changeFieldGroupControl(groupId, widgetNamespace, widgetId[, settings])`

Configures how a field group renders.

**Built-in group widgets:**
- `topLevelTab` — renders as a tab. Settings: `helpText`.
- `fieldset` — renders as a collapsible section. Settings: `helpText`, `collapsible` (boolean), `collapsedByDefault` (boolean).

### Moving Fields in Layouts

`editorLayout.moveField(fieldId)` returns an `EditorLayoutMovement` with:
- `.toTheTopOfFieldGroup(groupId?)` — move to top of group
- `.toTheBottomOfFieldGroup(groupId?)` — move to bottom of group
- `.beforeField(fieldId)` — before a specific field
- `.afterField(fieldId)` — after a specific field
- `.beforeFieldGroup(groupId)` — before a field group
- `.afterFieldGroup(groupId)` — after a field group

```typescript
const layout = page.createEditorLayout()

layout.createFieldGroup('content', { name: 'Content' })
layout.changeFieldGroupControl('content', 'builtin', 'topLevelTab')

layout.createFieldGroup('seo', { name: 'SEO' })
layout.changeFieldGroupControl('seo', 'builtin', 'topLevelTab')

layout.createFieldGroup('openGraph', { name: 'Open Graph' })
layout.changeFieldGroupControl('openGraph', 'builtin', 'fieldset', {
  helpText: 'Social sharing metadata',
  collapsedByDefault: true,
})

layout.moveField('title').toTheTopOfFieldGroup('content')
layout.moveField('body').afterField('title')
layout.moveField('metaTitle').toTheTopOfFieldGroup('seo')
layout.moveField('ogImage').toTheTopOfFieldGroup('openGraph')
```

## Sidebar Widgets

### `contentType.addSidebarWidget(widgetNamespace, widgetId[, settings, insertBeforeWidgetId])`

Adds a widget to the sidebar. Widget namespaces: `sidebar-builtin`, `extension`.

### `contentType.updateSidebarWidget(widgetNamespace, widgetId, settings)`

Updates an existing sidebar widget's settings.

### `contentType.removeSidebarWidget(widgetNamespace, widgetId)`

Removes a widget from the sidebar.

### `contentType.resetSidebarToDefault()`

Resets sidebar to default configuration.

```typescript
const page = migration.editContentType('page')
page.addSidebarWidget('sidebar-builtin', 'publication-widget')
page.addSidebarWidget('extension', 'translationExtension', {
  sourceLocale: 'en-US',
})
page.removeSidebarWidget('sidebar-builtin', 'versions-widget')
```

## Tags

### `migration.createTag(id[, opts, visibility])`

Creates a tag. Options: `name` (string). Visibility: `'public'` (default) or `'private'`.

### `migration.editTag(id[, opts])`

Edits an existing tag.

### `migration.deleteTag(id)`

Deletes a tag. Works even if the tag is attached to entries or assets.

### `migration.setTagsForEntries(config)`

Assigns tags to entries based on field values.

- `contentType` (required) — content type ID
- `from` (required) — array of field IDs to read
- `setTagsForEntry` (required) — `(entryFields, currentTags, allTags) => ITagLink[]`

```typescript
migration.createTag('region-eu').name('Region: EU')
migration.createTag('region-us').name('Region: US')

migration.setTagsForEntries({
  contentType: 'office',
  from: ['region'],
  setTagsForEntry: (fields, currentTags, allTags) => {
    const region = fields.region['en-US']
    const tagId = region === 'Europe' ? 'region-eu' : 'region-us'
    const newTag = allTags.find((t) => t.sys.id === tagId)
    return [...currentTags, newTag!]
  },
})
```

## Annotations

### `contentType.setAnnotations(annotationIds)`

Sets annotations on a content type.

Available annotations:
- `Contentful:AggregateRoot`
- `Contentful:AggregateComponent`

### `field.setAnnotations(annotationIds[, opts])`

Sets annotations on a field. Options: `parameters` (object with `appFunctionId`, `appDefinitionId`).

Available field annotations:
- `Contentful:GraphQLFieldResolver`

### `contentType.clearAnnotations()` / `field.clearAnnotations()`

Removes all annotations.

```typescript
const page = migration.createContentType('page')
page.setAnnotations(['Contentful:AggregateRoot'])

const computed = page.createField('computed')
  .type('Symbol')
  .name('Computed Value')
computed.setAnnotations(['Contentful:GraphQLFieldResolver'], {
  parameters: { appFunctionId: 'func-123', appDefinitionId: 'app-456' },
})
```

## Taxonomy Validations

### `contentType.addTaxonomyValidation(id, linkType[, opts])`

Adds a taxonomy validation. `linkType`: `'TaxonomyConcept'` or `'TaxonomyConceptScheme'`. Options: `{ required: boolean }`.

### `contentType.clearTaxonomyValidations()`

Removes all taxonomy validations.

### `contentType.setTaxonomyValidations(validations)`

Replaces all taxonomy validations.

```typescript
const article = migration.editContentType('article')
article.addTaxonomyValidation('topic-taxonomy', 'TaxonomyConcept', { required: true })
article.addTaxonomyValidation('content-category', 'TaxonomyConceptScheme')
```

Taxonomy concepts and schemes must already exist (create them via the web app or CMA).

## Context Object

The second parameter to the migration function provides:

### `context.makeRequest(config)`

Direct access to the Contentful Management API. Uses Axios-style configuration.

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = async (migration, { makeRequest }) => {
  const response = await makeRequest({
    method: 'GET',
    url: '/content_types?limit=100',
  })

  const contentTypes = response.items
}

export = migration
```

### `context.spaceId`

The current space ID (string).

### `context.accessToken`

The current management access token (string).

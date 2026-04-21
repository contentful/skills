# Migration Patterns

Common migration patterns with complete, ready-to-use examples.

## Table of Contents

- [Create a Content Type with Multiple Fields](#create-a-content-type-with-multiple-fields)
- [Add a Field to an Existing Content Type](#add-a-field-to-an-existing-content-type)
- [Rename a Field](#rename-a-field)
- [Change a Field Type](#change-a-field-type)
- [Add Validations to a Field](#add-validations-to-a-field)
- [Configure Rich Text](#configure-rich-text)
- [Set Up Reference Fields](#set-up-reference-fields)
- [Transform Entries](#transform-entries)
- [Derive Linked Entries](#derive-linked-entries)
- [Transform Entries to a Different Type](#transform-entries-to-a-different-type)
- [Configure Editor Interface](#configure-editor-interface)
- [Set Up Editor Layout with Tabs](#set-up-editor-layout-with-tabs)
- [Content Type with Localized Fields](#content-type-with-localized-fields)
- [Delete a Content Type Safely](#delete-a-content-type-safely)

## Create a Content Type with Multiple Fields

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  const blogPost = migration.createContentType('blogPost', {
    name: 'Blog Post',
    description: 'An article on the blog',
    displayField: 'title',
  })

  blogPost.createField('title')
    .name('Title')
    .type('Symbol')
    .required(true)

  blogPost.createField('slug')
    .name('Slug')
    .type('Symbol')
    .required(true)
    .validations([
      { unique: true },
      { regexp: { pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' } },
    ])

  blogPost.createField('body')
    .name('Body')
    .type('RichText')

  blogPost.createField('author')
    .name('Author')
    .type('Link')
    .linkType('Entry')
    .required(true)
    .validations([{ linkContentType: ['author'] }])

  blogPost.createField('heroImage')
    .name('Hero Image')
    .type('Link')
    .linkType('Asset')
    .validations([
      { linkMimetypeGroup: ['image'] },
      { assetImageDimensions: { width: { min: 800 } } },
    ])

  blogPost.createField('tags')
    .name('Tags')
    .type('Array')
    .items({
      type: 'Link',
      linkType: 'Entry',
      validations: [{ linkContentType: ['tag'] }],
    })

  blogPost.createField('publishDate')
    .name('Publish Date')
    .type('Date')
    .required(true)

  blogPost.changeFieldControl('slug', 'builtin', 'slugEditor', {
    trackingFieldId: 'title',
  })

  blogPost.changeFieldControl('publishDate', 'builtin', 'datePicker', {
    format: 'dateonly',
  })
}

export = migration
```

## Add a Field to an Existing Content Type

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  const blogPost = migration.editContentType('blogPost')

  blogPost.createField('excerpt')
    .name('Excerpt')
    .type('Text')
    .validations([{ size: { max: 300 } }])

  blogPost.moveField('excerpt').afterField('title')

  blogPost.changeFieldControl('excerpt', 'builtin', 'multipleLine', {
    helpText: 'Short summary for listing pages (max 300 characters)',
  })
}

export = migration
```

## Rename a Field

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  const page = migration.editContentType('page')
  page.changeFieldId('headline', 'title')
  page.editField('title').name('Title')
}

export = migration
```

Content is preserved — only the API ID changes. Update your code to use the new field ID.

## Change a Field Type

You cannot change a field's type directly. Instead: create a new field, transform data, then delete the old field.

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  const article = migration.editContentType('article')

  // Step 1: Create new Integer field
  article.createField('readTimeMinutes')
    .name('Read Time (minutes)')
    .type('Integer')
    .validations([{ range: { min: 1, max: 120 } }])

  // Step 2: Transform data from old Symbol field to new Integer field
  migration.transformEntries({
    contentType: 'article',
    from: ['readTime'],
    to: ['readTimeMinutes'],
    transformEntryForLocale: (fields, locale) => {
      const raw = fields.readTime?.[locale]
      if (!raw) return
      const parsed = parseInt(raw, 10)
      if (isNaN(parsed)) return
      return { readTimeMinutes: parsed }
    },
  })

  // Step 3: Delete old field
  article.deleteField('readTime')
}

export = migration
```

## Add Validations to a Field

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  const product = migration.editContentType('product')

  product.editField('sku').validations([
    { unique: true },
    { regexp: { pattern: '^[A-Z]{2}-\\d{6}$' } },
  ])

  product.editField('price').validations([
    { range: { min: 0 } },
  ])

  product.editField('category').validations([
    { in: ['Electronics', 'Clothing', 'Books', 'Home', 'Food'] },
  ])
}

export = migration
```

## Configure Rich Text

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  const article = migration.editContentType('article')

  article.createField('content')
    .name('Content')
    .type('RichText')
    .validations([
      {
        enabledNodeTypes: [
          'heading-2', 'heading-3', 'heading-4',
          'ordered-list', 'unordered-list',
          'blockquote', 'hyperlink',
          'embedded-entry-block',
          'embedded-asset-block',
          'table',
        ],
      },
      {
        enabledMarks: ['bold', 'italic', 'code'],
      },
      {
        nodes: {
          'embedded-entry-block': [{
            linkContentType: ['codeBlock', 'callout', 'imageGallery'],
          }],
          'embedded-entry-inline': [{
            linkContentType: ['inlineLink'],
          }],
        },
      },
    ])
}

export = migration
```

## Set Up Reference Fields

**Single reference:**

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  const page = migration.editContentType('page')

  page.createField('author')
    .name('Author')
    .type('Link')
    .linkType('Entry')
    .required(true)
    .validations([{ linkContentType: ['person'] }])
}

export = migration
```

**Multiple allowed content types:**

```typescript
page.createField('hero')
  .name('Hero Section')
  .type('Link')
  .linkType('Entry')
  .validations([{ linkContentType: ['heroBanner', 'heroVideo', 'heroSlider'] }])
```

**Array of references:**

```typescript
page.createField('sections')
  .name('Page Sections')
  .type('Array')
  .items({
    type: 'Link',
    linkType: 'Entry',
    validations: [{ linkContentType: ['textBlock', 'imageBlock', 'ctaBlock'] }],
  })
  .validations([{ size: { min: 1, max: 20 } }])
```

## Transform Entries

**Combine fields:**

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  migration.transformEntries({
    contentType: 'person',
    from: ['firstName', 'lastName'],
    to: ['fullName'],
    transformEntryForLocale: (fields, locale) => {
      const first = fields.firstName?.[locale] || ''
      const last = fields.lastName?.[locale] || ''
      if (!first && !last) return
      return { fullName: `${first} ${last}`.trim() }
    },
  })
}

export = migration
```

**Split a field:**

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  migration.transformEntries({
    contentType: 'address',
    from: ['fullAddress'],
    to: ['street', 'city', 'zip'],
    transformEntryForLocale: (fields, locale) => {
      const address = fields.fullAddress?.[locale]
      if (!address) return
      const parts = address.split(', ')
      return {
        street: parts[0] || '',
        city: parts[1] || '',
        zip: parts[2] || '',
      }
    },
  })
}

export = migration
```

**Conditionally update entries:**

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  migration.transformEntries({
    contentType: 'article',
    from: ['status'],
    to: ['status'],
    transformEntryForLocale: (fields, locale) => {
      const status = fields.status?.[locale]
      if (status === 'draft') return { status: 'in-review' }
      return
    },
    shouldPublish: 'preserve',
  })
}

export = migration
```

## Derive Linked Entries

Extract data from existing entries into new entries of a different content type, and link them.

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  // First: create the target content type
  const category = migration.createContentType('category', {
    name: 'Category',
    displayField: 'name',
  })
  category.createField('name').name('Name').type('Symbol').required(true)
  category.createField('slug').name('Slug').type('Symbol').required(true)

  // Second: add a reference field to the source content type
  const article = migration.editContentType('article')
  article.createField('categoryRef')
    .name('Category')
    .type('Link')
    .linkType('Entry')
    .validations([{ linkContentType: ['category'] }])

  // Third: derive entries and link them
  migration.deriveLinkedEntries({
    contentType: 'article',
    derivedContentType: 'category',
    from: ['categoryName'],
    toReferenceField: 'categoryRef',
    derivedFields: ['name', 'slug'],
    identityKey: async (fields) => {
      return fields.categoryName['en-US']
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
    },
    deriveEntryForLocale: async (fields, locale) => {
      if (locale !== 'en-US') return
      const name = fields.categoryName[locale]
      return {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      }
    },
  })
}

export = migration
```

The `identityKey` function deduplicates: entries with the same key produce one derived entry.

## Transform Entries to a Different Type

Move entries from one content type to another.

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  migration.transformEntriesToType({
    sourceContentType: 'legacyPost',
    targetContentType: 'article',
    from: ['title', 'body', 'author'],
    identityKey: (fields) =>
      fields.title['en-US'].toLowerCase().replace(/\s+/g, '-'),
    transformEntryForLocale: (fields, locale) => ({
      title: fields.title?.[locale],
      content: fields.body?.[locale],
      authorName: fields.author?.[locale],
    }),
    updateReferences: true,
    removeOldEntries: true,
    shouldPublish: 'preserve',
  })
}

export = migration
```

Options:
- `updateReferences` — updates Link fields pointing to old entries (does not support RichText references)
- `removeOldEntries` — deletes source entries after transform
- `entryIds` — limit to specific entry IDs

## Configure Editor Interface

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  const page = migration.editContentType('page')

  page.changeFieldControl('title', 'builtin', 'singleLine', {
    helpText: 'The page title shown in the browser tab',
  })

  page.changeFieldControl('slug', 'builtin', 'slugEditor', {
    trackingFieldId: 'title',
    helpText: 'URL path segment (auto-generated from title)',
  })

  page.changeFieldControl('status', 'builtin', 'dropdown')

  page.changeFieldControl('featured', 'builtin', 'boolean', {
    trueLabel: 'Featured',
    falseLabel: 'Not featured',
  })

  page.changeFieldControl('priority', 'builtin', 'rating', { stars: 5 })

  page.changeFieldControl('publishDate', 'builtin', 'datePicker', {
    format: 'dateonly',
    ampm: '24',
  })
}

export = migration
```

## Set Up Editor Layout with Tabs

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  const page = migration.editContentType('page')

  const layout = page.createEditorLayout()

  // Create tabs
  layout.createFieldGroup('content', { name: 'Content' })
  layout.changeFieldGroupControl('content', 'builtin', 'topLevelTab')

  layout.createFieldGroup('media', { name: 'Media' })
  layout.changeFieldGroupControl('media', 'builtin', 'topLevelTab')

  layout.createFieldGroup('seo', { name: 'SEO' })
  layout.changeFieldGroupControl('seo', 'builtin', 'topLevelTab')

  // Create a collapsible section inside the SEO tab
  layout.createFieldGroup('openGraph', { name: 'Open Graph' })
  layout.changeFieldGroupControl('openGraph', 'builtin', 'fieldset', {
    helpText: 'Social sharing metadata',
    collapsedByDefault: true,
  })

  // Move fields into tabs
  layout.moveField('title').toTheTopOfFieldGroup('content')
  layout.moveField('body').afterField('title')

  layout.moveField('heroImage').toTheTopOfFieldGroup('media')
  layout.moveField('gallery').afterField('heroImage')

  layout.moveField('metaTitle').toTheTopOfFieldGroup('seo')
  layout.moveField('metaDescription').afterField('metaTitle')
  layout.moveField('ogTitle').toTheTopOfFieldGroup('openGraph')
  layout.moveField('ogImage').afterField('ogTitle')
}

export = migration
```

## Content Type with Localized Fields

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = (migration) => {
  const product = migration.createContentType('product', {
    name: 'Product',
    displayField: 'name',
  })

  // Localized fields — different value per locale
  product.createField('name')
    .name('Name')
    .type('Symbol')
    .required(true)
    .localized(true)

  product.createField('description')
    .name('Description')
    .type('Text')
    .localized(true)

  // Non-localized fields — same value across all locales
  product.createField('sku')
    .name('SKU')
    .type('Symbol')
    .required(true)
    .validations([{ unique: true }])

  product.createField('price')
    .name('Price')
    .type('Number')
    .required(true)
}

export = migration
```

## Delete a Content Type Safely

Deleting a content type requires removing all entries and inbound references first.

```typescript
import type { MigrationFunction } from 'contentful-migration'

const migration: MigrationFunction = async (migration, { makeRequest }) => {
  // Step 1: Check for entries (optional safety check)
  const entries = await makeRequest({
    method: 'GET',
    url: '/entries?content_type=legacyWidget&limit=0',
  })

  if (entries.total > 0) {
    throw new Error(
      `Cannot delete legacyWidget: ${entries.total} entries still exist. ` +
      'Delete or migrate them first.'
    )
  }

  // Step 2: Remove reference fields pointing to this type from other content types
  const page = migration.editContentType('page')
  page.deleteField('legacyWidgetRef')

  // Step 3: Delete the content type
  migration.deleteContentType('legacyWidget')
}

export = migration
```

In practice, split this across multiple migrations:
1. Migration 1: Remove reference fields and transform/migrate entries
2. Migration 2: Delete the content type

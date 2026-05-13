# Localization

How to fetch content in specific locales via the Content Delivery API.

## Table of Contents
- [Locale Parameter](#locale-parameter)
- [All Locales](#all-locales)
- [Fallback Chains](#fallback-chains)
- [Querying by Locale](#querying-by-locale)
- [Available Locales](#available-locales)

## Locale Parameter

### Default Locale

Without the `locale` parameter, the API returns content in the space's default locale:

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id}" \
  -H "Authorization: Bearer {cda_token}"
```

Response fields contain resolved values directly:

```json
{
  "fields": {
    "title": "Hello World",
    "body": "Post content"
  }
}
```

### Specific Locale

Request content in a specific locale:

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id}?locale=de-DE" \
  -H "Authorization: Bearer {cda_token}"
```

```json
{
  "fields": {
    "title": "Hallo Welt",
    "body": "Beitragsinhalt"
  }
}
```

### Query with Locale

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/entries?content_type=blogPost&locale=fr-FR" \
  -H "Authorization: Bearer {cda_token}"
```

## All Locales

Use `locale=*` to get all locales in a single response:

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/entries/{entry_id}?locale=*" \
  -H "Authorization: Bearer {cda_token}"
```

Response fields become locale-keyed (same structure as CMA):

```json
{
  "fields": {
    "title": {
      "en-US": "Hello World",
      "de-DE": "Hallo Welt",
      "fr-FR": "Bonjour le monde"
    },
    "body": {
      "en-US": "English content",
      "de-DE": "German content"
    }
  }
}
```

Non-localized fields only appear under the default locale.

## Fallback Chains

Each locale can have a fallback locale configured in space settings. If content doesn't exist in the requested locale, Contentful returns the fallback locale's value instead.

Example fallback chain:
```
fr-FR → en-US → null
de-DE → en-US → null
ja-JP → en-US → null
```

If a German translation doesn't exist for a field, the English value is returned.

### Checking for Fallbacks

Use `locale=*` to see which locales actually have content:

```bash
curl "...?locale=*" -H "Authorization: Bearer {cda_token}"
```

If `fields.title` only has `{"en-US": "Hello"}` and no `de-DE` key, the German locale is using the English fallback.

## Querying by Locale

### Filter by localized field value

```bash
# Search German titles
curl "...?content_type=blogPost&locale=de-DE&fields.title[match]=Hallo" \
  -H "Authorization: Bearer {cda_token}"
```

### Full-text search

Full-text `query` searches all locales by default:

```bash
curl "...?content_type=blogPost&query=contentful" \
  -H "Authorization: Bearer {cda_token}"
```

Combine with `locale` to search within a specific locale:

```bash
curl "...?content_type=blogPost&locale=fr-FR&fields.title[match]=bonjour" \
  -H "Authorization: Bearer {cda_token}"
```

## Available Locales

### List Locales

```bash
curl "https://cdn.contentful.com/spaces/{space_id}/environments/master/locales" \
  -H "Authorization: Bearer {cda_token}"
```

Response:

```json
{
  "sys": { "type": "Array" },
  "items": [
    {
      "code": "en-US",
      "name": "English (United States)",
      "default": true,
      "fallbackCode": null
    },
    {
      "code": "de-DE",
      "name": "German (Germany)",
      "default": false,
      "fallbackCode": "en-US"
    },
    {
      "code": "fr-FR",
      "name": "French (France)",
      "default": false,
      "fallbackCode": "en-US"
    }
  ]
}
```

### Localized Assets

Assets can have different files per locale:

```bash
curl "...?locale=*" -H "Authorization: Bearer {cda_token}"
```

```json
{
  "fields": {
    "title": { "en-US": "User Guide", "de-DE": "Benutzerhandbuch" },
    "file": {
      "en-US": { "url": "//images.ctfassets.net/.../guide-en.pdf", "fileName": "guide-en.pdf" },
      "de-DE": { "url": "//images.ctfassets.net/.../guide-de.pdf", "fileName": "guide-de.pdf" }
    }
  }
}
```

## Best Practices

1. **Omit `locale` for default** — don't specify locale for the default language
2. **Use `locale=*` sparingly** — significantly increases response size
3. **Cache by locale** — implement separate caches per locale
4. **Check fallback chain** — understand your space's locale fallback configuration
5. **Use `/locales` endpoint** — fetch available locales dynamically rather than hardcoding

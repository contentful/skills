# Troubleshooting

## Preview content not appearing

- Verify `CONTENTFUL_PREVIEW_ACCESS_TOKEN` is set and non-empty.
- Ensure preview host is `preview.contentful.com` when Draft Mode is enabled.
- Ensure Draft Mode is actually enabled for the request.

## Published content appears in preview

- Check token switch logic (`preview ? PREVIEW_TOKEN : DELIVERY_TOKEN`).
- Check host switch logic (`preview ? "preview.contentful.com" : default`).
- Confirm query-level `preview` argument is used for GraphQL flows.

## Caching issues in preview

- Use non-cached fetch behavior for preview mode.
- Verify any framework-level cache layer is bypassed for Draft Mode requests.

## API auth errors

- Confirm space ID and token match the same space.
- Confirm token has access to the target environment.
- Prefer `Authorization: Bearer ...` over query-string token usage.

## Alias-related issues

- Verify `CONTENTFUL_ENVIRONMENT_ALIAS` points to an existing alias.
- Confirm the alias target is the expected environment for this deploy.
- If alias is not used, verify `CONTENTFUL_ENVIRONMENT_ID` matches intended environment.
- Confirm API key access includes the alias/target environment.

## Content Source Maps considerations

- Source maps are for preview-oriented authoring experiences.
- Hidden metadata can affect some string-like usages (for example URL-like or date-like values).
- If needed, decode/clean enhanced strings per SDK guidance.

## References

- `https://www.contentful.com/developers/docs/concepts/environment-aliases/`
- `https://www.contentful.com/developers/docs/tools/vercel/content-source-maps-with-vercel/`
- `https://www.contentful.com/developers/docs/tools/vercel/vercel-nextjs/`
- `https://www.contentful.com/developers/docs/tools/vercel/vercel-nextjs/using-draft-mode-to-fetch-unpublished-content-from-contentfuls-apis/`

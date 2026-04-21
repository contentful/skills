# Rendering Pipeline

This is the part that turns Contentful entries plus personalization data into rendered UI.

## Contentful Client Pattern

Use separate delivery and preview clients when preview mode exists.

```ts
const contentfulClient = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID ?? '',
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_TOKEN ?? '',
  environment: process.env.NEXT_PUBLIC_CONTENTFUL_ENVIRONMENT ?? 'master',
}).withoutUnresolvableLinks;

const previewClient = createClient({
  space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID ?? '',
  accessToken: process.env.NEXT_PUBLIC_CONTENTFUL_PREVIEW_TOKEN ?? '',
  host: 'preview.contentful.com',
}).withoutUnresolvableLinks;

const getClient = (preview: boolean) => (preview ? previewClient : contentfulClient);
```

Why this helps:

- delivery and preview content stay explicit
- unresolved links are removed instead of surprising the renderer

## Include Depth Matters

- Minimum useful include depth is usually `2`
- Complex page trees often use `10`

If experiences or variants fail to resolve, include depth is one of the first things to inspect.

## Personalizable Entry Shape

The baseline entry should contain `fields.nt_experiences`.

Those linked entries are mapped into the format expected by the SDK.

## Canonical Current-SDK Pattern

Use a component map plus renderer plus experience wrapper.

```tsx
const ContentTypeMap = {
  hero: Hero,
  cta: CTA,
  feature: Feature,
};

const ComponentRenderer = (props) => {
  const contentTypeId = props?.sys?.contentType?.sys?.id;
  const Component = ContentTypeMap[contentTypeId];
  if (!Component) return null;
  return <Component {...props} />;
};

const BlockRenderer = ({ block }) => {
  const experiences = (block.fields.nt_experiences || [])
    .filter(ExperienceMapper.isExperienceEntry)
    .map(ExperienceMapper.mapExperience);

  return (
    <Experience
      {...block}
      id={block.sys.id}
      component={ComponentRenderer}
      experiences={experiences}
      trackClicks
    />
  );
};
```

## Rendering Rules

1. Always map experiences from `nt_experiences` before rendering.
2. Keep baseline and variant props structurally compatible.
3. Prefer a central renderer over duplicating personalization logic in many components.
4. Unknown content types should fail safely, ideally with a warning rather than a crash.

## Merge Tags

Use merge tags for inline personalization.

- CMS-authored path: `nt_mergetag` embedded in rich text
- developer-authored path: direct `MergeTag` component usage in JSX

## Preview Data Requirements

If preview tooling is enabled, fetch:

- all relevant experiences
- all relevant audiences

Preview setup is incomplete if the provider has no preview data to work with.

## New SDK Mental Model

If the customer chooses `@contentful/optimization`, the personalized rendering primitive changes from `<Experience>` to `<OptimizedEntry>`.

The architectural idea is the same:

- baseline Contentful entry
- optimization metadata
- deterministic renderer
- one clear wrapper around personalizable content

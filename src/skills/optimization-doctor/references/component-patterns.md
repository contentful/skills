# Personalization Component Patterns

## Experience Component

Wraps a component to show different variants based on audience targeting:

```tsx
import { Experience } from '@ninetailed/experience.js-next';

<Experience
  id={entry.sys.id}
  component={HeroBanner}
  experiences={entry.fields.nt_experiences}
  {...entry.fields}
/>
```

## Personalize Component

Alternative API for inline personalization:

```tsx
import { Personalize } from '@ninetailed/experience.js-next';

<Personalize
  id={entry.sys.id}
  component={CTAButton}
  variants={entry.fields.nt_experiences}
/>
```

## ExperienceMapper

Maps Contentful entries to experience-ready props. Used in data fetching:

```ts
import { ExperienceMapper } from '@ninetailed/experience.js-next/mappers';

const mappedExperiences = ExperienceMapper.mapExperiences(entry.fields.nt_experiences);
```

## BlockRenderer / ContentTypeMap

Maps Contentful content types to React components for dynamic rendering:

```tsx
const componentMap = {
  heroBanner: HeroBanner,
  ctaButton: CTAButton,
  featureGrid: FeatureGrid,
};

function BlockRenderer({ block, ...props }) {
  const Component = componentMap[block.sys.contentType.sys.id];
  if (!Component) return null;
  return <Component {...block.fields} {...props} />;
}
```

## Common Issues

- Missing `nt_experiences` field on Contentful content types (content model not configured)
- Component mapper doesn't include all personalized content types
- Using raw entry data without ExperienceMapper (experiences won't resolve)
- Passing wrong props shape to Experience component

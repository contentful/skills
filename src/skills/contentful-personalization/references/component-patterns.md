# Component Patterns

Concrete examples of what a "ready" codebase looks like vs common problems.

## Good Pattern: ContentTypeMap + BlockRenderer

The standard Ninetailed pattern. Found in all official playgrounds and demos.

```typescript
// components/Renderer/BlockRenderer.tsx

const ContentTypeMap = {
  hero: Hero,
  cta: CTA,
  feature: Feature,
  banner: Banner,
  pricingTable: PricingTable,
};

const BlockRenderer = ({ block }) => {
  const contentTypeId = block.sys.contentType.sys.id;
  const Component = ContentTypeMap[contentTypeId];
  if (!Component) return null;

  // Extract experiences from the Contentful entry
  const experiences = (block.fields.nt_experiences || [])
    .filter(ExperienceMapper.isExperienceEntry)
    .map(ExperienceMapper.mapExperience);

  // Wrap with Experience component for personalization
  return (
    <Experience
      {...block}
      id={block.sys.id}
      component={ComponentRenderer}
      experiences={experiences}
    />
  );
};
```

**Why this works**: Each content type maps to a self-contained component.
The `<Experience>` wrapper can swap the baseline entry for a variant entry,
and the same component renders both. The component doesn't know or care
whether it's showing the baseline or a variant.

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

## Good Pattern: Page-Level Data Fetching with ISR

```typescript
// pages/[[...slug]].tsx
export const getStaticProps = async ({ params }) => {
  const [page, experiences, audiences] = await Promise.all([
    getPage({ slug: params.slug }),
    getAllExperiences(),
    getAllAudiences(),
  ]);

  return {
    props: {
      page,
      ninetailed: { preview: { experiences, audiences } },
    },
    revalidate: 5,
  };
};
```

**Why this works**: All content fetched at the page level, passed down as
props. ISR keeps content fresh without rebuilding. Experiences and audiences
fetched in parallel for the preview plugin.

## Good Pattern: Isolated Component

```typescript
// components/Hero/Hero.tsx
const Hero = ({ fields }) => (
  <section>
    <h1>{fields.headline}</h1>
    <p>{fields.subheadline}</p>
    <Button href={fields.ctaLink}>{fields.ctaText}</Button>
    {fields.image && <Image src={fields.image.fields.file.url} />}
  </section>
);
```

**Why this works**: Pure props to JSX. No internal state, no data fetching,
no side effects. The `<Experience>` wrapper can swap the entire entry and
the component renders the variant's fields identically.

## Problem Pattern: Component-Level Data Fetching

```typescript
// BAD: Component fetches its own data
const Hero = ({ entryId }) => {
  const [entry, setEntry] = useState(null);
  useEffect(() => {
    contentfulClient.getEntry(entryId).then(setEntry);
  }, [entryId]);

  if (!entry) return <Skeleton />;
  return <h1>{entry.fields.headline}</h1>;
};
```

**Why this breaks**: The `<Experience>` wrapper provides variant data via
props, but this component ignores props and fetches its own data. Swapping
the entry ID isn't enough because the component still shows loading state.

**Fix**: Move data fetching to the page level. Pass the full entry as props.

## Problem Pattern: Hardcoded Content

```typescript
// BAD: Content is hardcoded, not from Contentful
const Hero = () => (
  <section>
    <h1>Welcome to Our Platform</h1>
    <p>The best solution for your needs</p>
    <Button href="/signup">Get Started</Button>
  </section>
);
```

**Why this breaks**: Nothing to personalize -- the content isn't dynamic.
You can't swap "Welcome to Our Platform" for a targeted variant because
there's no Contentful entry backing it.

**Fix**: Create a Contentful content type for this component, migrate the
content to Contentful entries, and render from entry fields.

## Problem Pattern: Tightly Coupled Components

```typescript
// BAD: Component depends on parent's data structure
const ProductSection = ({ pageData }) => {
  const products = pageData.sections[2].products;
  const hero = pageData.sections[0];
  return (
    <div>
      <h2>{hero.title}</h2>
      {products.map(p => <ProductCard key={p.id} {...p} />)}
    </div>
  );
};
```

**Why this breaks**: The component reaches into specific indices of the
parent's data structure. It can't be wrapped independently because it
depends on the full page data, not just its own entry.

**Fix**: Each component should receive only its own content as props.
The page renders a list of components, each receiving its own entry.

## Problem Pattern: No Component Mapper

```typescript
// BAD: Components rendered manually in pages
const HomePage = ({ page }) => (
  <>
    <Hero data={page.fields.heroSection} />
    <Features data={page.fields.featuresSection} />
    <Pricing data={page.fields.pricingSection} />
    <Footer />
  </>
);
```

**Why this is harder**: Without a mapper, each personalizable component
needs its own `<Experience>` wrapper added manually in every page that
uses it. A mapper centralizes this in one place.

**Fix**: Introduce a `BlockRenderer` that maps content type IDs to components.
The page renders a list of blocks through the renderer instead of hardcoding
each section.

## Identifying Personalizable Content Types

Not all content types need personalization. Focus on:

1. **Above-the-fold content**: heroes, banners, main headings
2. **Conversion elements**: CTAs, pricing tables, signup forms
3. **Feature highlights**: feature lists, value propositions
4. **Navigation elements**: menus with personalized links (advanced)

Content types that rarely need personalization:
- Footer (same for everyone)
- Legal text, terms of service
- Site-wide navigation (unless doing nav personalization)
- Metadata-only entries (SEO, redirects)

## Common Issues

- Missing `nt_experiences` field on Contentful content types (content model not configured)
- Component mapper doesn't include all personalized content types
- Using raw entry data without ExperienceMapper (experiences won't resolve)
- Passing wrong props shape to Experience component

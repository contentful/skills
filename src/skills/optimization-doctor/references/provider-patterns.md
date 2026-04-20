# NinetailedProvider Configuration Patterns

## Next.js App Router

Provider goes in the root layout (`app/layout.tsx`):

```tsx
import { NinetailedProvider } from '@ninetailed/experience.js-next';
import { NinetailedInsightsPlugin } from '@ninetailed/experience.js-plugin-insights';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NinetailedProvider
          clientId={process.env.NEXT_PUBLIC_NINETAILED_API_KEY!}
          environment={process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT}
          plugins={[new NinetailedInsightsPlugin()]}
        >
          {children}
        </NinetailedProvider>
      </body>
    </html>
  );
}
```

## Next.js Pages Router

Provider goes in `pages/_app.tsx`:

```tsx
import { NinetailedProvider } from '@ninetailed/experience.js-next';

export default function App({ Component, pageProps }) {
  return (
    <NinetailedProvider
      clientId={process.env.NEXT_PUBLIC_NINETAILED_API_KEY!}
    >
      <Component {...pageProps} />
    </NinetailedProvider>
  );
}
```

## Common Issues

- Provider placed too deep in the tree (must wrap all personalized content)
- Missing `clientId` prop (API key not passed or env var undefined)
- Plugins array empty when analytics is expected
- Using `apiKey` prop instead of `clientId` (older SDK versions)
- Provider rendered only on some pages instead of globally

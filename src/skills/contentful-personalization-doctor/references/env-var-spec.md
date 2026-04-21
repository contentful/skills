# Environment Variable Specification

## Required Variables

| Variable | Format | Description |
|----------|--------|-------------|
| `NINETAILED_API_KEY` | `nt_production_*` or `nt_development_*` | Ninetailed API key. Prefix indicates environment type. |
| `CONTENTFUL_SPACE_ID` | Alphanumeric string | Contentful space identifier |
| `CONTENTFUL_ACCESS_TOKEN` | Alphanumeric string | Contentful Delivery or Preview API token |

## Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NINETAILED_ENVIRONMENT` | `main` | Ninetailed environment name. Usually `main` for production. |

## Next.js Public Prefix

Next.js requires `NEXT_PUBLIC_` prefix for client-side variables:
- `NEXT_PUBLIC_NINETAILED_API_KEY`
- `NEXT_PUBLIC_NINETAILED_ENVIRONMENT`
- `NEXT_PUBLIC_CONTENTFUL_SPACE_ID`

Server-only variables (e.g., `CONTENTFUL_ACCESS_TOKEN`) should NOT use the `NEXT_PUBLIC_` prefix.

## Common Mistakes

- Using `NINETAILED_KEY` instead of `NINETAILED_API_KEY`
- Missing `NEXT_PUBLIC_` prefix in Next.js (key won't be available client-side)
- Duplicate definitions across `.env` and `.env.local` with conflicting values
- Trailing whitespace or quotes in `.env` values
- Using a production key in development or vice versa

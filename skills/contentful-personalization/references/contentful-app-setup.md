# Contentful App Setup

Do this before wiring the SDK in code.

## What the App Setup Does

The Contentful Personalization app prepares the CMS side of personalization.
Without it, the frontend SDK has nothing useful to read.

The app setup is responsible for:

- connecting the Contentful environment to a personalization data bucket
- installing the personalization content types
- extending selected content types with `nt_experiences`

## Prerequisite

- The customer needs access to the Contentful Personalization product.

## Installation Checklist

1. Open Contentful.
2. Go to `Apps` -> `Marketplace`.
3. Search for `Contentful Personalization`.
4. Install the app into the correct Contentful environment.
5. Authorize access.
6. Open the app configuration screen.
7. Choose the correct data bucket.
8. Select the content types that should become personalizable.
9. Save the configuration.

## API Key / Client ID

The Client ID is found in **Organization settings** > **Optimization** > **Data sources and metrics** > **SDK keys**. Copy it during installation so the frontend SDK can connect to the correct data bucket.

## Data Bucket Guidance

- `Main`: production-oriented bucket
- `Development`: non-production bucket for implementation and QA

Use the bucket that matches the environment the customer is configuring.

## Content Types Installed by the App

### `nt_experience`

Defines experiments and personalizations.

### `nt_audience`

Defines audience targeting rules.

### `nt_mergetag`

Defines inline personalization values that can be embedded in rich text or rendered in JSX.

## What the App Adds to Existing Content Types

Selected content types get an `nt_experiences` field.

That field links baseline entries to one or more `nt_experience` entries.

Without `nt_experiences`, the renderer has no experience configuration to map.

## What to Explain to Customers

- Personalization setup is both a CMS task and a code task.
- Editors attach experiences in Contentful; the frontend renders the resolved baseline or variant.
- Merge tags are for inline personalization, not full component swapping.

## Minimum CMS Verification

Before leaving the CMS setup, confirm:

1. The app is installed in the correct environment.
2. The correct data bucket is selected.
3. The intended content types now have `nt_experiences`.
4. Editors can create or view `nt_experience`, `nt_audience`, and `nt_mergetag` entries.

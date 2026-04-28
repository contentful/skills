import { z, action } from '@contentful/skill-kit';
import { ContentInspectionResult, type Finding } from '../schemas.js';

const API_TIMEOUT_MS = 10_000;

interface EntryApiState {
  found: boolean;
  hasNtExperiences: boolean;
  ntExperiencesCount: number;
  experiencesResolved: boolean;
  variantsResolved: boolean;
}

function isResolvedEntry(item: unknown): boolean {
  return (
    typeof item === 'object' &&
    item !== null &&
    'fields' in item &&
    'sys' in item
  );
}

function isUnresolvedLink(item: unknown): boolean {
  if (typeof item !== 'object' || item === null) return false;
  const sys = (item as Record<string, unknown>).sys;
  if (typeof sys !== 'object' || sys === null) return false;
  return (sys as Record<string, unknown>).type === 'Link';
}

function analyzeEntry(json: Record<string, unknown>): {
  state: EntryApiState;
  contentTypeId?: string;
  unresolvedExperienceCount: number;
  unresolvedVariantDetails: Array<{ experienceId: string; unresolved: number; total: number }>;
} {
  const sys = json.sys as Record<string, unknown> | undefined;
  const fields = json.fields as Record<string, unknown> | undefined;
  const contentTypeId = (sys?.contentType as Record<string, unknown>)?.sys
    ? ((sys?.contentType as Record<string, unknown>).sys as Record<string, unknown>).id as string
    : undefined;

  if (!fields) {
    return {
      state: { found: true, hasNtExperiences: false, ntExperiencesCount: 0, experiencesResolved: false, variantsResolved: false },
      contentTypeId,
      unresolvedExperienceCount: 0,
      unresolvedVariantDetails: [],
    };
  }

  const ntExperiences = fields.nt_experiences;
  const hasField = ntExperiences !== undefined;
  const isArray = Array.isArray(ntExperiences);
  const count = isArray ? ntExperiences.length : 0;

  if (!hasField || !isArray || count === 0) {
    return {
      state: { found: true, hasNtExperiences: hasField, ntExperiencesCount: 0, experiencesResolved: false, variantsResolved: false },
      contentTypeId,
      unresolvedExperienceCount: 0,
      unresolvedVariantDetails: [],
    };
  }

  const resolvedExperiences = ntExperiences.filter(isResolvedEntry);
  const unresolvedLinks = ntExperiences.filter(isUnresolvedLink);
  const experiencesResolved = resolvedExperiences.length > 0 && unresolvedLinks.length === 0;

  let variantsResolved = true;
  const unresolvedVariantDetails: Array<{ experienceId: string; unresolved: number; total: number }> = [];
  for (const exp of resolvedExperiences) {
    const expFields = (exp as Record<string, unknown>).fields as Record<string, unknown> | undefined;
    const variants = expFields?.nt_variants;
    if (!Array.isArray(variants) || variants.length === 0) continue;
    const unresolvedVariants = variants.filter(isUnresolvedLink);
    if (unresolvedVariants.length > 0) {
      variantsResolved = false;
      const expSys = (exp as Record<string, unknown>).sys as Record<string, unknown>;
      unresolvedVariantDetails.push({
        experienceId: (expSys?.id as string) ?? 'unknown',
        unresolved: unresolvedVariants.length,
        total: variants.length,
      });
    }
  }

  return {
    state: {
      found: true,
      hasNtExperiences: true,
      ntExperiencesCount: count,
      experiencesResolved,
      variantsResolved,
    },
    contentTypeId,
    unresolvedExperienceCount: unresolvedLinks.length,
    unresolvedVariantDetails,
  };
}

function synthesizeFindings(
  cda: ReturnType<typeof analyzeEntry> | undefined,
  cpa: ReturnType<typeof analyzeEntry> | undefined,
  cdaError: Finding | undefined,
  cpaError: Finding | undefined,
): Finding[] {
  const findings: Finding[] = [];

  if (cdaError) findings.push(cdaError);
  if (cpaError) findings.push(cpaError);

  const hasBothApis = cda && cpa;
  const cdaFound = cda?.state.found ?? false;
  const cpaFound = cpa?.state.found ?? false;

  // Entry not published at all
  if (hasBothApis && !cdaFound && cpaFound) {
    findings.push({
      item: 'Entry publishing',
      status: 'fail',
      detail: 'Entry exists in preview (draft) but not in published content — publish the entry to make it available via the Delivery API',
    });
    return findings;
  }

  // Entry not found anywhere
  if ((cda && !cdaFound) && (cpa && !cpaFound)) {
    findings.push({
      item: 'Entry lookup',
      status: 'fail',
      detail: 'Entry not found in either the Delivery API or Preview API — check that the entry ID is correct',
    });
    return findings;
  }

  // CDA only, entry not found
  if (cda && !cdaFound && !cpa) {
    findings.push({
      item: 'Entry lookup',
      status: 'fail',
      detail: 'Entry not found in published content — it may not be published yet. Provide a Preview API token to check if it exists in draft.',
    });
    return findings;
  }

  // Analyze nt_experiences field presence
  const cdaHasField = cda?.state.hasNtExperiences ?? false;
  const cpaHasField = cpa?.state.hasNtExperiences ?? false;
  const cdaCount = cda?.state.ntExperiencesCount ?? 0;
  const cpaCount = cpa?.state.ntExperiencesCount ?? 0;

  if (hasBothApis && !cdaHasField && cpaHasField && cpaCount > 0) {
    findings.push({
      item: 'Unpublished personalization changes',
      status: 'fail',
      detail: `The entry has ${cpaCount} experience(s) attached in preview, but the published version does not include the nt_experiences field. The entry needs to be republished after the experiences were added.`,
    });
  } else if (hasBothApis && cdaHasField && cdaCount === 0 && cpaCount > 0) {
    findings.push({
      item: 'Unpublished personalization changes',
      status: 'fail',
      detail: `The entry has ${cpaCount} experience(s) in preview but 0 in published content. Republish the entry to make the experiences available.`,
    });
  } else if (hasBothApis && cdaCount > 0 && cpaCount > cdaCount) {
    findings.push({
      item: 'Unpublished personalization changes',
      status: 'fail',
      detail: `Published content has ${cdaCount} experience(s) but preview has ${cpaCount}. Republish the entry to include the new experiences.`,
    });
  } else if (!cdaHasField && !cpaHasField) {
    const source = cda ? 'published content' : 'preview content';
    findings.push({
      item: 'Content type extension',
      status: 'fail',
      detail: `The nt_experiences field does not exist on this entry in ${source}. The content type has not been extended with personalization — open the Contentful Personalization app and add this content type to the personalizable types.`,
    });
  } else if (cdaHasField && cdaCount === 0 && (!cpa || cpaCount === 0)) {
    findings.push({
      item: 'Experience attachment',
      status: 'warn',
      detail: 'The nt_experiences field exists but is empty — no experiences are attached to this entry. Create an experience in the Contentful Personalization app and link it to this entry.',
    });
  }

  // Analyze experience resolution (only meaningful when we have experiences)
  const primaryApi = cda?.state.found ? cda : cpa;
  const primaryLabel = cda?.state.found ? 'published' : 'preview';
  if (primaryApi && primaryApi.state.ntExperiencesCount > 0) {
    if (!primaryApi.state.experiencesResolved) {
      const unresolvedCount = primaryApi === cda ? cda!.unresolvedExperienceCount : cpa!.unresolvedExperienceCount;
      findings.push({
        item: 'Experience entries',
        status: 'fail',
        detail: `${unresolvedCount} of ${primaryApi.state.ntExperiencesCount} experience(s) in ${primaryLabel} content are unresolved — the experience entries are not published. Publish all nt_experience entries, then republish this baseline entry.`,
      });
    } else {
      findings.push({
        item: 'Experience entries',
        status: 'pass',
        detail: `${primaryApi.state.ntExperiencesCount} experience(s) in ${primaryLabel} content are fully resolved`,
      });
    }

    // Variant resolution
    const variantDetails = primaryApi === cda ? cda!.unresolvedVariantDetails : cpa!.unresolvedVariantDetails;
    if (!primaryApi.state.variantsResolved && variantDetails.length > 0) {
      for (const v of variantDetails) {
        findings.push({
          item: `Variant entries (experience ${v.experienceId})`,
          status: 'fail',
          detail: `${v.unresolved} of ${v.total} variant(s) are not published. Publish the variant entries, then republish the experience entry.`,
        });
      }
    } else if (primaryApi.state.experiencesResolved) {
      findings.push({
        item: 'Variant entries',
        status: 'pass',
        detail: 'All variants in resolved experiences are fully resolved',
      });
    }
  }

  // Cross-API resolution comparison
  if (hasBothApis && cdaCount > 0 && cpaCount > 0) {
    if (cpa!.state.experiencesResolved && !cda!.state.experiencesResolved) {
      findings.push({
        item: 'Experience publishing',
        status: 'fail',
        detail: 'Experiences resolve in preview but not in published content — the experience entries need to be published',
      });
    }
    if (cpa!.state.variantsResolved && !cda!.state.variantsResolved && cda!.state.experiencesResolved) {
      findings.push({
        item: 'Variant publishing',
        status: 'fail',
        detail: 'Variants resolve in preview but not in published content — the variant entries need to be published',
      });
    }
    if (
      cda!.state.experiencesResolved && cda!.state.variantsResolved &&
      cpa!.state.experiencesResolved && cpa!.state.variantsResolved
    ) {
      findings.push({
        item: 'Publishing state',
        status: 'pass',
        detail: 'Published and preview content are consistent — all experiences and variants are resolved in both',
      });
    }
  }

  return findings;
}

async function fetchEntry(
  host: string,
  spaceId: string,
  environment: string,
  entryId: string,
  token: string,
  includeDepth: number,
  parentSignal: AbortSignal,
): Promise<{ json?: Record<string, unknown>; httpStatus: number; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  parentSignal.addEventListener('abort', () => controller.abort());

  try {
    const url = `https://${host}/spaces/${spaceId}/environments/${environment}/entries/${entryId}?access_token=${token}&include=${includeDepth}`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const json = (await res.json()) as Record<string, unknown>;
      return { json, httpStatus: res.status };
    }
    return { httpStatus: res.status };
  } catch (err) {
    clearTimeout(timeout);
    return { httpStatus: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

export const inspectContent = action({
  name: 'inspect-content',
  input: z.object({
    spaceId: z.string(),
    environment: z.string().default('master'),
    accessToken: z.string().optional(),
    previewToken: z.string().optional(),
    entryId: z.string(),
    includeDepth: z.number().default(3),
  }),
  output: ContentInspectionResult,
  run: async ({ input, signal }) => {
    if (!input.accessToken && !input.previewToken) {
      return {
        status: 'skip' as const,
        findings: [{ item: 'Content Inspection', status: 'skip' as const, detail: 'No Contentful API tokens provided' }],
        entry: { id: input.entryId },
      };
    }

    let cdaAnalysis: ReturnType<typeof analyzeEntry> | undefined;
    let cpaAnalysis: ReturnType<typeof analyzeEntry> | undefined;
    let cdaError: Finding | undefined;
    let cpaError: Finding | undefined;

    if (input.accessToken) {
      const { json, httpStatus, error } = await fetchEntry(
        'cdn.contentful.com', input.spaceId, input.environment, input.entryId,
        input.accessToken, input.includeDepth, signal,
      );

      if (error) {
        cdaError = { item: 'Delivery API connectivity', status: 'fail' as const, detail: `Network error: ${error}` };
      } else if (httpStatus === 401 || httpStatus === 403) {
        cdaError = { item: 'Delivery API authentication', status: 'fail' as const, detail: `CDA token rejected (HTTP ${httpStatus}) — check that the token is a valid Content Delivery API token` };
      } else if (httpStatus === 404) {
        cdaAnalysis = {
          state: { found: false, hasNtExperiences: false, ntExperiencesCount: 0, experiencesResolved: false, variantsResolved: false },
          unresolvedExperienceCount: 0,
          unresolvedVariantDetails: [],
        };
      } else if (json) {
        cdaAnalysis = analyzeEntry(json);
      } else {
        cdaError = { item: 'Delivery API', status: 'fail' as const, detail: `Unexpected HTTP ${httpStatus}` };
      }
    }

    if (input.previewToken) {
      const { json, httpStatus, error } = await fetchEntry(
        'preview.contentful.com', input.spaceId, input.environment, input.entryId,
        input.previewToken, input.includeDepth, signal,
      );

      if (error) {
        cpaError = { item: 'Preview API connectivity', status: 'fail' as const, detail: `Network error: ${error}` };
      } else if (httpStatus === 401 || httpStatus === 403) {
        cpaError = { item: 'Preview API authentication', status: 'fail' as const, detail: `CPA token rejected (HTTP ${httpStatus}) — check that the token is a valid Content Preview API token` };
      } else if (httpStatus === 404) {
        cpaAnalysis = {
          state: { found: false, hasNtExperiences: false, ntExperiencesCount: 0, experiencesResolved: false, variantsResolved: false },
          unresolvedExperienceCount: 0,
          unresolvedVariantDetails: [],
        };
      } else if (json) {
        cpaAnalysis = analyzeEntry(json);
      } else {
        cpaError = { item: 'Preview API', status: 'fail' as const, detail: `Unexpected HTTP ${httpStatus}` };
      }
    }

    const findings = synthesizeFindings(cdaAnalysis, cpaAnalysis, cdaError, cpaError);

    const comparison = (cdaAnalysis && cpaAnalysis)
      ? {
          hasUnpublishedChanges: findings.some((f) => f.item.includes('Unpublished') || f.item.includes('publishing')),
          detail: findings.find((f) => f.item.includes('Unpublished'))?.detail ?? 'No unpublished changes detected',
        }
      : undefined;

    const hasCritical = findings.some((f) => f.status === 'fail');
    const hasWarning = findings.some((f) => f.status === 'warn');
    const status = hasCritical ? 'fail' as const : hasWarning ? 'warn' as const : 'pass' as const;

    return {
      status,
      findings,
      entry: {
        id: input.entryId,
        contentTypeId: cdaAnalysis?.contentTypeId ?? cpaAnalysis?.contentTypeId,
        cda: cdaAnalysis?.state,
        cpa: cpaAnalysis?.state,
        comparison,
      },
    };
  },
});

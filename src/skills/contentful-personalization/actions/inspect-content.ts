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

interface FetchResult {
  state: EntryApiState;
  contentTypeId?: string;
  findings: Finding[];
  error?: string;
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

function inspectEntryResponse(json: Record<string, unknown>, label: string): FetchResult {
  const findings: Finding[] = [];
  const sys = json.sys as Record<string, unknown> | undefined;
  const fields = json.fields as Record<string, unknown> | undefined;
  const contentTypeId = (sys?.contentType as Record<string, unknown>)?.sys
    ? ((sys?.contentType as Record<string, unknown>).sys as Record<string, unknown>).id as string
    : undefined;

  if (!fields) {
    findings.push({ item: `${label}: Entry structure`, status: 'fail', detail: 'Response has no fields object' });
    return {
      state: { found: true, hasNtExperiences: false, ntExperiencesCount: 0, experiencesResolved: false, variantsResolved: false },
      contentTypeId,
      findings,
    };
  }

  const ntExperiences = fields.nt_experiences;
  const hasField = ntExperiences !== undefined;
  const isArray = Array.isArray(ntExperiences);
  const count = isArray ? ntExperiences.length : 0;

  if (!hasField) {
    findings.push({
      item: `${label}: nt_experiences field`,
      status: 'fail',
      detail: 'Field does not exist — content type may not be extended with personalization',
    });
    return {
      state: { found: true, hasNtExperiences: false, ntExperiencesCount: 0, experiencesResolved: false, variantsResolved: false },
      contentTypeId,
      findings,
    };
  }

  if (!isArray || count === 0) {
    findings.push({
      item: `${label}: nt_experiences field`,
      status: 'warn',
      detail: 'Field exists but is empty — no experiences attached to this entry',
    });
    return {
      state: { found: true, hasNtExperiences: true, ntExperiencesCount: 0, experiencesResolved: false, variantsResolved: false },
      contentTypeId,
      findings,
    };
  }

  const resolvedExperiences = ntExperiences.filter(isResolvedEntry);
  const unresolvedLinks = ntExperiences.filter(isUnresolvedLink);
  const experiencesResolved = resolvedExperiences.length > 0 && unresolvedLinks.length === 0;

  if (unresolvedLinks.length > 0) {
    findings.push({
      item: `${label}: Experience resolution`,
      status: 'fail',
      detail: `${unresolvedLinks.length} of ${count} experience(s) are unresolved links — they may not be published, or include depth is too shallow`,
    });
  } else {
    findings.push({
      item: `${label}: Experience resolution`,
      status: 'pass',
      detail: `${resolvedExperiences.length} experience(s) fully resolved`,
    });
  }

  let variantsResolved = true;
  for (const exp of resolvedExperiences) {
    const expFields = (exp as Record<string, unknown>).fields as Record<string, unknown> | undefined;
    const variants = expFields?.nt_variants;
    if (!Array.isArray(variants) || variants.length === 0) continue;

    const unresolvedVariants = variants.filter(isUnresolvedLink);
    if (unresolvedVariants.length > 0) {
      variantsResolved = false;
      const expSys = (exp as Record<string, unknown>).sys as Record<string, unknown>;
      findings.push({
        item: `${label}: Variant resolution (experience ${expSys?.id ?? 'unknown'})`,
        status: 'fail',
        detail: `${unresolvedVariants.length} of ${variants.length} variant(s) are unresolved links — they may not be published, or include depth is too shallow`,
      });
    }
  }

  if (variantsResolved && resolvedExperiences.length > 0) {
    findings.push({
      item: `${label}: Variant resolution`,
      status: 'pass',
      detail: 'All variants in resolved experiences are fully resolved',
    });
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
    findings,
  };
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

    const findings: Finding[] = [];
    let cdaResult: FetchResult | undefined;
    let cpaResult: FetchResult | undefined;

    // Fetch from CDA (published content)
    if (input.accessToken) {
      const { json, httpStatus, error } = await fetchEntry(
        'cdn.contentful.com', input.spaceId, input.environment, input.entryId,
        input.accessToken, input.includeDepth, signal,
      );

      if (error) {
        findings.push({ item: 'CDA: Connectivity', status: 'fail', detail: `Network error: ${error}` });
      } else if (httpStatus === 401 || httpStatus === 403) {
        findings.push({ item: 'CDA: Authentication', status: 'fail', detail: `Token rejected (HTTP ${httpStatus})` });
      } else if (httpStatus === 404) {
        findings.push({ item: 'CDA: Entry lookup', status: 'fail', detail: 'Entry not found in published content — it may not be published' });
        cdaResult = {
          state: { found: false, hasNtExperiences: false, ntExperiencesCount: 0, experiencesResolved: false, variantsResolved: false },
          findings: [],
        };
      } else if (json) {
        cdaResult = inspectEntryResponse(json, 'CDA');
        findings.push(...cdaResult.findings);
      } else {
        findings.push({ item: 'CDA: Entry lookup', status: 'fail', detail: `Unexpected HTTP ${httpStatus}` });
      }
    }

    // Fetch from CPA (preview/draft content)
    if (input.previewToken) {
      const { json, httpStatus, error } = await fetchEntry(
        'preview.contentful.com', input.spaceId, input.environment, input.entryId,
        input.previewToken, input.includeDepth, signal,
      );

      if (error) {
        findings.push({ item: 'CPA: Connectivity', status: 'fail', detail: `Network error: ${error}` });
      } else if (httpStatus === 401 || httpStatus === 403) {
        findings.push({ item: 'CPA: Authentication', status: 'fail', detail: `Token rejected (HTTP ${httpStatus})` });
      } else if (httpStatus === 404) {
        findings.push({ item: 'CPA: Entry lookup', status: 'fail', detail: 'Entry not found even in preview — check the entry ID' });
        cpaResult = {
          state: { found: false, hasNtExperiences: false, ntExperiencesCount: 0, experiencesResolved: false, variantsResolved: false },
          findings: [],
        };
      } else if (json) {
        cpaResult = inspectEntryResponse(json, 'CPA');
        findings.push(...cpaResult.findings);
      } else {
        findings.push({ item: 'CPA: Entry lookup', status: 'fail', detail: `Unexpected HTTP ${httpStatus}` });
      }
    }

    // Compare CDA vs CPA
    let comparison: { hasUnpublishedChanges: boolean; detail: string } | undefined;
    if (cdaResult && cpaResult) {
      if (!cdaResult.state.found && cpaResult.state.found) {
        comparison = { hasUnpublishedChanges: true, detail: 'Entry exists in preview but not in published content — the entry needs to be published' };
        findings.push({ item: 'CDA vs CPA: Publishing state', status: 'fail', detail: comparison.detail });
      } else if (
        cpaResult.state.hasNtExperiences && cpaResult.state.ntExperiencesCount > 0 &&
        (!cdaResult.state.hasNtExperiences || cdaResult.state.ntExperiencesCount === 0)
      ) {
        comparison = { hasUnpublishedChanges: true, detail: 'Preview has nt_experiences data but published content does not — republish the baseline entry' };
        findings.push({ item: 'CDA vs CPA: Publishing state', status: 'fail', detail: comparison.detail });
      } else if (
        cpaResult.state.ntExperiencesCount > cdaResult.state.ntExperiencesCount
      ) {
        comparison = { hasUnpublishedChanges: true, detail: `Preview has ${cpaResult.state.ntExperiencesCount} experience(s) but published content has ${cdaResult.state.ntExperiencesCount} — republish the baseline entry` };
        findings.push({ item: 'CDA vs CPA: Publishing state', status: 'fail', detail: comparison.detail });
      } else if (
        cpaResult.state.experiencesResolved && !cdaResult.state.experiencesResolved &&
        cdaResult.state.ntExperiencesCount > 0
      ) {
        comparison = { hasUnpublishedChanges: true, detail: 'Experiences resolve in preview but not in published content — experience entries may need publishing' };
        findings.push({ item: 'CDA vs CPA: Publishing state', status: 'fail', detail: comparison.detail });
      } else if (
        cpaResult.state.variantsResolved && !cdaResult.state.variantsResolved &&
        cdaResult.state.experiencesResolved
      ) {
        comparison = { hasUnpublishedChanges: true, detail: 'Variants resolve in preview but not in published content — variant entries may need publishing' };
        findings.push({ item: 'CDA vs CPA: Publishing state', status: 'fail', detail: comparison.detail });
      } else {
        comparison = { hasUnpublishedChanges: false, detail: 'Published and preview content are consistent' };
        findings.push({ item: 'CDA vs CPA: Publishing state', status: 'pass', detail: comparison.detail });
      }
    }

    // Determine overall status
    const hasCritical = findings.some((f) => f.status === 'fail');
    const hasWarning = findings.some((f) => f.status === 'warn');
    const status = hasCritical ? 'fail' as const : hasWarning ? 'warn' as const : 'pass' as const;

    return {
      status,
      findings,
      entry: {
        id: input.entryId,
        contentTypeId: cdaResult?.contentTypeId ?? cpaResult?.contentTypeId,
        cda: cdaResult?.state,
        cpa: cpaResult?.state,
        comparison,
      },
    };
  },
});

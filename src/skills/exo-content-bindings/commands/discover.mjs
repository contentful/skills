// discover: read-only discovery of an ExO environment: components, templates, content model, existing binding
// sets, instance usage and content population. Never writes to Contentful. The token is not written to disk.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv, cma, loadSchema, typeIdFromUrn, annotationOf } from '../lib/client.mjs';
import { readRecipe, editorCheck } from '../lib/recipe.mjs';
import { flags, emit, CliError } from '../lib/cli.mjs';


export const usage = `discover --env-file <file> --out-dir <dir>

Read an ExO environment (read-only) and describe it for binding design.

  --env-file <file>   credentials file: CONTENTFUL_MANAGEMENT_TOKEN, EXO_SPACE_ID, EXO_ENVIRONMENT_ID
  --out-dir <dir>     working directory for this run (created if missing)

Writes <dir>/discovery.md (read this: components, content model, every existing binding set in plain language),
<dir>/discovery.json (full detail) and <dir>/api_log.jsonl. Prints a JSON summary with counts and file paths.
Exit 1 when the environment cannot be read completely (permissions, rate limit).`;

export async function run(argv) {
  const { 'env-file': envFile, 'out-dir': outDir } = flags(argv, { 'env-file': { type: 'string' }, 'out-dir': { type: 'string' } }, ['env-file', 'out-dir']);
  mkdirSync(outDir, { recursive: true });
  const creds = loadEnv(envFile);
  const api = cma(creds, join(outDir, 'api_log.jsonl'));

  // --- pre-flight: permissions ------------------------------------------------
  const probe = await api.call('GET', '/components?limit=1');
  if (probe.status === 401 || probe.status === 403) {
    throw new CliError(`Pre-flight failed: HTTP ${probe.status} on /components. The token's user lacks Experience Orchestration access ` +
      `(by default only space admins, or the Experience Editor / Presentation Editor roles). This is a permissions problem, not an empty environment.`);
  }
  if (!probe.ok) throw new CliError(`Pre-flight failed: HTTP ${probe.status} ${probe.json.message || ''}`);

  // --- fetch -------------------------------------------------------------------
  const [components, templates, dataAssemblies, fragments, experiences, contentTypes, entries, assets, published] = await Promise.all([
    api.list('/components'), api.list('/experience_templates'), api.list('/data_assemblies'),
    api.list('/experience_fragments'), api.list('/experiences'), api.list('/content_types'),
    api.list('/entries'), api.list('/assets'), api.list('/public/data_assemblies'),
  ]);
  // A list that failed (rate limit, permissions) must not look like an empty one: stop instead of reporting "0 experiences".
  // /public/data_assemblies is optional (it only tells which recipes are published).
  const failedLists = Object.entries({ '/components': components, '/experience_templates': templates, '/data_assemblies': dataAssemblies, '/experience_fragments': fragments, '/experiences': experiences, '/content_types': contentTypes, '/entries': entries, '/assets': assets }).filter(([, r]) => r.items === null);
  if (failedLists.length) {
    throw new CliError(`Discovery is incomplete: ${failedLists.map(([p, r]) => `${p} returned HTTP ${r.status}`).join(', ')}. ${failedLists.some(([, r]) => r.status === 429) ? 'The space is rate-limited; wait a few seconds and run discover again.' : 'Check the token\'s access and run discover again.'} Nothing was written to discovery.json.`);
  }
  const schema = await loadSchema(creds, join(outDir, 'api_log.jsonl'));

  // --- content model from the GraphQL schema (authoritative names and types) ----
  const roots = schema.roots;                          // [{ name: 'ComponentQuote', ref }]
  const rootById = Object.fromEntries(roots.map(r => [typeIdFromUrn(r.ref.sys.urn), r]));
  const ctNames = Object.fromEntries((contentTypes.items || []).map(c => [c.sys.id, c.name]));
  const ctFieldMeta = Object.fromEntries((contentTypes.items || []).map(c => [c.sys.id, Object.fromEntries(c.fields.map(f => [f.id, f]))]));

  // population: how often each field is filled, per content type
  const pop = {}, count = {};
  for (const e of entries.items || []) {
    const ct = e.sys.contentType.sys.id; count[ct] = (count[ct] || 0) + 1; pop[ct] ||= {};
    for (const [k, v] of Object.entries(e.fields || {})) {
      const val = Object.values(v)[0];
      if (val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && !val.length)) pop[ct][k] = (pop[ct][k] || 0) + 1;
    }
  }
  // which content types are referenced where (so "shared source" types are visible)
  const referencedBy = {};
  function describeField(f) {
    if (f.type === 'TypeRef') {
      const lt = f.ref.sys.linkType;
      return lt === 'Contentful:Asset' ? 'Asset' : `→ ${rootById[typeIdFromUrn(f.ref.sys.urn)]?.name || typeIdFromUrn(f.ref.sys.urn)}`;
    }
    if (f.type === 'Array') {
      const it = f.items || {};
      if (it.type === 'DiscriminatedUnion') return `[→ ${unionLabel(it.members)}]`;
      if (it.type === 'TypeRef') return it.ref.sys.linkType === 'Contentful:Asset' ? '[Asset]' : `[→ ${rootById[typeIdFromUrn(it.ref.sys.urn)]?.name}]`;
      return `[${it.type}]`;
    }
    if (f.type === 'DiscriminatedUnion') return `→ ${unionLabel(f.members)}`;
    return f.type;
  }
  // When a reference field allows content types that do not exist in this environment, the schema
  // widens it to every entry type. Say "any entry type" rather than listing them all.
  const entryRootCount = roots.filter(r => r.ref.sys.linkType !== 'Contentful:Asset').length;
  function unionLabel(members) {
    const names = members.map(m => rootById[typeIdFromUrn(m.ref.sys.urn)]?.name || typeIdFromUrn(m.ref.sys.urn));
    return names.length >= entryRootCount ? `any entry type (${names.length}; the allowed list names types missing from this environment)` : names.join(' | ');
  }
  const contentModel = {};
  for (const r of roots) {
    const id = typeIdFromUrn(r.ref.sys.urn);
    if (r.ref.sys.linkType === 'Contentful:Asset') continue;
    const fields = schema.getFields(r.ref);
    const n = count[id] || 0;
    contentModel[r.name] = {
      contentTypeId: id, displayName: ctNames[id] || r.name, entries: n,
      fields: Object.values(fields).map(f => {
        // a reference list is `cards` in the content type and `cardsCursorCollection` in GraphQL: f.name is the content type's id
        const meta = ctFieldMeta[id]?.[f.fieldId] || ctFieldMeta[id]?.[f.id] || ctFieldMeta[id]?.[f.name] || {};
        const targets = [];
        if (f.type === 'TypeRef' && f.ref.sys.linkType !== 'Contentful:Asset') targets.push(typeIdFromUrn(f.ref.sys.urn));
        if (f.type === 'Array' && f.items?.type === 'DiscriminatedUnion' && f.items.members.length < entryRootCount) targets.push(...f.items.members.map(m => typeIdFromUrn(m.ref.sys.urn)));
        if (f.type === 'Array' && f.items?.type === 'TypeRef' && f.items.ref.sys.linkType !== 'Contentful:Asset') targets.push(typeIdFromUrn(f.items.ref.sys.urn));
        if (f.type === 'DiscriminatedUnion' && f.members.length < entryRootCount) targets.push(...f.members.map(m => typeIdFromUrn(m.ref.sys.urn)));
        for (const t of targets) (referencedBy[t] ||= new Set()).add(`${r.name}.${f.id}`);
        return { id: f.id, fieldId: meta.id || f.fieldId, name: meta.name || f.name, type: describeField(f), required: !!f.required,
                 filled: n ? `${pop[id]?.[meta.id || f.id] || 0}/${n}` : 'no entries',
                 allowedValues: (meta.validations || []).find(v => v.in)?.in, disabled: meta.disabled || meta.omitted || undefined };
      }),
    };
  }
  for (const [id, set] of Object.entries(referencedBy)) if (rootById[id]) contentModel[rootById[id].name].referencedBy = [...set].sort();

  // --- existing binding sets, in plain language ---------------------------------
  const publishedIds = new Set((published.items || []).map(d => d.sys.id));
  function humanPointer(p) { return typeof p === 'string' ? p.replace(/^\$resolvers\/[^/]+\/?/, '').replace(/^_node\/?/, '') || '(whole result)' : JSON.stringify(p); }
  function summariseDa(def) {
    let interim = null, note = null;
    try { interim = readRecipe(def, { schema }); } catch (e) { note = `not in a shape this skill can describe field by field (${e.message.slice(0, 120)}); the raw mapping is shown`; }
    const params = interim ? (Array.isArray(interim.parameters) ? interim.parameters : Object.entries(interim.parameters || {}).map(([id, p]) => ({ id, ...p }))) : [];
    const picks = params.map(p => p.allowedTypes ? `${p.name || p.id}: one ${p.allowedTypes.join(' or ')} entry${p.required === false ? ' (optional)' : ''}`
                                                : `${p.name || p.id}: ${p.type}${p.fields ? ' {' + p.fields.map(f => f.id + (f.fallbackValue !== undefined ? '=' + JSON.stringify(f.fallbackValue) : '')).join(', ') + '}' : ''}${p.locked ? ' (locked)' : ''}`);
    const kinds = Object.values(interim?.resolvers || {}).map(r => r.resolverType === 'dataAssembly' ? `child recipe ${typeIdFromUrn(r.dataAssembly.sys.urn)}` : r.kind === 'collection' ? `query: ${r.contentTypeName} collection` : 'entry').filter((v, i, a) => a.indexOf(v) === i);
    const fills = Object.entries(interim?.return || def.return || {}).map(([k, v]) => {
      const f = v?.$from; const sel = f?.select ?? v;
      return `${k} ← ${typeof sel === 'string' ? humanPointer(sel) : f?.source ? humanPointer(f.source) + (sel ? ' ' + JSON.stringify(sel) : '') : JSON.stringify(v)}`;
    });
    // API-only recipes are visible in the component editor but read-only there; don't copy their shape as a convention
    const editor = editorCheck(schema, def, allDas);
    return { id: def.sys.id, name: def.name, description: def.description, published: publishedIds.has(def.sys.id), editorPicks: picks, resolverKinds: kinds, fills, note, editableInUi: editor.editable, editorState: editor.state, editorCauses: editor.causes, editorRewrites: editor.rewrites, interim };
  }
  const allDas = Object.fromEntries((dataAssemblies.items || []).map(d => [d.sys.id, d]));
  const existing = (dataAssemblies.items || []).map(summariseDa);
  const existingById = Object.fromEntries(existing.map(d => [d.id, d]));

  // --- components & templates ---------------------------------------------------
  const usedInTrees = {};
  function walk(nodes, ownerId) {
    for (const n of nodes || []) {
      if ((n.component||n.componentType)?.sys?.urn) (usedInTrees[typeIdFromUrn((n.component||n.componentType).sys.urn)] ||= new Set()).add(ownerId);
      for (const slotNodes of Object.values(n.slots || {})) walk(slotNodes, ownerId);
      if (n.componentTree) walk(n.componentTree, ownerId);
    }
  }
  for (const c of [...(components.items || []), ...(templates.items || [])]) walk(c.componentTree, c.sys.id);

  function prop(p) {
    const base = { id: p.id, name: p.name, type: p.type, required: !!p.required };
    if (p.type === 'Array' && p.items) base.itemFields = (p.items.fields || []).map(f => `${f.id}:${f.type}${f.required ? '!' : ''}`);
    if (p.type === 'TypeRef' && p.ref) base.ref = typeIdFromUrn(p.ref.sys.urn);
    return base;
  }
  function surface(c, kind) {
    const bindingSets = (c.dataAssemblies || []).map(l => typeIdFromUrn(l.sys.urn));
    return {
      kind, id: c.sys.id, name: c.name, description: c.description || '',
      implementation: (annotationOf(c) || '').replace('Contentful:', '').replace('Implementation', '') || (c.componentTree?.length ? 'Composed' : 'Coded'),
      published: !!c.sys.publishedVersion,
      // unpublished now, but it was published at some point: not the same as never published
      wasPublished: !c.sys.publishedVersion && !!(c.sys.firstPublishedAt || c.sys.publishedCounter),
      // the published definition is what editors see; links added since then are invisible until someone publishes
      unpublishedChanges: !!c.sys.publishedVersion && c.sys.version > c.sys.publishedVersion + 1,
      contentProperties: (c.contentProperties || []).map(prop),
      designProperties: (c.designProperties || []).map(d => d.id),
      slots: (c.slots || []).map(s => ({ id: s.id, name: s.name, allows: (s.allowedResources || []).flatMap(r => r.allowedTypes || []), max: (s.validations || []).find(v => v.size)?.size?.max })),
      treeChildren: [...new Set((function collect(nodes, acc = []) { for (const n of nodes || []) { if (n.component||n.componentType) acc.push(typeIdFromUrn((n.component||n.componentType).sys.urn)); if (n.nodeType === 'Looper') acc.push(`Looper(${n.items})`); for (const s of Object.values(n.slots || {})) collect(s, acc); collect(n.componentTree, acc); } return acc; })(c.componentTree))],
      usedInside: [...(usedInTrees[c.sys.id] || [])].sort(),
      bindingSets: bindingSets.map(id => existingById[id] ? { id, name: existingById[id].name, editorPicks: existingById[id].editorPicks, resolverKinds: existingById[id].resolverKinds, editableInUi: existingById[id].editableInUi } : { id, name: '(not found in this environment)' }),
    };
  }
  const componentSurfaces = (components.items || []).map(c => surface(c, 'components'));
  const templateSurfaces = (templates.items || []).map(t => surface(t, 'templates'));

  // --- instance layer (context only) -------------------------------------------
  const instances = {
    fragments: (fragments.items || []).map(f => { const id = f.contentBindings?.sys?.urn ? typeIdFromUrn(f.contentBindings.sys.urn) : null;
      return { id: f.sys.id, name: f.name, selectedBindingSet: id, bindingStatus: !id ? 'no binding set selected' : existingById[id] ? 'uses ' + existingById[id].name : `selects "${id}" which no longer exists` }; }),
    experiences: (experiences.items || []).map(e => ({ id: e.sys.id, name: e.name, template: e.template?.sys?.urn ? typeIdFromUrn(e.template.sys.urn) : null })),
  };

  // --- write + print -------------------------------------------------------------
  const discovery = {
    source: { spaceId: creds.spaceId, environmentId: creds.environmentId, at: new Date().toISOString() },
    components: componentSurfaces, templates: templateSurfaces, contentModel, existingBindingSets: existing, instances,
    raw: { components: components.items, templates: templates.items, dataAssemblies: dataAssemblies.items, contentTypes: contentTypes.items },
    unsupportedFields: schema.unsupported,
    counts: { entries: entries.items?.length ?? null, assets: assets.items?.length ?? null, publishedBindingSets: publishedIds.size },
    availability: { publishedDataAssemblies: published.status },
  };
  writeFileSync(join(outDir, 'discovery.json'), JSON.stringify(discovery, null, 2));

  const report = []; const line = (s = '') => report.push(s);
  line(`# Discovery: ${creds.spaceId} / ${creds.environmentId}`);
  line(`${componentSurfaces.length} components, ${templateSurfaces.length} templates, ${existing.length} binding sets (${publishedIds.size} published), ${Object.keys(contentModel).length} content types, ${discovery.counts.entries} entries, ${instances.fragments.length} fragments, ${instances.experiences.length} experiences`);
  for (const group of [templateSurfaces, componentSurfaces]) {
    if (!group.length) continue;
    line(`\n## ${group[0].kind === 'templates' ? 'Templates' : 'Components'}`);
    for (const c of group) {
      line(`\n### ${c.name}  (${c.id}, ${c.implementation}${c.published ? (c.unpublishedChanges ? ', has unpublished changes — editors see the older published version' : '') : c.wasPublished ? ', not published at the moment (it was published before) — editors cannot use it until it is published again' : ', never published — editors cannot use it yet'})`);
      if (c.contentProperties.length) line(`  bindable content properties: ` + c.contentProperties.map(p => `${p.id}${p.required ? '!' : ''}:${p.type}${p.ref ? '→' + p.ref : ''}${p.itemFields ? '{' + p.itemFields.join(', ') + '}' : ''}`).join(', '));
      else line(`  no content properties → nothing to bind here`);
      if (c.designProperties.length) line(`  design properties (never bound): ${c.designProperties.join(', ')}`);
      if (c.slots.length) line(`  slots: ` + c.slots.map(s => `${s.id}${s.allows.length ? ' allows ' + s.allows.join('|') : ''}${s.max ? ' max ' + s.max : ''}`).join('; ') + '  ← occupants bring their own recipes');
      if (c.treeChildren.length) line(`  built from: ${c.treeChildren.join(', ')}`);
      if (c.usedInside.length) line(`  appears inside: ${c.usedInside.join(', ')}`);
      if (c.bindingSets.length) for (const b of c.bindingSets) line(`  existing binding set "${b.name}" [${b.id}]${b.editableInUi === false ? ' [API ONLY in the editor]' : ''}${b.editorPicks ? ' — editor picks ' + b.editorPicks.join('; ') + ' — ' + b.resolverKinds.join(', ') : ''}`);
      else if (c.contentProperties.length) line(`  existing binding sets: none`);
    }
  }
  line(`\n## Content model (field: type, filled/entries)`);
  for (const [name, ct] of Object.entries(contentModel)) {
    line(`\n### ${name}  (${ct.contentTypeId} "${ct.displayName}", ${ct.entries} entries${ct.referencedBy ? ', referenced by ' + ct.referencedBy.join(', ') : ''})`);
    line('  ' + ct.fields.filter(f => !f.disabled).map(f => `${f.id}${f.required ? '!' : ''}: ${f.type}${f.allowedValues ? ' in[' + f.allowedValues.join('|') + ']' : ''} ${f.filled}`).join('\n  '));
  }
  if (existing.length) {
    line(`\n## Existing binding sets (house conventions — read these before proposing anything)`);
    for (const d of existing) {
      line(`\n### ${d.name} [${d.id}]${d.published ? '' : ' (draft)'} — ${d.resolverKinds.join(', ')}${d.editableInUi ? '' : ' — API ONLY: editors see it read-only in the component editor; do not copy its shape'}`);
      if (!d.editableInUi) for (const c of d.editorCauses) line(`  api-only because ${c.where} ${c.why}`);
      if (d.editorState === 'unverified') line(`  not written by the component editor: it fits the editor's rules, but its ${d.editorRewrites.join(', ')} differ from the shape the editor saves and would be rewritten on first save there. Confirm it opens in the component editor before building on it`);
      if (d.editorPicks.length) line(`  editor picks: ${d.editorPicks.join('; ')}`);
      for (const f of d.fills) line(`  ${f}`);
      if (d.note) line(`  ${d.note}`);
    }
  }
  if (schema.unsupported.length) {
    line(`\n## Fields this skill cannot bind (${schema.unsupported.length})`);
    for (const u of schema.unsupported) line(`  ${u.type}.${u.field}: ${u.reason}`);
  }
  if (instances.fragments.length || instances.experiences.length) {
    line(`\n## Instances (context only; this skill does not edit them). Fragments show the binding set they select; which binding sets an experience's placed components use is NOT read here, so "no experience uses it" cannot be concluded from this list`);
    for (const f of instances.fragments) line(`  fragment "${f.name}" [${f.id}]: ${f.bindingStatus}`);
    for (const e of instances.experiences) line(`  experience "${e.name}" [${e.id}]${e.template ? ' on template ' + e.template : ''}`);
  }
  line(`\nFull detail: ${join(outDir, 'discovery.json')}`);
  writeFileSync(join(outDir, 'discovery.md'), report.join('\n') + '\n');
  emit({
    ok: true, source: discovery.source,
    counts: { components: componentSurfaces.length, templates: templateSurfaces.length, bindingSets: existing.length, publishedBindingSets: publishedIds.size, contentTypes: Object.keys(contentModel).length, entries: discovery.counts.entries, fragments: instances.fragments.length, experiences: instances.experiences.length },
    apiOnlyBindingSets: existing.filter(d => !d.editableInUi).map(d => d.id),
    notWrittenByTheEditor: existing.filter(d => d.editorState === 'unverified').map(d => d.id),
    fieldsThisSkillCannotBind: schema.unsupported.length,
    files: { summary: join(outDir, 'discovery.md'), discovery: join(outDir, 'discovery.json'), apiLog: join(outDir, 'api_log.jsonl') },
    next: 'Read files.summary before proposing anything.',
  });
}

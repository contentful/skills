// build: turn a plan into Management API request bodies and validate them against the live schema before anything
// is written. Every generated query is validated against the environment's GraphQL schema, and every payload is
// checked against the component editor's editing rules (lib/recipe.mjs#editorCheck); a recipe the editor would show
// as "API only" is an error unless the plan declares apiOnly.reason. Read-only against Contentful: it only loads
// the GraphQL schema.
//
// plan.json = { "recipes": [ Recipe, ... ] } where Recipe is
// { id, name, description, parameters, resolvers, return } plus:
//   linkTo:     [{ kind: "components" | "templates", id }]   who offers this recipe
//   collection: { resolver, contentTypeName, limit, order, fields? }  optional query-collection shorthand
//   review:     { summary, picks, derived, notUsed, alternatives, questions }  text for the proposal
//   apiOnly:    { reason }  only when the user has agreed to a recipe the component editor cannot edit
// See references/plan-format.md for the full format and examples.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv, loadSchema, typeIdFromUrn, CONTENT_SOURCE } from '../lib/client.mjs';
import { buildBody, compileCollection, editorCheck } from '../lib/recipe.mjs';
import { flags, emit } from '../lib/cli.mjs';


export const usage = `build --env-file <file> --plan <plan.json> --out-dir <dir>

Validate a plan against the live schema and generate request bodies. Writes nothing to Contentful.

  --env-file <file>   credentials file (see discover)
  --plan <file>       the plan (references/plan-format.md)
  --out-dir <dir>     the working directory discover wrote to (needs discovery.json)

Writes <dir>/payloads/<id>.json for every recipe without errors and <dir>/build.json (full report). Prints JSON:
per recipe its errors, warnings, what fills each property, and whether the component editor can edit it
("editable" or "apiOnly"). Exit 1 when any recipe has errors.`;

export async function run(argv) {
  const { 'env-file': envFile, plan: planFile, 'out-dir': outDir } = flags(argv, { 'env-file': { type: 'string' }, plan: { type: 'string' }, 'out-dir': { type: 'string' } }, ['env-file', 'plan', 'out-dir']);
  const creds = loadEnv(envFile);
  const plan = JSON.parse(readFileSync(planFile, 'utf8'));
  const discovery = JSON.parse(readFileSync(join(outDir, 'discovery.json'), 'utf8'));
  mkdirSync(join(outDir, 'payloads'), { recursive: true });
  const schema = await loadSchema(creds, join(outDir, 'api_log.jsonl'));

  const roots = schema.roots;
  const rootByName = Object.fromEntries(roots.map(r => [r.name, r]));
  const rootById = Object.fromEntries(roots.map(r => [typeIdFromUrn(r.ref.sys.urn), r]));
  const toPascal = (t) => rootByName[t] ? t : rootById[t] ? rootById[t].name : t;
  const owners = Object.fromEntries([...discovery.components, ...discovery.templates].map(s => [`${s.kind}/${s.id}`, s]));
  const existingDas = Object.fromEntries((discovery.raw.dataAssemblies || []).map(d => [d.sys.id, d]));
  // A reference the GraphQL schema types as a union must be selected with $on, even when only one of its content
  // types exists in this environment (schema.mjs marks such fields `branch`). The content-type validations give the
  // full allowed list, including types missing from the environment, for the error message.
  const allowedTypesOf = {};
  for (const ct of discovery.raw.contentTypes || []) for (const f of ct.fields || []) {
    const v = [...(f.validations || []), ...((f.items || {}).validations || [])].find(x => x.linkContentType);
    if (v) allowedTypesOf[`${ct.sys.id}.${f.id}`] = v.linkContentType;
  }

  // ---------------------------------------------------------------- normalisation
  function normaliseParameters(params) {
    const list = Array.isArray(params) ? params : Object.entries(params || {}).map(([id, p]) => ({ id, ...p }));
    return list.map(p => {
      const q = { required: true, ...p };
      if (q.allowedTypes) { q.type ||= 'Contentful:Entry'; q.source ||= CONTENT_SOURCE; q.allowedTypes = q.allowedTypes.map(toPascal); }
      return q;
    });
  }
  function applyCollectionShorthand(recipe) {
    const c = recipe.collection; if (!c) return recipe;
    const name = c.resolver || 'collection';
    // The Management API currently rejects an editable `order` parameter (OrderExpression) with
    // "Invalid input at parameters", so orderings are written into the query text.
    const order = (c.order || []).map(o => typeof o === 'string' ? o : `${o.path.replace(/\./g, '_')}_${String(o.direction).toUpperCase()}`);
    const compiled = compileCollection(name, { contentTypeName: toPascal(c.contentTypeName), limit: c.limit, order: order.length ? order : undefined, locked: c.locked });
    const { parameterDefinition, ...resolver } = compiled;
    const params = normaliseParameters(recipe.parameters);
    if (parameterDefinition && !params.some(p => p.id === name)) params.push({ id: name, required: true, name: c.name || `${c.contentTypeName} query`, ...parameterDefinition });
    return { ...recipe, parameters: params, resolvers: { ...recipe.resolvers, [name]: resolver } };
  }
  function defaultResolvers(recipe) {
    if (recipe.resolvers && Object.keys(recipe.resolvers).length) return recipe.resolvers;
    const first = normaliseParameters(recipe.parameters).find(p => p.allowedTypes);
    return first ? { main: { resolverType: 'graphql', parameters: { id: `$parameters/${first.id}` } } } : {};
  }

  // ---------------------------------------------------------------- schema walking
  const fieldCache = new Map();
  const fieldsOf = (ref) => { const k = ref.sys.urn; if (!fieldCache.has(k)) fieldCache.set(k, schema.getFields(ref)); return fieldCache.get(k); };
  const memberName = (m) => m.missing ? `${m.missing} (not in this environment)` : rootById[typeIdFromUrn(m.ref.sys.urn)]?.name || typeIdFromUrn(m.ref.sys.urn);

  /** Follow a slash path from a type ref. Returns { field, ref, union } for the leaf, or throws. */
  function follow(ref, path) {
    const segs = path.split('/').filter(Boolean);
    let cur = { ref, field: null, union: null, isArray: false };
    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      if (cur.isArray) { if (seg !== 'items') throw new Error(`expected "items" after collection "${segs[i - 1]}", got "${seg}"`); cur = { ...cur, isArray: false }; continue; }
      if (cur.union) throw new Error(`"${segs.slice(0, i).join('/')}" can be one of ${cur.union.map(memberName).join(' | ')}; select it with $on { type: { <TypeName>: ... } } before reading "${seg}"`);
      if (!cur.ref) throw new Error(`"${segs.slice(0, i).join('/')}" is a ${cur.field?.type}; cannot select "${seg}" inside it`);
      const fields = fieldsOf(cur.ref); const f = fields[seg];
      if (!f) throw new Error(`"${seg}" is not a field of ${rootById[typeIdFromUrn(cur.ref.sys.urn)]?.name || 'Asset'} (has: ${Object.keys(fields).join(', ')})`);
      if (f.type === 'TypeRef' && f.ref.sys.linkType !== 'Contentful:Asset' && f.branch) {
        const list = allowedTypesOf[`${typeIdFromUrn(cur.ref.sys.urn)}.${seg}`] || [typeIdFromUrn(f.ref.sys.urn)];
        cur = { ref: null, field: f, union: list.map(t => rootById[t] ? { ref: rootById[t].ref } : { ref: { sys: { urn: `missing/${t}` } }, missing: t }), isArray: false, branchReason: `"${seg}" allows ${list.join(' | ')}` };
      }
      else if (f.type === 'TypeRef') cur = { ref: f.ref, field: f, union: null, isArray: false };
      else if (f.type === 'DiscriminatedUnion') cur = { ref: null, field: f, union: f.members, isArray: false };
      else if (f.type === 'Array') {
        const it = f.items || {};
        if (it.type === 'DiscriminatedUnion') cur = { ref: null, field: f, union: it.members, isArray: true };
        else if (it.type === 'TypeRef' && f.branch) cur = { ref: null, field: f, union: [{ ref: it.ref }], isArray: true };
        else if (it.type === 'TypeRef') cur = { ref: it.ref, field: f, union: null, isArray: true };
        else cur = { ref: null, field: { ...f, leafType: it.type }, union: null, isArray: true };
      } else cur = { ref: null, field: f, union: null, isArray: false };
    }
    return cur;
  }
  const leafType = (cur) => cur.field ? (cur.field.type === 'TypeRef' ? (cur.field.ref.sys.linkType === 'Contentful:Asset' ? 'Asset' : 'Entry') : cur.field.type === 'Array' ? 'Array' : cur.field.type) : 'Entry';

  /** Validate one return expression against a start ref; collect leaf types per target key. */
  function checkSelect(expr, start, target, out, errors, warnings) {
    // start: { ref, union, isArray }
    if (typeof expr === 'string') {
      try { const leaf = follow(start.ref ? start.ref : { sys: { urn: 'x' } }, expr); out.push({ target, type: leafType(leaf), path: expr }); }
      catch (e) { if (start.ref) errors.push(`${target}: ${e.message}`); else errors.push(`${target}: cannot select "${expr}" here — ${start.union ? 'branch with $on first' : 'not an entry'}`); }
      return;
    }
    if (!expr || typeof expr !== 'object') { out.push({ target, type: 'Literal', path: JSON.stringify(expr) }); return; }
    if ('$literal' in expr) { out.push({ target, type: 'Literal', path: JSON.stringify(expr.$literal) }); return; }
    if ('$on' in expr) {
      const branches = expr.$on.type || {};
      // A branch on a known single type is harmless and is what the component editor itself writes, so no warning.
      const present = (start.union || []).filter(m => !m.missing).map(memberName);
      const members = present;
      if (start.isArray || (start.union || []).length === present.length) for (const m of present) if (!(m in branches)) errors.push(`${target}: can be a ${m} but no $on branch maps it — the API rejects a multi-type selection with a missing branch`);
      for (const [name, sub] of Object.entries(branches)) {
        const root = rootByName[name];
        if (!root) { errors.push(`${target}: $on branch "${name}" is not a content type in this environment`); continue; }
        if (members.length && !members.includes(name)) warnings.push(`${target}: $on branch "${name}" can never occur here (allowed: ${members.join(', ')})`);
        checkSelect(sub, { ref: root.ref }, target, out, errors, warnings);
      }
      return;
    }
    if ('$from' in expr) {
      const f = expr.$from;
      if (typeof f === 'string') { out.push({ target, type: 'Resolver', path: f }); return; }
      let next = start;
      if (f.source && !f.source.startsWith('$') && !start.ref) { errors.push(`${target}: cannot select "${f.source}" here — ${start.union ? 'branch with $on first' : 'not an entry'}`); return; }
      if (f.source && !f.source.startsWith('$')) {
        try { const leaf = follow(start.ref, f.source); next = { ref: leaf.ref, union: leaf.union, isArray: leaf.isArray }; }
        catch (e) { errors.push(`${target}: ${e.message}`); return; }
      }
      if (f.select === undefined) { out.push({ target, type: leafType(next.field ? next : { field: null }), path: f.source }); return; }
      checkSelect(f.select, next, target, out, errors, warnings); return;
    }
    // a field map straight onto a union: say once which branch is missing, not once per field
    if (!start.ref && start.union) { const names = start.union.map(memberName); errors.push(`${target}: ${start.isArray ? 'each item' : 'this reference'} can be ${names.join(' | ')} and the schema types it as a union, so the mapping must be wrapped: { "$on": { "type": { "${names[0]}": { … } } } }`); return; }
    for (const [k, v] of Object.entries(expr)) checkSelect(v, start, `${target}.${k}`, out, errors, warnings);
  }

  const compatible = { String: ['String', 'Date', 'DateTime', 'Symbol', 'Text', 'Literal'], RichText: ['RichText'], Boolean: ['Boolean', 'Literal'], Number: ['Number', 'Integer', 'Literal'], Array: ['Array'], TypeRef: ['Resolver'], Record: ['Entry', 'Asset', 'Resolver'] };

  // ---------------------------------------------------------------- build loop
  const report = { recipes: [], ok: true };
  const planDas = {};
  // recipes the editor shows as API only: existing ones, and plan recipes as they are built
  const apiOnlyIds = new Set(Object.values(existingDas).filter(d => !editorCheck(schema, d, existingDas).editable).map(d => d.sys.id));
  for (let recipe of plan.recipes || []) {
    const errors = [], warnings = [], leaves = []; let editor = null, existingNote = null, unchanged = false;
    const id = recipe.id; if (!id) { errors.push('recipe has no id'); }
    const targets = (recipe.linkTo || []).map(t => owners[`${t.kind}/${t.id}`] || (errors.push(`linkTo ${t.kind}/${t.id} not found in discovery`), null)).filter(Boolean);
    if (!recipe.linkTo?.length) warnings.push('no linkTo: the recipe will exist but no component or template will offer it');
    for (const o of targets) {
      if (!o.published) warnings.push(`${o.kind}/${o.id} ${o.wasPublished ? 'is not published at the moment (it was published before)' : 'has never been published'}: editors cannot use it or this recipe until it is`);
      else if (o.unpublishedChanges) warnings.push(`${o.kind}/${o.id} has unpublished changes: editors see the older published version until someone publishes it, and this recipe will not appear for them before that`);
    }
    // Modifying an existing recipe changes every instance that already uses it. Say so where the user will see it.
    const prior = existingDas[id];
    if (prior) {
      const users = (discovery.instances?.fragments || []).filter(f => f.selectedBindingSet === id).map(f => `fragment "${f.name}"`);
      // what changes is only known once the body is built (the plan and the saved recipe are written differently)
      existingNote = { at: warnings.length, users };
      warnings.push(`"${id}" already exists in this environment ("${prior.name}"${prior.sys.publishedVersion ? ', published' : ''}); applying will UPDATE it${users.length ? ' and affect ' + users.join(', ') : ''}. If an alternative recipe is intended, use a new id.`);
    }

    try {
      recipe = applyCollectionShorthand(recipe);
      const parameters = normaliseParameters(recipe.parameters);
      const resolvers = defaultResolvers({ ...recipe, parameters });
      // Plans describe resolvers; the query is generated. A raw Management API resolver ({ source, query }) is refused.
      for (const [rid, r] of Object.entries(resolvers)) if (!['graphql', 'dataAssembly'].includes(r.resolverType)) errors.push(`resolver ${rid}: write it as { resolverType: "graphql", parameters: { id: "$parameters/<pick>" } }, { resolverType: "dataAssembly", dataAssembly, parameters } or the collection shorthand; hand-written queries and raw API resolvers are not accepted (the editor cannot edit them)`);
      for (const p of parameters) for (const t of p.allowedTypes || []) if (!rootByName[t]) errors.push(`parameter ${p.id}: allowed type "${t}" is not a content type in this environment`);

      // referenced child recipes: from the environment or earlier in this plan
      const referenced = {};
      for (const [rid, r] of Object.entries(resolvers)) if (r.resolverType === 'dataAssembly') {
        const cid = typeIdFromUrn(r.dataAssembly.sys.urn);
        const child = existingDas[cid] || planDas[cid];
        if (!child) errors.push(`resolver ${rid}: child recipe "${cid}" is neither in the environment nor earlier in this plan (order matters)`);
        else referenced[cid] = child;
      }

      // what each resolver starts from
      const startOf = {};
      for (const [rid, r] of Object.entries(resolvers)) {
        if (r.resolverType === 'dataAssembly') { startOf[rid] = { resolverOnly: true }; continue; }
        if (r.kind === 'collection') { const root = rootByName[r.contentTypeName]; startOf[rid] = { ref: root?.ref, collectionField: r.query.match(/\n\s*(\w+CursorCollection)/)?.[1] }; continue; }
        const idPtr = r.parameters?.id; const pid = typeof idPtr === 'string' ? idPtr.replace('$parameters/', '') : null;
        const p = parameters.find(x => x.id === pid);
        if (!p) { errors.push(`resolver ${rid}: parameters.id must point at an entry parameter ($parameters/<id>)`); continue; }
        const types = (p.allowedTypes || []).map(t => rootByName[t]).filter(Boolean);
        startOf[rid] = types.length === 1 ? { ref: types[0].ref } : { union: types.map(t => ({ ref: t.ref })) };
      }

      // validate every return key
      for (const [key, expr] of Object.entries(recipe.return || {})) {
        const f = expr?.$from; const src = typeof f === 'object' ? f.source : typeof f === 'string' ? f : typeof expr === 'string' ? expr : null;
        if (!src || !src.startsWith('$resolvers/')) { errors.push(`${key}: return must start from a resolver ($resolvers/<name>…)`); continue; }
        const [, rid, ...rest] = src.split('/'); const st = startOf[rid];
        if (!st) { errors.push(`${key}: unknown resolver "${rid}"`); continue; }
        if (st.resolverOnly) { leaves.push({ target: key, type: 'Resolver', path: src }); continue; }
        let start = st;
        if (st.collectionField) {
          if (rest[0] !== st.collectionField || rest[1] !== 'items') { errors.push(`${key}: a collection resolver is read as $resolvers/${rid}/${st.collectionField}/items`); continue; }
          start = { ref: st.ref }; rest.splice(0, 2);
        }
        if (rest.length) { try { const leaf = follow(start.ref, rest.join('/')); start = { ref: leaf.ref, union: leaf.union, isArray: leaf.isArray }; } catch (e) { errors.push(`${key}: ${e.message}`); continue; } }
        const sel = typeof f === 'object' ? f.select : undefined;
        if (sel === undefined) leaves.push({ target: key, type: start.union ? 'Union' : 'Entry', path: src });
        else checkSelect(sel, start, key, leaves, errors, warnings);
      }

      // contract with each owner: every return key is a content property; every content property is covered or explained
      for (const o of targets) {
        const props = Object.fromEntries(o.contentProperties.map(p => [p.id, p]));
        for (const key of Object.keys(recipe.return || {})) {
          const p = props[key]; if (!p) { errors.push(`${key}: not a content property of ${o.kind}/${o.id} (has: ${Object.keys(props).join(', ')})`); continue; }
          const mine = leaves.filter(l => l.target === key || l.target.startsWith(key + '.'));
          if (p.type === 'Array') {
            const itemIds = (o.contentProperties.find(x => x.id === key)?.itemFields || []).map(s => s.split(':')[0]);
            for (const l of mine) { const sub = l.target.slice(key.length + 1); if (sub && !itemIds.includes(sub)) errors.push(`${l.target}: "${sub}" is not an item field of ${key} (has: ${itemIds.join(', ')})`); }
          } else if (p.type !== 'TypeRef') {
            for (const l of mine) if (l.type !== 'Resolver' && !(compatible[p.type] || []).includes(l.type)) errors.push(`${key}: ${o.id} expects ${p.type} but "${l.path}" is ${l.type}`);
          }
        }
        for (const p of o.contentProperties) if (!(p.id in (recipe.return || {}))) {
          const why = recipe.review?.notUsed?.[p.id];
          (p.required && !why ? errors : warnings).push(`${o.kind}/${o.id}.${p.id}${p.required ? ' (required)' : ''} is not filled by this recipe${why ? ': ' + why : ' — fill it or explain it in review.notUsed'}`);
        }
        if (o.designProperties.some(d => d in (recipe.return || {}))) errors.push(`return touches a design property of ${o.id}; design properties are never bound`);
      }

      // build the request body
      let body = null;
      if (!errors.length) {
        // Canonical shape, as the component editor itself writes recipes: a selection from an entry resolver is
        // wrapped in a root `$on` branch on the entry's content type, and a whole-resolver return is `{ $from: ptr }`.
        // The API accepts the flat form too, but the editor's binding panel was observed not to render it reliably.
        const typeOf = (rid) => { const st = startOf[rid]; return st?.ref ? rootById[typeIdFromUrn(st.ref.sys.urn)]?.name : null; };
        // does the reference reached by `segs` from `ref` allow more than one content type?
        const needsBranchAt = (ref, segs) => { try { let cur = ref; for (let i = 0; i < segs.length; i++) { const f = fieldsOf(cur)[segs[i]]; if (!f) return false; if (i === segs.length - 1) return f.type === 'DiscriminatedUnion' || (f.type === 'Array' && f.items?.type === 'DiscriminatedUnion') || !!f.branch; if (f.type === 'TypeRef') cur = f.ref; else return false; } return false; } catch { return false; } };
        const canon = {};
        for (const [key, v] of Object.entries(recipe.return || {})) {
          if (typeof v === 'string') { canon[key] = { $from: v }; continue; }
          const f = v?.$from;
          if (!f || typeof f === 'string' || typeof f.source !== 'string' || f.select === undefined) { canon[key] = v; continue; }
          const [, rid, ...rest] = f.source.split('/'); const T = typeOf(rid);
          if (!T || resolvers[rid]?.kind === 'collection') { canon[key] = v; continue; }
          const already = !rest.length && f.select && typeof f.select === 'object' && f.select.$on && Object.keys(f.select.$on.type || {}).every(k => k === T);
          if (already) { canon[key] = v; continue; }
          // A $on on a reference that allows exactly one content type is rejected by the API ("input data type must
          // be a discriminated union"); only references with a wider allowed list may be branched. Flatten the rest.
          let sel = f.select;
          if (rest.length && sel && typeof sel === 'object' && sel.$on && !needsBranchAt(startOf[rid]?.ref, rest)) {
            const branches = Object.values(sel.$on.type || {});
            if (branches.length === 1 && typeof branches[0] === 'string') sel = branches[0];
          }
          const inner = rest.length ? (typeof sel === 'string' ? `${rest.join('/')}/${sel}` : { $from: { source: rest.join('/'), select: sel } }) : sel;
          canon[key] = { $from: { source: `$resolvers/${rid}`, select: { $on: { type: { [T]: inner } } } } };
        }
        const interim = { id, name: recipe.name || id, description: recipe.description || '', metadata: recipe.metadata || { tags: [] }, parameters, resolvers, return: canon };
        body = buildBody(interim, { schema, referenced });
        // sys.dataType is the recipe's declared output. The editor compares it with the owner's content
        // properties, so it mirrors the owner's FULL contract (every property, every item field, even ones this
        // recipe leaves unfilled; the UI-authored recipes do exactly this). A TypeRef entry points at the child
        // Data Assembly that fills it; pointing it at the component type breaks the component editor.
        const rawProps = Object.fromEntries((targets[0] ? (discovery.raw[targets[0].kind === 'templates' ? 'templates' : 'components'] || []).find(c => c.sys.id === targets[0].id)?.contentProperties || [] : []).map(p => [p.id, p]));
        const childDaFor = (key) => { const v = recipe.return[key]; const ptr = typeof v === 'string' ? v : typeof v?.$from === 'string' ? v.$from : v?.$from?.source; const rid = ptr?.startsWith('$resolvers/') ? ptr.split('/')[1] : null; return rid ? resolvers[rid]?.dataAssembly : null; };
        const dataType = targets[0] ? targets[0].contentProperties.map(p => {
          const raw = rawProps[p.id] || {};
          const entry = { name: p.name, required: p.required, type: p.type, id: p.id };
          if (p.type === 'Array' && raw.items) entry.items = raw.items;
          if (p.type === 'TypeRef') { const child = childDaFor(p.id); if (child) entry.ref = child; else { errors.push(`${p.id}: a TypeRef property must be filled by a child recipe (resolverType "dataAssembly") so the editor can resolve it`); entry.ref = raw.ref; } }
          return entry;
        }) : [];
        const payload = { sys: { id, type: 'DataAssembly', dataType }, ...body };
        if (existingNote) {
          const norm = (d) => JSON.stringify({ parameters: (Array.isArray(d.parameters) ? d.parameters : Object.entries(d.parameters || {}).map(([pid, p]) => ({ id: pid, ...p }))).map(p => ({ ...p, required: p.required ?? true })), resolvers: Object.fromEntries(Object.entries(d.resolvers || {}).map(([k, r]) => [k, { ...r, query: (r.query || '').replace(/\s+/g, ' ').trim() }])), return: d.return }, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x);
          const part = (k) => norm({ [k]: prior[k] }) !== norm({ [k]: body[k] });
          const changed = [part('return') && 'what fills the properties', part('resolvers') && 'what is fetched', part('parameters') && 'what the editor picks', prior.name !== body.name && 'its name'].filter(Boolean);
          warnings[existingNote.at] = changed.length
            ? `"${id}" already exists in this environment ("${prior.name}"${prior.sys.publishedVersion ? ', published' : ''}); applying will UPDATE it (changes: ${changed.join(', ')})${existingNote.users.length ? ' and affect ' + existingNote.users.join(', ') : ''}. If an alternative recipe is intended, use a new id.`
            : `"${id}" already exists in this environment ("${prior.name}"${prior.sys.publishedVersion ? ', published' : ''}) and this plan builds the same recipe: applying would change nothing.`;
          unchanged = !changed.length;
        }
        // Can the component editor open it? The API saves recipes the editor can only show as "API only" (read-only:
        // they cannot be reviewed, changed or removed there), so check it against the editor's editing rules.
        editor = editorCheck(schema, payload, { ...existingDas, ...planDas, [id]: payload });
        for (const cid of Object.keys(referenced)) if (apiOnlyIds.has(cid)) editor.causes.push({ where: `child recipe "${cid}"`, why: 'is itself API only, so editors cannot change what this recipe feeds into it' });
        const where = editor.causes.map(c => `${c.where} ${c.why}`).join('; ');
        if (!editor.editable) {
          apiOnlyIds.add(id);
          if (recipe.apiOnly?.reason) warnings.push(`API ONLY (declared): the component editor will show this binding set read-only. ${where}. Reason given: ${recipe.apiOnly.reason.replace(/\.$/, '')}. Needs the user's explicit confirmation; apply needs --allow-api-only ${id}`);
          else errors.push(`API ONLY: the component editor would show this binding set read-only, so it could not be reviewed, changed or removed in the UI. ${where}. Redesign it; if no editable design meets the need, set apiOnly.reason and ask the user to confirm`);
        } else {
          if (editor.causes.length) warnings.push(`editable itself, but ${where}`);
          if (recipe.apiOnly) warnings.push('declares apiOnly but the editor can open it: remove apiOnly');
          // Everything built here is in the editor's own shape; anything else means the generator and the check disagree.
          if (editor.state !== 'editable') errors.push(`could not confirm the component editor can edit this binding set: its ${editor.rewrites.join(', ')} did not read back the way it was written. This is a fault in the skill's scripts, not in the plan; report it and do not apply this recipe`);
        }
        planDas[id] = { ...payload };
        if (!errors.length) writeFileSync(join(outDir, 'payloads', `${id}.json`), JSON.stringify({ linkTo: recipe.linkTo || [], editor: { state: editor.state, editable: editor.editable, causes: editor.causes, apiOnlyReason: recipe.apiOnly?.reason || null }, body: payload }, null, 2));
      }
      report.recipes.push({ id, name: recipe.name, linkTo: recipe.linkTo || [], editor: editor && { state: editor.state, editable: editor.editable, causes: editor.causes, rewrites: editor.rewrites, apiOnlyReason: recipe.apiOnly?.reason || null }, modifiesExisting: prior ? { name: prior.name, published: !!prior.sys.publishedVersion, unchanged } : null, errors, warnings, fills: leaves.map(l => `${l.target} ← ${l.path} (${l.type})`), queries: body ? Object.fromEntries(Object.entries(body.resolvers).filter(([, r]) => r.query).map(([k, r]) => [k, r.query])) : null, review: recipe.review || null });
    } catch (e) {
      errors.push(`build failed: ${e.message}`);
      report.recipes.push({ id, name: recipe.name, linkTo: recipe.linkTo || [], errors, warnings, fills: [], queries: null, review: recipe.review || null });
    }
    if (errors.length) report.ok = false;
  }
  writeFileSync(join(outDir, 'build.json'), JSON.stringify(report, null, 2));

  emit({
    ok: report.ok,
    recipes: report.recipes.map(r => ({ id: r.id, offeredBy: r.linkTo.map(t => `${t.kind}/${t.id}`), built: !r.errors.length, editor: r.editor ? (r.editor.editable ? 'editable' : 'apiOnly') : null, changesExisting: r.modifiesExisting ? !r.modifiesExisting.unchanged : false, errors: r.errors, warnings: r.warnings, fills: r.fills })),
    files: { report: join(outDir, 'build.json'), payloads: join(outDir, 'payloads') },
    next: report.ok ? 'Run propose, then show the proposal to the user. Nothing has been written to Contentful.' : 'Fix the errors in the plan and build again. Nothing has been written to Contentful.',
  });
  return report.ok ? 0 : 1;
}

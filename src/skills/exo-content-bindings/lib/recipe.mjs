// Recipes (Data Assemblies): write the request body, read a saved one back, and judge whether the component
// editor can edit it. No Contentful-internal package is used; `graphql` parses, prints and validates queries.
//
//   compileCollection(name, config)        "latest N of a type" resolver + its locked limit parameter
//   buildBody(interim, { schema, referenced })   plan recipe -> { metadata, name, description, parameters, resolvers, return }
//   readRecipe(da, { schema })             saved recipe -> plan-shaped recipe (or throws when the shape is unfamiliar)
//   editorCheck(schema, da, refs)          { state, editable, causes, rewrites }
//
// The generator writes one shape per pattern: the shape the component editor itself saves. It refuses anything
// else, so a recipe it builds is editable by construction, and editorCheck confirms that by reading the result
// back and regenerating it.
import { parse, print, validate, visit, visitWithTypeInfo, TypeInfo, Kind } from 'graphql';
import { fieldResolver, CONTENT_SOURCE } from './schema.mjs';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const OPS = ['$from', '$on', '$literal', '$object'];
const isOp = (v) => isObj(v) && OPS.some(o => o in v);
const listParams = (p) => Array.isArray(p) ? p : Object.entries(p || {}).map(([id, x]) => ({ id, ...x }));
const COLLECTION_ROOT = /^[a-z][A-Za-z0-9_]*?CursorCollection$/;
const isCollectionName = (n) => /CursorCollection$|Collection$/.test(n);
const collectionField = (typeName) => typeName.charAt(0).toLowerCase() + typeName.slice(1) + 'CursorCollection';
const typeOfCollectionField = (f) => { const m = f.match(/^([a-z][A-Za-z0-9_]*?)CursorCollection$/); return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : null; };
const daIdOf = (link) => link?.sys?.urn?.split('/').pop() ?? null;
const canonical = (v) => JSON.stringify(v ?? null, (k, x) => isObj(x) ? Object.fromEntries(Object.entries(x).sort()) : x);
const squash = (q) => (q || '').replace(/\s+/g, ' ').trim();

// ------------------------------------------------------------------------------------------------ collections
/**
 * config: { contentTypeName (GraphQL type name), limit?: number, order?: ['sys_publishedAt_DESC', ...], locked? }
 * The ordering is written into the query; the limit is a field of a locked Record parameter named after the resolver.
 */
export function compileCollection(name, config) {
  const order = config.order || [];
  if (order.some(o => typeof o !== 'string')) throw new Error(`collection "${name}": order must be a list of GraphQL order values such as "sys_publishedAt_DESC"`);
  if (config.limit !== undefined && !(Number.isInteger(config.limit) && config.limit > 0)) throw new Error(`collection "${name}": limit must be a positive whole number`);
  const args = [config.limit !== undefined ? 'limit: $limit' : null, order.length ? `order: [${order.join(', ')}]` : null].filter(Boolean);
  const query = print(parse(`query ${config.limit !== undefined ? '($limit: Int!) ' : ''}{ ${collectionField(config.contentTypeName)}${args.length ? `(${args.join(', ')})` : ''} { items { __typename } } }`));
  const hasLimit = config.limit !== undefined;
  return {
    resolverType: 'graphql', kind: 'collection', query,
    parameters: hasLimit ? { limit: `$parameters/${name}/limit` } : {},
    contentTypeName: config.contentTypeName,
    parameterDefinition: hasLimit ? { type: 'Record', locked: config.locked ?? true, fields: [{ type: 'Number', id: 'limit', fallbackValue: config.limit }] } : undefined,
  };
}

// ------------------------------------------------------------------------------------------------ selection tree
// What a resolver must fetch: fields (f) and per-type branches (on). A node with neither is a leaf.
const node = () => ({ f: new Map(), on: new Map() });
const child = (n, name) => { if (!n.f.has(name)) n.f.set(name, node()); return n.f.get(name); };
const arm = (n, type) => { if (!n.on.has(type)) n.on.set(type, node()); return n.on.get(type); };
const descend = (n, path) => { for (const s of path) n = child(n, s); return n; };
const segs = (p) => String(p).split('/').filter(Boolean);
function merge(into, from) { for (const [k, v] of from.f) merge(child(into, k), v); for (const [k, v] of from.on) merge(arm(into, k), v); }
function addSelect(n, sel, where) {
  if (typeof sel === 'string') { descend(n, segs(sel)); return; }
  if (!isObj(sel)) throw new Error(`${where}: a selection must be a field path, a map of them, $on or $from`);
  if ('$literal' in sel) return;
  if ('$object' in sel) throw new Error(`${where}: $object is not supported; write the object shape directly`);
  if ('$on' in sel) { for (const [t, sub] of Object.entries(sel.$on?.type || {})) addSelect(arm(n, t), sub, where); return; }
  if ('$from' in sel) {
    const f = sel.$from; const source = typeof f === 'string' ? f : f?.source;
    if (typeof source !== 'string' || source.startsWith('$')) throw new Error(`${where}: inside a selection, $from.source is a field path relative to the entry being read`);
    const at = descend(n, segs(source));
    if (isObj(f) && f.select !== undefined) addSelect(at, f.select, where);
    return;
  }
  for (const v of Object.values(sel)) addSelect(n, v, where);
}
function printNode(n) {
  const parts = [];
  for (const name of [...n.f.keys()].sort()) { const c = n.f.get(name); parts.push(c.f.size || c.on.size ? `${name} { ${c.on.size ? '__typename ' : ''}${printNode(c)} }` : name); }
  for (const t of [...n.on.keys()].sort((a, b) => a.localeCompare(b))) parts.push(`... on ${t} { ${printNode(n.on.get(t))} }`);
  return parts.join(' ');
}
/** A rich text field is read as its JSON document: `field { document: json }`. */
function withRichText(doc, gql) {
  const info = new TypeInfo(gql);
  return visit(doc, visitWithTypeInfo(info, { Field(f) {
    if (f.selectionSet || fieldResolver(info.getFieldDef()?.astNode)?.kind !== 'rich-text') return undefined;
    return { ...f, selectionSet: { kind: Kind.SELECTION_SET, selections: [{ kind: Kind.FIELD, alias: { kind: Kind.NAME, value: 'document' }, name: { kind: Kind.NAME, value: 'json' } }] } };
  } }));
}
function finishQuery(text, rid, gql) {
  const doc = withRichText(parse(text), gql);
  const problems = validate(gql, doc);
  if (problems.length) {
    const msgs = [...new Set(problems.map(e => e.message))];
    const hint = msgs.some(m => /inline fragment|on type "\w+(Item|Collection)?"/.test(m) && /Cannot query field/.test(m)) ? ' A reference the schema types as a union must be selected with $on { type: { <TypeName>: … } }, even when only one content type is allowed.' : '';
    throw new Error(`the query for resolver "${rid}" does not fit this environment's schema: ${msgs.slice(0, 3).join(' | ')}.${hint}`);
  }
  return print(doc);
}

// ------------------------------------------------------------------------------------------------ build
/**
 * interim: { name, description, metadata, parameters, resolvers, return } in the plan's shape:
 *   parameters  [{ id, name, required?, allowedTypes: [GraphQL type names] }] or any other parameter as the API stores it
 *   resolvers   { r: { resolverType: 'graphql', parameters: { id: '$parameters/p' } }                       entry
 *                 r: compileCollection(...)                                                               collection
 *                 r: { resolverType: 'dataAssembly', dataAssembly: link, parameters: { childParam: ptr } } nested recipe
 *   return      { prop: { $from: '$resolvers/<nested>' } | { $from: { source: '$resolvers/<r>[/path]', select } } }
 * referenced: child Data Assemblies by id (to know whether a child parameter takes an entry).
 */
export function buildBody(interim, { schema, referenced = {} }) {
  const params = listParams(interim.parameters);
  const ids = new Set(); for (const p of params) { if (ids.has(p.id)) throw new Error(`duplicate parameter id "${p.id}"`); ids.add(p.id); }
  const parameters = params.map(({ id, required, ...p }) => {
    if (!('allowedTypes' in p)) return { id, required: required ?? true, ...p };
    const base = { id, required: required ?? true, name: p.name, ...(p.description !== undefined && { description: p.description }) };
    if (p.type === 'Contentful:Asset') return { ...base, type: 'ResourceLink', allowedResources: [{ type: 'Contentful:Asset', source: CONTENT_SOURCE }] };
    const allowedTypes = p.allowedTypes.map(t => { const cid = schema.nameToId.get(t); if (cid === undefined) throw new Error(`parameter ${id}: "${t}" is not a content type in this environment`); return cid; });
    return { ...base, type: 'ResourceLink', allowedResources: [{ type: 'Contentful:Entry', source: p.source || CONTENT_SOURCE, allowedTypes }] };
  });

  const resolvers = interim.resolvers || {};
  const kindOf = (rid) => { const r = resolvers[rid]; return !r ? null : r.resolverType === 'dataAssembly' ? 'nested' : r.kind === 'collection' ? 'collection' : r.resolverType === 'graphql' ? 'entry' : null; };
  const trees = new Map(Object.keys(resolvers).map(rid => [rid, node()]));
  const splitPtr = (ptr, where) => { const [scope, rid, ...rest] = segs(ptr); if (scope !== '$resolvers' || !rid) throw new Error(`${where}: must start from a resolver ($resolvers/<name>…)`); if (!kindOf(rid)) throw new Error(`${where}: unknown or unsupported resolver "${rid}"`); return { rid, rest }; };

  const ret = {};
  for (const [key, v] of Object.entries(interim.return || {})) {
    const f = isObj(v) ? v.$from : undefined;
    if (typeof f === 'string') {
      const { rid, rest } = splitPtr(f, key);
      if (kindOf(rid) !== 'nested' || rest.length) throw new Error(`${key}: { $from: "${f}" } takes a whole nested recipe; "${rid}" ${kindOf(rid) === 'nested' ? 'cannot be read field by field' : 'is not one'}`);
      ret[key] = { $from: `$resolvers/${rid}` }; continue;
    }
    if (!isObj(f) || typeof f.source !== 'string' || f.select === undefined) throw new Error(`${key}: write it as { $from: { source: "$resolvers/<name>…", select } } or { $from: "$resolvers/<nested recipe>" }`);
    const { rid, rest } = splitPtr(f.source, key);
    if (kindOf(rid) === 'nested') throw new Error(`${key}: a nested recipe is taken whole: { $from: "$resolvers/${rid}" }`);
    addSelect(descend(trees.get(rid), rest), f.select, key);
    ret[key] = { $from: { source: ['$resolvers', rid, ...(kindOf(rid) === 'entry' ? ['_node'] : []), ...rest].join('/'), select: f.select } };
  }

  // what each nested recipe is fed: an editor pick passes straight through; a reference on a read entry is passed as its id
  const feeds = {};
  for (const [rid, r] of Object.entries(resolvers)) {
    if (kindOf(rid) !== 'nested') continue;
    const childParams = listParams(referenced[daIdOf(r.dataAssembly)]?.parameters);
    const takesEntity = (name) => { const d = childParams.find(p => p.id === name); return d?.type === 'ResourceLink' && (d.allowedResources || []).some(a => a.type === 'Contentful:Entry' || a.type === 'Contentful:Asset'); };
    feeds[rid] = {};
    for (const [name, b] of Object.entries(isObj(r.parameters) ? r.parameters : {})) {
      const where = `resolver ${rid}, parameter ${name}`;
      if (typeof b === 'string') { if (!b.startsWith('$')) throw new Error(`${where}: expected a pointer ($parameters/… or $resolvers/…)`); feeds[rid][name] = b; continue; }
      const f = isObj(b) ? b.$from : undefined;
      if (!isObj(f) || typeof f.source !== 'string') throw new Error(`${where}: write it as "$parameters/<pick>" or { $from: { source: "$resolvers/<entry resolver>", select: "<reference field>" } }`);
      const { rid: src, rest } = splitPtr(f.source, where);
      if (kindOf(src) !== 'entry') throw new Error(`${where}: can only be fed from an entry resolver`);
      const id = takesEntity(name) ? ['_id'] : [];
      if (typeof f.select === 'string' || f.select === undefined) {
        const path = [...rest, ...segs(f.select || ''), ...id];
        if (!path.length) throw new Error(`${where}: select the reference field to pass on`);
        descend(trees.get(src), path); feeds[rid][name] = ['$resolvers', src, '_node', ...path].join('/');
      } else if (isObj(f.select) && isObj(f.select.$on?.type) && Object.values(f.select.$on.type).every(x => typeof x === 'string')) {
        const select = { $on: { type: Object.fromEntries(Object.entries(f.select.$on.type).map(([t, p]) => [t, [...segs(p), ...id].join('/')])) } };
        addSelect(descend(trees.get(src), rest), select, where);
        feeds[rid][name] = { $from: { source: ['$resolvers', src, '_node', ...rest].join('/'), select } };
      } else throw new Error(`${where}: select must be a field path, or $on with one field path per content type`);
    }
  }

  const out = {};
  for (const [rid, r] of Object.entries(resolvers)) {
    const kind = kindOf(rid), tree = trees.get(rid);
    if (kind === 'nested') { out[rid] = { source: 'Contentful:DataAssembly', dataAssembly: r.dataAssembly, parameters: feeds[rid] }; continue; }
    if (kind === 'collection') {
      const doc = parse(r.query); const root = doc.definitions[0]?.selectionSet.selections[0];
      const field = root?.name?.value; const items = tree.f.get(field)?.f.get('items');
      if ([...tree.f.keys()].some(k => k !== field) || tree.on.size) throw new Error(`resolver ${rid}: a collection is read as $resolvers/${rid}/${field}/items`);
      const extra = items ? printNode(items) : '';
      out[rid] = { source: 'Contentful:GraphQL', query: finishQuery(print(doc).replace(/items \{\s*__typename\s*\}/, `items { __typename ${extra} }`), rid, schema.gql), parameters: r.parameters || {} };
      continue;
    }
    if (kind !== 'entry') throw new Error(`resolver ${rid}: describe it as an entry resolver, a nested recipe or the collection shorthand; hand-written queries are not accepted`);
    if (!tree.f.size && !tree.on.size) continue;                       // nothing reads it
    if (!isObj(r.parameters) || !('id' in r.parameters)) throw new Error(`resolver ${rid}: parameters.id must point at the editor pick it reads ($parameters/<id>)`);
    if (tree.f.size) {                                                 // fields read without a type branch belong to the pick's one allowed type
      const pick = params.find(p => `$parameters/${p.id}` === r.parameters.id);
      if (pick?.allowedTypes?.length !== 1) throw new Error(`resolver ${rid}: its editor pick allows ${pick?.allowedTypes?.length ? 'several content types' : 'no known content type'}; select with $on { type: { <TypeName>: … } }`);
      const fields = node(); fields.f = tree.f; tree.f = new Map(); merge(arm(tree, pick.allowedTypes[0]), fields);
    }
    out[rid] = { source: 'Contentful:GraphQL', query: finishQuery(`query ($id: ID!) { _node(id: $id) { __typename ${printNode(tree)} } }`, rid, schema.gql), parameters: r.parameters };
  }
  return { metadata: interim.metadata ?? { tags: [] }, name: interim.name ?? '', description: interim.description ?? '', parameters, resolvers: out, return: ret };
}

// ------------------------------------------------------------------------------------------------ read back
function parseCollection(resolver, daParams) {
  // -> config, or null when the query is a collection the editor cannot describe. Mirrors what the editor accepts:
  // one root field `<type>CursorCollection`, only `limit` and `order` arguments, limit bound to a Record parameter field.
  const doc = parse(resolver.query);
  const ops = doc.definitions.filter(d => d.kind === Kind.OPERATION_DEFINITION);
  const roots = ops.length === 1 ? ops[0].selectionSet.selections.filter(s => s.kind === Kind.FIELD) : [];
  if (roots.length !== 1 || !COLLECTION_ROOT.test(roots[0].name.value)) return null;
  const contentTypeName = typeOfCollectionField(roots[0].name.value); if (!contentTypeName) return null;
  const record = (variable) => {
    const b = isObj(resolver.parameters) ? resolver.parameters[variable] : undefined;
    const m = typeof b === 'string' ? b.match(/^\$parameters\/([^/]+)\/([^/]+)$/) : null;
    if (!m || m[2] !== variable) return undefined;
    const def = listParams(daParams).find(p => p.id === m[1]);
    return def?.type === 'Record' ? def : undefined;
  };
  const config = { contentTypeName, field: roots[0].name.value };
  for (const a of roots[0].arguments || []) {
    if (a.name.value === 'limit') {
      if (a.value.kind === Kind.INT) { config.limit = parseInt(a.value.value, 10); continue; }
      if (a.value.kind !== Kind.VARIABLE) return null;
      const v = a.value.name.value; const b = isObj(resolver.parameters) ? resolver.parameters[v] : undefined;
      if (typeof b === 'string') {
        const fld = (record(v)?.fields || []).find(x => x?.id === v);
        if (!fld) throw new Error(`limit is bound to ${b}, which is not a field of a Record parameter`);
        if (isObj(fld.validation) && typeof fld.validation.min === 'number' && typeof fld.validation.max === 'number') { config.limit = fld.validation.max; config.limitRange = fld.validation; }
        else if (Number.isInteger(fld.fallbackValue)) config.limit = fld.fallbackValue;
        else if (!Array.isArray(fld.fallbackValue)) throw new Error('limit has a non-integer fallback value');
        config.parameter = b.split('/')[1];
        continue;
      }
      if (isObj(b) && Number.isInteger(b.$literal)) { config.limit = b.$literal; config.literalLimit = true; continue; }
      return null;
    }
    if (a.name.value === 'order') {
      if (a.value.kind === Kind.VARIABLE) { const fld = (record(a.value.name.value)?.fields || []).find(x => x?.id === a.value.name.value && x.type === 'OrderExpression'); if (!Array.isArray(fld?.fallbackValue)) return null; config.order = fld.fallbackValue; config.editableOrder = true; continue; }
      if (a.value.kind !== Kind.LIST || a.value.values.some(x => x.kind !== Kind.ENUM)) return null;
      config.order = a.value.values.map(x => x.value); continue;
    }
    return null;                                                       // where:, skip:, anything else
  }
  const lim = record('limit'); if (lim?.locked === false) config.locked = false;
  return config;
}
function isEntityQuery(doc) {
  const [d] = doc.definitions;
  if (doc.definitions.length !== 1 || d.kind !== Kind.OPERATION_DEFINITION || d.operation !== 'query' || d.variableDefinitions?.length !== 1 || d.selectionSet.selections.length !== 1) return false;
  const v = d.variableDefinitions[0];
  if (v.variable.name.value !== 'id' || v.type.kind !== Kind.NON_NULL_TYPE || v.type.type.kind !== Kind.NAMED_TYPE || v.type.type.name.value !== 'ID') return false;
  const s = d.selectionSet.selections[0];
  return s.kind === Kind.FIELD && s.name.value === '_node' && s.arguments?.length === 1 && s.arguments[0].name.value === 'id' && s.arguments[0].value.kind === Kind.VARIABLE && s.arguments[0].value.name.value === 'id';
}
const hasCollectionRoot = (doc) => doc.definitions.some(d => d.kind === Kind.OPERATION_DEFINITION && d.selectionSet.selections.some(s => s.kind === Kind.FIELD && COLLECTION_ROOT.test(s.name.value)));

/**
 * A saved Data Assembly in the plan's shape, so it can be described in plain language and regenerated.
 * Throws when a part is in a shape this skill does not write (the caller then reports the raw recipe).
 */
export function readRecipe(da, { schema }) {
  const parameters = listParams(da.parameters).map(p => {
    const entry = p.type === 'ResourceLink' && (p.allowedResources || []).length === 1 && p.allowedResources[0].type === 'Contentful:Entry' && p.allowedResources[0].source === CONTENT_SOURCE ? p.allowedResources[0] : null;
    if (!entry) return { ...p };
    const { allowedResources, type, ...rest } = p;
    return { ...rest, allowedTypes: (entry.allowedTypes || []).map(id => schema.idToName.get(id) ?? id), type: 'Contentful:Entry', source: entry.source };
  });
  const resolvers = {}; const kinds = {};
  for (const [rid, r] of Object.entries(da.resolvers || {})) {
    if (r.source === 'Contentful:DataAssembly') { kinds[rid] = 'nested'; resolvers[rid] = null; continue; }   // filled below, order kept
    if (r.source !== 'Contentful:GraphQL') throw new Error(`resolver "${rid}" has an unfamiliar source "${r.source}"`);
    const doc = parse(r.query);
    if (hasCollectionRoot(doc)) {
      const c = parseCollection(r, da.parameters);
      if (!c) throw new Error(`resolver "${rid}" is a collection query with arguments other than limit and order`);
      kinds[rid] = 'collection';
      const { parameterDefinition, ...compiled } = compileCollection(c.parameter || rid, { contentTypeName: c.contentTypeName, limit: c.limit, order: c.editableOrder ? undefined : c.order, locked: c.locked });
      resolvers[rid] = { ...compiled, parameters: r.parameters || {}, order: c.order, limit: c.limit, field: c.field };
    } else {
      if (!isEntityQuery(doc)) throw new Error(`resolver "${rid}" is a hand-written query (not _node(id: $id))`);
      kinds[rid] = 'entry'; resolvers[rid] = { resolverType: 'graphql', parameters: r.parameters };
    }
  }
  // "$resolvers/<entry>/_node/a/b" -> { rid, path: [a, b] }
  const split = (ptr) => { const [scope, rid, ...rest] = segs(ptr); if (scope !== '$resolvers' || !kinds[rid]) throw new Error(`"${ptr}" does not start from a resolver of this recipe`); return { rid, path: kinds[rid] === 'entry' && rest[0] === '_node' ? rest.slice(1) : rest }; };
  for (const [rid, r] of Object.entries(da.resolvers || {})) {
    if (kinds[rid] !== 'nested') continue;
    const feeds = {};
    for (const [name, b] of Object.entries(isObj(r.parameters) ? r.parameters : {})) {
      const strip = (p) => segs(p).filter((s, i, a) => !(i === a.length - 1 && s === '_id')).join('/');
      if (typeof b === 'string' && b.startsWith('$resolvers/')) { const { rid: src, path } = split(b); feeds[name] = { $from: { source: `$resolvers/${src}`, select: strip(path.join('/')) } }; }
      else if (isObj(b?.$from) && typeof b.$from.source === 'string' && isObj(b.$from.select?.$on?.type)) { const { rid: src, path } = split(b.$from.source); feeds[name] = { $from: { source: ['$resolvers', src, ...path].join('/'), select: { $on: { type: Object.fromEntries(Object.entries(b.$from.select.$on.type).map(([t, p]) => [t, typeof p === 'string' ? strip(p) : p])) } } } }; }
      else feeds[name] = b;
    }
    resolvers[rid] = { resolverType: 'dataAssembly', dataAssembly: r.dataAssembly, parameters: feeds };
  }
  const ret = {};
  for (const [key, v] of Object.entries(da.return || {})) {
    if (typeof v !== 'string' && !isObj(v)) continue;                  // a bare number / true / null: the editor drops it
    const ptr = typeof v === 'string' ? v : typeof v?.$from === 'string' ? v.$from : null;
    if (ptr !== null) { const { rid, path } = split(ptr); ret[key] = kinds[rid] === 'nested' && !path.length ? { $from: `$resolvers/${rid}` } : { $from: { source: `$resolvers/${rid}`, select: path.join('/') } }; continue; }
    if (!isObj(v?.$from) || typeof v.$from.source !== 'string') throw new Error(`content property "${key}" is not read from a resolver`);
    const { rid, path } = split(v.$from.source);
    ret[key] = { $from: { source: ['$resolvers', rid, ...path].join('/'), ...(v.$from.select !== undefined && { select: v.$from.select }) } };
  }
  return { id: da.sys?.id ?? '', name: da.name, description: da.description, metadata: da.metadata, parameters, resolvers, return: ret, kinds };
}

// ------------------------------------------------------------------------------------------------ editor check
// The component editor opens a recipe only when it fits its editing model; otherwise it shows the binding set as
// "API only" (visible, but it cannot be reviewed, changed or removed there). The Management API response does not
// say which. These are the editor's rules as of November 2026, checked against editor-authored and API-authored
// recipes (references/platform-notes.md, "API-only recipes"). They are a copy, not the editor's code: if the editor
// changes, this can be out of date, which is why the skill asks the user to open the component after applying.
const DEPTH = 4;
function lintExpression(v, where, inSelect, da, causes) {
  const bad = (why) => causes.push({ where, why });
  const pointer = (p) => {
    const s = segs(p);
    if (/\/\d+(\/|$)/.test(p)) bad(`takes one item out of a list by position (${p}). The editor cannot show "the Nth item"; make it its own editor pick, or feed a nested recipe from a parameter`);
    if (s[0] === '$parameters') { if (!inSelect) bad('reads a parameter directly; read the picked entry through a resolver'); if (s.length - 2 > DEPTH) bad(`selects more than ${DEPTH} levels deep (${p}); move part of the path into a nested recipe`); return 'parameters'; }
    if (s[0] === '$resolvers') { if (s.length - 3 > DEPTH) bad(`selects more than ${DEPTH} levels deep (${p}); move part of the path into a nested recipe`); return s[1] ? 'resolver' : null; }
    if (s.length > DEPTH) bad(`selects more than ${DEPTH} levels deep (${p}); move part of the path into a nested recipe`);
    return null;
  };
  if (typeof v === 'string') { pointer(v); return; }
  if (!isObj(v)) return;                                               // a bare number / true / null: see unparsable()
  if ('$literal' in v) { if (!inSelect) bad('returns a fixed value. The editor cannot show constants; leave the property unbound so the component default applies, or fill it from a field'); return; }
  if ('$object' in v) { if (!inSelect) bad('uses an explicit $object; write the object shape directly'); for (const x of Object.values(isObj(v.$object) ? v.$object : {})) lintExpression(x, where, inSelect, da, causes); return; }
  if ('$on' in v) { for (const x of Object.values(v.$on?.type || {})) lintExpression(x, where, inSelect, da, causes); if (v.$on?.default !== undefined) lintExpression(v.$on.default, where, inSelect, da, causes); return; }
  if ('$from' in v) {
    const f = v.$from; if (typeof f === 'string') { pointer(f); return; }
    const scope = pointer(f?.source ?? '');
    if (f?.select !== undefined) lintExpression(f.select, where, inSelect || scope === 'resolver', da, causes);
    return;
  }
  for (const x of Object.values(v)) lintExpression(x, where, inSelect, da, causes);
}
/** A bare number, boolean, null or list where a pointer belongs. The editor's parser gives up on the whole return
 *  when it meets one, skips its expression rules, and drops the value on first save. */
const unparsable = (v) => typeof v === 'string' ? false : !isObj(v) ? true : isOp(v) ? false : Object.values(v).some(unparsable);
/** Bare-string returns ("$resolvers/x/…") that the editor cannot attribute to a field mapping. */
function lintShorthand(v, where, da, schema, causes) {
  if (isObj(v) && !isOp(v)) { for (const x of Object.values(v)) lintShorthand(x, where, da, schema, causes); return; }
  if (typeof v !== 'string') return;
  const [scope, rid, ...rest] = segs(v); const r = scope === '$resolvers' ? da.resolvers?.[rid] : null; if (!r) return;
  if (r.source === 'Contentful:DataAssembly') { if (rest.length) causes.push({ where, why: `reads one value out of nested recipe "${rid}"; a nested recipe is taken whole ({ "$from": "$resolvers/${rid}" })` }); return; }
  if (r.source !== 'Contentful:GraphQL' || !queryIsValid(r.query, schema)) return;
  if (!rest.length) { causes.push({ where, why: `returns everything resolver "${rid}" fetched; map a field` }); return; }
  const picks = (isObj(r.parameters) ? Object.values(r.parameters) : [r.parameters]).map(p => typeof p === 'string' && /^\$parameters\/[^/]+$/.test(p) ? p.split('/')[1] : isObj(p) && typeof p.$from === 'string' && /^\$parameters\/[^/]+$/.test(p.$from) ? p.$from.split('/')[1] : null).filter(Boolean);
  const several = picks.some(id => { const d = listParams(da.parameters).find(p => p.id === id); const e = (d?.allowedResources || []).find(a => a.type === 'Contentful:Entry' && a.source === CONTENT_SOURCE); return (e?.allowedTypes || []).filter(t => schema.idToName.has(t)).length > 1; });
  if (several) causes.push({ where, why: `is a bare path on a pick that allows several content types; select with $on { type: { <TypeName>: … } }` });
}
function queryIsValid(query, schema) { try { return validate(schema.gql, parse(query)).length === 0; } catch { return false; } }
/** A `limit` on a reference list inside a query must be a plain whole number on a plain selection. */
function lintReferenceLimits(doc, causes, where) {
  const seen = new Map();
  const walk = (set, path, depth, tainted) => { for (const s of set.selections) {
    if (s.kind === Kind.INLINE_FRAGMENT) { walk(s.selectionSet, s.typeCondition ? [...path, `on ${s.typeCondition.name.value}`] : path, depth, tainted || !!s.directives?.length); continue; }
    if (s.kind !== Kind.FIELD) continue;
    const here = depth === 0 && s.name.value === '_node' ? path : [...path, s.name.value];
    const t = tainted || !!(s.alias || s.directives?.length);
    const limit = depth > 0 && isCollectionName(s.name.value) ? s.arguments?.find(a => a.name.value === 'limit') : null;
    if (limit) {
      const n = limit.value.kind === Kind.INT ? Number(limit.value.value) : NaN; const key = here.join('/');
      if (s.arguments.length > 1) causes.push({ where, why: `limits the reference list "${s.name.value}" together with other arguments` });
      else if (t || !Number.isInteger(n) || n < 1 || n > 1000) causes.push({ where, why: `limits the reference list "${s.name.value}" with something other than a whole number from 1 to 1000 on a plain selection` });
      else if (seen.has(key) && seen.get(key) !== n) causes.push({ where, why: `gives the reference list "${s.name.value}" two different limits` });
      else seen.set(key, n);
    }
    if (s.selectionSet) walk(s.selectionSet, here, depth + 1, t);
  } };
  for (const d of doc.definitions) {
    if (d.kind === Kind.OPERATION_DEFINITION) walk(d.selectionSet, [], 0, false);
    else if (d.kind === Kind.FRAGMENT_DEFINITION) visit(d, { Field(f) { if (isCollectionName(f.name.value) && f.arguments?.some(a => a.name.value === 'limit')) causes.push({ where, why: 'limits a reference list inside a named fragment' }); } });
  }
}

/**
 * Can the component editor edit this Data Assembly (a saved entity or a buildBody payload)?
 * refs: every Data Assembly it may reference, by id. Returns
 *   { state, editable, causes: [{ where, why }], rewrites: [part] }
 *   state 'editable'    fits the editor's rules and is exactly what this skill (and the editor) would write
 *         'unverified'  fits the editor's rules as far as this check knows them, but is in another shape: the editor
 *                       should open it and would rewrite the listed parts on first save. Confirm in the component editor.
 *         'apiOnly'     breaks a rule, or cannot be read back at all: the editor shows it read-only (or cannot open
 *                       it). causes says which part and why.
 *   editable is false only for 'apiOnly'.
 */
export function editorCheck(schema, da, refs = {}) {
  const causes = [];
  const skipExpressionRules = unparsable(da.return || {});
  for (const [k, v] of Object.entries(da.return || {})) { const where = `content property "${k}"`; if (!skipExpressionRules) lintExpression(v, where, false, da, causes); lintShorthand(v, where, da, schema, causes); }
  for (const [rid, r] of Object.entries(da.resolvers || {})) {
    const where = `resolver "${rid}"`;
    if (r.source === 'Contentful:GraphQL') {
      let doc; try { doc = parse(r.query); } catch (e) { causes.push({ where, why: `has a query that does not parse (${e.message.slice(0, 80)})` }); continue; }
      lintReferenceLimits(doc, causes, where);
      if (hasCollectionRoot(doc)) {
        let c; try { c = queryIsValid(r.query, schema) ? parseCollection(r, da.parameters) : undefined; } catch { c = undefined; }
        if (c === null) causes.push({ where, why: 'is a collection query the editor cannot describe (it understands one <type>CursorCollection with a limit and an order, nothing else); use the collection shorthand' });
      } else if (!isEntityQuery(doc)) {
        const root = doc.definitions.find(d => d.kind === Kind.OPERATION_DEFINITION)?.selectionSet.selections.find(s => s.kind === Kind.FIELD)?.name.value;
        causes.push({ where, why: `uses a hand-written query${root && root !== '_node' ? ` rooted at "${root}(…)"` : ''} instead of query ($id: ID!) { _node(id: $id) … }; describe it as an entry resolver or the collection shorthand and let build.mjs write the query` });
      } else if (!isObj(r.parameters) || isOp(r.parameters) || !('id' in r.parameters)) causes.push({ where, why: 'does not bind the query\'s id to an editor pick (parameters.id)' });
    }
    if (r.parameters !== undefined) { const before = causes.length; lintExpression(isObj(r.parameters) && !isOp(r.parameters) ? r.parameters : { _: r.parameters }, where, true, da, causes); for (const c of causes.slice(before)) c.why = `feeds a parameter that ${c.why}`; }
  }
  const unique = causes.filter((c, i) => causes.findIndex(x => x.where === c.where && x.why === c.why) === i);
  if (unique.length) return { state: 'apiOnly', editable: false, causes: unique, rewrites: [], note: null };
  // No rule is broken. Read it back as field mappings: where that fails, the editor's own reader hit the same wall
  // and could not open the binding set, so it counts as not editable.
  let plan;
  try { plan = readRecipe(da, { schema }); }
  catch (e) { return { state: 'apiOnly', editable: false, causes: [{ where: 'recipe', why: `breaks no single rule but cannot be read back as field mappings (${e.message.slice(0, 160)}); the editor is unlikely to open it` }], rewrites: [] }; }
  // Then regenerate it. Identical -> it is already in the editor's own shape.
  let rewrites = [];
  try {
    const rebuilt = buildBody(plan, { schema, referenced: refs });
    const q = (rs) => Object.fromEntries(Object.entries(rs || {}).map(([k, r]) => [k, { ...r, query: squash(r.query) }]));
    if (canonical(rebuilt.return) !== canonical(da.return)) rewrites.push('return');
    if (canonical(q(rebuilt.resolvers)) !== canonical(q(da.resolvers))) rewrites.push('resolvers');
    if (canonical(rebuilt.parameters) !== canonical(listParams(da.parameters).map(p => ({ ...p, required: p.required ?? true })))) rewrites.push('parameters');
  } catch { rewrites = ['return', 'resolvers', 'parameters']; }
  return { state: rewrites.length ? 'unverified' : 'editable', editable: true, causes: [], rewrites };
}

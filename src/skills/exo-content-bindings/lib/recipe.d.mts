import type { Schema } from './schema.mjs';

/** A pointer expression as the Data Assembly API stores it: a path, a map of them, `$from`, `$on`, `$literal`. */
export type Expression = string | number | boolean | null | { [key: string]: Expression };

export interface Resolver {
  resolverType?: 'graphql' | 'dataAssembly';
  kind?: 'collection';
  query?: string;
  contentTypeName?: string;
  dataAssembly?: { sys: { type: 'ResourceLink'; linkType: string; urn: string } };
  parameters?: Expression;
  [key: string]: unknown;
}
/** A recipe in the plan's shape (references/plan-format.md), without the skill-only keys. */
export interface Recipe {
  id?: string;
  name?: string;
  description?: string;
  metadata?: unknown;
  parameters?: Record<string, unknown>[] | Record<string, Record<string, unknown>>;
  resolvers?: Record<string, Resolver>;
  return?: Record<string, Expression>;
}
/** A Data Assembly as the Management API stores it (or a request body with `sys.id`). */
export interface DataAssembly {
  sys?: { id?: string; [key: string]: unknown };
  metadata?: unknown;
  name?: string;
  description?: string;
  parameters?: Record<string, unknown>[] | Record<string, Record<string, unknown>>;
  resolvers?: Record<string, { source?: string; query?: string; parameters?: Expression; [key: string]: unknown }>;
  return?: Record<string, Expression>;
}
export interface DataAssemblyBody {
  metadata: unknown;
  name: string;
  description: string;
  parameters: Record<string, unknown>[];
  resolvers: Record<string, { source: string; query?: string; parameters?: Expression; [key: string]: unknown }>;
  return: Record<string, Expression>;
}
export interface CollectionResolver extends Resolver {
  resolverType: 'graphql';
  kind: 'collection';
  query: string;
  contentTypeName: string;
  parameterDefinition?: { type: 'Record'; locked: boolean; fields: Record<string, unknown>[] };
}
export interface EditorVerdict {
  /** `editable`: the shape the editor saves. `unverified`: fits the rules, another shape. `apiOnly`: read-only in the editor. */
  state: 'editable' | 'unverified' | 'apiOnly';
  editable: boolean;
  causes: { where: string; why: string }[];
  rewrites: string[];
}

export function compileCollection(
  name: string,
  config: { contentTypeName: string; limit?: number; order?: string[]; locked?: boolean },
): CollectionResolver;
export function buildBody(
  recipe: Recipe,
  options: { schema: Schema; referenced?: Record<string, DataAssembly> },
): DataAssemblyBody;
export function readRecipe(dataAssembly: DataAssembly, options: { schema: Schema }): Recipe & { kinds: Record<string, string> };
export function editorCheck(schema: Schema, dataAssembly: DataAssembly, references?: Record<string, DataAssembly>): EditorVerdict;

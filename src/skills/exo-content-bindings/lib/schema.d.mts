import type { GraphQLSchema } from 'graphql';

export interface ResourceLink {
  sys: { type: 'ResourceLink'; linkType: string; urn: string };
}
export interface FieldShape {
  type: string;
  ref?: ResourceLink;
  source?: string;
  required?: boolean;
  discriminator?: string;
  members?: FieldShape[];
}
export interface Field extends FieldShape {
  /** GraphQL field name, e.g. `itemsCursorCollection`. */
  id: string;
  /** Content type field id as editors know it, e.g. `items`. */
  name: string;
  required: boolean;
  /** Internal CMA field id from the schema directive. */
  fieldId: string;
  contentTypeId?: string;
  items?: FieldShape;
  isOpenEnded?: boolean;
  /** The schema types this reference (or the list's items) as a union: select through it with `$on`. */
  branch?: boolean;
}
export interface RootType {
  name: string;
  type: 'TypeRef';
  ref: ResourceLink;
  source?: string;
}
export interface Schema {
  gql: GraphQLSchema;
  roots: RootType[];
  rootByName: Record<string, RootType>;
  rootById: Record<string, RootType>;
  assetRoot: RootType | null;
  idToName: Map<string, string>;
  nameToId: Map<string, string>;
  getFields(ref: ResourceLink): Record<string, Field>;
  unsupported: { type: string; field: string; reason: string }[];
}
export interface Credentials {
  token: string;
  spaceId: string;
  environmentId: string;
  baseUrl: string;
}

export const CONTENT_SOURCE: string;
export function schemaFromSdl(sdl: string): Schema;
export function fetchSdl(creds: Credentials, logPath?: string): Promise<string>;
export function loadSchema(creds: Credentials, logPath?: string): Promise<Schema>;

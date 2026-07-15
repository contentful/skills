import { type, action } from '@contentful/skill-kit';
import { dirname, join, resolve } from 'node:path';
import { readdir, readFile, stat } from 'node:fs/promises';
import { CredentialsScanResult, type EnvVarInfo } from '../schemas.js';

const PUBLIC_PREFIXES = ['NEXT_PUBLIC_', 'GATSBY_', 'REACT_APP_', 'VITE_', 'EXPO_PUBLIC_'] as const;

interface KnownEnvVar {
  name: string;
  aliases: string[];
  secret: boolean;
  allowPublicPrefix: boolean;
}

const KNOWN_ENV_VARS: KnownEnvVar[] = [
  {
    name: 'NINETAILED_API_KEY',
    aliases: ['NINETAILED_API_KEY', 'NINETAILED_CLIENT_ID'],
    secret: true,
    allowPublicPrefix: true,
  },
  {
    name: 'NINETAILED_ENVIRONMENT',
    aliases: ['NINETAILED_ENVIRONMENT'],
    secret: false,
    allowPublicPrefix: true,
  },
  {
    name: 'OPTIMIZATION_CLIENT_ID',
    aliases: ['OPTIMIZATION_CLIENT_ID'],
    secret: false,
    allowPublicPrefix: true,
  },
  {
    name: 'OPTIMIZATION_ENVIRONMENT',
    aliases: ['OPTIMIZATION_ENVIRONMENT'],
    secret: false,
    allowPublicPrefix: true,
  },
  {
    name: 'CONTENTFUL_SPACE_ID',
    aliases: ['CONTENTFUL_SPACE_ID'],
    secret: false,
    allowPublicPrefix: true,
  },
  {
    name: 'CONTENTFUL_ACCESS_TOKEN',
    aliases: ['CONTENTFUL_ACCESS_TOKEN', 'CONTENTFUL_TOKEN', 'CONTENTFUL_DELIVERY_TOKEN'],
    secret: true,
    allowPublicPrefix: true,
  },
  {
    name: 'CONTENTFUL_PREVIEW_TOKEN',
    aliases: ['CONTENTFUL_PREVIEW_TOKEN', 'CONTENTFUL_PREVIEW_ACCESS_TOKEN'],
    secret: true,
    allowPublicPrefix: true,
  },
  {
    name: 'CONTENTFUL_MANAGEMENT_TOKEN',
    aliases: ['CONTENTFUL_MANAGEMENT_TOKEN', 'CONTENTFUL_CMA_TOKEN'],
    secret: true,
    // A CMA token represents the user's management identity. Never accept a value
    // exposed through a framework's browser-visible environment-variable prefix.
    allowPublicPrefix: false,
  },
  {
    name: 'CONTENTFUL_ENVIRONMENT',
    aliases: ['CONTENTFUL_ENVIRONMENT'],
    secret: false,
    allowPublicPrefix: true,
  },
];

interface EnvSource {
  label: string;
  values: Record<string, string>;
}

function maskValue(value: string): string {
  if (value.length <= 8) return '****';
  return value.slice(0, 8) + '****';
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function findSearchDirectories(projectPath: string): Promise<string[]> {
  const start = resolve(projectPath);
  const ancestors: string[] = [];
  let current = start;

  while (true) {
    ancestors.push(current);
    if (await pathExists(join(current, '.git'))) return ancestors;

    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  // Without a git boundary, scanning arbitrary parent directories is surprising and
  // could pick up unrelated credentials. Stay inside the requested project instead.
  return [start];
}

function parseEnvFile(content: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }

  return values;
}

function envFilePriority(name: string): number {
  if (name === '.env.local') return 0;
  if (name.endsWith('.local')) return 1;
  if (name === '.env') return 3;
  return 2;
}

async function readEnvSources(projectPath: string): Promise<EnvSource[]> {
  const sources: EnvSource[] = [{ label: 'process environment', values: process.env as Record<string, string> }];
  const directories = await findSearchDirectories(projectPath);

  // Directories are ordered from the app toward the repository root. This lets an app-local
  // value override a monorepo-root default while still discovering shared credentials.
  for (const directory of directories) {
    let entries: string[] = [];
    try {
      entries = (await readdir(directory))
        .filter((entry) => entry === '.env' || entry.startsWith('.env.'))
        .sort((left, right) => envFilePriority(left) - envFilePriority(right) || left.localeCompare(right));
    } catch {
      continue;
    }

    for (const entry of entries) {
      try {
        sources.push({
          label: join(directory, entry),
          values: parseEnvFile(await readFile(join(directory, entry), 'utf-8')),
        });
      } catch {
        // An unreadable optional env file should not stop the rest of the scan.
      }
    }
  }

  return sources;
}

function acceptedNames(variable: KnownEnvVar): string[] {
  const prefixes = variable.allowPublicPrefix ? ['', ...PUBLIC_PREFIXES] : [''];
  return variable.aliases.flatMap((alias) => prefixes.map((prefix) => `${prefix}${alias}`));
}

function unsafePublicNames(variable: KnownEnvVar): string[] {
  if (variable.allowPublicPrefix) return [];
  return variable.aliases.flatMap((alias) => PUBLIC_PREFIXES.map((prefix) => `${prefix}${alias}`));
}

function findFirstValue(sources: EnvSource[], names: string[]): { value: string; source: string } | undefined {
  for (const source of sources) {
    for (const name of names) {
      if (Object.hasOwn(source.values, name)) return { value: source.values[name] ?? '', source: source.label };
    }
  }
  return undefined;
}

export const scanCredentials = action({
  name: 'scan-credentials',
  input: type({ projectPath: 'string' }),
  output: CredentialsScanResult,
  run: async ({ input }) => {
    const sources = await readEnvSources(input.projectPath);
    const envVars: EnvVarInfo[] = [];
    const detected: Record<string, string> = {};

    for (const variable of KNOWN_ENV_VARS) {
      const found = findFirstValue(sources, acceptedNames(variable));
      const unsafePublicValue = findFirstValue(sources, unsafePublicNames(variable));

      if (!found) {
        envVars.push({
          name: variable.name,
          status: 'missing',
          ...(unsafePublicValue
            ? {
                source: unsafePublicValue.source,
                warning:
                  'A browser-exposed management token was ignored. Move it to CONTENTFUL_MANAGEMENT_TOKEN in a server-only process or env file.',
              }
            : {}),
        });
        continue;
      }

      const value = found.value.trim();
      if (!value) {
        envVars.push({ name: variable.name, status: 'empty', source: found.source });
        continue;
      }

      envVars.push({
        name: variable.name,
        status: 'set',
        maskedValue: variable.secret ? maskValue(value) : value,
        source: found.source,
      });
      detected[variable.name] = value;
    }

    return {
      envVars,
      ...(detected['NINETAILED_API_KEY'] || detected['NINETAILED_ENVIRONMENT']
        ? {
            personalization: {
              ...(detected['NINETAILED_API_KEY'] ? { apiKey: detected['NINETAILED_API_KEY'] } : {}),
              ...(detected['NINETAILED_ENVIRONMENT'] ? { environment: detected['NINETAILED_ENVIRONMENT'] } : {}),
            },
          }
        : {}),
      ...(detected['OPTIMIZATION_CLIENT_ID'] || detected['OPTIMIZATION_ENVIRONMENT']
        ? {
            optimization: {
              ...(detected['OPTIMIZATION_CLIENT_ID'] ? { clientId: detected['OPTIMIZATION_CLIENT_ID'] } : {}),
              ...(detected['OPTIMIZATION_ENVIRONMENT'] ? { environment: detected['OPTIMIZATION_ENVIRONMENT'] } : {}),
            },
          }
        : {}),
      ...(detected['CONTENTFUL_SPACE_ID'] ||
      detected['CONTENTFUL_ACCESS_TOKEN'] ||
      detected['CONTENTFUL_PREVIEW_TOKEN'] ||
      detected['CONTENTFUL_MANAGEMENT_TOKEN'] ||
      detected['CONTENTFUL_ENVIRONMENT']
        ? {
            contentful: {
              ...(detected['CONTENTFUL_SPACE_ID'] ? { spaceId: detected['CONTENTFUL_SPACE_ID'] } : {}),
              ...(detected['CONTENTFUL_ACCESS_TOKEN'] ? { accessToken: detected['CONTENTFUL_ACCESS_TOKEN'] } : {}),
              ...(detected['CONTENTFUL_PREVIEW_TOKEN'] ? { previewToken: detected['CONTENTFUL_PREVIEW_TOKEN'] } : {}),
              ...(detected['CONTENTFUL_MANAGEMENT_TOKEN']
                ? { managementToken: detected['CONTENTFUL_MANAGEMENT_TOKEN'] }
                : {}),
              ...(detected['CONTENTFUL_ENVIRONMENT'] ? { environment: detected['CONTENTFUL_ENVIRONMENT'] } : {}),
            },
          }
        : {}),
    };
  },
});

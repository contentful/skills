import { type, action } from '@contentful/skill-kit';
import { join } from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import { CredentialsScanResult, type EnvVarInfo } from '../schemas.js';

const FW_PREFIX = '(?:NEXT_PUBLIC_|GATSBY_|REACT_APP_|VITE_)?';

const KNOWN_ENV_VARS: Array<{ name: string; secret: boolean; patterns: RegExp[] }> = [
  {
    name: 'NINETAILED_API_KEY',
    secret: true,
    patterns: [
      new RegExp(`^${FW_PREFIX}NINETAILED_API_KEY\\s*=[^\\S\\n]*(.+)`, 'm'),
      new RegExp(`^${FW_PREFIX}NINETAILED_CLIENT_ID\\s*=[^\\S\\n]*(.+)`, 'm'),
    ],
  },
  {
    name: 'NINETAILED_ENVIRONMENT',
    secret: false,
    patterns: [new RegExp(`^${FW_PREFIX}NINETAILED_ENVIRONMENT\\s*=[^\\S\\n]*(.+)`, 'm')],
  },
  {
    name: 'OPTIMIZATION_CLIENT_ID',
    secret: false,
    patterns: [new RegExp(`^${FW_PREFIX}OPTIMIZATION_CLIENT_ID\\s*=[^\\S\\n]*(.+)`, 'm')],
  },
  {
    name: 'OPTIMIZATION_ENVIRONMENT',
    secret: false,
    patterns: [new RegExp(`^${FW_PREFIX}OPTIMIZATION_ENVIRONMENT\\s*=[^\\S\\n]*(.+)`, 'm')],
  },
  {
    name: 'CONTENTFUL_SPACE_ID',
    secret: false,
    patterns: [new RegExp(`^${FW_PREFIX}CONTENTFUL_SPACE_ID\\s*=[^\\S\\n]*(.+)`, 'm')],
  },
  {
    name: 'CONTENTFUL_ACCESS_TOKEN',
    secret: true,
    patterns: [
      new RegExp(`^${FW_PREFIX}CONTENTFUL_ACCESS_TOKEN\\s*=[^\\S\\n]*(.+)`, 'm'),
      new RegExp(`^${FW_PREFIX}CONTENTFUL_TOKEN\\s*=[^\\S\\n]*(.+)`, 'm'),
      new RegExp(`^${FW_PREFIX}CONTENTFUL_DELIVERY_TOKEN\\s*=[^\\S\\n]*(.+)`, 'm'),
    ],
  },
  {
    name: 'CONTENTFUL_PREVIEW_TOKEN',
    secret: true,
    patterns: [
      new RegExp(`^${FW_PREFIX}CONTENTFUL_PREVIEW_TOKEN\\s*=[^\\S\\n]*(.+)`, 'm'),
      new RegExp(`^${FW_PREFIX}CONTENTFUL_PREVIEW_ACCESS_TOKEN\\s*=[^\\S\\n]*(.+)`, 'm'),
    ],
  },
  {
    name: 'CONTENTFUL_ENVIRONMENT',
    secret: false,
    patterns: [new RegExp(`^${FW_PREFIX}CONTENTFUL_ENVIRONMENT\\s*=[^\\S\\n]*(.+)`, 'm')],
  },
];

function maskValue(value: string): string {
  if (value.length <= 8) return '****';
  return value.slice(0, 8) + '****';
}

async function readFileSafe(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

export const scanCredentials = action({
  name: 'scan-credentials',
  input: type({ projectPath: 'string' }),
  output: CredentialsScanResult,
  run: async ({ input }) => {
    const root = input.projectPath;

    let envEntries: string[] = [];
    try {
      const dirEntries = await readdir(root);
      envEntries = dirEntries.filter((f) => f.startsWith('.env'));
    } catch {
      /* no directory access */
    }

    let combinedEnv = '';
    for (const entry of envEntries) {
      const content = await readFileSafe(join(root, entry));
      if (content) combinedEnv += '\n' + content;
    }

    const envVars: EnvVarInfo[] = [];
    const detected: Record<string, string> = {};

    for (const { name, secret, patterns } of KNOWN_ENV_VARS) {
      let found = false;
      for (const pattern of patterns) {
        const match = combinedEnv.match(pattern);
        if (match) {
          const value = match[1].trim().replace(/^["']|["']$/g, '');
          if (!value) {
            envVars.push({ name, status: 'empty' });
          } else {
            envVars.push({ name, status: 'set', maskedValue: secret ? maskValue(value) : value });
            detected[name] = value;
          }
          found = true;
          break;
        }
      }
      if (!found) {
        envVars.push({ name, status: 'missing' });
      }
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
      ...(detected['CONTENTFUL_SPACE_ID'] || detected['CONTENTFUL_ACCESS_TOKEN']
        ? {
            contentful: {
              ...(detected['CONTENTFUL_SPACE_ID'] ? { spaceId: detected['CONTENTFUL_SPACE_ID'] } : {}),
              ...(detected['CONTENTFUL_ACCESS_TOKEN'] ? { accessToken: detected['CONTENTFUL_ACCESS_TOKEN'] } : {}),
              ...(detected['CONTENTFUL_PREVIEW_TOKEN'] ? { previewToken: detected['CONTENTFUL_PREVIEW_TOKEN'] } : {}),
              ...(detected['CONTENTFUL_ENVIRONMENT'] ? { environment: detected['CONTENTFUL_ENVIRONMENT'] } : {}),
            },
          }
        : {}),
    };
  },
});

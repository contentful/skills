import { type, action } from '@contentful/skill-kit';
import { join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { WriteEnvResult } from '../schemas.js';

const PUBLIC_MANAGEMENT_TOKEN =
  /^(?:NEXT_PUBLIC_|GATSBY_|REACT_APP_|VITE_|EXPO_PUBLIC_)CONTENTFUL_(?:MANAGEMENT|CMA)_TOKEN$/;

export const writeEnvFile = action({
  name: 'write-env-file',
  input: type({
    projectPath: 'string',
    variables: 'Record<string, string>',
    fileName: "string = '.env.local'",
  }),
  output: WriteEnvResult,
  run: async ({ input }) => {
    const filePath = join(input.projectPath, input.fileName);

    let existing = '';
    try {
      existing = await readFile(filePath, 'utf-8');
    } catch {
      /* file doesn't exist yet */
    }

    const existingLines = existing.split('\n');
    const existingKeys = new Set(
      existingLines.filter((line) => line.trim() && !line.startsWith('#')).map((line) => line.split('=')[0].trim()),
    );

    const written: Array<{ name: string; value: string }> = [];
    const skipped: Array<{ name: string; reason: string }> = [];
    const newLines: string[] = [];

    for (const [name, value] of Object.entries(input.variables) as Array<[string, string]>) {
      if (PUBLIC_MANAGEMENT_TOKEN.test(name)) {
        skipped.push({
          name,
          reason: 'Management tokens must remain server-only and cannot use a browser-visible env prefix',
        });
      } else if (existingKeys.has(name)) {
        skipped.push({ name, reason: 'Already exists in file' });
      } else {
        newLines.push(`${name}=${value}`);
        written.push({ name, value });
      }
    }

    if (newLines.length > 0) {
      const separator = existing.endsWith('\n') || existing === '' ? '' : '\n';
      const header = existing === '' ? '' : separator;
      const content = existing + header + newLines.join('\n') + '\n';
      await writeFile(filePath, content, 'utf-8');
    }

    return { written, skipped, filePath };
  },
});

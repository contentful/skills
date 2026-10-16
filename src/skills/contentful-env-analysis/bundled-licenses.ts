import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import type { Metafile } from 'esbuild';

export async function bundledLicenses(inputs: Metafile['inputs'], baseDir: string): Promise<string> {
  const packages = new Map<string, string>();
  for (const input of Object.keys(inputs)) {
    if (!input.replaceAll('\\', '/').includes('node_modules/')) continue;
    let directory = dirname(resolve(baseDir, input));
    while (directory !== dirname(directory)) {
      try {
        const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
        packages.set(`${pkg.name}@${pkg.version}`, directory);
        break;
      } catch (error) {
        if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
        directory = dirname(directory);
      }
    }
    if (directory === dirname(directory)) throw new Error(`Cannot identify bundled package: ${input}`);
  }

  const notices: string[] = [];
  for (const [name, directory] of [...packages].sort(([a], [b]) => a.localeCompare(b))) {
    const files = (await readdir(directory)).sort();
    const licenses = files.filter((file) => /^(?:licen[cs]e|copying|notice)(?:[.-].*)?$/i.test(file));
    const texts: string[] = [];
    for (const file of licenses) texts.push(await readFile(join(directory, file), 'utf8'));
    if (!texts.length) {
      const readme = files.find((file) => /^readme(?:\.[^/]*)?$/i.test(file));
      if (readme) {
        const text = await readFile(join(directory, readme), 'utf8');
        const section = text.match(/(?:^|\n)(?:#+\s*)?Licen[cs]e[^\n]*\n(?:[-=]+\n)?([\s\S]+)/i)?.[1];
        if (section?.includes('Permission is hereby granted')) texts.push(section);
      }
    }
    if (!texts.length) throw new Error(`No bundled license text found for ${name}`);
    notices.push(`## ${name}\n\n${texts.join('\n\n').trimEnd()}`);
  }
  return `# Third-party notices\n\nLicenses for dependencies included in scripts/main.js.\n\n${notices.join('\n\n')}\n`;
}

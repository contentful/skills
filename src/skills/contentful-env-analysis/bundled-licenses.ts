import { createHash } from 'node:crypto';
import { Parser } from 'tar';

export async function bundledLicenses(bundle: string): Promise<string> {
  const packages = [
    ...new Set(
      [...bundle.matchAll(/^\/\/ .*?\.pnpm\/([^/]+)\/node_modules\//gm)].map((match) =>
        match[1].split('_')[0].replace('+', '/'),
      ),
    ),
  ];
  if (!packages.length) throw new Error('Cannot identify bundled dependencies; review the upstream build format.');
  const notices = await Promise.all(
    packages.sort().map(async (pkg) => {
      const response = await fetch(`https://registry.npmjs.org/${pkg.replace(/@([^@]+)$/, '/$1')}`);
      if (!response.ok) throw new Error(`Cannot read npm metadata for ${pkg}: HTTP ${response.status}`);
      const metadata = await response.json();
      const url = new URL(metadata.dist.tarball);
      if (url.protocol !== 'https:' || url.hostname !== 'registry.npmjs.org') {
        throw new Error(`Unexpected npm tarball host for ${pkg}`);
      }
      const archive = await fetch(url);
      if (!archive.ok) throw new Error(`Cannot download license for ${pkg}: HTTP ${archive.status}`);
      const data = Buffer.from(await archive.arrayBuffer());
      const integrity: string = metadata.dist.integrity;
      const [algorithm, expected] = integrity.split('-');
      if (
        !['sha512', 'sha256', 'sha1'].includes(algorithm) ||
        createHash(algorithm).update(data).digest('base64') !== expected
      ) {
        throw new Error(`npm integrity mismatch for ${pkg}`);
      }
      const licenses: string[] = [];
      let readmeLicense: string | undefined;
      await new Promise<void>((resolve, reject) => {
        const parser = new Parser({
          onReadEntry(entry) {
            const isReadme = /^package\/readme(?:\.[^/]*)?$/i.test(entry.path);
            if (
              (!isReadme && !/^package\/(?:licen[cs]e|copying|notice)(?:\.[^/]*)?$/i.test(entry.path)) ||
              entry.type !== 'File'
            ) {
              entry.resume();
              return;
            }
            const chunks: Buffer[] = [];
            entry.on('data', (chunk: Buffer) => chunks.push(chunk));
            entry.on('end', () => {
              const text = Buffer.concat(chunks).toString('utf8');
              if (!isReadme) licenses.push(`${entry.path}\n\n${text}`);
              else {
                const section = text.match(/(?:^|\n)(?:#+\s*)?Licen[cs]e[^\n]*\n(?:[-=]+\n)?([\s\S]+)/i)?.[1];
                if (section?.includes('Permission is hereby granted'))
                  readmeLicense = `${entry.path} (license section)\n\n${section}`;
              }
            });
          },
        });
        parser.on('error', reject);
        parser.on('end', resolve);
        parser.end(data);
      });
      if (!licenses.length && readmeLicense) licenses.push(readmeLicense);
      if (!licenses.length) {
        const repository = typeof metadata.repository === 'string' ? metadata.repository : metadata.repository?.url;
        const github = typeof repository === 'string' && repository.match(/github\.com[/:]([^/]+\/[^/]+?)(?:\.git)?$/);
        if (github && /^[a-f0-9]{40}$/.test(metadata.gitHead)) {
          const path = `https://raw.githubusercontent.com/${github[1]}/${metadata.gitHead}/LICENSE`;
          const license = await fetch(path);
          if (license.ok) licenses.push(`${path}\n\n${await license.text()}`);
        }
      }
      if (!licenses.length) throw new Error(`No license text found for ${pkg}; review before publishing.`);
      return `## ${pkg}\n\n${licenses.sort().join('\n\n')}`;
    }),
  );
  return `# Third-party notices\n\nLicenses for dependencies included in scripts/main.js.\n\n${notices.join('\n\n')}`.trimEnd() + '\n';
}

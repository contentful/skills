// exo-content-bindings command line: discover -> build -> propose -> apply.
// Flags in, one JSON document on stdout, diagnostics on stderr. See each command's --help.
import * as discover from './commands/discover.mjs';
import * as build from './commands/build.mjs';
import * as propose from './commands/propose.mjs';
import * as apply from './commands/apply.mjs';
import { CliError } from './lib/cli.mjs';

const commands = { discover, build, propose, apply };
const overview = `Usage: node main.js <command> [flags]

Design and create binding sets (Data Assemblies) for Contentful Experience Orchestration.

Commands, in the order a run uses them:
  discover   read the environment (read-only)
  build      validate a plan against the live schema and generate request bodies (read-only)
  propose    render the plan as a review page for the user (no network)
  apply      write the approved binding sets to Contentful (needs --approved)

Run "node main.js <command> --help" for a command's flags.
Every command prints one JSON document to stdout; messages go to stderr.
Credentials are read from a file passed with --env-file; never pass a token as an argument.`;

const [name, ...argv] = process.argv.slice(2);
const wantsHelp = (args) => args.includes('--help') || args.includes('-h');
if (!name || wantsHelp([name])) { console.error(overview); process.exit(name ? 0 : 2); }
const command = commands[name];
if (!command) { console.error(`error: unknown command "${name}"\n\n${overview}`); process.exit(2); }
if (wantsHelp(argv)) { console.error(`Usage: node main.js ${command.usage}`); process.exit(0); }
if (Number(process.versions.node.split('.')[0]) < 20) { console.error(`error: Node.js 20 or newer is required (this is ${process.versions.node}).`); process.exit(1); }
try {
  process.exitCode = (await command.run(argv)) ?? 0;
} catch (e) {
  console.error(`error: ${e instanceof Error ? e.message : String(e)}`);
  if (e instanceof CliError && e.code === 2) console.error(`\nUsage: node main.js ${command.usage}`);
  process.exitCode = e instanceof CliError ? e.code : 1;
}

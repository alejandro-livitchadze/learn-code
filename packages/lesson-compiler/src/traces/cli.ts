import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeTraces } from './files';

/** `tsx src/traces/cli.ts [content dir]`: regenerate every recorded trace from PGlite. */
const here = dirname(fileURLToPath(import.meta.url));
const contentDir = resolve(process.argv[2] ?? resolve(here, '../../../../content'));
const written = await writeTraces(contentDir);
for (const w of written) process.stdout.write(`wrote ${w}\n`);

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isLinted, lintFile, type Violation } from '../src/codeLint';

/** Runs CL1 and CL2 over every tracked or untracked-but-not-ignored file. Used by `pnpm lint`. */
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
})
  .split('\n')
  .filter((f) => f !== '' && isLinted(f));

const violations: Violation[] = files.flatMap((f) => lintFile(f, readFileSync(f, 'utf8')));
for (const v of violations) console.error(`${v.file}:${v.line} ${v.rule} ${v.message}`);
if (violations.length > 0) {
  console.error(`${violations.length} code lint violation(s).`);
  process.exit(1);
}
console.log(`Code lint CL1 and CL2: ${files.length} files checked, no violations.`);

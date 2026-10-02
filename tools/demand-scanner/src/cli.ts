import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BlockedError, DEFAULT_KEYWORDS, fetchFeeds } from './fetch.js';
import { parseAll } from './parse.js';
import { writeReports } from './report.js';
import { DATA_DIR } from './store.js';
import { validateExtractions } from './validate.js';

const USAGE = `usage: pnpm demand <command>
  fetch [keyword...]   fetch RSS feeds (default: ${DEFAULT_KEYWORDS.join(', ')}), cache new vacancies
  parse                parse cached raw items into parsed/, reject bad ones, drop duplicates
  scan [keyword...]    fetch, then parse
  report               write report.md, report-js.md, spot-check.md, unknown-terms.json
  validate             check extracted/*.json against the schema and the literal-occurrence guard`;

const SYNONYMS_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'synonyms.json');

async function main(argv: readonly string[]): Promise<number> {
  const [cmd, ...rest] = argv;
  const keywords = rest.length > 0 ? rest : DEFAULT_KEYWORDS;
  switch (cmd) {
    case 'fetch':
    case 'scan': {
      try {
        console.log(await fetchFeeds({ root: DATA_DIR, keywords, log: console.log }));
      } catch (e) {
        if (e instanceof BlockedError) {
          console.error(e.message);
          return 2;
        }
        throw e;
      }
      if (cmd === 'fetch') return 0;
      console.log(parseAll(DATA_DIR));
      return 0;
    }
    case 'parse':
      console.log(parseAll(DATA_DIR));
      return 0;
    case 'report': {
      const ctx = writeReports(DATA_DIR, SYNONYMS_PATH);
      console.log(`reports written: ${ctx.sample.length} vacancies in the sample`);
      return 0;
    }
    case 'validate': {
      const { checked, errors } = validateExtractions(DATA_DIR);
      for (const e of errors) console.error(e);
      console.log(`${checked} extraction files checked, ${errors.length} with errors`);
      return errors.length > 0 ? 1 : 0;
    }
    default:
      console.error(USAGE);
      return 64;
  }
}

process.exitCode = await main(process.argv.slice(2));

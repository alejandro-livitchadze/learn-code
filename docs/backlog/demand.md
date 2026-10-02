# Backlog: demand lane

Branch `lane/demand`. Status values: `todo`, `in_progress`, `done`, `blocked`.

Epic: E05. Lessons from an earlier run, use them:

- Djinni has an official RSS feed with full vacancy text: `/jobs/rss/?primary_keyword=Fullstack`. Use it instead of HTML pages. One request returns at most 100 items and ignores `page=`; repeat the query with each `exp_level` value (`no_exp`, `1y` ... `10y`) to collect more.
- `robots.txt` allows `/jobs/`. No terms page was found; stay polite (one request every 3 seconds).
- The feed has no company and no salary. Deduplicate by normalized title plus description hash.
- The keyword "Fullstack" also returns Python, .NET and PHP vacancies.
- No local model is available in this lane. Skill extraction is done by you, in this session, in batches of 20, each batch validated by the schema and by the guard "every skill string literally appears in the vacancy text".

## D1. Scanner: fetch, parse, validate
- Status: done
- Note: `tools/demand-scanner` is a self-contained pnpm package (run `pnpm demand <fetch|parse|scan|validate>` from that dir); first live scan cached 218 feed items, 212 parsed after dedupe (5 duplicates, 0 rejected); data in `research/demand/`.
- Assumption: no root pnpm workspace exists yet (platform lane owns it), so the package has its own lockfile and `demand` script; the repo root can adopt it later. Vacancy schema has no company/salary (feed lacks them) and adds `publishedAt` and `query`. Feed pages are always re-requested (the only way to find new vacancies); cached ids are never rewritten or re-parsed.
- Depends on: none
- Done when: `tools/demand-scanner` fetches the RSS feed for `primary_keyword=Fullstack` and also `Node.js`, parses into the `Vacancy` schema, caches raw responses, skips cached vacancies on re-run, and has `pnpm demand validate` implementing the schema and literal-occurrence guard; unit tests pass.

## D2. Synonyms
- Status: in_progress
- Depends on: D1
- Done when: `synonyms.json` covers at least 150 canonical skills with categories `language`, `runtime`, `framework`, `database`, `orm`, `api`, `auth`, `testing`, `devops`, `cloud`, `queue`, `ai`, `frontend`, `other`, with Ukrainian spellings; the `ai` category includes claude-code, copilot, openai-api, rag, mcp, langchain, langgraph, vector-db, embeddings, ai-agents; AWS and Azure services have their own ids; common misspellings found in data are mapped.

## D3. Extraction, batches 1 to 5
- Status: todo
- Depends on: D2
- Done when: the first 100 unextracted vacancies (sorted by id) have extraction files that pass `pnpm demand validate`.

## D4. Extraction, the rest
- Status: todo
- Depends on: D3
- Done when: every parsed vacancy has an extraction file that passes `pnpm demand validate`.

## D5. Reports
- Status: todo
- Depends on: D4
- Done when: `research/demand/report.md` (all vacancies) and `research/demand/report-js.md` exist. The JS report covers only vacancies where nodejs, typescript or javascript is required, and shows: sample size; top 20 required backend-side skills with percentages; shares of NestJS, Express, Fastify, Prisma, TypeORM, Drizzle, Sequelize, Redis, any queue, any AI skill; the top 10 split into senior/lead and junior/middle where seniority is known. Also `research/demand/spot-check.md` lists 20 random vacancy ids with links for the author's manual check. Unknown terms seen 3+ times are listed at the end of the report.

## D6. Weekly refresh
- Status: todo
- Depends on: D5
- Done when: this task is never marked done. Each session: fetch new vacancies, extract them, regenerate both reports, and add one dated line to `research/demand/changelog.md` with the new sample size and any skill whose share moved by 5 points or more.

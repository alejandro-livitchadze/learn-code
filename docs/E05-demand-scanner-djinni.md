# E05. Demand Scanner: What Fullstack Vacancies Require

Read `00-context.md` and `agent-workers.md` first. Independent of E01 to E04. Can start immediately.

When run from the demand lane, `docs/backlog/demand.md` overrides this file: it records what an earlier run learned (RSS feed, no local model).

## Goal

A command that collects current fullstack vacancies from Djinni, extracts required skills and produces two outputs: a frequency table of skills, and a study plan ordered by demand. The author uses the plan for his own job search; the course roadmap uses the same data.

## Scope

In scope: fetching public vacancy pages, parsing, skill extraction with a local model, normalization, aggregation, a markdown report.

Out of scope: logging in, applying to vacancies, other job boards (add later behind the same interface).

## Before writing code

1. Read `https://djinni.co/robots.txt` and the terms of use. Stay within what they allow.
2. Check whether Djinni offers an RSS feed or another official export for a search. If it does, use it instead of HTML pages.
3. Collect only public vacancy text. No personal data, no accounts.

## Pipeline

Five workers, each a separate module with file input and file output (see `agent-workers.md`).

### 1. `vacancy-fetcher` (T0)

- Input: search parameters (keywords such as `fullstack`, `node.js`, `react`; experience level; page limit).
- Fetches list pages, then each vacancy page.
- Politeness: one request every 3 seconds, a descriptive User-Agent, stop on HTTP 429 or 403.
- Caches raw responses in `research/demand/raw/<id>.html`. A cached vacancy is never fetched again.

### 2. `vacancy-parser` (T0)

- Extracts fields with an HTML parser (`cheerio`), not with a model.

```ts
interface Vacancy {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly company: string;
  readonly description: string;
  readonly salaryRange?: { readonly min: number; readonly max: number; readonly currency: string };
  readonly experienceYears?: number;
  readonly remote: boolean;
  readonly fetchedAt: string; // ISO date
}
```

- Validates with Zod. A page that fails validation goes to `research/demand/rejected/` with the reason.

### 3. `skill-extractor` (T1, local model)

- One vacancy in, one JSON object out. Calls Ollama through its OpenAI-compatible endpoint with a JSON schema response format. The endpoint URL and model name come from environment variables.

```ts
interface ExtractedSkills {
  readonly vacancyId: string;
  readonly required: readonly string[];
  readonly niceToHave: readonly string[];
  readonly seniority: 'junior' | 'middle' | 'senior' | 'lead' | 'unknown';
}
```

- Prompt rules: copy skill names as written, do not invent skills that are not in the text, put a skill in `niceToHave` only when the text marks it as optional.
- Output is validated. Invalid output is retried once, then the vacancy is marked as failed.

### 4. `skill-normalizer` (T0 with a dictionary)

- Maps variants to one canonical id using `tools/demand-scanner/synonyms.json` (`postgres`, `PostgreSQL`, `psql` to `postgresql`).
- Unknown terms are written to `research/demand/unknown-terms.json` for review instead of being guessed.
- Each canonical skill has a category: `runtime`, `framework`, `database`, `orm`, `api`, `auth`, `testing`, `devops`, `cloud`, `frontend`, `other`.

### 5. `demand-aggregator` (T0)

- Counts, for each skill, the share of vacancies that require it and the share that list it as optional. Splits by seniority.
- Writes:
  - `research/demand/skills.json`
  - `research/demand/report.md`: top skills per category, with counts and the sample size.
  - `research/demand/study-plan.md`: backend-side skills ordered by demand, with frontend skills excluded.

## CLI

- `pnpm demand scan --query fullstack --pages 10`
- `pnpm demand report`

Each stage can run alone (`pnpm demand extract`), reading the previous stage's files, so a failure does not restart the whole pipeline.

## Golden cases

`tools/demand-scanner/evals/` holds 10 vacancy descriptions with hand-written expected skills. The extractor must reach at least 90% recall on required skills and invent none. Run the evals whenever the prompt or the model changes.

## Acceptance criteria

- At least 100 vacancies are processed end to end.
- Re-running the scan fetches only new vacancies.
- The report states the sample size, the date range and the number of failed vacancies.
- A manual check of 20 random vacancies shows no invented skills.
- No model is used where a script is enough.

## Pitfalls

- Vacancies are written in English and Ukrainian. The extractor prompt must handle both, and the synonym dictionary must include Ukrainian spellings.
- Agencies repost the same vacancy. Deduplicate by normalized title, company and description hash.
- Djinni reflects the Ukrainian hiring market. It is the right source for the author's job search and a partial signal for a global course. Treat it as one input to `research-brief.md`, not a replacement.
- Markup changes break parsers. Keep selectors in one file and fail loudly when a required field is missing.

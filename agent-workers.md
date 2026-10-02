# Agent Workers: Microservice Catalogue

Complements `agent-orchestration.md`. That file describes the flow. This one describes the workers.

## 1. Idea

A worker is a microservice. It does one small job, knows nothing about the rest of the system, reads one input file and writes one output file. Each worker has:

- a prompt file (or a script, if no model is needed),
- an input schema and an output schema (Zod),
- a model tier,
- a small set of golden test cases.

## 2. Model tiers and cost

No paid API. Three tiers:

- **T0, script.** Deterministic code. Free, fast, always preferred.
- **T1, local model.** Runs through Ollama on the Windows machine with the RTX 4070 Super (12 GB VRAM), exposed on the local network through its OpenAI-compatible endpoint. Suitable for extraction, classification, reformatting and short rewrites with a strict JSON schema.
- **T2, subscription CLI agent.** A coding agent CLI covered by an existing subscription (Claude or Gemini). Suitable for writing lessons, designing exercises and verifying claims. Usage limits apply, so T2 jobs run in batches. Check each tool's limits and its terms for automated use before scheduling unattended runs.

Rule: a worker uses the lowest tier that passes its golden cases. A "dumb" worker means a narrow task, not necessarily a weak model.

## 3. Worker contract

```ts
type Tier = 'T0' | 'T1' | 'T2';

interface WorkerSpec {
  readonly id: string;
  readonly tier: Tier;
  readonly inputSchema: string;  // path to a Zod schema module
  readonly outputSchema: string;
  readonly promptFile?: string;  // absent for T0
  readonly maxRetries: 0 | 1 | 2;
}

interface Job<TInput> {
  readonly jobId: string;
  readonly workerId: string;
  readonly input: TInput;
  readonly createdAt: string; // ISO date
}

type JobResult<TOutput> =
  | { readonly jobId: string; readonly ok: true; readonly output: TOutput }
  | { readonly jobId: string; readonly ok: false; readonly reason: string };
```

Every worker output is validated against its schema. Invalid output counts as a failure and triggers a retry.

## 4. Queue on the file system

```
queue/<worker-id>/<job-id>.json     waiting
running/<worker-id>/<job-id>.json   claimed
done/<worker-id>/<job-id>.json      result
failed/<worker-id>/<job-id>.json    result with reason
```

- A worker claims a job by renaming the file from `queue/` to `running/`. Rename is atomic, so two workers cannot take the same job.
- A dispatcher script (T0) watches `done/` and creates the follow-up jobs according to the pipeline.
- `queue/`, `running/` are git-ignored. Results that matter (lessons, reports, posts) are committed.

## 5. Catalogue

### Demand and research

- `vacancy-fetcher` (T0): downloads public vacancy pages politely and caches raw HTML.
- `vacancy-parser` (T0): extracts title, company, description and salary from HTML.
- `skill-extractor` (T1): one vacancy description in, a list of required and optional skills out.
- `skill-normalizer` (T0 with a synonym dictionary; T1 only for unknown terms): maps "Postgres", "PostgreSQL", "psql" to one id.
- `demand-aggregator` (T0): counts frequencies, writes `skills.json` and `study-plan.md`.
- `market-researcher` (deep research tool, run by hand): follows `research-brief.md`.

### Curriculum

- `roadmap-builder` (T2): topic and demand data in, `roadmap.json` out.
- `lesson-outliner` (T2): one roadmap entry in, a list of steps with kinds and concepts out.

### Lesson content

- `hook-writer` (T2): writes the opening story.
- `explain-writer` (T2): writes one `explain` step.
- `predict-builder` (T2): writes a `predict` step with code, options and feedback.
- `exercise-builder` (T2): writes one `parsons`, `fillBlanks`, `bugHunt`, `sqlLab` or `apiLab` step with tests.
- `chat-writer` (T2): writes one `firesideChat`.
- `lesson-assembler` (T0): merges the steps into `lesson.mdoc`.

### Verification

- `sample-runner` (T0): executes every code sample and compares output.
- `test-runner` (T0): checks that reference solutions pass and starter code fails.
- `pedagogy-linter` (T0): applies the rules from `00-context.md`.
- `claim-checker` (T2, fresh context): checks each technical claim against primary documentation and returns defects with source links.

### Finishing and distribution

- `style-editor` (T2): fixes voice and pacing only.
- `card-maker` (T1): `recap` bullets in, review cards out.
- `telegram-post` (T1): approved lesson summary in, one post out.
- `video-script` (T2): approved lesson in, a 60 to 90 second script out.

## 6. Golden cases

Each worker folder contains `evals/` with 5 to 10 input and expected-output pairs.

- A worker ships only if it passes at least 90% of its cases.
- If a T1 worker fails, first tighten the prompt and the schema, then split the task further, and only then move it to T2.
- If a T2 worker passes all cases easily, try it on T1.

## 7. Limits to respect

- A 12 GB card runs small and medium quantized models. They are reliable for structured extraction and weak at long, funny, technically exact prose. Do not move lesson writing or claim checking to T1.
- Chains multiply errors. Keep T0 checks between every two model steps.
- Run T2 workers one after another in a single session. Fanning out to sub-agents multiplies usage several times.
- Subscription tools have usage caps. The dispatcher must tolerate a worker being unavailable for hours.

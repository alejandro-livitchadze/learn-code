# E07. Interaction Catalogue for the Fullstack Course

Read `00-context.md` first. Builds on E03, E04 and E06.

This file is the source for two kinds of agents:

- `lesson-outliner` and `exercise-builder` pick interactions from it when planning a lesson.
- Platform engineers build the reusable engines listed in section 3.

## 1. How to design an interaction

Use this method for every new topic. An interaction that cannot answer all five points is decoration and should be cut.

1. **Misconception.** What does a frontend developer wrongly believe about this topic?
2. **The invisible thing.** What is happening that the learner cannot normally see (memory, a queue, a lock, the number of queries, the bytes on the wire)?
3. **Pattern.** Which pattern from section 2 makes it visible or forces the learner to act on it?
4. **The moment.** One sentence the learner should say out loud afterwards ("Oh, the browser sent it anyway").
5. **Check.** How does the system verify success by behavior, not by matching text?

## 2. Patterns

- **Break it first.** The learner causes the failure before any theory. Then the explanation lands on a fresh question.
- **Attacker, then defender.** The learner exploits a naive implementation inside the lesson's own sandboxed app, then fixes it until the same attack fails.
- **Be the machine.** The learner performs the runtime's job by hand, step by step, and is checked against a real trace.
- **Behavior-checked design.** Many right answers. Scenarios that must succeed or fail decide (as in E06).
- **Meter.** A live gauge for an invisible cost: memory, query count, latency, rebuild time, dropped requests.
- **Scale slider.** One parameter grows from tiny to huge until the approach breaks (10 rows to 10 million).
- **Split view.** An abstraction on the left, what it really produces on the right (ORM call and SQL, code and raw HTTP).
- **Two timelines.** Two actors on a shared clock. The learner predicts or arranges the interleaving.
- **Sequence assembly.** Parsons for messages between actors instead of lines of code.
- **Incident.** The lesson is a postmortem. The hook is the outage; the last active step is the fix.
- **Budget.** Limited resources (two indexes, 100 ms, 256 MB) force a trade-off instead of "add everything".

## 3. Reusable engines

About forty-five interactions below are built from eight engines. Build engines, not one-off widgets.

- **`simulation`**: a deterministic model with sliders, a play and step control, and meters. The model is a pure function `(state, params, tick) => state`. Used for the restaurant, the pool, the bucket, rolling deploys.
- **`beTheMachine`**: lanes or zones with movable items, checked against a precomputed trace. Generalizes `beTheRuntime` and `beTheDatabase`.
- **`pipelineBuilder`**: order and configure stages, then run scripted scenarios through them. Generalizes the scenario runner from E06.
- **`sequenceBuilder`**: actors as columns, messages as arrows the learner places in order.
- **`timelineLab`**: two or more sessions on a shared clock with predicted and actual values.
- **`inspector`**: a structured artifact (raw HTTP request, JWT, execution plan, Docker layers) with clickable and editable parts and live consequences.
- **`attackLab`**: an `apiLab` variant with a visible vulnerable app, an attack goal, and a second phase where the learner patches it.
- **`sorter`**: drag situations into categories with feedback per item. Generalizes `matching`.

A simulation is a model, not the real system. Each `simulation` step states that in one line and, where possible, is followed by a step with real output from the runner.

## 4. Running story

One project grows through the course: the API of a small online shop. Every module's incident happens to this shop, so data, table names and characters stay familiar and the learner's own code accumulates.

## 5. Catalogue

Module numbers follow `00-context.md`. The site is desktop only (D11).

Format of each entry: **misconception**, then the interaction, the moment, and the engine. Entries marked **[signature]** are the ones to build first in each module.

### Module 2. The Node.js runtime

- **The loop as a roundabout [signature].** *Misconception: `setTimeout(0)` runs immediately; promises and timers are one queue.* Callbacks are cards. The learner moves each to the call stack, the `nextTick` queue, the promise queue, timers, I/O, or `setImmediate`, then runs the loop one phase at a time. Moment: "Promises jump the queue." Engine: `beTheMachine`.
- **The one-waiter restaurant [signature].** *Misconception: Node handles requests in parallel.* One waiter serves many tables. The learner adds a CPU-heavy order (a huge synchronous loop) and watches the wait time of every other table grow on a meter. Then moves the work to a helper in the kitchen (a worker thread) and compares. Moment: "One slow request froze everyone." Engine: `simulation`, followed by a real `apiLab` that measures it.
- **The tank and the pipe.** *Misconception: reading a file means loading it.* A fast source pours into a slow sink. A memory gauge fills. The learner switches between reading everything, piping, and ignoring backpressure, with a file-size slider from 1 MB to 2 GB. Moment: "Memory stayed flat with a stream." Engine: `simulation` with meter and scale slider.
- **Be the resolver.** *Misconception: imports find files by magic.* Given `import x from 'pkg/sub'` and a file tree, the learner clicks the locations Node checks, in order. Variants for CommonJS and ES modules, and for `exports` in `package.json`. Engine: `beTheMachine`.
- **Where does the error land?** *Misconception: `try/catch` catches everything.* Four throws: synchronous, inside a callback, in a promise without `catch`, in an event emitter. For each, the learner picks the destination: the `catch` block, an unhandled rejection, a crashed process. Then runs them for real. Engine: `sorter`, then `predict` with real output.
- **The memory leak hunt.** *Misconception: the garbage collector prevents leaks.* A server with a growing cache. The learner fires requests and watches a heap meter climb, then finds the reference that keeps objects alive. Engine: `simulation` plus `bugHunt`.

### Module 3. HTTP and API design

- **Write the request by hand [signature].** *Misconception: a request is a JavaScript object.* The learner assembles raw HTTP text from fragments: request line, headers, the blank line, the body. The server replies only when it is valid. Then the reverse: read a raw response. Moment: "It is just text with a blank line." Engine: `inspector` with Parsons.
- **The middleware conveyor [signature].** *Misconception: middleware order does not matter.* The learner orders stations: logger, CORS, body parser, authentication, rate limiter, route handler, error handler. Scripted requests travel through. Wrong orders fail specific scenarios: the body is empty in the handler, an error is never caught, an anonymous request reaches the handler. Engine: `pipelineBuilder`.
- **Design the routes, then meet the clumsy client.** *Misconception: REST is about naming.* The learner defines methods, paths and status codes for the shop. A scripted client then uses the API over a bad network and retries requests. Moment: "My POST created two orders." Leads to idempotency. Engine: `pipelineBuilder` with behavior-checked design.
- **Status code triage.** *Misconception: 200 with an error body is fine; 401 and 403 are the same.* Situations arrive one by one and the learner sorts them: 400, 401, 403, 404, 409, 422, 500. Each wrong choice shows what a client would do with it. Engine: `sorter`.
- **Attack your own endpoint.** *Misconception: the frontend already validated it.* The learner sends payloads to a naive handler: a missing field, a wrong type, a 5 MB string, an extra `isAdmin: true`. Each hit is recorded. Then the learner writes a validation schema until every attack bounces. Engine: `attackLab`.
- **The page that shifts.** *Misconception: offset pagination is always fine.* A list is being inserted into while the learner pages through it. Duplicates and skipped rows are highlighted. Switching to a cursor fixes it. A scale slider shows the cost of a deep offset. Engine: `simulation` with real `sqlLab` afterwards.
- **Be the browser: CORS.** *Misconception: CORS protects the server.* Three actors: the browser, the site, the API. For each request the learner predicts: is it sent, is there a preflight, can the script read the response? Moment: "The server processed it; only the browser hid the answer." Engine: `sequenceBuilder` with predictions.
- **The leaky bucket.** *Misconception: rate limiting is a counter per minute.* The learner taps to send requests and watches tokens drain and refill. Compares fixed window and token bucket on the same burst. Engine: `simulation`.

### Module 1. PostgreSQL

Design topics are specified in E06. Query topics:

- **The query X-ray [signature].** *Misconception: SQL runs in the order it is written.* The learner arranges clauses in execution order: `FROM`, `WHERE`, `GROUP BY`, `HAVING`, `SELECT`, `ORDER BY`, `LIMIT`. Each stage shows the intermediate table. Explains why an alias from `SELECT` is unknown in `WHERE`. Engine: `beTheMachine` with precomputed stages.
- **Buckets.** *Misconception: `GROUP BY` sorts.* Rows fall into buckets by key, then each bucket collapses into one row. The learner predicts the row count before and after, and why a non-aggregated column is rejected. Engine: `beTheMachine`.
- **NULL is not a value.** *Misconception: `NULL = NULL` is true.* The learner fills a truth table for `AND`, `OR`, `NOT` with unknowns, then predicts which rows a `WHERE x <> 5` returns. Engine: `predict` with `fillBlanks`.
- **The index budget [signature].** *Misconception: more indexes are always better.* Five slow queries, a budget of two indexes. The learner picks, sees real plan costs change, and a write-cost meter rise. A scale slider moves the table from a thousand to ten million rows. Engine: `inspector` on real `EXPLAIN` output with a budget.
- **Steal the money.** *Misconception: two statements in a row are safe.* Two sessions transfer money between accounts. The learner arranges the interleaving to make money vanish, then wraps the steps in a transaction or adds a row lock until the theft is impossible. Engine: `timelineLab`, break it first.
- **Make a deadlock.** The learner orders lock acquisitions in two sessions to produce a deadlock, reads the real PostgreSQL error, then fixes it with a consistent lock order. Engine: `timelineLab`.

### Module 4. Data access

- **Log in without a password [signature].** *Misconception: escaping quotes in the app is enough.* A login form next to a live preview of the SQL string being built, updating with every key press. The learner gets in without knowing the password. Then switches to parameters and sees the same input stay harmless data. Engine: `attackLab` with split view. The target is the lesson's own sandboxed app only.
- **The query counter [signature].** *Misconception: an ORM loop is one query.* A page lists fifty posts with authors. A counter spins to fifty-one and a waterfall shows each round trip. The learner rewrites with a join or batching until the counter shows one or two. Engine: meter on a real `apiLab`.
- **What did the ORM say?** The learner predicts the SQL for an ORM call, then sees the real statement. Includes one call that silently selects every column and one that loads a whole table to count it. Engine: `predict` with split view.
- **The parking lot.** *Misconception: opening connections is free.* A pool with five spaces. Requests arrive as cars. One handler forgets to release its connection. The learner watches the lot fill, the queue grow and timeouts start, with sliders for pool size and request rate. Engine: `simulation`, then `bugHunt` for the missing release.
- **Two branches, two migrations.** Two developers add migrations on separate branches. The learner merges them and predicts the state of production and staging. Engine: `timelineLab`.

### Module 5. Authentication and authorization

- **The leaked table [signature].** *Misconception: hashing is hashing.* The learner receives a leaked users table in three versions: plain text, fast unsalted hashes, slow salted hashes. In the second, identical hashes reveal identical passwords and a lookup table matches common ones at once. A meter shows guesses per second for each scheme. Moment: "Salt made every row its own problem." Engine: `inspector` with meter. Conceptual only; no cracking tools.
- **Follow the cookie.** *Misconception: JWT is the modern replacement for sessions.* The learner plays the server for both designs: on each request, decide what must be looked up. Then a scenario: the user clicks "log out everywhere". With sessions it is one delete. With tokens the learner discovers they need a store after all. Engine: `sequenceBuilder` with be the machine.
- **Take the token apart.** The learner clicks the three parts of a JWT, edits the payload to `role: admin`, and watches verification fail. A pitfall step tells the story of accepting unsigned tokens. Engine: `inspector`.
- **Someone else's order [signature].** *Misconception: logged in means allowed.* Logged in as one customer, the learner changes the id in `/orders/42` and reads another customer's order. Then adds the ownership check until the request returns 404. Engine: `attackLab`.
- **The cookie switchboard.** Three switches: `HttpOnly`, `Secure`, `SameSite`. Three attacks: a script reading the cookie, a forged form on another site, a plain HTTP connection. The learner predicts which attacks each combination blocks, then runs the simulation. Engine: `simulation` with predictions.
- **Passport control.** The OAuth authorization code flow as a role play. The learner places the messages between browser, application and provider in order, and marks which ones must never pass through the browser. Engine: `sequenceBuilder`.

### Module 6. Caching with Redis

- **The thundering herd [signature].** *Misconception: a cache only ever reduces load.* A popular key expires and a hundred requests hit the database at the same moment. A meter shows the spike. The learner tries a lock, early refresh, and serving the stale value while one request refills. Engine: `simulation`.
- **The stale price.** *Misconception: caching is "save it and read it".* An admin changes a price; a customer still sees the old one. The learner chooses an invalidation strategy (expiry time, delete on write, write-through), and scenarios show which ones leave a window of wrong data. Engine: `pipelineBuilder` with `timelineLab`.
- **The memory budget.** Limited memory and five candidate things to cache. The learner picks; a hit-rate meter and a latency meter respond. Then plays the eviction policy by hand: which key leaves when memory is full? Engine: budget with `beTheMachine`.

### Module 7. Queues and background jobs

- **The slow checkout [signature].** *Misconception: everything a request triggers must happen inside it.* The checkout handler sends an email and builds a PDF before answering. A latency meter shows two seconds. The learner moves the work to a queue and the response drops to milliseconds. Then the worker crashes mid-job: was the email lost? Engine: `simulation`, break it first.
- **Charged twice.** *Misconception: a job runs exactly once.* The worker charges the card and crashes before confirming the job. The queue delivers it again. The learner arranges the timeline to reproduce the double charge, then adds an idempotency key. Engine: `timelineLab`.
- **The poison job.** One job always fails and blocks everything behind it. The learner configures retries with growing delays and a dead-letter queue, and watches the backlog drain. Engine: `simulation`.

### Module 8. Testing and error handling

- **Your tests against The Bug [signature].** *Misconception: coverage means safety.* The learner writes tests. The Bug then mutates the implementation: flips a comparison, removes a line, changes a boundary. Every mutant the tests fail to catch survives. The score is mutants killed. Engine: `bugHunt` with precomputed mutants run through the runner.
- **Which test catches it?** Ten bugs. For each, the learner picks the cheapest kind of test that would have caught it: unit, integration, end to end. A cost meter adds up run time. Engine: `sorter` with budget.
- **The test that lies.** A test with everything mocked passes while the real endpoint is broken. The learner draws the boundary of what the test actually exercises, then removes one mock so it fails for the right reason. Engine: `bugHunt`.
- **Who is this message for?** An endpoint returns a stack trace with a file path and a query. The learner splits it into what the client should see and what goes to the log. Engine: `sorter`, then `bugHunt` on the error middleware.
- **The incident [signature].** One failed checkout among thousands of log lines. First with unstructured logs, timed. Then with structured logs and a request id, timed again. Moment: "With the id it took ten seconds." Engine: `inspector`, incident pattern.

### Module 9. Shipping

- **The layer cake [signature].** *Misconception: instruction order in a Dockerfile is cosmetic.* The learner orders the lines. After each simulated code change, a meter shows which layers rebuild and how long it takes. A second meter shows image size before and after a multi-stage build. Engine: Parsons with `simulation`.
- **Works on my machine.** Two environments side by side. The learner finds the hard-coded value that breaks production, then moves configuration to environment variables. Engine: `inspector`, then `bugHunt`.
- **Three requests in flight [signature].** A deploy sends the stop signal while three requests are running. The learner chooses what the handler does. A counter shows dropped requests. Only a graceful shutdown reaches zero. Engine: `timelineLab` with meter.
- **Traffic during a rollout.** Dots of traffic flow to three instances while they restart one by one. Without health checks, dots hit a starting instance and fail. The learner adds the check and adjusts timings. Engine: `simulation`.
- **The average lies.** A latency histogram with a long tail. The learner guesses the average, the median and the 99th percentile, then sees which customers live in the tail. Engine: `predict` with `inspector`.

## 6. Build order

1. Engines already specified: `beTheMachine` (E06 traces), scenario runner (E06).
2. `simulation` engine with meters and sliders. It unlocks the largest number of entries.
3. `pipelineBuilder`, `timelineLab`.
4. `inspector`, `sorter`, `sequenceBuilder`.
5. `attackLab` on top of `apiLab` from E04.

For content, start with the signature entry of the module the author is studying at the moment.

## 7. Acceptance criteria for any catalogue entry turned into a lesson step

- The five questions from section 1 are answered in the lesson's pull request.
- Success is checked by behavior, a trace, or scenarios, never by comparing free text.
- A simulation is labelled as a model and paired with real output where the runner can produce it.
- Attack steps target only the lesson's own sandboxed application.

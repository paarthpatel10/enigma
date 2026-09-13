# Enigma: the idea, the current prototype, and what comes next

Version: local reviewer prototype, documented 13 September 2026.
Audience: product reviewers, collaborators, and anyone being introduced to Enigma.

> This version is a working local application powered by synthetic responses.
> It does not contact AI providers or produce real findings about brands.
> Its purpose is to test the product experience and evidence workflow before
> connecting real models.

## 1. The idea in plain language

Enigma is an AI brand-intelligence observatory: a system intended to study how
AI systems mention, recommend, compare, and describe brands.

Imagine someone asking an AI assistant which project management tool their team
should choose. Some brands may appear, others may not. Different wording, a
different model, or another attempt might produce a different answer. One answer
is therefore not enough to establish a dependable pattern.

Enigma's intended approach is to ask a controlled set of questions repeatedly,
preserve the answers and their context, measure defined outcomes, and make those
measurements traceable to the original evidence. Eventually, it should help
investigate where results differ and which observable signals are associated
with those differences.

The central principle is **evidence before scores**. A dashboard number should
be something a reviewer can inspect and reproduce, not an unexplained rating.

Enigma is not a measure of objective product quality, public opinion, or market
share. Even with live models, it would measure outputs under specified test
conditions, not reveal a model's private reasoning or prove why it chose a brand.

## 2. What this version is trying to prove

This prototype tests a small end-to-end product journey:

1. Open a populated experiment.
2. Understand the overview and its measurement definitions.
3. Inspect the responses behind a number.
4. Start another controlled replay and watch its progress.
5. See how a failed response is handled.
6. Reload without losing saved evidence and export the experiment.

The question at this stage is: can a reviewer understand and audit this workflow?
It is not yet: which brand performs best in real AI answers?

The user interface, API, storage, extraction, calculations, progress updates,
and export are functioning software. The answer-producing component is a
deterministic fixture generator. That distinction is important: the displayed
numbers are calculated from stored test responses, but those responses are
authored examples rather than empirical observations.

## 3. What a reviewer can do

| Area | What it does now |
| --- | --- |
| Overview | Shows experiment status, response counts, brand mention results, and comparisons between the two synthetic targets |
| Experiments | Lists saved experiments and lets a reviewer select one or launch another replay |
| Response explorer | Searches and filters saved responses by target and outcome, with paginated results |
| Evidence detail | Displays original response text, the prompt, outcome, collection context, and manifest hash |
| Methodology | Explains the metrics and exposes the resolved experiment configuration |
| Export | Downloads a JSON bundle containing the configuration, status, raw runs, and calculated report |
| Presentation | Provides responsive layouts and light/dark appearance |

The launch dialog accepts an experiment name, a repeat count from 1 to 20, and
an optional simulated failure. It does not yet offer arbitrary categories,
editable prompt sets, real provider selection, or uploaded experiment code.

Response filters narrow the explorer; they do not redefine the saved experiment
or turn the overview into a filtered research report.

## 4. The example experiment

The trusted definition is in `experiments/project_tools.py`.

| Setting | Current example |
| --- | --- |
| Category | Project management |
| Brands | Notion, Asana, Linear, Monday |
| Targets | `fixture-a` and `fixture-b`; neither represents a real provider |
| Persona label | Small-team buyer |
| Geography label | US English, prompt context only |
| Questions | Six project-tool selection prompts |
| Default repetitions | Ten per question per target |
| Default total | 6 questions × 2 targets × 10 repetitions = 120 runs |

The questions cover small teams, growing startups, remote teams, software work
planning, documentation, and shortlisting. These are example prompts, not an
approved empirical sampling protocol or a balanced factorial experiment.

A run is one question-target-repeat combination. An experiment groups all those
runs under one saved configuration. With the current fixed questions and targets,
the repeat limit permits 12 to 240 runs per experiment.

The persona and geography are recorded context labels. The replay does not
simulate real people, geographic routing, local search results, or localization.

### Why Python definitions and JSON snapshots?

Python is the editable, trusted source of an experiment definition. It lets the
backend validate the definition using the same domain code as the runner. YAML
is not required in this version.

Before collection begins, Enigma resolves the definition into a JSON manifest.
That manifest is the portable record of what the particular experiment used.
Changing the Python definition later does not rewrite old manifests or raw runs.

This is not a system for executing uploaded Python. The API accepts a fixed
server-owned definition identifier and bounded options, not source code or
arbitrary import paths. New local definition changes require a server restart.

## 5. What happens when an experiment runs

```text
Reviewer starts replay
        |
        v
API validates options and checks no replay is already active
        |
        v
Create experiment ID + save resolved manifest + queued status
        |
        v
For each question, synthetic target, and repetition:
    generate fixture -> save raw run -> update progress
        |
        v
Read stored runs -> extract mentions, numbered items, and URLs
        |
        v
Calculate summary -> display evidence and metrics -> export JSON
```

The API schedules collection as an in-process background task. The runner works
sequentially through the combinations and saves each response before updating
progress. A short artificial delay makes progress visible; it is not model
inference time or a performance benchmark.

The interface periodically fetches updates while collection is active. Metrics
shown during a run describe the responses saved so far, not the final planned
sample. When collection finishes, the status becomes `completed` or
`completed_with_errors`.

Only one replay may be queued or running at a time. Another start request is
rejected with a conflict response. There is no distributed queue, automatic
retry system, or resume-from-checkpoint feature.

On the first server start with an empty data directory, the application creates
the default 120-response example automatically. Later starts reuse the saved
experiments. Any previously queued or running experiment is marked interrupted
at startup; its existing evidence is retained rather than silently resumed.

### How the synthetic answers are made

`src/adapters/replay.py` uses a fixed arithmetic rule involving the prompt index,
repeat index, brand position, and fixture target to select brands. It inserts
selected brands into authored numbered descriptions. Some responses include an
illustrative `example.com` URL. Every successful response identifies itself as
a synthetic fixture.

The two targets use different hard-coded thresholds to create visible comparison
patterns. These patterns are programmed test behavior, not discovered brand
advantages. The recorded seed of 42 is metadata; the generator does not call a
random-number engine or sample a language model.

Replaying the same definition and repeat count produces the same response content
pattern, although experiment IDs and timestamps change. Adding repetitions does
not create independent scientific evidence from these deterministic fixtures.

## 6. What is saved and why

By default, evidence lives locally under `data/raw/`. `ENIGMA_DATA_DIR` can select
another local directory.

```text
data/raw/<experiment-id>/
    manifest.json       Resolved definition and version metadata
    status.json         Mutable progress and outcome
    raw/
        run-0001.json   Original response and collection context
        run-0002.json
        ...
```

Each raw run records its experiment/run identifiers, target and provider label,
UTC timestamp, prompt and variant/family identifiers, repetition number, persona,
geography, collection surface, settings, schema version, synthetic flag, outcome,
error/exclusion information, original text, and a SHA-256 hash of the manifest.

The manifest records brands, prompts, targets, repetition count, definition
version, schema/extractor/metric versions, creation time, and failure-test option.
The reviewer-supplied display name is stored in experiment status; the manifest
also retains the definition's own name.

The application creates manifests and raw-run files without overwriting existing
files. Progress is intentionally mutable and replaced atomically. This is
application-level preservation, not tamper-proof storage: someone with filesystem
access can still modify files. The manifest hash identifies configuration; it
is not a signature or a hash of the response body.

Derived results are calculated from the stored responses when requested rather
than maintained in a separate analytics database. Export bundles include the
report generated at export time. For a stable completed snapshot, export after
collection finishes; exporting mid-run can reflect evolving progress.

Generated evidence is excluded from Git. Pushing the repository shares the code
and documentation, not the experiments saved on the developer's machine. A new
installation generates its own example. Export and back up evidence separately
when it needs to be shared or retained.

## 7. How the measurements work

The unit of analysis is a saved response. Successful responses are eligible for
brand metrics; failed responses are counted separately and excluded from the
denominator. Runs that have not yet completed are not treated as negative answers.

### Brand mentions

The extractor checks each configured brand using case-insensitive word boundaries.
A response contributes at most one mention count per brand, even if it repeats
that name many times.

`Mention probability = successful responses mentioning the brand / all successful responses`

For example, if eight of eleven successful responses mention a brand, the result
is 8/11, about 72.7%. An additional failed run does not change the denominator to
twelve. This is a worked example, not a reported brand result.

Per-target calculations use only successful responses for that target. A response
may mention several brands, so brand percentages need not sum to 100%. This
metric is not market share or a normalized share-of-voice score.

### Numbered recommendations

The current rule recognizes a numbered line such as `1. Notion ...` when the
brand starts the item. It records that item's number and aggregates the number
of successful responses containing such an item for each brand.

This is a formatting heuristic, not semantic recommendation analysis. It can
miss prose recommendations and does not reliably distinguish endorsement from
criticism. Rank/position is extracted, but an aggregate ranking metric is not
implemented. Sentiment and attribute extraction are also not implemented.

### URLs and citations

The extractor identifies HTTP/HTTPS URLs in the response text and removes exact
duplicates within a response. The summary counts successful responses containing
at least one URL, not the number of verified sources or brand-specific citations.

It does not fetch pages, verify claims, evaluate source quality, or establish
that a URL influenced an answer. Fixture URLs are explicitly illustrative.

### Uncertainty and missing data

Mention results include a 95% Wilson binomial interval. With no successful
responses, probability and interval are `null`, meaning unavailable rather than
zero visibility.

On these deterministic fixtures, intervals demonstrate the reporting interface;
they are not meaningful empirical uncertainty estimates. Before live research,
the sampling design must address dependencies across prompts and repeated runs,
provider differences, and whether binomial assumptions are appropriate. Pooling
responses can also obscure differences between prompts and targets.

## 8. Failures, safeguards, and operational limits

Checking the failure option causes exactly one combination—the first prompt,
first repetition, and `fixture-b`—to return a simulated timeout with empty text
and an explicit exclusion reason. For a one-repeat experiment, twelve runs are
saved: eleven successes and one failure. The final state is completed with errors.

Collection exceptions can produce an interrupted experiment. Existing raw files
remain available. Recovery currently means inspecting that evidence and starting
a new experiment; there is no automatic retry or continuation. This is not a
transactional database, so crash recovery and consistency guarantees remain
limited.

Run-save logs include experiment ID, run ID, and outcome to make collection
traceable. Normal run-save events do not log full response payloads.

The server is intended for a single user on loopback with one worker. In-process
locking coordinates local file access but does not support multiple server
processes. Browser writes from unexpected origins are rejected; that safeguard
is not authentication. There are no accounts, permissions, multi-tenant isolation,
or production security controls. Do not expose this version publicly.

## 9. Technical architecture

| Layer | Implementation | Responsibility |
| --- | --- | --- |
| Presentation | React, TypeScript, Vite | Reviewer screens, navigation, filters, dialogs, progress display |
| HTTP interface | Python and FastAPI, `src/interfaces/api.py` | Validate requests, expose experiments/evidence/export, serve the built UI |
| Application workflow | `src/application/runner.py` | Prepare experiments, iterate runs, preserve metadata, update status |
| Domain | `src/domain/research.py` | Validate definitions, extract evidence, calculate metrics and intervals |
| Collection adapter | `src/adapters/replay.py` | Produce deterministic synthetic responses |
| Storage adapter | `src/adapters/store.py` | Persist manifests, raw runs, and progress as local JSON |

The domain calculations do not depend on FastAPI or React. Collection and storage
are separated from presentation so later integrations can be added without
embedding provider logic in UI components. The runner currently calls the replay
adapter directly; a production plugin architecture is not implemented.

The API exposes health, experiment listing and launch, individual experiment
details, response retrieval, and JSON export. Response search and pagination are
client-side in this version; this is suitable for the bounded prototype, not
large-scale datasets.

These are reversible prototype choices, not a final production stack decision.
Setup commands are in the repository [README](../README.md).

## 10. A short explanation and demonstration you can reuse

You can introduce the product like this:

> Enigma is being built to study how AI systems represent brands. Instead of
> relying on a single answer or an unexplained visibility score, it organizes
> controlled experiments and connects every metric to saved responses and their
> context. This first version demonstrates that workflow with synthetic answers:
> you can run a replay, inspect evidence, understand the calculations, and export
> the results. Connecting real providers and validating the research method are
> the next steps; today's example numbers are not brand research findings.

For a five-minute demo:

1. Open the overview and point out the synthetic-data labeling and sample size.
2. Explain that each bar comes from counting saved responses, not a manually set
   dashboard percentage.
3. Open a response and show its original text, prompt, and metadata.
4. Open Methodology and explain the successful-response denominator.
5. Launch one repetition with a simulated failure; show eleven eligible responses
   out of twelve saved runs.
6. Export the completed bundle and explain how someone can inspect the evidence
   outside the interface.

Ask reviewers whether the distinction between simulation and research is clear,
whether they can trace a metric to evidence, and which questions the experience
leaves unanswered. Positive feedback on usability does not validate the research
method or establish demand for every proposed future feature.

## 11. What has been verified

The prototype has nine passing backend tests covering extraction, denominator and
missing-data behavior, interval bounds, validation, evidence preservation, API
export, interrupted-run handling, and cross-origin rejection. Python lint/type
checks and frontend formatting/build checks passed. Dependency audits reported
no known vulnerabilities at verification time; this is not a security guarantee.

Playwright CLI checks exercised experiment launch, progress/completion, response
search, raw-evidence dialogs, restart persistence, simulated failure, export,
and desktop/mobile/dark layouts. These are manual browser checks, not a complete
automated regression suite or accessibility certification. Two dependency
deprecation warnings remain in backend tests.

See [Reviewer verification](REVIEWER_VERIFICATION.md) for the recorded checks.
The first live-provider research milestone remains incomplete.

## 12. Future scope

The following is a proposed progression, not a committed delivery schedule.
Provider selection, research sampling, production storage, hosting, and commercial
scope still require decisions in the [project specification](PROJECT_SPEC.md).

### First: validate one small live experiment

Choose one category, three to five brands, a controlled prompt set, and at least
two actual model providers. Implement provider adapters with explicit model and
API versions, generation/retrieval settings, rate limits, cost tracking, and
failure handling. Preserve raw responses before analysis and distinguish API
collection from consumer-facing assistant experiences.

Build a human-reviewed evaluation set to measure extraction accuracy. Define
sampling, exclusions, stopping rules, uncertainty assumptions, and comparison
limits before interpreting results. Success means another person can reproduce
the analysis from saved evidence—not merely see live bars on a dashboard.

### Then: richer measurement and comparison

Explore validated recommendation/position metrics, attribute associations,
sentiment, source-domain analysis, prompt sensitivity, and cross-model
disagreement. Keep these separate measures with documented denominators rather
than combining them into an arbitrary universal score.

Add configurable experiments only with appropriate validation and provenance.
Repeated time periods could support drift and stability analysis; a single
collection cannot establish a trend.

### Later: investigate explanations and interventions

Explore relationships among cited sources, brand entities, reviews, media, and
owned content. Record hypotheses and documented interventions, then remeasure.
Observational correlations should remain associations; causal claims require a
stronger design that considers confounders and alternative explanations.

### If validated: operational and collaborative product

Consider scheduled collection, durable background jobs, retries, scalable
storage, automated browser regression tests, stronger accessibility coverage,
and robust monitoring. A shared product would additionally need authentication,
authorization, tenant isolation, secure secret management, backups, retention
policies, provider-policy compliance, and deployment controls.

Shared reports, reviewer annotations, and evidence-linked findings may help teams
collaborate. These should follow actual reviewer needs rather than expanding the
prototype into a broad platform prematurely.

The long-term ambition is a disciplined learning loop: observe AI outputs,
measure patterns, form testable hypotheses, evaluate changes, and learn—while
keeping the evidence, uncertainty, and limits visible at every step.

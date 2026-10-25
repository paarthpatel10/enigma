# Enigma coding-agent guide

Status: **Baseline 0.1**
Last updated: **2026-08-25**

## 1. Purpose

Enigma is a research-grade AI brand-intelligence observatory. It measures how
AI systems mention, recommend, compare, characterize, and cite brands; how those
results vary across controlled conditions; and which observable signals are
associated with the differences.

Enigma is not a generic SEO dashboard and must not present model output as
objective brand quality, public opinion, or market share. Its intended
differentiator is reproducible measurement: preserved raw evidence, controlled
experiments, repeated runs, explicit denominators, uncertainty, and traceable
claims.

The initial product loop is:

```text
observe -> measure -> form a hypothesis -> test -> re-measure -> learn
```

## 2. Document ownership

Consult these documents before changing the repository:

- `docs/PROJECT_SPEC.md` is authoritative for approved product scope, research
  requirements, milestone definitions, non-goals, and open product decisions.
- `docs/RESEARCH.md` is the evidence and idea ledger for competitor findings,
  discussion insights, gaps, hypotheses, and potential adaptations. An entry in
  the research ledger is not automatically an approved requirement.
- `docs/ENGINEERING_STANDARDS.md` is authoritative for detailed architecture,
  quality, observability, resilience, security, and testing policy.
- `AGENTS.md` contains specialized agent responsibilities and workflows, such as
  Git governance. It is separate from this repository-wide guide.
- `CODEX.md` gives all coding agents stable, repository-wide context and must
  remain consistent with the documents above.

When documents disagree, do not silently choose one. Identify the conflict and
ask for a decision. Record approved product decisions in `PROJECT_SPEC.md` and
material, hard-to-reverse technical choices in an architecture decision record.

## 3. Current phase and approved scope

The project is in discovery and specification. Prefer a small, reproducible
vertical slice over broad platform scaffolding.

The first research milestone is an offline-first experiment covering one
product category, three to five brands, a controlled prompt set, repeated runs,
and at least two model providers. It must preserve raw responses and metadata,
derive transparent metrics, compare prompt sensitivity and model disagreement,
and produce a reproducible report with limitations and links to underlying
runs.

Long-term capability areas—discovery, measurement, perception, authority
mapping, research analysis, and an intervention/action loop—are directions, not
committed milestones. Do not implement an item merely because it appears in the
capability map or research ledger.

## 4. Technology stack

Python and FastAPI are approved, with a local-first testing phase and a React
frontend preference. Python experiment definitions resolve to saved JSON before
collection. The reviewer prototype uses React + TypeScript/Vite and local JSON
files as reversible implementation choices. No production database, cloud, or
SaaS architecture is approved. See PROJECT_SPEC.md section 12.

When the first vertical slice requires a stack decision:

1. derive selection criteria from the approved experiment;
2. compare the smallest viable alternatives;
3. document the decision and trade-offs in `docs/decisions/`;
4. update `docs/PROJECT_SPEC.md`, `docs/ENGINEERING_STANDARDS.md`, and this file
   where the decision changes their content; and
5. add exact, reproducible development commands to this file.

## 5. Architecture

Begin as a modular monolith using ports-and-adapters boundaries:

```text
interfaces (CLI/API/jobs/UI)
             |
             v
application use cases -----> ports/contracts
             |                    ^
             v                    |
domain + metrics          adapters/infrastructure
                          (models, storage, queues, web)
```

For the research pipeline, preserve these separable stages:

```text
versioned experiment manifest
             |
             v
provider adapters -> immutable raw responses -> extraction/normalization
                                                   |
                                                   v
                                           metrics + analysis
                                                   |
                                                   v
                                            report/dashboard
```

Architecture rules:

- Domain and metric code must not import model SDKs, database clients, web
  frameworks, or UI libraries.
- Application use cases coordinate behavior through explicit ports.
- Adapters translate provider and storage formats, capabilities, and failures
  into internal contracts without hiding meaningful provider differences.
- Interfaces validate input and present results; they do not own research or
  metric rules.
- Keep collection, raw storage, extraction, metrics, analysis, and presentation
  independently testable.
- Add deployable services only when demonstrated scaling, isolation, ownership,
  or reliability needs justify their operational cost.
- Introduce design patterns only for a concrete recurring problem. Avoid hidden
  global state, service locators, inheritance-heavy hierarchies, and speculative
  abstractions.

## 6. Project structure

The current repository is documentation-first:

```text
Enigma/
├── CODEX.md
├── AGENTS.md
├── README.md
├── .agents/skills/          local specialized workflows; not committed
└── docs/
    ├── PROJECT_SPEC.md
    ├── RESEARCH.md
    ├── ENGINEERING_STANDARDS.md
    └── PLUGIN_AND_SKILL_PLAN.md
```

As implementation is approved, use these logical locations. Create a directory
only when it has real content:

```text
configs/                     safe versioned configuration and examples
data/samples/                small sanitized fixtures only
docs/decisions/              architecture decision records
experiments/manifests/       versioned experiment definitions
scripts/                     repeatable development and operations commands
src/domain/                  entities, value objects, invariants, metrics
src/application/             use cases and orchestration
src/ports/                   provider, storage, and queue contracts
src/adapters/                external-system implementations
src/interfaces/              CLI, API, job, and UI boundaries
src/observability/           logging, metrics, and tracing setup
tests/unit/
tests/contract/
tests/integration/
tests/end_to_end/
tests/fixtures/
```

Adapt package nesting to the selected language while preserving the logical
boundaries. Do not add empty scaffolding.

## 7. Module and component organization

- Give each module one cohesive responsibility and a small public surface.
- Organize by domain responsibility and architectural boundary, not by framework
  convenience.
- Keep provider adapters separate from extraction, analysis, and presentation.
- Keep metric definitions pure and independently testable where practical.
- Place reusable boundary behavior behind small capability-focused contracts.
- Prefer composition over inheritance.
- Do not create an interface for every class; create contracts where behavior
  varies or a boundary needs isolation.
- Make schemas typed and versioned. Preserve compatibility or provide a
  documented migration when an API or schema changes.

## 8. Naming conventions

Until a language-specific standard is approved:

- Use clear, domain-specific names rather than abbreviations.
- Name types and modules after their responsibility, such as `Experiment`,
  `RawResponse`, `ProviderAdapter`, or `MentionProbability`.
- Use stable identifiers for experiments, runs, prompts, brands, and model
  targets. Do not use display names as identifiers.
- Include units or aggregation meaning where ambiguity is possible.
- Name boolean values as predicates (`is_valid`, `has_citation`) according to the
  selected language's conventional casing.
- Name tests after observable behavior and expected outcome.
- Use UTC for stored timestamps and make timezone conversions explicit.
- Follow the selected ecosystem's standard formatter and naming style once the
  stack is chosen; document material exceptions here.

## 9. Research data and metric conventions

Preserve each raw response and its collection metadata before normalization or
derivation. At minimum record:

- experiment and run identifiers;
- provider, model, collection surface, and timestamp;
- exact prompt, prompt family/variant, intent, persona, and geography;
- run number and relevant generation or retrieval settings;
- response status, failure category, and exclusion reason; and
- prompt, manifest, schema, and metric-definition versions.

For each metric, document its unit of analysis, numerator, denominator,
aggregation, missing/failed-run behavior, and uncertainty method. Report sample
sizes and uncertainty with point estimates. Do not combine visibility,
perception, and influence into one score without validation and an approved
rationale.

Separate observations, associations, hypotheses, and causal claims. Source
influence is an association unless an intervention or stronger causal design
supports causality. Cross-provider comparisons must disclose differences in
model behavior, retrieval, APIs, and consumer-facing surfaces.

## 10. Database and API conventions

No production database or public API has been approved. The local reviewer API
serves synthetic replay data and rejects cross-origin browser writes. It must
run on loopback with a single worker; it is not a public service.

When introduced:

- keep persistence behind explicit ports rather than embedding queries in
  domain logic;
- version stored raw and derived schemas;
- make migrations reviewable, reversible where practical, and tested;
- preserve immutable raw-run provenance;
- use stable resource identifiers and explicit API versions;
- validate untrusted input at the interface boundary;
- use typed/domain-specific errors with documented semantics;
- make collection operations idempotent with stable experiment/run IDs;
- apply network timeouts and retry only transient failures with bounded backoff
  and jitter; and
- never silently drop a run or provider failure.

## 11. Coding, configuration, and observability conventions

- Prefer simple code and explicit behavior over speculative flexibility.
- Document public contracts, invariants, units, and non-obvious reasoning.
- Use environment variables or a secret manager for environment-specific and
  sensitive values. Commit only sanitized examples.
- Pin dependencies and commit the chosen ecosystem's lockfile.
- Use structured, contextual logging with stable event names and UTC timestamps.
- Include relevant experiment, run, job, provider, model, duration, retry, and
  outcome fields.
- Never log credentials, authentication headers, personal data, or full
  sensitive prompts/responses. Raw payloads belong in the controlled raw store.
- Preserve causes when translating external errors at adapter boundaries.

## 12. Testing expectations

Tests protect research correctness and observable behavior, not an arbitrary
coverage percentage.

- Unit-test domain rules, schemas, metric formulas, parsers, normalization, and
  edge cases.
- Contract-test every provider and storage adapter against shared behavior and
  error semantics.
- Integration-test storage, configuration, and provider boundaries using
  controlled sandboxes or recorded fixtures.
- Keep a small number of end-to-end tests for critical manifest-to-report flows.
- Validate extraction against human-reviewed examples and test denominators,
  uncertainty calculations, and research invariants.
- Add a regression test for each bug fix when practical.
- Mock external boundaries, not internal implementation details.
- Never call paid or nondeterministic model APIs from the default unit suite.
- Mark live-provider tests explicitly and require opt-in credentials.
- Keep fixtures small, sanitized, versioned, and representative.
- Treat flaky tests as defects.

## 13. Development commands

The local reviewer prototype has Python/FastAPI and a React/Vite frontend.
Canonical setup and verification commands are in README.md.

Once a stack is approved, add the exact canonical commands here and ensure CI
uses the same commands developers use locally:

```text
Install:      .venv/Scripts/python -m pip install -r requirements-lock.txt; npm ci (frontend/)
Run locally:  .venv/Scripts/python -m uvicorn src.interfaces.api:app --host 127.0.0.1 --port 8000
Format:       python -m ruff format src experiments tests; npm run format (frontend/)
Lint:         python -m ruff check src experiments tests
Type-check:   python -m mypy; npm run check (frontend/)
Test:         python -m pytest -q
Build:        npm run build (frontend/)
Security:     python -m pip_audit; npm audit (frontend/)
```

Do not invent commands or imply checks passed when their tooling does not exist.

## 14. Git and change discipline

Follow the specialized Git instructions in `AGENTS.md`. At present, `main` is
stable work, `develop` is the intended integration branch, and implementation
belongs on short-lived `feature/<descriptive-name>` branches from `develop`.

Keep commits conventional, focused, and reviewable. Do not commit secrets, raw
or generated research datasets, large model-response exports, local databases,
logs, caches, or build output. Preserve unrelated user changes in a dirty
worktree.

## 15. Constraints: do not change without approval

Agents must not:

- convert an open decision or research idea into a product requirement;
- select a production stack, database, framework, cloud, or deployment target
  without an approved decision;
- weaken raw-response preservation, provenance, or traceability;
- present model perception as product quality, public opinion, or market share;
- make causal claims from observational citation correlations;
- hide provider/API differences to make comparisons appear cleaner;
- create a universal weighted score without validation and approval;
- add automated publishing, PR outreach, backlink generation, production
  multi-tenancy, or large-scale browser automation to milestone one;
- place research/business rules in adapters, interfaces, or UI code;
- add services, queues, repositories, patterns, or empty directories for
  hypothetical future needs;
- store credentials or sensitive customer data in Git, fixtures, logs, or
  prompts; or
- overwrite unrelated work or generated research evidence.

## 16. Keeping this file current

Update `CODEX.md` in the same change whenever an approved decision alters:

- product purpose or committed scope;
- technology stack or dependencies;
- repository structure or module boundaries;
- architecture, schemas, database, or API conventions;
- naming, coding, testing, security, or Git conventions;
- canonical run, format, lint, type-check, test, build, or security commands; or
- constraints future coding agents must preserve.

Also update the authoritative source document. Research findings first belong in
`docs/RESEARCH.md`; approved product decisions belong in `docs/PROJECT_SPEC.md`;
hard-to-reverse technical decisions belong in `docs/decisions/`; specialized
agent workflows belong in `AGENTS.md`.

Before handing off a change, verify that this guide remains accurate and report
which checks ran and which were unavailable.

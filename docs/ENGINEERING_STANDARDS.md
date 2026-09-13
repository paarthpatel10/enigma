# Enigma engineering standards

Status: **Baseline 0.1 — stack-neutral**
Last updated: **2026-08-23**

## 1. Purpose

These standards define how Enigma should be designed, implemented, tested, and
operated. They apply regardless of the final language or framework and should be
refined once the first technical stack is selected.

The goal is maintainable, observable, testable software—not architecture for its
own sake.

Reviewer prototype (2026-09-13): Python/FastAPI, React/TypeScript/Vite and local
JSON evidence storage implement the testing slice in PROJECT_SPEC.md section 12.
Use requirements-lock.txt and frontend/package-lock.json for reproducible setup.
The architecture rules below continue to apply. This is a single-worker local
service with synthetic fixtures, not a production deployment architecture.

## 2. Core engineering principles

- **Single responsibility:** each module should have one cohesive reason to
  change.
- **Open/closed:** extend provider, extractor, metric, and storage behavior
  through stable contracts where variation is known; do not generalize imagined
  future requirements.
- **Liskov substitution:** implementations of a contract must preserve its
  documented behavior, error semantics, and data guarantees.
- **Interface segregation:** expose small capability-focused interfaces rather
  than one large service used differently by every caller.
- **Dependency inversion:** domain and application logic depend on contracts;
  provider SDKs, storage, queues, and web frameworks implement those contracts.
- **KISS:** choose the simplest design that meets the current acceptance criteria.
- **YAGNI:** do not add services, abstractions, or infrastructure without a
  demonstrated need.
- **DRY with judgment:** remove duplicated knowledge or business rules; harmless
  duplicated syntax is preferable to a misleading abstraction.
- **Explicit over implicit:** make schemas, units, time zones, identifiers,
  defaults, retries, and failure behavior visible.

## 3. Architectural boundaries

Use a ports-and-adapters style separation without requiring a specific framework:

```text
interfaces (CLI/API/jobs/UI)
             |
             v
application use cases -----> ports/contracts
             |                    ^
             v                    |
domain + metrics          adapters/infrastructure
                          (LLMs, storage, queues, web)
```

### Dependency rule

- Domain models and metric calculations must not import provider SDKs, database
  clients, web frameworks, or UI libraries.
- Application use cases coordinate domain behavior through explicit ports.
- Adapters translate external formats and failures into internal contracts.
- Interfaces validate requests and present results; they do not contain research
  or business rules.

Begin as a modular monolith. Introduce separate deployable services only when
independent scaling, isolation, ownership, or reliability requirements justify
the operational cost.

## 4. Design-pattern policy

Patterns are tools, not requirements. Introduce one only when the problem and
trade-off are documented and the resulting code is easier to test and change.

Likely useful patterns include:

| Pattern | Appropriate Enigma use |
| --- | --- |
| Adapter | Normalize different model providers, storage systems, or collection surfaces |
| Strategy | Select extraction, scoring, interval, or prompt-generation algorithms |
| Factory | Construct a provider/strategy from validated configuration |
| Repository | Isolate persistence when more than trivial file access is required |
| Pipeline | Compose explicit collection, extraction, validation, and analysis stages |
| Specification | Represent reusable filtering or experiment eligibility rules |

Avoid service locators, hidden global state, inheritance-heavy hierarchies, and
singletons used as dependency containers. Do not create an interface for every
class; create contracts at boundaries that genuinely vary or need isolation.

## 5. Provisional repository structure

Create directories when the first implementation needs them. Do not add empty
folders solely to resemble this diagram.

```text
Enigma/
├── .agents/skills/           project-specific Codex workflows
├── configs/                  safe, versioned configuration and examples
├── data/
│   └── samples/              small, sanitized, reviewable fixtures only
├── docs/
│   ├── decisions/            architecture decision records (ADRs)
│   └── ...                   specifications and operating guidance
├── experiments/
│   └── manifests/            versioned experiment definitions
├── scripts/                  repeatable development/operations commands
├── src/
│   ├── domain/               entities, value objects, invariant logic
│   ├── application/          use cases and orchestration
│   ├── ports/                provider/storage/queue contracts
│   ├── adapters/             external-system implementations
│   ├── interfaces/           CLI, API, jobs, and UI boundaries
│   └── observability/        logging, metrics, and tracing setup
└── tests/
    ├── unit/
    ├── integration/
    ├── contract/
    ├── end_to_end/
    └── fixtures/
```

Adapt package nesting to the selected language while preserving these logical
boundaries. Raw, interim, processed, and generated datasets remain ignored; only
small sanitized fixtures or samples belong in Git.

## 6. Configuration and secrets

- Read environment-specific values from environment variables or a dedicated
  secret manager; never commit real credentials.
- Commit a sanitized `.env.example` when environment variables are introduced.
- Validate configuration at startup and fail with actionable messages.
- Separate configuration from code and define precedence explicitly.
- Pin dependencies and commit the ecosystem's lockfile.
- Rotate a credential immediately if it is exposed; deleting it from the latest
  commit is not sufficient.

## 7. Logging, metrics, and tracing

Use structured logs with stable event names and fields. Logs should support both
local debugging and production investigation.

Include relevant context such as:

- timestamp in UTC;
- severity and event name;
- application version/environment;
- correlation, experiment, run, and job identifiers;
- provider/model and operation name when applicable;
- duration, retry count, outcome, and normalized error category.

Never log API keys, tokens, authentication headers, personal data, or complete
sensitive prompts/responses. Raw research payloads belong in the controlled raw
response store with provenance and retention rules—not in logs.

Use log levels consistently:

- `DEBUG`: local diagnostic details, disabled or sampled in production;
- `INFO`: meaningful lifecycle and successful operation events;
- `WARNING`: recoverable degradation, retry, or unexpected condition;
- `ERROR`: failed operation requiring investigation;
- `CRITICAL`: system-level failure or integrity risk.

Add metrics for latency, throughput, error/retry rates, provider usage/cost, queue
depth, failed runs, and extraction quality as those components are introduced.
Use distributed tracing only when work crosses process or service boundaries.

## 8. Errors, resilience, and external APIs

- Use typed/domain-specific errors instead of relying on message parsing.
- Preserve causes while translating provider failures at adapter boundaries.
- Distinguish validation, authentication, authorization, rate-limit, transient,
  provider, integrity, and internal failures.
- Apply timeouts to network operations.
- Retry only transient failures, with bounded exponential backoff and jitter.
- Respect provider rate limits and `Retry-After` guidance.
- Make collection jobs idempotent using stable experiment/run identifiers.
- Use circuit breakers, queues, or dead-letter handling only after the failure
  mode requiring them exists.
- Never silently drop a run; record its terminal state and exclusion reason.

## 9. Testing strategy

Tests should protect behavior and research correctness, not merely increase a
coverage number.

### Required layers

- **Unit tests:** domain rules, metric formulas, parsers, normalization, and edge
  cases; fast and deterministic.
- **Contract tests:** every provider/storage adapter satisfies the same internal
  contract and error semantics.
- **Integration tests:** real boundaries such as storage, configuration, and
  provider clients using controlled sandboxes or recorded fixtures.
- **End-to-end tests:** a small number of critical workflows from manifest to
  reproducible result.
- **Research validation tests:** known examples, human-reviewed extraction sets,
  denominator checks, uncertainty calculations, and invariants.

### Test rules

- Every bug fix includes a regression test when practical.
- Mock at external boundaries, not internal implementation details.
- Never call paid or nondeterministic model APIs from the default unit-test suite.
- Mark live-provider tests explicitly and require opt-in credentials.
- Control randomness with recorded seeds when supported; otherwise test
  invariants and statistical tolerances rather than exact model wording.
- Keep fixtures small, sanitized, versioned, and representative.
- Treat flaky tests as defects; fix or quarantine them with an owner and reason.

Coverage is a diagnostic signal. Critical metric, schema, and integrity code
requires strong branch coverage, but no project-wide percentage replaces review.

## 10. Code quality and documentation

Once the stack is chosen, configure one standard formatter, linter, type checker,
test runner, dependency/security scanner, and pre-commit workflow where supported.
CI should run the same commands developers run locally.

- Prefer clear names and small cohesive modules.
- Document public contracts, invariants, non-obvious decisions, and units.
- Avoid comments that restate code; explain why a constraint exists.
- Maintain architecture decision records for material, hard-to-reverse choices.
- Keep API and schema changes backward-compatible or provide a migration.
- Use conventional, reviewable commits and avoid mixing unrelated changes.

## 11. Security and privacy baseline

- Validate untrusted inputs at system boundaries.
- Use least-privilege credentials and narrowly scoped tokens.
- Sanitize filenames, URLs, and model-produced tool arguments before use.
- Protect against prompt injection when retrieved content can influence tools.
- Review dependencies and automate vulnerability checks after a package manager
  is introduced.
- Define retention and deletion behavior before storing customer or large-scale
  response data.
- Do not use sensitive customer data in test fixtures or model prompts without
  explicit authorization and controls.

## 12. Definition of done

A change is complete when:

- acceptance criteria and relevant edge cases are satisfied;
- architecture respects the dependency rule;
- logging and error behavior are appropriate for the change;
- relevant unit, contract, integration, or end-to-end tests pass;
- formatting, linting, types, and security checks pass where configured;
- documentation/specifications and safe configuration examples are updated;
- no secret, generated dataset, or unnecessary artifact is staged;
- limitations and any checks not run are reported.

# India skincare implementation plan

> For agentic workers: use executing-plans for inline execution, with TDD for each task.

**Goal:** Add the approved bounded, ungrounded Gemini pilot without changing old replay evidence.
**Architecture:** A provider contract separates external collection from the runner;
fixed definitions select replay or Gemini. Existing API and React screens expose
mode-specific information. Raw provider payloads are retained before metrics.
**Tech stack:** Existing Python, FastAPI, httpx, React and TypeScript dependencies.
**Spec:** [SKINCARE_PILOT_DESIGN.md](SKINCARE_PILOT_DESIGN.md).

## Global constraints

- Gemini model: `gemini-3.1-flash-lite`; 6 prompts × 3 repeats; no tools or retries.
- 60-second timeout and 10-second minimum pacing for live requests.
- Never put credentials in API responses, manifests, logs, exports, or Git.
- No live calls on startup, tests, or page loading; explicit launch acknowledgement.
- Preserve synthetic replay and all existing raw files.
- Live metrics remain provisional descriptive counts, not medical guidance.

## Task 1: Provider adapter and configuration

Files: `src/adapters/gemini.py`, `src/ports/provider.py`, `.env.example`,
`tests/test_gemini.py`.

Interface: `GeminiProvider.collect(prompt: str) -> dict[str, Any]` is asynchronous;
`load_key(path: Path) -> str` loads process key then local canonical/legacy entries.
The result contains raw_text, raw_provider_response, status, error,
exclusion_reason, stop_collection, HTTP status, model version, timing and usage.

- [ ] Write and run failing tests for key precedence and missing key, complete
  answer preservation, blocked/empty/truncated responses, HTTP failures, timeout,
  and exact-key redaction. Mock only httpx transport.
- [ ] Implement request header authentication to the fixed Google host, bounded
  request settings, typed outcome classification, and safe credential parsing.
- [ ] Run `python -m pytest tests/test_gemini.py -q`, Ruff and mypy.

Test examples: a mocked `STOP` answer must return the original text and JSON;
`MAX_TOKENS` must be excluded; HTTP 429 must return stop_collection true and must
not trigger another call. Environment `GEMINI_API_KEY` must override local data.

## Task 2: Definition, evidence workflow and measurement

Files: `experiments/india_skincare.py`, `src/domain/research.py`,
`src/application/runner.py`, `tests/test_live_research.py`.

Interfaces: fixed definition adds mode, settings and prompt family; runner accepts
a provider at its boundary. Existing calls retain replay defaults. Summaries read
saved runs and recognize explicit live mode without modifying old schemas.

- [ ] Write failing tests for 18 planned combinations, complete saved metadata,
  early stop with remaining unattempted count, excluded denominators and ambiguous
  brand negatives (`a simple minimalist routine` must count neither brand).
- [ ] Add the approved prompts verbatim, reference metadata, and alias/context
  matching. Preserve provider payload before extraction.
- [ ] Track excluded, failed, eligible and unattempted separately; suppress live
  Wilson intervals and recommendation counts; provide per-prompt counts.
- [ ] Run new tests and the original replay suite.

## Task 3: API and reviewer UI

Files: `src/interfaces/api.py`, `frontend/src/types.ts`, `frontend/src/api.ts`,
`frontend/src/components.tsx`, `frontend/src/App.tsx`, `tests/test_api.py`.

- [ ] Write failing API tests for missing key/acknowledgement, live repeat bounds,
  simulated-failure rejection, mode-aware export and preserved replay launch.
- [ ] Add fixed live selection and inject the provider only for explicit starts.
- [ ] Adapt existing controls and labels: Live · Ungrounded, actual model names,
  unverified URLs, provisional extraction, raw provider evidence, and counts.
- [ ] Verify backend tests, frontend format/build, and browser flows for both modes.

## Task 4: Pilot and handoff

- [ ] Recheck official pack prices and freeze eligibility reference metadata.
- [ ] Run all offline checks and audits before any live collection.
- [ ] Launch one acknowledged live experiment; stop according to failure policy.
- [ ] Manually inspect every returned answer and report exclusions, parser errors,
  and other brands separately without changing the preregistered tracked set.
- [ ] Update README, PROJECT_SPEC, HOW_ENIGMA_WORKS and verification notes.
- [ ] Report actual results and checks; no silent push or merge.

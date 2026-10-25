# Reviewer prototype implementation plan

## Scope and design

Build the authorized local testing experience, using Python + FastAPI and React
with TypeScript/Vite. The initial collection adapter replays synthetic examples;
it does not query, impersonate, or measure real providers. This is a reviewer
prototype, not completion of the two-live-provider research milestone.

Python definitions produce validated, fully resolved JSON snapshots. Local JSON
files hold immutable raw runs and per-experiment manifests. Generated data stays
ignored. No database or SaaS platform is selected by this prototype.

## Execution checklist

- [x] Domain and tests: validated definitions; explicit successful-run denominators;
  zero-sample nulls; Wilson intervals; exact word-boundary brand extraction.
- [x] Replay adapter and file store: deterministic synthetic examples, exclusive
  raw writes, fixed server-owned definition registry, no uploaded Python execution.
- [x] API: list experiments, start replay, status, responses, summary,
  downloadable evidence bundle. Record terminal failures and startup interruptions.
- [x] Reviewer UI: overview, experiments, response search/filter/detail,
  methodology, real progress, accessible controls and responsive layout.
- [x] Verify: backend unit/integration tests, Ruff, type checks, frontend build,
  dependency audits, browser interaction checks and desktop/mobile screenshots.
- [x] Update spec, repository guide and run instructions; open local preview.

## Acceptance criteria

A reviewer can open a populated synthetic example, filter the evidence, inspect
raw text and provenance, launch another replay, see persisted progress, reload
without losing the experiment, and export the manifest plus underlying runs.
Every visible number is derived from stored responses; failures are not counted
as absent mentions. Empty, loading and disconnected states have recovery actions.

## Design direction

Light research workspace, slate text, teal accent, restrained blue comparison
series, 8px controls, clear typography, open metric strip and flat chart/table
regions. Image-to-Code supplies a generated overview reference before frontend
implementation. Taste's dashboard exclusion is respected. Vercel guidelines
govern controls, focus, contrast, state and responsive behavior.

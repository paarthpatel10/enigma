# Enigma

Enigma is a provisional research project for measuring how AI systems perceive,
recommend, compare, and source information about brands.

The project aims to go beyond an AI-visibility dashboard by treating brand
intelligence as an experimental loop:

```text
observe -> measure -> form a hypothesis -> test -> re-measure -> learn
```

Production scope and architecture remain provisional. See
[`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) for the working specification.

## Project status

- Stage: local reviewer prototype with synthetic replay data
- Default branch: `main`
- Planned integration branch: `develop`
- Planned workflow: Gitflow with short-lived `feature/*` branches

## Try the reviewer experience

Requires Python 3.12+ and Node.js 22.12+. This is a local, single-user prototype.
All example responses are synthetic fixtures. No model credentials or paid API
calls are used. Live model collection is not yet implemented.

From the repository root in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-lock.txt
cd frontend
npm ci
npm run build
cd ..
.\.venv\Scripts\python.exe -m uvicorn src.interfaces.api:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. The first start creates a synthetic example with 120
responses. Keep one server worker. Do not bind this unauthenticated prototype to
a public network. To develop the frontend separately, run `npm run dev` from
`frontend/` while the API runs on port 8000.

Reviewer walkthrough:

1. Inspect the overview and compare the two fixture targets.
2. Open Response explorer, search an answer, and inspect its original text.
3. Open Methodology to inspect denominators, intervals, and the saved manifest.
4. Run an experiment; optionally include one simulated timeout.
5. Watch the collection progress, inspect the failed response, then export evidence.
6. Reload the page to verify the experiment remains available.

Edit `experiments/project_tools.py` to change the trusted local definition, then
restart the API. Each new experiment snapshots its resolved configuration.
Existing snapshots and raw responses remain unchanged. The API cannot upload or
execute Python definitions. `data/raw/` is ignored and stores local evidence;
set `ENIGMA_DATA_DIR` to choose another local location. Back it up if needed.

## Verification

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check src experiments tests
.\.venv\Scripts\python.exe -m ruff format --check src experiments tests
.\.venv\Scripts\python.exe -m mypy
.\.venv\Scripts\python.exe -m pip_audit
cd frontend
npm run format:check
npm run build
npm audit
```

Metric intervals on deterministic fixtures illustrate the interface, not empirical
uncertainty. The extraction rules support these fixtures only and require a
human-reviewed evaluation set before use with real models. Source URLs in fixtures
are illustrative, not retrieved citations. Reports do not represent brand quality.

## Working documents

- [`docs/HOW_ENIGMA_WORKS.md`](docs/HOW_ENIGMA_WORKS.md) — shareable explanation of
  the idea, current version, workflow, measurements, limitations, and future scope
- [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) — product and research direction
- [`docs/ENGINEERING_STANDARDS.md`](docs/ENGINEERING_STANDARDS.md) — architecture,
  quality, observability, testing, and repository structure
- [`docs/PLUGIN_AND_SKILL_PLAN.md`](docs/PLUGIN_AND_SKILL_PLAN.md) — tooling decisions

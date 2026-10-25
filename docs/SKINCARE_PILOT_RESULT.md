# First live skincare pilot — 2026-09-15

Experiment `406d9d23d8404496bf7d345313269168` is **interrupted**, not a
completed research experiment. The local integration successfully collected
two answers before Google's third response was HTTP 503 / UNAVAILABLE, with
a high-demand message. It stopped without retries or model fallback.

## Collection and exclusions

- Planned: 6 prompts × 3 repetitions = 18 requests to Gemini 3.1 Flash-Lite.
- Actual: 2 complete answers, 1 failed attempt, 15 unattempted combinations.
- Both complete answers use variant 1; the other five prompts were never sent.
- Successful responses report 1,340 tokens total; failed response reports no usage.
- Search grounding disabled; no URL strings in the two successful answers.
- Raw JSON, text, settings, timestamps, error and manifest are saved locally.
- Earlier connectivity tests are excluded. Data stays outside Git.

The user approved keeping Simple despite its official-store stock limitation.
The manifest records that amendment. Dot & Key's official collection was checked
for the 100 g Barrier Repair variant at INR 395, with availability shown.
Researcher reference pages were not supplied to the model and are not its citations.

## Manual inspection

| Run | Brands in the model's shortlist | Tracked-brand mentions |
| --- | --- | --- |
| run-0001 | Cetaphil, Aveeno, Bioderma | None |
| run-0002 | Cetaphil, Aveeno, Dr. Sheth's | None |
| run-0003 | No answer; HTTP 503 | Excluded |

Direct inspection agrees with the automatic counts of 0/2 for Minimalist, Simple
and Dot & Key. Do not interpret this as low general visibility: this is two
repetitions of one wording, not the planned sample. The tracked set was not
changed after seeing the answers.

The answers include unverified efficacy, suitability and price assertions and
some medical-sounding claims despite cosmetic-shopping instructions. These are
model outputs, not validated conclusions or purchasing advice. Mentioned
retailers are not verified citations. We cannot infer source influence or why
the model selected these brands.

## Verification and next step

28 backend tests pass (two pre-existing dependency deprecation warnings).
Ruff lint and mypy pass; frontend formatting/build and dependency audits passed
during integration. Default tests block real httpx transport. Browser inspection
confirmed live/ungrounded labels, interrupted counts and raw-response dialog;
API export returned the preserved evidence bundle. Mobile regression and a broader
integration review remain outstanding.

No billing settings were changed. No further collection is scheduled. A fresh
run can be explicitly started later; do not overwrite or silently resume this
partial experiment. A full six-prompt sample, extraction evaluation, a second
provider and grounded-source analysis remain unfinished.

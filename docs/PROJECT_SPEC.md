# Enigma project specification

Status: **Draft 0.2 — local reviewer prototype**
Last updated: **2026-09-12**

## 1. Working vision

Enigma is an AI brand-intelligence observatory that empirically measures how
different AI systems perceive, recommend, compare, and cite brands—and studies
why those results vary across prompts, personas, geography, models, repeated
runs, and time.

The intended differentiator is research discipline rather than feature parity
with existing GEO/AEO products.

## 2. Problem statement

Brands increasingly appear inside AI-generated answers, but a single answer is
not a reliable measurement. Outputs can vary because of prompt wording, user
context, model/provider, retrieval behavior, sampling, and time.

Enigma should answer questions such as:

- Is a brand mentioned or recommended for a defined intent?
- Which attributes, strengths, weaknesses, and comparisons are associated with
  the brand?
- Which sources are cited, and how are they related to recommendations?
- Where do models disagree?
- How stable are results across repeated runs and time?
- Which observable authority or content signals are associated with visibility?
- Did a documented intervention coincide with a measurable change?

## 3. Product principles

1. **Measurement before recommendation.** Show evidence and uncertainty before
   prescribing actions.
2. **Raw data before scores.** Retain the response and collection context behind
   every derived metric.
3. **Conditional perception.** Avoid presenting one universal score when results
   depend on intent, persona, geography, model, or time.
4. **Association is not causation.** Label causal hypotheses and test them rather
   than presenting them as facts.
5. **Reproducibility.** Version prompts, schemas, metric definitions, and analysis.
6. **Provider-aware comparison.** Disclose differences between API responses and
   consumer-facing AI products.

## 4. Proposed capability map

The long-term concept has six related areas. These are directions, not committed
milestones.

| Area | Purpose |
| --- | --- |
| Discovery | Define intents, prompt families, personas, regions, and buyer stages |
| Measurement | Track mentions, recommendations, position, citations, and share of voice |
| Perception | Extract attributes, associations, sentiment, strengths, and weaknesses |
| Authority graph | Relate brands, entities, domains, citations, media, reviews, and owned sources |
| Research engine | Analyze sensitivity, disagreement, drift, uncertainty, bias, and source influence |
| Action loop | Form hypotheses, record interventions, and compare pre/post measurements |

## 5. First research milestone

Build a small offline-first experiment for one product category, three to five
brands, a limited prompt set, and at least two model providers.

### Minimum workflow

1. Define a versioned experiment manifest.
2. Expand each intent into controlled prompt variants.
3. Collect repeated responses with complete run metadata.
4. Preserve immutable raw responses.
5. Extract brand mentions, recommendations, positions, citations, and attributes.
6. Calculate aggregate metrics with uncertainty intervals where appropriate.
7. Compare prompt sensitivity and model disagreement.
8. Produce a reproducible report with limitations and links to underlying runs.

### Candidate measures

- Mention probability
- Recommendation probability
- Citation probability
- Mean/median recommendation position
- Share of voice within the experiment
- Attribute association frequency
- Cross-model agreement/disagreement
- Prompt-variant sensitivity
- Temporal stability (after multiple collection periods exist)

Every measure must define its unit of analysis, denominator, aggregation method,
and missing/failed-run behavior before implementation.

## 6. Provisional data entities

- `Brand`
- `CompetitorSet`
- `Intent`
- `PromptTemplate`
- `PromptVariant`
- `Persona`
- `Geography`
- `ModelTarget`
- `Experiment`
- `Run`
- `RawResponse`
- `Citation`
- `BrandMention`
- `Recommendation`
- `AttributeAssertion`
- `MetricSnapshot`
- `Intervention`

Schemas and storage technology remain open until the first experiment is fully
specified.

## 7. Provisional system boundaries

```text
experiment manifest
        |
        v
provider adapters -> raw response store -> extraction/normalization
                                              |
                                              v
                                      metrics + analysis
                                              |
                                              v
                                       report/dashboard
```

Keep collection, raw storage, extraction, metrics, and presentation separable so
each layer can be tested and replaced independently.

Implementation must follow `docs/ENGINEERING_STANDARDS.md`. In particular,
domain and metric logic must not depend directly on model SDKs, web frameworks,
databases, or dashboard libraries.

## 8. Explicit non-goals for the first milestone

- Cloning every feature of PEEC, Profound, Scrunch, or another competitor
- Claiming that measured AI visibility represents product quality
- Automated publishing, PR outreach, or backlink generation
- A production multi-tenant SaaS platform
- A universal proprietary score with arbitrary weights
- Causal claims based only on observational citation correlations
- Large-scale browser automation before API-based methodology is validated

## 9. Risks and ethical constraints

- Model outputs are stochastic and may be outdated or factually wrong.
- Provider terms and automated-query policies must be respected.
- Prompts, personas, and brand selection can introduce researcher bias.
- Sentiment and attribute extraction can add a second layer of model error.
- Geographic simulation is not equivalent to observing real local users.
- Public reporting should provide limitations and a correction path for brands.
- Store the minimum user or customer data required for the experiment.

## 10. Open decisions

- Initial product category and brands
- Providers and whether collection uses APIs, consumer interfaces, or both
- Initial geography and personas
- Number of prompt variants and repeated runs
- Production storage, hosting, and SaaS architecture (deferred)
- Raw and analytical storage formats
- Extraction approach: deterministic rules, structured LLM extraction, or hybrid
- Evaluation dataset and human-review protocol
- Live-provider adapter targets and extraction validation before real collection

## 12. Approved discussion decisions and reviewer slice

Discussion decisions carried forward on 2026-09-12: Python backend, FastAPI API,
local testing before SaaS, React frontend preference. Python experiment definitions
are accepted instead of requiring YAML. Each resolves to a validated JSON snapshot
before collection; preserve the raw responses and metadata beside that snapshot.

The user authorized building a visually polished testing experience for a product
reviewer. The implementation uses React + TypeScript + Vite, local JSON storage,
and a deterministic synthetic replay adapter as reversible prototype choices.
These choices do not settle production technology or the empirical experiment.

Current slice: experiment list/overview, bounded replay launch with repeat count,
progress and failure states, response search/filter/pagination, raw-evidence
inspection, explicit methodology, exact counts and Wilson intervals, evidence
bundle export, light/dark appearance and responsive layout.

Example category: project management; Notion, Asana, Linear and Monday; six prompts,
two explicitly synthetic fixture targets, ten default repeats (120 responses).
The category and prompts are test fixtures, not a finalized research protocol.
No real model API is called and no real provider is represented by a fixture.
Live collection, scheduling, advanced perception, interventions, authority graphs,
and SaaS are deferred. The original research milestone is not yet complete.

Mention probability uses successful responses as denominator and whole-word,
case-insensitive matching as numerator. Recommendation counts recognize brand
names at the start of numbered items. Failed runs remain visible and excluded.
No eligible data yields null, not zero. Wilson intervals are illustrative on
deterministic fixtures; independence assumptions must be revisited for real runs.
URLs are extracted from text; example URLs are not retrieved evidence.

Reviewer acceptance: launch a replay, inspect progress, reopen persisted evidence,
filter answers, inspect raw text and provenance, and export a self-contained JSON
bundle. Python definitions are trusted local code; the API never accepts source
files or arbitrary import paths. Serve locally on loopback with one worker.

## 11. Definition of success for milestone one

Milestone one is successful when another person can use a versioned experiment
manifest and documented environment to reproduce the collection and analysis,
trace every aggregate result to raw runs, inspect uncertainty and limitations,
and compare at least two models without hidden manual calculations.

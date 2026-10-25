# Enigma research and opportunity ledger

Status: **Active discovery ledger 0.1**
Last updated: **2026-08-25**

## 1. Purpose

This document captures substantive findings from project discussions,
competitor research, market observations, papers, datasets, experiments, and
other sources that may improve Enigma.

It is an evidence and idea ledger, not an approved feature backlog. A finding
must be evaluated and explicitly accepted before it changes product scope.
Approved product decisions belong in `PROJECT_SPEC.md`; repository-wide
implementation guidance belongs in `../CODEX.md`; material technical decisions
belong in `decisions/`.

## 2. Evidence discipline

Every material entry should distinguish:

- **Observation:** what the source or discussion actually showed.
- **Association:** variables that moved together without proving causality.
- **Hypothesis:** a falsifiable explanation or prediction to test.
- **Idea:** a possible product adaptation not yet supported or approved.
- **Decision:** an explicitly accepted or rejected direction, linked to the
  document where it was incorporated.

Use one of these evidence labels:

| Label | Meaning |
| --- | --- |
| Verified | Confirmed against a primary source, reproducible dataset, or direct product inspection |
| Reported | Stated by a credible source but not independently reproduced |
| Inferred | Reasonable interpretation derived from available observations |
| Speculative | Early idea or claim requiring evidence |

Do not describe competitor marketing claims as verified product behavior without
checking them. Add source links, access dates, screenshots, quotations within
copyright limits, or experiment references where available. Record conflicts
instead of smoothing them over.

## 3. Decision states

Assign each opportunity one state:

- `Captured` — recorded but not yet assessed;
- `Investigate` — evidence gathering or validation is warranted;
- `Candidate` — sufficiently supported to consider for scope;
- `Accepted` — approved and incorporated into the authoritative spec;
- `Rejected` — intentionally excluded, with a reason;
- `Deferred` — useful but outside the current milestone.

Only `Accepted` entries are requirements, and the requirement must also appear
in `PROJECT_SPEC.md`.

## 4. Research entry template

Copy this template for each substantive finding:

```markdown
### YYYY-MM-DD — Short topic

- Origin: ChatGPT/Codex task, product inspection, paper, dataset, interview, etc.
- Source: Link, citation, task reference, or "discussion only"
- Accessed: YYYY-MM-DD, when applicable
- Evidence status: Verified | Reported | Inferred | Speculative
- Decision state: Captured | Investigate | Candidate | Accepted | Rejected | Deferred
- Scope: Competitor | Market | Method | Product | Architecture | Ethics

Observation:
What was observed, without interpretation.

Gap or opportunity:
What appears absent, weak, confusing, or underserved.

Relevance to Enigma:
How this could improve measurement, research validity, usability, or differentiation.

Possible adaptation:
A narrowly stated idea—not an automatic requirement.

Risks and limitations:
Confounders, missing evidence, provider differences, cost, ethics, or implementation risk.

Next validation step:
The smallest useful check, comparison, or experiment.

Decision link:
Link to PROJECT_SPEC.md or an ADR after explicit approval; otherwise "None".
```

## 5. Current synthesis from project discussions

The following entries summarize ideas already present in the project documents
and current discussion. They are not a recovered transcript of earlier sessions
and should not be treated as verified competitor facts.

### 2026-08-25 — Existing AI-visibility products establish a useful baseline

- Origin: Current project specification and discussion
- Source: `PROJECT_SPEC.md`; discussion only
- Evidence status: Inferred
- Decision state: Investigate
- Scope: Competitor, Product

Observation:
The project has identified PEEC, Profound, Scrunch, and the broader GEO/AEO
category as relevant comparison points. Common capability areas worth evaluating
include prompt discovery, mention and recommendation tracking, share of voice,
citations, sentiment or attribute extraction, competitor comparison, and
reporting over time.

Gap or opportunity:
Feature availability, definitions, denominators, sampling protocols, uncertainty,
raw-evidence access, and cross-provider comparability have not yet been verified
product by product.

Relevance to Enigma:
These capabilities define a market baseline, but Enigma should compare methods
and evidence quality rather than chase a checklist.

Possible adaptation:
Create a sourced competitor matrix that records not only whether a feature
exists, but how it is measured, what evidence users can inspect, and which
claims remain opaque.

Risks and limitations:
Product behavior, packaging, and terminology can change. Marketing pages may not
describe methodology completely. No competitor-specific claim in this entry has
yet been verified.

Next validation step:
Inspect primary product documentation and, where possible, controlled product
demos. Record findings as separate dated entries with citations.

Decision link:
None.

### 2026-08-25 — Research transparency is the intended differentiation

- Origin: Current project specification and discussion
- Source: `PROJECT_SPEC.md`
- Evidence status: Inferred
- Decision state: Accepted
- Scope: Method, Product

Observation:
Enigma is explicitly designed around preserved raw responses, complete run
metadata, controlled prompt variants, repeated sampling, reproducible metrics,
uncertainty, and traceability from aggregate results to individual runs.

Gap or opportunity:
AI visibility can be misleading when a dashboard exposes a point estimate or
single score without making prompt dependence, model disagreement, stochastic
variation, denominators, failures, and evidence accessible.

Relevance to Enigma:
Research discipline provides a coherent product identity and a defensible basis
for later recommendations.

Possible adaptation:
Make methodology, sample size, uncertainty, exclusions, and raw-run lineage
first-class parts of every report rather than optional technical details.

Risks and limitations:
Greater methodological transparency can increase product complexity. The user
experience must explain uncertainty clearly without hiding it or overwhelming
nontechnical users.

Next validation step:
Specify and run milestone one's controlled experiment, then test whether another
person can reproduce and audit its results.

Decision link:
`PROJECT_SPEC.md` sections 3, 5, and 11.

### 2026-08-25 — Keep distinct measurement dimensions separate

- Origin: Current project specification and research workflow
- Source: `PROJECT_SPEC.md`; project `enigma-research` workflow
- Evidence status: Inferred
- Decision state: Accepted
- Scope: Method, Product

Observation:
Visibility, recommendation, perception, citation behavior, disagreement,
sensitivity, temporal drift, and source influence answer different questions.

Gap or opportunity:
A universal weighted score may be easy to market but can conceal assumptions,
missing data, conditional effects, and disagreement between models.

Relevance to Enigma:
Separate, reproducible measures let users inspect what changed and under which
conditions.

Possible adaptation:
Use a metric family with explicit definitions and denominators. Add a composite
only after validation demonstrates a useful interpretation and the weighting is
approved and documented.

Risks and limitations:
Multiple measures demand careful information design and may be harder to compare
at a glance.

Next validation step:
Define milestone-one metrics and evaluate their extraction reliability,
uncertainty, missing-data behavior, and usefulness independently.

Decision link:
`PROJECT_SPEC.md` sections 3, 5, and 8.

### 2026-08-25 — Move from observation toward testable interventions

- Origin: Current project specification and discussion
- Source: `PROJECT_SPEC.md`; discussion only
- Evidence status: Speculative
- Decision state: Deferred
- Scope: Method, Product

Observation:
The long-term concept includes forming hypotheses, recording interventions, and
comparing measurements before and after changes.

Gap or opportunity:
Descriptive dashboards can show visibility or citation patterns without
establishing which action influenced them.

Relevance to Enigma:
A disciplined intervention loop could eventually make the product more useful
while preserving the distinction between association and causation.

Possible adaptation:
Add an intervention registry and pre-specified before/after or stronger causal
designs only after the collection and measurement foundation is validated.

Risks and limitations:
Temporal changes, provider updates, content indexing delays, seasonality, and
unobserved factors can confound causal interpretation. Simple pre/post movement
does not prove impact.

Next validation step:
Complete milestone one and identify a low-risk intervention that supports a
controlled or staggered evaluation design.

Decision link:
Long-term direction only; not part of milestone one.

## 6. Competitor research backlog

Before competitor-derived features are proposed for the product specification,
research should answer:

1. Which customer workflow and decision does each feature support?
2. What models, collection surfaces, geographies, and time windows are covered?
3. How are prompts selected, generated, grouped, and versioned?
4. Are repeated runs used, and are sample sizes and uncertainty shown?
5. Can users inspect raw answers, citations, prompts, failures, and exclusions?
6. How are mention, rank, recommendation, sentiment, share of voice, and citation
   metrics defined?
7. How are entities, aliases, ambiguous mentions, and missing data handled?
8. Are API and consumer-interface outputs distinguished?
9. What recommendations or action workflows are offered, and what evidence
   supports them?
10. Which apparent gaps are real product gaps versus undocumented methodology or
    unavailable plan tiers?

Create one dated entry per product or methodological theme. Prefer primary
documentation and direct inspection. Record the product version, plan, region,
and access date because features can change.

## 7. Promotion workflow

When a finding appears useful:

1. verify the evidence and label remaining uncertainty;
2. state the user problem and research value, not just the competitor feature;
3. define the smallest testable adaptation;
4. assess conflicts with research integrity, milestone scope, ethics, and cost;
5. obtain explicit approval;
6. update `PROJECT_SPEC.md` with the accepted requirement or open decision;
7. update `CODEX.md` if implementation guidance or constraints changed; and
8. mark the ledger entry `Accepted`, `Rejected`, or `Deferred` and link the
   resulting decision.

This workflow prevents attractive ideas from silently becoming requirements and
keeps a traceable record of why Enigma adopted, changed, or rejected them.

## 8. Maintenance rule

Update this ledger when a project discussion or external source produces a
substantive competitor finding, market insight, methodological concern,
falsifiable hypothesis, product opportunity, or rejected direction worth
remembering. Do not add routine implementation notes or duplicate approved
requirements.

Each update must preserve provenance, evidence status, decision state, risks,
and the next validation step. If a prior entry becomes outdated, retain the
history and add a dated correction or superseding entry rather than rewriting
the record without explanation.

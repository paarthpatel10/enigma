# Enigma Research Ledger UI Design

## Status

Approved for the V1 reviewer prototype on 2026-09-15.

## Design read

Enigma is a research-grade analytics product for product reviewers and brand strategists. The interface should feel like a precise editorial research lab: calm, inspectable, and confident without presenting provisional model output as objective truth.

This is a visual overhaul with content and behavior preservation. Existing routes, query-string state, API contracts, experiment data, export behavior, raw responses, and the Enigma wordmark remain intact.

## Design controls

- Design variance: 6/10. Structured grids with selective asymmetry.
- Motion intensity: 3/10. State feedback and restrained entrance transitions only.
- Visual density: 6/10. Analytical, but readable at a glance.
- Theme: light-first with a complete dark theme.
- Type: Geist Sans and Geist Mono from the existing local packages.
- Iconography: the existing Phosphor icon family.
- Accent: one verdigris accent across interactive and selected states.
- Shape rule: 10px primary panels, 7px controls, circular icon controls only.

## Product principles

1. Lead with the research finding, then show collection health.
2. Put exact counts and denominators beside percentages.
3. Make grounding, source status, and limitations visible before interpretation.
4. Preserve the path from aggregate to raw response.
5. Treat interrupted, incomplete, failed, and empty states as research states, not generic errors.
6. Never imply a zero result when there is not enough eligible evidence.

## Information architecture

The four existing destinations remain:

- Overview: the study finding, collection quality, comparison, explainability, and recent evidence.
- Experiments: the study archive and collection status.
- Response explorer: prompt-level evidence with search, filters, and a readable evidence sheet.
- Methodology: metric definitions, denominators, limitations, and saved experiment artifacts.

The desktop sidebar remains persistent. On compact screens it becomes a single horizontal navigation row. The selected experiment remains encoded in the URL.

## Overview composition

### Study masthead

Show the selected study name as the page title. Pair it with category, geography, collection mode, status, experiment selection, run action, and evidence export. Replace the generic marketing-style headline with language grounded in the selected experiment.

### Finding and coverage band

Use an asymmetric two-column band:

- Main column: a concise result statement derived only from available data.
- Side column: eligible responses, attempted responses, model targets, and coverage.

For insufficient evidence, the result statement must say that the collection is incomplete and avoid ranking brands.

### Visibility field

Show each brand as a readable comparison row. Each model result includes the rate, exact mention count, denominator, and interval when available. When the denominator is zero, show "No eligible responses" instead of a 0% bar.

### Explainability ledger

Provide a first-class panel answering:

- What was asked?
- Which model and collection surface answered?
- Was retrieval or search grounding enabled?
- Were citations observed and verified?
- What limitations change how the result should be read?

For the current live Gemini pilot, state clearly that it is ungrounded and that URLs appearing in an answer are unverified references, not evidence of source influence.

### Evidence trail

Show recent response rows with prompt variant, repeat, model, extracted mentions, and status. Opening a row reveals the original prompt, raw answer, extraction result, collection context, and complete saved metadata.

## State behavior

- Loading: layout-shaped skeletons with a polite status announcement.
- Running: show attempted/total progress and explain that raw evidence is saved after every response.
- Interrupted: lead with a collection-stopped message, preserve completed evidence, show unattempted count, and suppress comparative claims when evidence is insufficient.
- Failed response: preserve the run, display its error and exclusion reason, and exclude it from eligible denominators.
- Empty filters: explain that no saved responses match and provide a clear-filter action.
- No eligible data: show an explanatory empty visualization rather than empty 0% tracks.

## Accessibility and interface requirements

- Default functional text is at least 14px; 12px is reserved for secondary metadata.
- All icon-only actions have accessible names; decorative icons are hidden from assistive technology.
- Visible `:focus-visible` treatment is present on every interactive element.
- Form controls have labels, names, explicit colors in both themes, and appropriate autocomplete behavior.
- URL parameters continue to represent page, experiment, filters, pagination, and selected run.
- Motion honors `prefers-reduced-motion` and animates only opacity and transforms.
- Headings use balanced wrapping; long model names and hashes wrap safely.
- Touch targets are at least 40px, increasing to 44px on compact screens.

## Responsive behavior

- Desktop: 248px sidebar and a maximum 1440px content canvas.
- Small laptop: reduced gutters with all primary study controls visible without crowding.
- Tablet: comparison and context regions stack; navigation becomes compact.
- Mobile: single-column study masthead, horizontally scrollable navigation, stacked evidence rows, and table content converted to readable response cards.

## Visual references

The implementation will use generated, screen-specific visual references rather than copying a competitor. Reference influence is limited to:

- Vercel: Geist typography, precise spacing, and restrained surface depth.
- Cohere: enterprise clarity and generous analytical grouping.
- Sentry: direct, legible operational-state language.
- Peec AI, Profound, and Otterly: visibility, prompt, response, and source information architecture.

## Verification

The redesigned interface must pass the frontend type check and production build. Browser verification covers overview, response explorer, experiments, methodology, evidence dialog, run dialog, interrupted data, synthetic data, light theme, dark theme, 1440px desktop, small laptop, and mobile widths.

# India skincare live pilot design

Date: 2026-09-14
Status: scope approved in conversation; detailed design ready for review.
Implementation has not started. The successful Gemini connectivity test is not
a research run and must not enter this dataset.

## Objective and scope

Observe which tracked brands Gemini mentions when asked to shortlist facial
moisturizers for an adult consumer with dry, sensitive skin in India, with a
budget strictly below INR 1,000 per pack. This is an exploratory integration
pilot, not a representative market study or medical recommendation.

Use `gemini-3.1-flash-lite` through the Gemini Developer API with no tools,
retrieval, chat history, or uploaded documents. Record India as prompt context,
not verified geolocation. Six prompts and three repetitions yield at most 18
requests. There is one provider; cross-provider comparison remains deferred.

Keep the synthetic project-management experiment available and its saved data
unchanged. Never pool synthetic and live results.

## Comparison set and eligibility evidence

Track Minimalist, Simple, and Dot & Key as a small purposive comparison set,
not the three best brands or an exhaustive market sample. Public official Indian
pages establish relevant product offerings; they do not establish clinical
suitability for every person with sensitive skin. Verify exact pack price and
availability again immediately before freezing the manifest. If a reference
cannot be verified, stop collection and record the unresolved eligibility issue.

Reference pages inspected on 2026-09-14:

- Minimalist Marula Oil 5% moisturizer: official collection lists INR 269 sale /
  INR 299 MRP. https://beminimalist.co/collections/skin and
  https://beminimalist.co/products/marula-05-moisturizer
- Simple Replenishing Rich Moisturiser 125 ml: official product page describes
  sensitive-skin positioning and a unit sale price of INR 3.99/ml. Confirm the
  displayed pack price before the run; do not use rounded unit-price arithmetic
  as the recorded checkout price.
  https://www.simpleskincare.in/products/replenishing-rich-moisturiser-with-glycerin-pro-vit-b5-125ml
- Dot & Key Barrier Repair moisturizer: official collection lists a 50 g variant
  at INR 395. https://www.dotandkey.com/collections/face-moisturizer-day-cream

These are researcher eligibility references, not Gemini citations. Do not send
the brand list, product descriptions, or these pages to the model. Brand-level
mentions do not prove a recommended SKU meets the budget or skin-type criteria.
Record other brands encountered in manual review without expanding the tracked
set after observing results.

## Frozen prompt set

Each request is independent. The exact prompts are:

1. For an adult consumer in India with dry, sensitive skin, which facial
   moisturizers would you shortlist under INR 1,000 per pack? Give up to three
   products and briefly explain your choices. State uncertainty about current
   price or availability. This is a cosmetic shopping question, not treatment.
2. Suggest up to three facial moisturizers costing less than INR 1,000 per pack
   for an adult with dry, sensitive skin shopping in India. Briefly explain
   each choice and flag uncertain prices or availability. Do not diagnose or
   prescribe treatment.
3. An adult shopper in India wants a facial moisturizer for dry, sensitive skin
   and has a budget below INR 1,000 per pack. What shortlist of up to three
   products would you suggest, and why? Flag uncertain price or availability;
   keep the answer to cosmetic shopping, not medical treatment.
4. Help an adult consumer choose among up to three facial moisturizers sold in
   India for dry, sensitive skin, each below INR 1,000 per pack. Explain your
   shortlist briefly and acknowledge uncertain current pricing or availability.
   Do not provide diagnosis or treatment advice.
5. What would be your shortlist of up to three facial moisturizers for an adult
   with dry, sensitive skin in India, costing under INR 1,000 per pack? Give
   brief reasons and identify price or availability uncertainty. Limit the
   answer to cosmetic product selection, not treatment.
6. For cosmetic shopping in India, name up to three facial moisturizers an adult
   with dry, sensitive skin could consider below INR 1,000 per pack. Explain
   the choices briefly, flag uncertain price or availability, and avoid diagnosis
   or treatment recommendations.

Do not request URLs or citations: doing so in an ungrounded run can elicit
invented references. The prompt wording itself shapes the response and must
remain available with every observation.

## Collection contract and safeguards

Add a provider port used by the application runner; implement a Gemini adapter
using the existing HTTP client dependency. Keep credentials and HTTP behavior
outside the domain. Preserve the replay adapter through the same explicit
dispatch boundary without a broad plugin framework.

Configuration precedence: process `GEMINI_API_KEY`, then local `.env`
`GEMINI_API_KEY`, then the existing local `gemini` entry. Parse assignments as
data; never execute the file. Do not alter the user's key file. Publish only a
blank `.env.example`. Missing credentials reject launch before creating a run.

Use temperature 1, maxOutputTokens 1024, and no seed claim. Record the complete
request configuration. Execute sequentially with at least 10 seconds between
requests and a 60-second request timeout. No automatic retries or model fallback:
stop on quota, authentication, permission, model-unavailable, transport, or server
errors. Persist the failed attempt; mark remaining planned combinations unattempted
and excluded. Safety-blocked, empty, and truncated answers are retained but
excluded from primary mention estimates. Continue after these content outcomes.

Free Tier was observed in AI Studio for the Enigma project. An API key or successful
response cannot independently verify billing status. Require explicit local
free-tier acknowledgement at launch and a clear notice that account changes
can alter billing. Do not enable billing, grounded tools, or paid fallback.
No calls occur on startup, page load, default tests, or automated retries.
Use generic shopping prompts only: free-tier data-use terms are not appropriate
for private medical histories or customer records.

## Evidence and measurement

Save the resolved manifest before collection. For each attempted run, retain
the full provider JSON response (or sanitized error payload), original answer,
HTTP status, start/end UTC time, elapsed time, requested and returned model
version, usage metadata, finish/safety reasons, prompt/variant/repeat, persona,
geography context, request settings, and manifest hash. Never persist request
authorization headers. Redact exact credential values from error payloads.
Raw evidence is saved before extraction and excluded from Git.

Each successful complete answer is one eligible observation. Mention frequency
is responses mentioning a tracked brand divided by eligible responses, at most
one count per brand per answer. Empty denominator is null. Display numerator,
denominator, attempted/failed/excluded/unattempted counts, and per-prompt counts.
For this tiny clustered pilot, suppress headline inferential intervals and
ranking claims; report descriptive frequencies rather than general prevalence.

Minimalist and Simple require brand context (named product, explicit skincare
brand reference, or clear list-entry usage). Common adjective usage is not a
mention. Match Dot & Key and Dot and Key as aliases. Add positive and negative
parser fixtures. Label automatic extraction provisional and manually review
all 18 answers; do not claim parser validity from fixture tests alone.
The existing numbered-line recommendation heuristic is not a validated semantic
recommendation metric, so hide it for live results in this slice.

Keep provider-returned grounding metadata distinct from answer-text URLs.
Expected grounding state is disabled, not 'no sources used'. Any text URLs are
unverified and must not contribute to a verified-citation metric. No page
retrieval or source-influence claims are part of this slice.

## API and reviewer experience

Add a fixed `india-skincare` definition alongside `project-tools`. Live launch
uses exactly three repeats, no simulated-failure toggle, and no arbitrary model
or endpoint input. Preserve old replay launch behavior. Maintain one active job.

Adapt the existing screens, not the visual design: show `Live · Ungrounded`,
the single actual model name, relevant run totals, and explicit extraction and
source limitations. Keep synthetic labels on old runs. Evidence detail and export
include provider metadata and raw JSON. Unknown/missing optional fields in old
datasets retain sensible compatibility defaults. Retry controls must not silently
restart paid-capable external operations.

## Verification and acceptance

Default tests use mocked HTTP responses, never the live key. Cover configuration
precedence, secret redaction, raw response preservation, successful/blocked/empty/
truncated outcomes, 401/403/404/429/5xx, timeouts, unattempted counts, launch bounds,
ambiguous brand matching, denominators, API export, and old replay regression.
Run pytest, Ruff format/lint, mypy, frontend formatting/build, dependency audits,
and browser checks for both experiment types and raw evidence/export.

Only after offline verification, run the explicitly approved 18-request pilot,
or stop earlier according to the failure policy. Inspect every answer and report
exact completed/excluded counts. A passing connectivity test is not pilot success.
Do not claim a validated extraction method, medical efficacy, current price
accuracy, source causality, or cross-provider findings.

## Deferred scope

Second provider, real search grounding, source-page retrieval/support evaluation,
automated semantic extraction, scheduling, intervention studies, production
storage, authentication, public hosting, and paid API usage are excluded.

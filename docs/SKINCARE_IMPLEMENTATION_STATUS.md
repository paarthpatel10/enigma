# Skincare integration status — 2026-09-14

**Superseded status, 2026-09-15:** the user approved the stock limitation and
released the hold. The first pilot collected two answers then stopped on HTTP
503. See [the current result](SKINCARE_PILOT_RESULT.md). The notes below preserve
the earlier implementation checkpoint, not the current launch state.

The Gemini adapter, fixed skincare definition, provider contract, runner dispatch,
mode-aware export and initial reviewer UI are implemented locally. The synthetic
demo remains supported. This is not yet a completed live pilot.

## Collection hold

The approved design requires checking eligibility before collection. The official
Simple Replenishing Rich Moisturiser 125 ml page lists INR 499 but says sold out:
https://www.simpleskincare.in/products/replenishing-rich-moisturiser-with-glycerin-pro-vit-b5-125ml

Minimalist's official Marula product page lists INR 299 and an add-to-cart control.
Dot & Key's official collection contains available variants, but the exact chosen
pack needs a final check. Availability is not a claim of delivery to every Indian
postcode or medical suitability.

The API rejects live launches with an eligibility explanation before loading the
key or creating an experiment. Resolve whether to keep Simple as a tracked brand
with an explicit official-store stock limitation, verify an alternative eligible
product, or replace it. Then update the design/reference snapshot and release the
hold deliberately. Do not silently remove the hold to obtain a live result.

## Implemented behavior

- Fixed model, 18-request ceiling, 60-second timeout, minimum 10-second pacing.
- No model fallback, search grounding, automatic retries or billing changes.
- Canonical environment key or local `.env` key, including legacy `gemini` entry.
- Original provider JSON and response, timing, model version and token usage saved.
- HTTP/transport errors halt collection; incomplete/blocked outputs are excluded.
- Failed, excluded and unattempted counts remain distinct.
- Provisional context matching for Simple/Minimalist; Dot and Key alias support.
- Descriptive live metrics without Wilson intervals or recommendation scores.
- Existing UI adds live selection, acknowledgement, actual model labels and
  ungrounded-source limitations; full raw JSON is inspectable/exportable.

## Verification and remaining work

Current checks: 28 pytest tests pass (two existing dependency deprecation
warnings), Ruff lint/format and mypy pass; frontend formatting and production
build pass. npm audit reports no known vulnerabilities. Browser inspection
confirmed the existing demo and the fixed live-dialog limit/acknowledgement.
The browser submit check was refused by the execution safety reviewer because
it submits a real collection request while eligibility is unresolved. It was
not bypassed; the hold itself is covered by the offline API test.

Backend tests cover adapter outcomes, quota halt, raw retention, key precedence,
redaction, malformed JSON, brand ambiguity, denominators, API limits and the hold.
Default tests now reject real httpx network transport. One failing test before
that guard was added attempted real transport and received a transport error,
with no HTTP response; its temporary output is not research evidence.

Remaining: resolve eligibility, complete browser verification of a live result
using isolated fixtures, review error-path coverage and implementation, then run
the bounded real pilot and manually inspect all returned answers. Current tests
do not establish real-world extraction accuracy. The previous connectivity test
is not included in experiment data. No completed skincare dataset exists.

No dependencies were added. The local credential file is not committed or exposed.

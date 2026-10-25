# Local reviewer verification

Verified 2026-09-13 on Windows, Python 3.12.14, Node.js 22.20.0.

## Automated checks

- Nine backend tests passed: entity boundaries, recommendation extraction,
  failed-run denominators, empty metrics, Wilson bounds, configuration limits,
  exclusive raw writes, API/export flow, persisted evidence after restart and
  cross-origin rejection (some tests cover multiple assertions).
- Ruff lint and formatting passed; mypy passed for 12 source files.
- Frontend TypeScript and Vite production build passed; Prettier check passed.
- npm audit and pip-audit reported no known vulnerabilities. pip and pytest
  were updated after the first audit found vulnerable versions.
- Two dependency deprecation warnings remain in the Starlette TestClient path
  concerning httpx and an AnyIO alias; no test failures.

## Browser checks

Playwright CLI verified a real local server:

- Open overview, start 120-response replay, observe completed status and stored
  120 raw response files.
- Search responses, check matching results and no-match empty state.
- Open original response and metadata; close dialog with Escape.
- Restart API and reload; the completed experiment remains available.
- Start a 12-response replay including one simulated timeout: 11 successes,
  one failure, terminal completed-with-errors state.
- Download JSON evidence bundle successfully.
- Inspect desktop 1440x1000, mobile 390x844 and dark appearance screenshots.
- Final browser console: zero errors and warnings after favicon fix.

Screenshots are local generated artifacts in ignored `output/playwright/`.
This was a manual browser audit, not a comprehensive accessibility certification
or a Lighthouse performance measurement. The data is synthetic throughout.

## Environment notes

Node package access needed Windows trusted CAs (`NODE_OPTIONS=--use-system-ca`).
Python audit used pip's vendored truststore to consult Windows certificate trust.
Certificate verification was not disabled.

The restricted Windows execution environment initially blocked atomic progress
file replacement. Running the server with approved local filesystem access
resolved that failure. The interrupted evidence was retained. File reads and
writes are synchronized within the one-worker prototype; this is not a
multi-process storage design.

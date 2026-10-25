# Research Ledger UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the reviewer prototype presentation layer with the approved Research Ledger interface while preserving experiment behavior and evidence integrity.

**Architecture:** Keep API loading and URL state in `App.tsx`, move derived presentation rules into a pure `researchPresentation.ts` module, and keep reusable visual surfaces in `components.tsx`. Rebuild the token and responsive system in `styles.css` without changing backend contracts.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Geist, Phosphor Icons, Radix Dialog, Vitest, Testing Library, Playwright CLI.

**Spec:** `docs/UI_RESEARCH_LEDGER_DESIGN.md`

## Global Constraints

- Preserve current API contracts, routes, URL query state, raw responses, exports, and experiment data.
- Do not add live model calls or resume the interrupted skincare experiment.
- Keep Geist and Phosphor as the only typography and icon families.
- Use one verdigris accent and one consistent radius system.
- Show exact counts and denominators beside visibility rates.
- Never display a zero rate when the eligible denominator is zero.
- Make live ungrounded collection and unverified URLs explicit.
- Honor reduced motion and both color themes.

---

### Task 1: Capture the approved visual source of truth

**Files:**
- Create: `output/design/research-ledger-overview.png`
- Create: `output/design/research-ledger-responses.png`
- Create: `output/design/research-ledger-methodology.png`
- Create: `output/design/research-ledger-mobile.png`

**Interfaces:**
- Consumes: `docs/UI_RESEARCH_LEDGER_DESIGN.md` and the current saved experiment content.
- Produces: four readable screen references used for layout, typography, spacing, component, and color extraction.

- [ ] **Step 1: Generate separate full-size references**

Use the built-in image generation tool with `ui-mockup` prompts. Keep copy short, use the exact Enigma study language, and avoid illegible miniature boards.

- [ ] **Step 2: Inspect each reference at original resolution**

Record the visual hierarchy, type scale, spacing rhythm, surface depth, control sizes, mobile collapse, and state language before writing production code.

- [ ] **Step 3: Save the selected references in the project**

Copy the selected outputs to the four paths above without overwriting unrelated assets.

### Task 2: Add testable research-presentation rules

**Files:**
- Create: `frontend/src/researchPresentation.ts`
- Create: `frontend/src/researchPresentation.test.ts`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

**Interfaces:**
- Consumes: `Detail` and `Run` from `frontend/src/types.ts`.
- Produces: `getResearchState(detail: Detail): ResearchState`, `getFinding(detail: Detail): Finding`, and `getSourceSummary(detail: Detail, runs: Run[]): SourceSummary`.

- [ ] **Step 1: Install the frontend test runner**

Run: `npm install --save-dev vitest`

- [ ] **Step 2: Write failing tests for incomplete evidence and zero denominators**

```ts
import { describe, expect, it } from "vitest";
import { getFinding, getResearchState } from "./researchPresentation";

describe("research presentation", () => {
  it("labels an interrupted partial collection as insufficient for comparison", () => {
    expect(getResearchState(interruptedDetail).canCompare).toBe(false);
    expect(getFinding(interruptedDetail).kind).toBe("insufficient");
  });

  it("does not turn a zero denominator into a zero percent finding", () => {
    expect(getFinding(noEligibleResponses).headline).toContain("No eligible responses");
  });
});
```

- [ ] **Step 3: Run tests and verify the expected module-not-found failure**

Run: `npm test -- --run`
Expected: FAIL because `researchPresentation.ts` does not exist.

- [ ] **Step 4: Implement the pure presentation rules**

```ts
export type ResearchState = {
  canCompare: boolean;
  attempted: number;
  eligible: number;
  coverage: number;
  label: string;
};

export function getResearchState(detail: Detail): ResearchState {
  const attempted = detail.completed;
  const eligible = detail.summary.successful;
  return {
    attempted,
    eligible,
    coverage: detail.total ? attempted / detail.total : 0,
    canCompare: detail.status === "completed" && eligible > 0,
    label: detail.status === "interrupted" ? "Collection stopped" : detail.status,
  };
}
```

- [ ] **Step 5: Run the focused tests and type check**

Run: `npm test -- --run && npm run check`
Expected: all presentation tests pass and TypeScript exits successfully.

### Task 3: Recompose the application shell and overview

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components.tsx`
- Modify: `frontend/src/styles.css`

**Interfaces:**
- Consumes: the presentation helpers from Task 2 and existing API callbacks.
- Produces: the study masthead, finding/coverage band, visibility field, explainability ledger, and evidence trail.

- [ ] **Step 1: Extend failing tests with completed and ungrounded source states**

```ts
it("allows comparison for a completed experiment with eligible responses", () => {
  expect(getResearchState(completedDetail).canCompare).toBe(true);
});

it("describes live ungrounded URLs as unverified references", () => {
  expect(getSourceSummary(liveDetail, runs).verification).toBe("unverified");
});
```

- [ ] **Step 2: Run the tests and verify the new assertions fail**

Run: `npm test -- --run`
Expected: FAIL until completed and source-state behavior is implemented.

- [ ] **Step 3: Implement the helpers and recompose the React views**

Use the approved component order. Preserve every existing navigation, filter, run, export, dialog, and API callback. Mark decorative Phosphor icons with `aria-hidden="true"`.

- [ ] **Step 4: Replace the visual tokens and responsive layout**

Implement the approved typography, verdigris palette, 10px/7px radius rules, minimum functional type sizes, desktop grid, compact navigation, mobile response cards, dark theme, skeletons, and reduced-motion behavior.

- [ ] **Step 5: Run tests, type checking, formatting, and the production build**

Run: `npm test -- --run`
Expected: all tests pass.

Run: `npm run check`
Expected: TypeScript exits successfully.

Run: `npm run format:check`
Expected: Prettier reports no differences.

Run: `npm run build`
Expected: Vite produces `frontend/dist` successfully.

### Task 4: Browser verification and documentation

**Files:**
- Modify: `docs/UI_RESEARCH_LEDGER_DESIGN.md`
- Create: `output/playwright/research-ledger-overview.png`
- Create: `output/playwright/research-ledger-dark.png`
- Create: `output/playwright/research-ledger-mobile.png`
- Create: `output/playwright/research-ledger-evidence.png`

**Interfaces:**
- Consumes: the built frontend and current local API.
- Produces: visual QA evidence and a record of any intentional deviations from the generated references.

- [ ] **Step 1: Open the app with Playwright CLI and take a fresh snapshot**

Run the current interrupted skincare URL and verify headings, navigation, status, source language, controls, and evidence rows are present.

- [ ] **Step 2: Exercise the critical flows**

Open and close the response evidence dialog, change experiments, filter responses, visit every route, toggle the theme, and confirm browser history navigation.

- [ ] **Step 3: Capture desktop, dark, mobile, and evidence screenshots**

Save the screenshots to the four paths above. Confirm no clipping, horizontal page overflow, illegible text, or hidden focus states.

- [ ] **Step 4: Run the final project verification**

Run: `.\\.venv\\Scripts\\python.exe -m pytest`
Expected: all backend tests pass.

Run: `.\\.venv\\Scripts\\python.exe -m ruff check .`
Expected: no lint errors.

Run: `.\\.venv\\Scripts\\python.exe -m mypy src`
Expected: no type errors.

Run: `npm test -- --run && npm run format:check && npm run check && npm run build`
Expected: every frontend check passes.

- [ ] **Step 5: Commit the verified UI slice**

Stage only the UI design, plan, frontend changes, lockfile, and intentional screenshots. Use a conventional commit message describing the Research Ledger redesign.

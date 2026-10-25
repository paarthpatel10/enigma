import { describe, expect, it } from "vitest";
import type { Detail, Run } from "./types";
import {
  getFinding,
  getResearchState,
  getSourceSummary,
  getStopReason,
} from "./researchPresentation";

const makeDetail = (overrides: Partial<Detail> = {}): Detail => ({
  id: "experiment-1",
  name: "India skincare pilot",
  created_at: "2026-09-15T10:00:00Z",
  status: "completed",
  completed: 18,
  total: 18,
  failed: 0,
  category: "Facial moisturizers under INR 1,000",
  mode: "live-ungrounded",
  excluded: 0,
  unattempted: 0,
  manifest: {
    brands: ["Minimalist", "Simple", "Dot & Key"],
    prompts: ["prompt-a", "prompt-b"],
    models: ["gemini-3.1-flash-lite"],
    repeats: 3,
    geography: "India (prompt context only)",
    persona: "Adult cosmetic shopper; dry, sensitive skin",
    version: "1",
    settings: {},
  },
  summary: {
    successful: 18,
    failed: 0,
    responses_with_citations: 0,
    brands: [
      {
        brand: "Minimalist",
        mentions: 9,
        total: 18,
        probability: 0.5,
        recommendations: 4,
        interval: [0.29, 0.71],
        by_model: {
          "gemini-3.1-flash-lite": {
            count: 9,
            total: 18,
            probability: 0.5,
            interval: [0.29, 0.71],
          },
        },
      },
    ],
  },
  ...overrides,
});

const interruptedDetail = makeDetail({
  status: "interrupted",
  completed: 3,
  failed: 1,
  unattempted: 15,
  summary: {
    successful: 2,
    failed: 1,
    responses_with_citations: 0,
    brands: [
      {
        brand: "Minimalist",
        mentions: 0,
        total: 2,
        probability: 0,
        recommendations: 0,
        interval: [0, 0.66],
        by_model: {
          "gemini-3.1-flash-lite": {
            count: 0,
            total: 2,
            probability: 0,
            interval: [0, 0.66],
          },
        },
      },
    ],
  },
});

describe("research presentation", () => {
  it("labels an interrupted partial collection as insufficient for comparison", () => {
    expect(getResearchState(interruptedDetail).canCompare).toBe(false);
    expect(getResearchState(interruptedDetail).label).toBe(
      "Collection stopped",
    );
    expect(getFinding(interruptedDetail).kind).toBe("insufficient");
  });

  it("does not turn a zero denominator into a zero percent finding", () => {
    const detail = makeDetail({
      completed: 0,
      summary: {
        successful: 0,
        failed: 0,
        responses_with_citations: 0,
        brands: [],
      },
    });

    expect(getFinding(detail).headline).toContain("No eligible responses");
  });

  it("allows comparison for a completed experiment with eligible responses", () => {
    expect(getResearchState(makeDetail()).canCompare).toBe(true);
    expect(getFinding(makeDetail()).kind).toBe("comparison");
  });

  it("reports a tie instead of naming a leader", () => {
    const brand = makeDetail().summary.brands[0];
    const detail = makeDetail({
      summary: {
        ...makeDetail().summary,
        brands: [brand, { ...brand, brand: "Simple" }],
      },
    });

    expect(getFinding(detail).headline).toBe(
      "Minimalist and Simple appeared equally often in this collection.",
    );
  });

  it("warns when the leader's interval overlaps the runner-up", () => {
    const brand = makeDetail().summary.brands[0];
    const detail = makeDetail({
      summary: {
        ...makeDetail().summary,
        brands: [
          brand,
          {
            ...brand,
            brand: "Simple",
            mentions: 8,
            probability: 8 / 18,
            interval: [0.25, 0.66],
          },
        ],
      },
    });

    expect(getFinding(detail).headline).toBe(
      "No tracked brand reliably led this collection.",
    );
    expect(getFinding(detail).detail).toContain(
      "Most mentioned: Minimalist 9 of 18, Simple 8 of 18.",
    );
    expect(getFinding(detail).detail).toContain("intervals overlap");
  });

  it("names a leader only when the intervals separate", () => {
    const brand = makeDetail().summary.brands[0];
    const detail = makeDetail({
      summary: {
        ...makeDetail().summary,
        brands: [
          {
            ...brand,
            mentions: 16,
            probability: 16 / 18,
            interval: [0.67, 0.97],
          },
          {
            ...brand,
            brand: "Simple",
            mentions: 2,
            probability: 2 / 18,
            interval: [0.03, 0.33],
          },
        ],
      },
    });

    expect(getFinding(detail).headline).toBe(
      "Minimalist appeared most often in this collection.",
    );
  });

  it("does not rank brands when no intervals exist", () => {
    const brand = makeDetail().summary.brands[0];
    const detail = makeDetail({
      summary: {
        ...makeDetail().summary,
        brands: [
          { ...brand, mentions: 16, probability: 16 / 18, interval: null },
          {
            ...brand,
            brand: "Simple",
            mentions: 2,
            probability: 2 / 18,
            interval: null,
          },
        ],
      },
    });

    expect(getFinding(detail).headline).toBe(
      "No tracked brand reliably led this collection.",
    );
    expect(getFinding(detail).detail).toContain("brands are not ranked");
  });

  it("explains an interrupted collection from its failed run", () => {
    const failed = { id: "run-0003", status: "failed", error: "http_503" };

    expect(getStopReason(interruptedDetail, [failed as Run])).toBe(
      "Collection stopped at run-0003 after a provider error (http_503). Collection does not retry, so 15 of 18 planned responses were never requested.",
    );
    expect(getStopReason(makeDetail(), [])).toBeNull();
  });

  it("describes live ungrounded URLs as unverified references", () => {
    const run = {
      citations: ["https://example.com/reference"],
    } as Run;

    expect(getSourceSummary(makeDetail(), [run])).toEqual({
      grounding: "Ungrounded",
      verification: "unverified",
      label: "No verified sources",
      observedReferences: 1,
    });
  });
});

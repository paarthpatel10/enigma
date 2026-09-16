import type { Detail, Run } from "./types";

export type ResearchState = {
  canCompare: boolean;
  attempted: number;
  eligible: number;
  coverage: number;
  label: string;
};

export type Finding = {
  kind: "empty" | "insufficient" | "comparison";
  headline: string;
  detail: string;
};

export type SourceSummary = {
  grounding: string;
  verification: "unverified" | "authored";
  label: string;
  observedReferences: number;
};

const statusLabel = (status: string) => {
  if (status === "interrupted") return "Collection stopped";
  if (status === "completed_with_errors") return "Completed with errors";
  if (status === "running" || status === "queued")
    return "Collecting responses";
  if (status === "completed") return "Collection complete";
  return status.replaceAll("_", " ");
};

export function getResearchState(detail: Detail): ResearchState {
  const attempted = detail.completed;
  const eligible = detail.summary.successful;
  const complete =
    detail.status === "completed" || detail.status === "completed_with_errors";

  return {
    attempted,
    eligible,
    coverage: detail.total ? attempted / detail.total : 0,
    canCompare: complete && eligible > 0,
    label: statusLabel(detail.status),
  };
}

export function getFinding(detail: Detail): Finding {
  const state = getResearchState(detail);

  if (!state.eligible) {
    return {
      kind: "empty",
      headline: "No eligible responses are available yet.",
      detail:
        "Run or complete the collection before interpreting brand visibility.",
    };
  }

  if (!state.canCompare) {
    return {
      kind: "insufficient",
      headline: "This collection is too incomplete to compare brands.",
      detail: `Only ${state.eligible} eligible ${state.eligible === 1 ? "response was" : "responses were"} collected. Completed evidence is preserved, but the result is not ready for comparison.`,
    };
  }

  const ranked = [...detail.summary.brands]
    .filter((brand) => brand.total > 0)
    .sort((a, b) => (b.probability ?? -1) - (a.probability ?? -1));
  const leader = ranked[0];

  if (!leader || !leader.mentions) {
    return {
      kind: "comparison",
      headline: "No tracked brands appeared in the eligible responses.",
      detail: `The result reflects ${state.eligible} eligible responses in this experiment, not objective brand quality or public opinion.`,
    };
  }

  return {
    kind: "comparison",
    headline: `${leader.brand} appeared most often in this collection.`,
    detail: `${leader.mentions} of ${leader.total} eligible responses mentioned ${leader.brand}. Inspect the evidence before interpreting the difference.`,
  };
}

export function getSourceSummary(detail: Detail, runs: Run[]): SourceSummary {
  const observedReferences = runs.reduce(
    (total, run) => total + (run.citations?.length ?? 0),
    0,
  );

  if (detail.mode === "live-ungrounded") {
    return {
      grounding: "Ungrounded",
      verification: "unverified",
      label: "No verified sources",
      observedReferences,
    };
  }

  return {
    grounding: "Synthetic replay",
    verification: "authored",
    label: "Example references only",
    observedReferences,
  };
}

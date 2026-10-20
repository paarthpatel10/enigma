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

export const statusLabel = (status: string) => {
  if (status === "interrupted") return "Collection stopped";
  if (status === "completed_with_errors") return "Completed with errors";
  if (status === "running" || status === "queued")
    return "Collecting responses";
  if (status === "completed") return "Collection complete";
  const words = status.replaceAll("_", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
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

  const tied = ranked.filter(
    (brand) => brand.probability === leader.probability,
  );
  if (tied.length > 1) {
    return {
      kind: "comparison",
      headline: `${joinNames(tied.map((brand) => brand.brand))} appeared equally often in this collection.`,
      detail: `Each was mentioned in ${leader.mentions} of ${leader.total} eligible responses. No tracked brand led.`,
    };
  }

  const disagreement = modelsDisagree(detail)
    ? " The model targets disagree on which brand appears most."
    : "";
  const next = ranked[1];
  if (!next) {
    return {
      kind: "comparison",
      headline: `${leader.brand} appeared in ${leader.mentions} of ${leader.total} eligible responses.`,
      detail: `Only one tracked brand has eligible data, so nothing is ranked.${disagreement}`,
    };
  }

  // Name a leader only when the 95% intervals separate; otherwise report counts.
  const hasIntervals = Boolean(leader.interval && next.interval);
  const separated = hasIntervals && next.interval![1] < leader.interval![0];
  const counts = `${leader.brand} ${leader.mentions} of ${leader.total}, ${next.brand} ${next.mentions} of ${next.total}`;
  if (!separated) {
    return {
      kind: "comparison",
      headline: "No tracked brand reliably led this collection.",
      detail: `Most mentioned: ${counts}. ${
        hasIntervals
          ? "Their 95% intervals overlap, so the difference may not hold in a larger sample."
          : "No intervals are available for this collection, so brands are not ranked."
      }${disagreement}`,
    };
  }

  return {
    kind: "comparison",
    headline: `${leader.brand} appeared most often in this collection.`,
    detail: `${leader.mentions} of ${leader.total} eligible responses mentioned ${leader.brand}. Next was ${next.brand}, in ${next.mentions} of ${next.total}; their 95% intervals do not overlap.${disagreement}`,
  };
}

/** True when model targets have different most-mentioned brands. */
function modelsDisagree(detail: Detail) {
  const leaders = detail.manifest.models.map((model) => {
    const rates = detail.summary.brands.map(
      (brand) => brand.by_model[model]?.probability ?? -1,
    );
    const top = Math.max(...rates);
    return detail.summary.brands
      .filter((_, index) => rates[index] === top)
      .map((brand) => brand.brand)
      .sort()
      .join("|");
  });
  return new Set(leaders).size > 1;
}

/** Describes the saved extractor's brand-matching rule for reviewers. */
export function getMatchingRule(detail: Detail) {
  return detail.mode === "live-ungrounded"
    ? "Provisional context matching: a brand counts only when its name appears with product context, such as “Simple Replenishing” or “Dot & Key” (also “Dot and Key”), so a generic word like “simple” does not count. Not yet validated against human review."
    : "Whole-word, case-insensitive match on the tracked brand name.";
}

const joinNames = (names: string[]) =>
  names.length <= 2
    ? names.join(" and ")
    : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

/** Explains why an interrupted collection stopped, using its saved runs. */
export function getStopReason(detail: Detail, runs: Run[]): string | null {
  if (detail.status !== "interrupted") return null;
  const unattempted =
    detail.unattempted ?? Math.max(0, detail.total - detail.completed);
  const failure = [...runs].reverse().find((run) => run.status === "failed");
  const never = `${unattempted} of ${detail.total} planned ${unattempted === 1 ? "response was" : "responses were"} never requested.`;
  if (failure?.error) {
    return `Collection stopped at ${failure.id} after a provider error (${failure.error}). Collection does not retry, so ${never.charAt(0).toLowerCase()}${never.slice(1)}`;
  }
  return `Collection stopped before finishing and no provider error was recorded, for example because the local server restarted. ${never}`;
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

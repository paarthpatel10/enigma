import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  Copy,
  Flask,
  Info,
  Play,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { api, date, modelName, percent } from "./api";
import {
  getMatchingRule,
  getResearchState,
  getSourceSummary,
  statusLabel,
} from "./researchPresentation";
import type { Detail, Experiment, Run } from "./types";

export function Status({ value }: { value: string }) {
  const warning =
    value.includes("error") || value === "failed" || value === "interrupted";
  return (
    <span className={`status ${warning ? "warn" : ""}`}>
      <span className="status-dot" aria-hidden="true" />
      {statusLabel(value)}
    </span>
  );
}

/** Labels how an experiment's answers were produced. */
export function ModeTag({ mode }: { mode?: string }) {
  const live = mode === "live-ungrounded";
  return (
    <span className={`mode-tag ${live ? "live" : ""}`}>
      {live ? "Live · Ungrounded" : "Synthetic"}
    </span>
  );
}

export function Visibility({ detail }: { detail: Detail }) {
  const state = getResearchState(detail);
  const metrics = detail.manifest.brands.map(
    (brandName) =>
      detail.summary.brands.find((brand) => brand.brand === brandName) ?? {
        brand: brandName,
        mentions: 0,
        total: state.eligible,
        probability: state.eligible ? 0 : null,
        recommendations: 0,
        interval: null,
        by_model: {},
      },
  );
  const hasIntervals = metrics.some((brand) =>
    Object.values(brand.by_model).some((estimate) => estimate.interval),
  );
  return (
    <section className="visibility-field" aria-labelledby="visibility-heading">
      <div className="section-heading-row">
        <div>
          <p className="section-label">
            Brand visibility in eligible responses
          </p>
          <h2 id="visibility-heading">Tracked brand mentions</h2>
        </div>
        <p>
          {!state.canCompare
            ? "Comparison withheld until collection completes"
            : hasIntervals
              ? "Each rate shows mentions out of eligible responses and its 95% interval"
              : "Each rate shows mentions out of eligible responses"}
        </p>
      </div>
      <p className="tracked-set">
        <span>Tracked brands</span> {detail.manifest.brands.join(", ")}.{" "}
        <span className="tracked-set-note">
          Only these names are counted. Other brands an answer names are not
          extracted, so read the raw answers before treating a low count as
          absence.
        </span>
      </p>
      <div className="visibility-head" aria-hidden="true">
        <span>Brand</span>
        <span>Model result</span>
        <span>Mentions</span>
      </div>
      <div className="visibility-rows">
        {metrics.map((brand) => (
          <div className="visibility-row" key={brand.brand}>
            <strong>{brand.brand}</strong>
            <div className="model-results">
              {detail.manifest.models.map((model) => {
                const estimate = brand.by_model[model] ?? {
                  count: 0,
                  total: state.eligible,
                  probability: state.eligible ? 0 : null,
                  interval: null,
                };
                const rate =
                  estimate.probability === null
                    ? null
                    : estimate.probability * 100;
                return (
                  <div className="model-result" key={model}>
                    <span className="model-name">{modelName(model)}</span>
                    {state.canCompare && rate !== null ? (
                      <div className="rate-visual">
                        <span className="rate-line" aria-hidden="true">
                          {estimate.interval && (
                            <b
                              style={{
                                left: `${estimate.interval[0] * 100}%`,
                                width: `${(estimate.interval[1] - estimate.interval[0]) * 100}%`,
                              }}
                            />
                          )}
                          <i style={{ width: `${rate}%` }} />
                        </span>
                        <span className="rate-figures">
                          <strong>{percent(estimate.probability)}</strong>
                          <span>
                            {estimate.count} of {estimate.total}
                          </span>
                        </span>
                        <span className="rate-interval">
                          {estimate.interval
                            ? `95% interval ${estimate.interval.map(percent).join(" to ")}`
                            : "Descriptive frequency, no interval"}
                        </span>
                      </div>
                    ) : (
                      <span className="comparison-note">
                        {estimate.total
                          ? "Collection incomplete"
                          : "No eligible responses"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <span
              className={`mention-count ${state.canCompare ? "" : "withheld"}`}
            >
              {brand.mentions} / {brand.total}
              {!state.canCompare && <small>not comparable</small>}
            </span>
          </div>
        ))}
      </div>
      <div className="visibility-note">
        <Info size={18} aria-hidden="true" />
        <span>
          {state.canCompare
            ? "This describes the collected answers. It is not a measure of objective brand quality or public opinion."
            : `${state.eligible} eligible responses are preserved. More complete data is required before comparison.`}
        </span>
      </div>
    </section>
  );
}

export function ExplainabilityLedger({
  detail,
  runs,
}: {
  detail: Detail;
  runs: Run[];
}) {
  const sources = getSourceSummary(detail, runs);
  return (
    <section
      className="explainability"
      aria-labelledby="explainability-heading"
    >
      <div>
        <p className="section-label">Explainability ledger</p>
        <h2 id="explainability-heading">Why this result looks this way</h2>
        <p>
          The conditions below define what the model could use and what Enigma
          can responsibly claim.
        </p>
      </div>
      <dl>
        <div>
          <dt>Model target</dt>
          <dd>{detail.manifest.models.map(modelName).join(", ")}</dd>
        </div>
        <div>
          <dt>Grounding status</dt>
          <dd>{sources.grounding}</dd>
        </div>
        <div>
          <dt>Verified sources</dt>
          <dd>{sources.label}</dd>
        </div>
        <div>
          <dt>Observed URL references</dt>
          <dd>{sources.observedReferences} (not verified)</dd>
        </div>
        <div>
          <dt>Prompt context</dt>
          <dd>{detail.manifest.geography}</dd>
        </div>
        <div>
          <dt>Interpretation limit</dt>
          <dd>Model output, not consumer opinion</dd>
        </div>
      </dl>
    </section>
  );
}

export function ResponseList({
  runs,
  selectedId,
  onSelect,
  compact = false,
}: {
  runs: Run[];
  selectedId?: string;
  onSelect: (run: Run) => void;
  compact?: boolean;
}) {
  if (!runs.length)
    return (
      <div className="empty">
        <Flask size={30} aria-hidden="true" />
        <h3>No matching responses</h3>
        <p>Change the filters to inspect another part of the evidence.</p>
      </div>
    );
  return (
    <div className={`response-list ${compact ? "compact" : ""}`}>
      {runs.map((run) => (
        <button
          className={`response-row ${selectedId === run.id ? "selected" : ""}`}
          key={run.id}
          data-run-id={run.id}
          onClick={() => onSelect(run)}
          aria-pressed={selectedId === run.id}
        >
          <span className="response-primary">
            <strong>{variantLabel(run)}</strong>
            <span>{shortPrompt(run.prompt)}</span>
          </span>
          <span className="response-model">{modelName(run.model)}</span>
          <span className="response-mentions">
            {run.mentions.length
              ? run.mentions.join(", ")
              : run.status === "failed"
                ? "Excluded"
                : "No tracked matches"}
          </span>
          <Status value={run.status} />
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export function EvidenceSheet({
  run,
  trackedBrands,
  matchingRule,
  onClose,
}: {
  run: Run | null;
  trackedBrands: string[];
  matchingRule: string;
  onClose: () => void;
}) {
  const copy = (value: string) => navigator.clipboard?.writeText(value);
  if (!run)
    return (
      <aside className="evidence-sheet empty-evidence">
        <Flask size={31} aria-hidden="true" />
        <h2>Select a response</h2>
        <p>
          Choose a saved run to inspect its prompt, answer, extraction, and
          collection context.
        </p>
      </aside>
    );
  return (
    <aside className="evidence-sheet" aria-labelledby="evidence-title">
      <header className="evidence-title-row">
        <div>
          <h2 id="evidence-title">{variantLabel(run)}</h2>
          <p>
            {modelName(run.model)} · {date(run.timestamp)}
          </p>
        </div>
        <div>
          <Status value={run.status} />
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close response evidence"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>
      </header>
      {(run.exclusion_reason || run.error) && (
        <p className="inline-error">
          <strong>Excluded from every denominator.</strong>{" "}
          {[
            run.error && `Provider error: ${run.error}.`,
            run.exclusion_reason &&
              run.exclusion_reason !== run.error &&
              `Exclusion reason: ${run.exclusion_reason}.`,
          ]
            .filter(Boolean)
            .join(" ")}
        </p>
      )}
      <section className="extraction" aria-labelledby="extraction-heading">
        <h3 id="extraction-heading">Extraction result</h3>
        <dl className="evidence-summary">
          <div>
            <dt>Tracked brand matches</dt>
            <dd>
              {!run.raw_text
                ? "Not evaluated, no answer"
                : run.mentions.length
                  ? run.mentions.join(", ")
                  : "None of the tracked brands"}
            </dd>
          </div>
          <div>
            <dt>Source status</dt>
            <dd>
              {!run.raw_text
                ? "No answer to assess"
                : run.synthetic === false
                  ? "Ungrounded, no verified sources"
                  : "Synthetic example references"}
            </dd>
          </div>
        </dl>
        <p className="matching-rule">
          <strong>Tracked:</strong> {trackedBrands.join(", ")}. {matchingRule}{" "}
          Other brands in the answer are not extracted.
        </p>
      </section>
      <EvidenceBlock title="Exact prompt" onCopy={() => copy(run.prompt)}>
        <p className="exact-prompt">{run.prompt}</p>
      </EvidenceBlock>
      <EvidenceBlock
        title="Raw answer"
        onCopy={run.raw_text ? () => copy(run.raw_text) : undefined}
      >
        {run.raw_text ? (
          <div className="raw-response">{run.raw_text}</div>
        ) : (
          <p className="raw-response missing">
            No answer was collected for this attempt.
          </p>
        )}
      </EvidenceBlock>
      <dl className="evidence-context">
        <div>
          <dt>Prompt variant</dt>
          <dd>{run.prompt_variant}</dd>
        </div>
        <div>
          <dt>Repeat</dt>
          <dd>{run.run_number}</dd>
        </div>
        <div>
          <dt>Collected</dt>
          <dd>{date(run.timestamp)}</dd>
        </div>
        <div>
          <dt>Manifest hash</dt>
          <dd className="hash">{run.manifest_sha256}</dd>
        </div>
      </dl>
      <details>
        <summary>Full run metadata</summary>
        <pre>{JSON.stringify(run, null, 2)}</pre>
      </details>
    </aside>
  );
}

function EvidenceBlock({
  title,
  onCopy,
  children,
}: {
  title: string;
  onCopy?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="evidence-block">
      <header>
        <h3>{title}</h3>
        {onCopy && (
          <button
            className="icon-button"
            onClick={onCopy}
            aria-label={`Copy ${title.toLowerCase()}`}
          >
            <Copy size={18} aria-hidden="true" />
          </button>
        )}
      </header>
      {children}
    </section>
  );
}

/** "variant-2" with repeat 3 becomes "Variant 2 · repeat 3". */
export const variantLabel = (run: Run) =>
  `${run.prompt_variant.replace(/^variant-/, "Variant ")} · repeat ${run.run_number}`;

const shortPrompt = (prompt: string) => {
  const clean = prompt.replace(/\s+/g, " ").trim();
  if (clean.length <= 76) return clean;
  return `${clean.slice(0, 73).replace(/\s+\S*$/, "")}…`;
};

export function RunDialog({
  open,
  onOpenChange,
  onStarted,
  returnFocusTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStarted: (experiment: Experiment) => void;
  returnFocusTo?: React.RefObject<HTMLButtonElement | null>;
}) {
  const [name, setName] = useState("Project management landscape");
  const [repeats, setRepeats] = useState(10);
  const [failure, setFailure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const [ack, setAck] = useState(false);
  async function start(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<Experiment>("/experiments", {
        method: "POST",
        body: JSON.stringify({
          definition: live ? "india-skincare" : "project-tools",
          name,
          repeats: live ? 3 : repeats,
          simulate_failure: live ? false : failure,
          free_tier_ack: live && ack,
        }),
      });
      onStarted(result);
      onOpenChange(false);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content
          className={`dialog run-dialog ${live ? "live" : ""}`}
          onCloseAutoFocus={(event) => {
            if (returnFocusTo?.current) {
              event.preventDefault();
              returnFocusTo.current.focus();
            }
          }}
        >
          <div className="dialog-emblem">
            <Flask size={26} aria-hidden="true" />
          </div>
          <Dialog.Title>Run an experiment</Dialog.Title>
          <Dialog.Description>
            Choose the synthetic demo or the bounded India skincare live pilot.
          </Dialog.Description>
          <Dialog.Close
            className="icon-button dialog-close"
            aria-label="Close run dialog"
          >
            <X size={20} aria-hidden="true" />
          </Dialog.Close>
          <form onSubmit={start}>
            <label htmlFor="collection-mode">Experiment type</label>
            <select
              id="collection-mode"
              name="collection-mode"
              autoComplete="off"
              value={live ? "live" : "demo"}
              onChange={(event) => {
                const next = event.target.value === "live";
                setLive(next);
                setName(
                  next
                    ? "India skincare pilot"
                    : "Project management landscape",
                );
                setAck(false);
              }}
            >
              <option value="demo">Synthetic project-management demo</option>
              <option value="live">
                Live India skincare · Gemini · Ungrounded
              </option>
            </select>
            <label htmlFor="experiment-name">Experiment name</label>
            <input
              id="experiment-name"
              name="experiment-name"
              autoComplete="off"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <label htmlFor="repeat-count">Repeats per prompt and target</label>
            <input
              id="repeat-count"
              name="repeats"
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              required
              value={live ? 3 : repeats}
              disabled={live}
              onChange={(event) => setRepeats(Number(event.target.value))}
            />
            <div className="run-estimate">
              <span>
                {live
                  ? "6 prompts × gemini-3.1-flash-lite × 3 repeats"
                  : `6 prompts × 2 fixture targets × ${repeats || 0} repeats`}
              </span>
              <strong>
                {live ? "18 real requests" : `${12 * (repeats || 0)} responses`}
              </strong>
            </div>
            {live && (
              <ul className="live-facts">
                <li>
                  Takes at least 3 minutes. Requests are spaced 10 seconds or
                  more apart.
                </li>
                <li>
                  Stops at the first provider error, such as a 503. There are no
                  retries or fallback model, and completed answers are kept.
                </li>
                <li>
                  Creates a new, permanent study. Saved answers are never
                  overwritten.
                </li>
              </ul>
            )}
            <label className="checkbox">
              <input
                type="checkbox"
                name="run-acknowledgement"
                checked={live ? ack : failure}
                onChange={(event) =>
                  live
                    ? setAck(event.target.checked)
                    : setFailure(event.target.checked)
                }
              />
              {live
                ? "I verified this key's project is on Free Tier. Start up to 18 real requests and stop on quota errors."
                : "Include one simulated timeout to review failure handling"}
            </label>
            <div className={`notice ${live ? "live" : "safe"}`}>
              {live ? (
                <WarningCircle size={20} aria-hidden="true" />
              ) : (
                <Info size={20} aria-hidden="true" />
              )}
              <span>
                {live
                  ? "Uses your local Gemini key with search grounding off. Keep private health information out of the experiment name."
                  : "Synthetic replay. No API calls, credentials, or provider charges."}
              </span>
            </div>
            {error && (
              <p role="alert" className="inline-error">
                {error}
              </p>
            )}
            <button
              className={`primary full ${live ? "live-submit" : ""}`}
              type="submit"
              disabled={busy || (live && !ack)}
            >
              <Play size={17} weight="fill" aria-hidden="true" />
              {busy ? "Starting…" : live ? "Start live pilot" : "Start replay"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Methodology({ detail }: { detail: Detail }) {
  const live = detail.mode === "live-ungrounded";
  const { canCompare } = getResearchState(detail);
  return (
    <div className="methodology-layout">
      <nav className="method-contents" aria-label="Methodology contents">
        <span>Contents</span>
        <a href="#read-study">How to read this study</a>
        <a href="#collection-design">Collection design</a>
        <a href="#metric-definitions">Metric definitions</a>
        <a href="#counts">Counts and denominators</a>
        <a href="#saved-manifest">Saved manifest</a>
      </nav>
      <article className="method-document">
        <section id="read-study">
          <h2>How to read this study</h2>
          <p>
            {live
              ? "This study uses AI model responses to explore how consumer questions about facial moisturizers under INR 1,000 in India are answered. Results describe what the model said in this controlled setting. They are not a measure of objective brand quality, product efficacy, or public opinion."
              : "This synthetic fixture demonstrates Enigma's measurement path. It provides no evidence about real models, brands, customers, or public opinion."}
          </p>
        </section>
        <section id="collection-design">
          <h2>Collection design</h2>
          <p>
            Every answer is linked to its exact prompt, model target, repeat,
            collection time, and saved experiment manifest.
          </p>
          <dl className="method-stats">
            <div>
              <dt>Prompt variants</dt>
              <dd>
                {detail.manifest.prompts.length}
                <small>fixed phrasings</small>
              </dd>
            </div>
            <div>
              <dt>Repeats per target</dt>
              <dd>
                {detail.manifest.repeats}
                <small>planned repeats</small>
              </dd>
            </div>
            <div>
              <dt>Model targets</dt>
              <dd>
                {detail.manifest.models.length}
                <small>
                  {detail.manifest.models.map(modelName).join(", ")}
                </small>
              </dd>
            </div>
            <div>
              <dt>Prompt context</dt>
              <dd>
                {detail.manifest.geography}
                <small>context, not location verification</small>
              </dd>
            </div>
          </dl>
          <details>
            <summary>
              View the {detail.manifest.prompts.length} prompt variants
            </summary>
            <ol className="prompt-variants">
              {detail.manifest.prompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ol>
          </details>
        </section>
        <section id="metric-definitions">
          <h2>Metric definitions</h2>
          <ul className="method-list">
            <li>
              <strong>Mention rate.</strong> Eligible responses containing a
              tracked brand name, divided by all eligible responses.
            </li>
            <li>
              <strong>Brand matching.</strong> {getMatchingRule(detail)} Tracked
              brands: {detail.manifest.brands.join(", ")}.
            </li>
            <li>
              <strong>Eligible response.</strong> A complete, non-empty answer
              collected successfully. Failed, blocked, empty, and truncated
              answers do not enter the denominator.
            </li>
            <li>
              <strong>Uncertainty.</strong> Completed synthetic experiments show
              95% Wilson intervals. The bounded live pilot reports descriptive
              frequencies and requires repeated-run review.
            </li>
            <li>
              <strong>Sources.</strong>{" "}
              {live
                ? "Search grounding is disabled. URLs in answers are unverified references, not evidence of source influence."
                : "Fixture URLs are authored examples, not retrieved sources."}
            </li>
            <li>
              <strong>Geography.</strong> The saved geography shapes prompt
              wording. It does not guarantee that the model used region-specific
              information.
            </li>
          </ul>
        </section>
        <section id="counts">
          <h2>Counts and denominators</h2>
          <p>
            {canCompare
              ? "Rates stay connected to the exact number of eligible responses."
              : "This collection is incomplete, so rates and intervals are withheld. Counts are listed for audit only and are not a comparison."}
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Brand</th>
                  <th scope="col">Mentions / eligible</th>
                  <th scope="col">Mention rate</th>
                  <th scope="col">95% interval</th>
                  <th scope="col">Recommendations</th>
                </tr>
              </thead>
              <tbody>
                {detail.summary.brands.map((brand) => (
                  <tr key={brand.brand}>
                    <td>{brand.brand}</td>
                    <td>
                      {brand.mentions} / {brand.total}
                    </td>
                    <td>
                      {!brand.total
                        ? "No eligible responses"
                        : canCompare
                          ? percent(brand.probability)
                          : "Withheld"}
                    </td>
                    <td>
                      {!brand.total
                        ? "No interval"
                        : !canCompare
                          ? "Withheld"
                          : (brand.interval?.map(percent).join(" to ") ??
                            "No interval")}
                    </td>
                    <td>{brand.recommendations ?? "Not reported"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section id="saved-manifest">
          <h2>Saved experiment artifacts</h2>
          <p>
            The resolved definition is saved before collection begins, so the
            study can be audited later.
          </p>
          <details>
            <summary>View saved JSON manifest</summary>
            <pre>{JSON.stringify(detail.manifest, null, 2)}</pre>
          </details>
          <details>
            <summary>View derived report</summary>
            <pre>{JSON.stringify(detail.summary, null, 2)}</pre>
          </details>
        </section>
      </article>
    </div>
  );
}

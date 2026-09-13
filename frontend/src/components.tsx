import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
  CheckCircle,
  Flask,
  Play,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { api, date, modelName, percent } from "./api";
import type { Detail, Experiment, Run } from "./types";

export function Status({ value }: { value: string }) {
  return (
    <span
      className={`status ${value.includes("error") || value === "failed" || value === "interrupted" ? "warn" : ""}`}
    >
      <span className="status-dot" />
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function Visibility({ detail }: { detail: Detail }) {
  return (
    <section className="panel visibility" aria-labelledby="visibility-heading">
      <div className="section-head">
        <div>
          <h2 id="visibility-heading">Brand visibility</h2>
          <p>Share of successful responses mentioning each brand</p>
        </div>
        <span className="subtle">By model target</span>
      </div>
      <div className="legend">
        <span>
          <i className="legend-dot teal" />
          Fixture A
        </span>
        <span>
          <i className="legend-dot blue" />
          Fixture B
        </span>
      </div>
      <div className="chart">
        {detail.summary.brands.map((brand) => (
          <div className="chart-row" key={brand.brand}>
            <div className="brand-label">
              <span className={`brand-logo ${brand.brand.toLowerCase()}`}>
                {brand.brand.slice(0, 1)}
              </span>
              {brand.brand}
            </div>
            <div className="bar-pair">
              {detail.manifest.models.map((model, index) => {
                const estimate = brand.by_model[model];
                return (
                  <div
                    className="bar-line"
                    key={model}
                    title={`${modelName(model)}: ${estimate?.count ?? 0}/${estimate?.total ?? 0}; 95% Wilson interval ${estimate?.interval?.map(percent).join(" to ") ?? "unavailable"}`}
                  >
                    <div
                      className={`bar ${index ? "blue" : "teal"}`}
                      style={{
                        width: `${(estimate?.probability ?? 0) * 100}%`,
                      }}
                    />
                    <span>{percent(estimate?.probability ?? null)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="axis">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>
      <div className="chart-note">
        Synthetic examples · View exact counts and intervals in Methodology.
      </div>
    </section>
  );
}

export function ResponseTable({
  runs,
  onSelect,
}: {
  runs: Run[];
  onSelect: (run: Run) => void;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Prompt & response</th>
            <th scope="col">Model target</th>
            <th scope="col">Brands mentioned</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="sr-only">Inspect</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id}>
              <td>
                <button className="prompt-button" onClick={() => onSelect(run)}>
                  {run.prompt}
                </button>
                <small>
                  {run.prompt_variant} / repeat {run.run_number}
                </small>
              </td>
              <td>
                <span
                  className={`model-mark ${run.model === "fixture-b" ? "blue" : "teal"}`}
                />
                {modelName(run.model)}
              </td>
              <td>
                <div className="brand-tags">
                  {run.mentions.length ? (
                    run.mentions.map((b) => <span key={b}>{b}</span>)
                  ) : (
                    <span>{run.status === "failed" ? "Excluded" : "None"}</span>
                  )}
                </div>
              </td>
              <td>
                <Status value={run.status} />
              </td>
              <td>
                <button
                  className="icon-button"
                  aria-label={`Inspect ${run.id}`}
                  onClick={() => onSelect(run)}
                >
                  <ArrowUpRight size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!runs.length && (
        <div className="empty">
          <Flask size={32} />
          <h3>No matching responses</h3>
          <p>Try another search or clear the filters.</p>
        </div>
      )}
    </div>
  );
}

export function EvidenceDialog({
  run,
  onClose,
}: {
  run: Run | null;
  onClose: () => void;
}) {
  return (
    <Dialog.Root open={!!run} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="dialog evidence-dialog">
          <Dialog.Title>Response evidence</Dialog.Title>
          <Dialog.Description>
            Inspect the original synthetic response and its collection context.
          </Dialog.Description>
          <Dialog.Close
            className="icon-button dialog-close"
            aria-label="Close response"
          >
            <X size={20} />
          </Dialog.Close>
          {run && (
            <>
              <div className="evidence-meta">
                <Status value={run.status} />
                <span>{modelName(run.model)}</span>
                <span>{run.id}</span>
              </div>
              <h3>Exact prompt</h3>
              <p className="exact-prompt">{run.prompt}</p>
              <h3>Raw response</h3>
              <pre className="raw-response">
                {run.raw_text || `No response collected. ${run.error}`}
              </pre>
              {run.exclusion_reason && (
                <p className="error">{run.exclusion_reason}</p>
              )}
              <h3>Collection context</h3>
              <dl className="facts">
                <div>
                  <dt>Collected</dt>
                  <dd>{date(run.timestamp)}</dd>
                </div>
                <div>
                  <dt>Surface</dt>
                  <dd>Synthetic replay</dd>
                </div>
                <div>
                  <dt>Prompt variant</dt>
                  <dd>{run.prompt_variant}</dd>
                </div>
                <div>
                  <dt>Repeat</dt>
                  <dd>{run.run_number}</dd>
                </div>
                <div>
                  <dt>Manifest SHA-256</dt>
                  <dd className="hash">{run.manifest_sha256}</dd>
                </div>
              </dl>
              <details>
                <summary>Full run metadata</summary>
                <pre>{JSON.stringify(run, null, 2)}</pre>
              </details>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function RunDialog({
  open,
  onOpenChange,
  onStarted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStarted: (experiment: Experiment) => void;
}) {
  const [name, setName] = useState("Project management landscape");
  const [repeats, setRepeats] = useState(10);
  const [failure, setFailure] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<Experiment>("/experiments", {
        method: "POST",
        body: JSON.stringify({ name, repeats, simulate_failure: failure }),
      });
      onStarted(result);
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay" />
        <Dialog.Content className="dialog run-dialog">
          <div className="dialog-emblem">
            <Flask size={26} />
          </div>
          <Dialog.Title>Run an experiment</Dialog.Title>
          <Dialog.Description>
            Replay a Python-defined experiment to explore the complete reviewer
            workflow.
          </Dialog.Description>
          <Dialog.Close
            className="icon-button dialog-close"
            aria-label="Close run dialog"
          >
            <X size={20} />
          </Dialog.Close>
          <form onSubmit={start}>
            <label htmlFor="experiment-name">Experiment name</label>
            <input
              id="experiment-name"
              name="experiment-name"
              autoComplete="off"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label htmlFor="repeat-count">Repeats per prompt and target</label>
            <input
              id="repeat-count"
              name="repeats"
              type="number"
              min={1}
              max={20}
              required
              value={repeats}
              onChange={(e) => setRepeats(Number(e.target.value))}
            />
            <div className="run-estimate">
              <span>
                6 prompts × 2 fixture targets × {repeats || 0} repeats
              </span>
              <strong>{12 * (repeats || 0)} responses</strong>
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={failure}
                onChange={(e) => setFailure(e.target.checked)}
              />
              Include one simulated timeout to review failure handling
            </label>
            <div className="notice">
              <WarningCircle size={20} />
              <span>
                Synthetic replay. No API calls, no credentials, no provider
                charges. Live collection is not connected.
              </span>
            </div>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="primary full" type="submit" disabled={busy}>
              <Play size={17} weight="fill" />
              {busy ? "Starting…" : "Start replay"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Methodology({ detail }: { detail: Detail }) {
  return (
    <div className="methodology">
      <section className="panel method-intro">
        <div className="dialog-emblem">
          <CheckCircle size={26} />
        </div>
        <h2>Every number has a denominator.</h2>
        <p>
          This workspace makes the path from an answer to a metric inspectable.
          These fixtures demonstrate that path; they provide no evidence about
          real brands or models.
        </p>
      </section>
      <section className="panel">
        <h2>Metric definitions</h2>
        <dl className="method-definitions">
          <div>
            <dt>Mention probability</dt>
            <dd>
              Successful responses containing a whole-word brand name, divided
              by all successful responses in the selected experiment.
              Case-insensitive; aliases and ambiguous entities are not resolved.
            </dd>
          </div>
          <div>
            <dt>Recommendation count</dt>
            <dd>
              Successful responses with the brand at the start of a numbered
              list item. This simple extractor supports the fixture format only;
              it is not validated for live model output.
            </dd>
          </div>
          <div>
            <dt>Uncertainty</dt>
            <dd>
              95% Wilson binomial intervals. On these deterministic fixtures,
              intervals demonstrate presentation only. Real experiments need a
              sampling design that accounts for prompt and run dependence.
            </dd>
          </div>
          <div>
            <dt>Failures & missing data</dt>
            <dd>
              Failed runs are preserved and excluded from metric denominators.
              No successful runs means “No data”, never a zero rate. Interrupted
              jobs preserve completed evidence and can be rerun as a new
              experiment.
            </dd>
          </div>
          <div>
            <dt>Citations</dt>
            <dd>
              HTTP(S) URLs found in raw text. Example URLs are authored, not
              retrieved. URL presence does not establish source influence or
              factual support.
            </dd>
          </div>
        </dl>
      </section>
      <section className="panel">
        <h2>Counts & intervals</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Brand</th>
                <th>Mentions / eligible</th>
                <th>Mention rate</th>
                <th>95% interval</th>
                <th>Recommendations</th>
              </tr>
            </thead>
            <tbody>
              {detail.summary.brands.map((b) => (
                <tr key={b.brand}>
                  <td>{b.brand}</td>
                  <td>
                    {b.mentions} / {b.total}
                  </td>
                  <td>{percent(b.probability)}</td>
                  <td>{b.interval?.map(percent).join(" to ") ?? "No data"}</td>
                  <td>{b.recommendations}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2>Resolved experiment definition</h2>
        <p>
          Authored in <code>experiments/project_tools.py</code>. The snapshot
          below is saved before collection begins.
        </p>
        <details>
          <summary>View saved JSON manifest</summary>
          <pre>{JSON.stringify(detail.manifest, null, 2)}</pre>
        </details>
      </section>
    </div>
  );
}

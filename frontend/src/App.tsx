import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Cube,
  DownloadSimple,
  Flask,
  House,
  MagnifyingGlass,
  Moon,
  Play,
  Sun,
  WarningCircle,
  X,
} from "@phosphor-icons/react";
import { api, date } from "./api";
import {
  EvidenceSheet,
  ExplainabilityLedger,
  Methodology,
  ModeTag,
  ResponseList,
  RunDialog,
  Status,
  Visibility,
} from "./components";
import {
  getFinding,
  getMatchingRule,
  getResearchState,
  getStopReason,
} from "./researchPresentation";
import type { Detail, Experiment, Run } from "./types";

const pages = [
  { id: "overview", name: "Overview", compactName: "Overview", icon: House },
  {
    id: "experiments",
    name: "Experiments",
    compactName: "Experiments",
    icon: Flask,
  },
  {
    id: "responses",
    name: "Response explorer",
    compactName: "Responses",
    icon: MagnifyingGlass,
  },
  {
    id: "methodology",
    name: "Methodology",
    compactName: "Methodology",
    icon: BookOpen,
  },
] as const;

const readQuery = () => new URLSearchParams(window.location.search);

const themeKey = "enigma-theme";
const readSavedTheme = () => {
  try {
    return localStorage.getItem(themeKey);
  } catch {
    return null;
  }
};

// Matches the CSS breakpoint where the response workspace becomes one column.
const compactQuery = "(max-width: 850px)";

function useCompactLayout() {
  const [compact, setCompact] = useState(
    () => window.matchMedia(compactQuery).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(compactQuery);
    const handler = () => setCompact(media.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);
  return compact;
}

export default function App() {
  const [query, setQuery] = useState(readQuery);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [runOpen, setRunOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dark, setDark] = useState(() => {
    const saved = readSavedTheme();
    return saved
      ? saved === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const compact = useCompactLayout();
  const lastEvidenceId = useRef<string | null>(null);
  const runButton = useRef<HTMLButtonElement>(null);

  const page = query.get("page") || "overview";
  const selectedId = query.get("experiment") || experiments[0]?.id;
  const search = query.get("q") || "";
  const model = query.get("model") || "";
  const status = query.get("status") || "";
  const loading = !detail || detail.id !== selectedId;
  const active = detail?.status === "running" || detail?.status === "queued";
  // While the selected study loads, describe it from the list, not stale detail.
  const selectedSummary = experiments.find(
    (experiment) => experiment.id === selectedId,
  );
  const live =
    (loading ? selectedSummary?.mode : detail.mode) === "live-ungrounded";
  const auditPage = page === "responses" || page === "methodology";

  function navigate(changes: Record<string, string>, replace = false) {
    const next = readQuery();
    Object.entries(changes).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    );
    window.history[replace ? "replaceState" : "pushState"]({}, "", `?${next}`);
    setQuery(next);
  }

  useEffect(() => {
    const handler = () => setQuery(readQuery());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem(themeKey, next ? "dark" : "light");
    } catch {
      // Storage can be unavailable; the theme still applies for this visit.
    }
  }

  const refreshList = useCallback(async () => {
    setExperiments(await api<Experiment[]>("/experiments"));
  }, []);

  useEffect(() => {
    refreshList().catch((reason: Error) => setError(reason.message));
  }, [refreshList]);

  useEffect(() => {
    if (!selectedId) return;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const [next, responses] = await Promise.all([
          api<Detail>(`/experiments/${selectedId}`),
          api<Run[]>(`/experiments/${selectedId}/responses`),
        ]);
        if (disposed) return;
        setDetail(next);
        setRuns(responses);
        setError("");
        if (next.status === "running" || next.status === "queued")
          timer = setTimeout(load, 500);
        else refreshList().catch(() => undefined);
      } catch (reason) {
        if (!disposed) setError((reason as Error).message);
      }
    };
    load();
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [selectedId, refreshList]);

  const filtered = runs.filter(
    (run) =>
      (!model || run.model === model) &&
      (!status || run.status === status) &&
      `${run.prompt} ${run.raw_text}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const pageNumber = Math.max(1, Number(query.get("p")) || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 12));
  const currentPage = Math.min(pageNumber, pageCount);
  const visibleRuns = filtered.slice((currentPage - 1) * 12, currentPage * 12);
  // Only a response that matches the current filters can stay selected.
  const selectedRun =
    filtered.find((run) => run.id === query.get("run")) ?? null;
  // On compact screens evidence opens as a sheet only after an explicit choice.
  const evidenceRun = compact
    ? selectedRun
    : (selectedRun ?? (page === "responses" ? visibleRuns[0] : null));
  useEffect(() => {
    if (selectedRun) lastEvidenceId.current = selectedRun.id;
  }, [selectedRun]);

  const link = (target: string) =>
    `?${new URLSearchParams({ ...Object.fromEntries(query), page: target, run: "" })}`;
  const pageTitle =
    page === "overview"
      ? (loading ? selectedSummary?.name : detail.name) || "Research overview"
      : page === "responses"
        ? "Response explorer"
        : page === "experiments"
          ? "Experiments"
          : "Methodology";
  const pageSubtitle =
    page === "overview"
      ? !loading
        ? `${detail.category} · ${detail.manifest.geography}`
        : "Loading the selected study…"
      : page === "responses"
        ? "Inspect every prompt, answer, and extraction decision."
        : page === "experiments"
          ? "Every saved study, with its collection state and evidence intact."
          : "See how every result was produced and how it should be read.";

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="wordmark" href="?">
          <Cube size={30} weight="duotone" aria-hidden="true" />
          <span>
            enigma<span className="wordmark-dot">.</span>
          </span>
        </a>
        <p className="brand-strap">AI brand intelligence</p>
        <nav aria-label="Main navigation">
          {pages.map(({ id, name, compactName, icon: Icon }) => (
            <a
              href={link(id)}
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              onClick={(event) => {
                if (!event.ctrlKey && !event.metaKey) {
                  event.preventDefault();
                  navigate({ page: id, run: "" });
                }
              }}
            >
              <Icon
                size={20}
                weight={page === id ? "fill" : "regular"}
                aria-hidden="true"
              />
              <span className="nav-full">{name}</span>
              <span className="nav-compact">{compactName ?? name}</span>
              {id === "experiments" && (
                <span className="nav-count">{experiments.length}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a
            className="integrity-link"
            href={link("methodology")}
            onClick={(event) => {
              event.preventDefault();
              navigate({ page: "methodology", run: "" });
            }}
          >
            <Flask size={20} aria-hidden="true" />
            <span>
              <strong>Research integrity</strong>
              <small>Definitions and limitations</small>
            </span>
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
          <button
            className="theme-button"
            onClick={toggleTheme}
            aria-label={`Use ${dark ? "light" : "dark"} appearance`}
          >
            {dark ? (
              <Sun size={19} aria-hidden="true" />
            ) : (
              <Moon size={19} aria-hidden="true" />
            )}
            <span>{dark ? "Light appearance" : "Dark appearance"}</span>
          </button>
        </div>
      </aside>

      <div className="app-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Studies <span aria-hidden="true">/</span>{" "}
            <strong>{pageTitle}</strong>
          </div>
          <span className="local-label">Local research workspace</span>
          <button
            className="icon-button topbar-theme"
            onClick={toggleTheme}
            aria-label={`Use ${dark ? "light" : "dark"} appearance`}
          >
            {dark ? (
              <Sun size={19} aria-hidden="true" />
            ) : (
              <Moon size={19} aria-hidden="true" />
            )}
          </button>
        </header>
        <main
          id="main"
          className={`page-${page} ${auditPage ? "audit-page" : ""}`}
        >
          <header className="study-header">
            <div className="study-copy">
              <h1>{pageTitle}</h1>
              <p className="study-subtitle">{pageSubtitle}</p>
              {!loading && page !== "experiments" && (
                <p className="study-date">Created {date(detail.created_at)}</p>
              )}
            </div>
            <div className="study-actions">
              {!loading && page !== "experiments" && (
                <Status value={detail.status} />
              )}
              <button
                ref={runButton}
                className={auditPage ? "secondary" : "primary"}
                onClick={() => setRunOpen(true)}
                disabled={active}
              >
                <Play size={17} weight="fill" aria-hidden="true" /> Run
                experiment
              </button>
              {selectedId && page !== "experiments" && (
                <a
                  className="secondary"
                  href={`/api/experiments/${selectedId}/export`}
                  download
                >
                  <DownloadSimple size={17} aria-hidden="true" /> Export
                  evidence
                </a>
              )}
            </div>
          </header>

          {page !== "experiments" && (
            <div className="study-switcher">
              <label htmlFor="selected-experiment">Study</label>
              <select
                id="selected-experiment"
                name="selected-experiment"
                value={selectedId || ""}
                onChange={(event) =>
                  navigate({ experiment: event.target.value, run: "", p: "" })
                }
              >
                {experiments.map((experiment) => (
                  <option key={experiment.id} value={experiment.id}>
                    {experiment.name} · {experiment.id.slice(0, 6)}
                  </option>
                ))}
              </select>
              <span className="surface-description">
                {live
                  ? "Live · Ungrounded. Extracted claims and URLs require review."
                  : "Synthetic replay. No live provider calls."}
              </span>
              {page !== "methodology" && (
                <a
                  href={link("methodology")}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate({ page: "methodology", run: "" });
                  }}
                >
                  How to read this study{" "}
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
              )}
            </div>
          )}

          {error && (
            <div className="error-banner" role="alert">
              <WarningCircle size={21} aria-hidden="true" />
              <span>{error}</span>
              <button onClick={() => window.location.reload()}>
                Retry connection
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="success-banner">
              <span>{notice}</span>
              <button className="text-button" onClick={() => setNotice("")}>
                Dismiss
              </button>
            </div>
          )}

          {loading && page !== "experiments" && !error ? (
            <div className="loading" role="status" aria-live="polite">
              <div className="loading-line wide" />
              <div className="loading-line" />
              <div className="loading-grid">
                <span />
                <span />
                <span />
              </div>
              <span className="sr-only">Loading the research workspace…</span>
            </div>
          ) : (
            detail && (
              <>
                {active && (
                  <div className="progress-banner" role="status">
                    <div>
                      <strong>
                        {live
                          ? "Collecting live answers"
                          : "Replaying fixtures"}
                      </strong>
                      <span>
                        {detail.completed} of {detail.total} attempted
                      </span>
                    </div>
                    <progress value={detail.completed} max={detail.total} />
                    <small>Raw evidence is saved after each response.</small>
                  </div>
                )}
                {page === "overview" && (
                  <Overview
                    detail={detail}
                    runs={runs}
                    onOpenEvidence={(run) =>
                      navigate({ page: "responses", run: run.id })
                    }
                    onViewAll={() => navigate({ page: "responses", run: "" })}
                  />
                )}
                {page === "responses" && (
                  <section
                    className="response-page"
                    aria-labelledby="response-count"
                  >
                    <div className="filters">
                      <label className="search" htmlFor="response-search">
                        <MagnifyingGlass size={19} aria-hidden="true" />
                        <span className="sr-only">Search responses</span>
                        <input
                          id="response-search"
                          name="response-search"
                          autoComplete="off"
                          placeholder="Search prompts or answers…"
                          value={search}
                          onChange={(event) =>
                            navigate({ q: event.target.value, p: "" }, true)
                          }
                        />
                      </label>
                      <select
                        aria-label="Filter model"
                        name="model-filter"
                        value={model}
                        onChange={(event) =>
                          navigate({ model: event.target.value, p: "" })
                        }
                      >
                        <option value="">All model targets</option>
                        {detail.manifest.models.map((target) => (
                          <option key={target} value={target}>
                            {target}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Filter status"
                        name="status-filter"
                        value={status}
                        onChange={(event) =>
                          navigate({ status: event.target.value, p: "" })
                        }
                      >
                        <option value="">All statuses</option>
                        <option value="succeeded">Succeeded</option>
                        <option value="failed">Failed</option>
                      </select>
                      {(search || model || status) && (
                        <button
                          className="text-button"
                          onClick={() =>
                            navigate({ q: "", model: "", status: "", p: "" })
                          }
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                    <div className="response-workspace">
                      <div className="response-index">
                        <div className="response-index-head">
                          <h2 id="response-count">
                            {filtered.length} responses
                          </h2>
                          <span>In collection order</span>
                        </div>
                        <ResponseList
                          runs={visibleRuns}
                          selectedId={evidenceRun?.id}
                          onSelect={(run) => navigate({ run: run.id })}
                        />
                        <div className="pagination">
                          <span>
                            Page {currentPage} of {pageCount}
                          </span>
                          <div>
                            <button
                              className="secondary"
                              disabled={currentPage <= 1}
                              onClick={() =>
                                navigate({
                                  p: String(currentPage - 1),
                                  run: "",
                                })
                              }
                            >
                              Previous
                            </button>
                            <button
                              className="secondary"
                              disabled={currentPage >= pageCount}
                              onClick={() =>
                                navigate({
                                  p: String(currentPage + 1),
                                  run: "",
                                })
                              }
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>
                      {!compact && (
                        <EvidenceSheet
                          run={evidenceRun}
                          trackedBrands={detail.manifest.brands}
                          matchingRule={getMatchingRule(detail)}
                          onClose={() => navigate({ run: "" })}
                        />
                      )}
                    </div>
                    {compact && (
                      <Dialog.Root
                        open={Boolean(evidenceRun)}
                        onOpenChange={(open) => {
                          if (!open) navigate({ run: "" });
                        }}
                      >
                        <Dialog.Portal>
                          <Dialog.Overlay className="overlay" />
                          <Dialog.Content
                            className="evidence-dialog"
                            aria-describedby={undefined}
                            onCloseAutoFocus={(event) => {
                              const row = document.querySelector<HTMLElement>(
                                `[data-run-id="${lastEvidenceId.current}"]`,
                              );
                              if (row) {
                                event.preventDefault();
                                row.focus();
                              }
                            }}
                          >
                            <div className="evidence-dialog-bar">
                              <Dialog.Title>Response evidence</Dialog.Title>
                              <Dialog.Close
                                className="icon-button"
                                aria-label="Close response evidence"
                              >
                                <X size={20} aria-hidden="true" />
                              </Dialog.Close>
                            </div>
                            <EvidenceSheet
                              run={evidenceRun}
                              trackedBrands={detail.manifest.brands}
                              matchingRule={getMatchingRule(detail)}
                              onClose={() => navigate({ run: "" })}
                            />
                          </Dialog.Content>
                        </Dialog.Portal>
                      </Dialog.Root>
                    )}
                  </section>
                )}
                {page === "experiments" && (
                  <section
                    className="experiment-archive"
                    aria-labelledby="experiment-list-heading"
                  >
                    <div className="archive-heading">
                      <div>
                        <h2 id="experiment-list-heading">Saved studies</h2>
                        <p>
                          Collections remain inspectable even when they stop or
                          fail.
                        </p>
                      </div>
                      <span>{experiments.length} total</span>
                    </div>
                    <div className="experiment-list">
                      {experiments.map((experiment) => (
                        <a
                          href={`?page=overview&experiment=${experiment.id}`}
                          className="experiment-item"
                          key={experiment.id}
                          onClick={(event) => {
                            if (!event.ctrlKey && !event.metaKey) {
                              event.preventDefault();
                              navigate({
                                page: "overview",
                                experiment: experiment.id,
                                run: "",
                              });
                            }
                          }}
                        >
                          <span className="experiment-icon">
                            <Flask size={23} aria-hidden="true" />
                          </span>
                          <div className="experiment-copy">
                            <h3>{experiment.name}</h3>
                            <p>
                              <ModeTag mode={experiment.mode} />
                              {experiment.category} ·{" "}
                              <span className="hash">
                                {experiment.id.slice(0, 6)}
                              </span>
                            </p>
                          </div>
                          <div className="experiment-count">
                            <strong>
                              {experiment.completed} / {experiment.total}
                            </strong>
                            <span>attempted</span>
                          </div>
                          <div className="experiment-created">
                            <strong>{date(experiment.created_at)}</strong>
                            <Status value={experiment.status} />
                          </div>
                          <ArrowUpRight size={20} aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  </section>
                )}
                {page === "methodology" && <Methodology detail={detail} />}
              </>
            )
          )}
          <footer>
            <span>Enigma Research Lab</span>
            <span>Evidence first. Conclusions with context.</span>
          </footer>
        </main>
      </div>
      <RunDialog
        open={runOpen}
        onOpenChange={setRunOpen}
        returnFocusTo={runButton}
        onStarted={(experiment) => {
          setExperiments((previous) => [experiment, ...previous]);
          navigate({ experiment: experiment.id, page: "overview", run: "" });
          setNotice(
            "Experiment started. Each response will be saved to your local workspace.",
          );
        }}
      />
    </>
  );
}

function Overview({
  detail,
  runs,
  onOpenEvidence,
  onViewAll,
}: {
  detail: Detail;
  runs: Run[];
  onOpenEvidence: (run: Run) => void;
  onViewAll: () => void;
}) {
  const state = getResearchState(detail);
  const finding = getFinding(detail);
  const stopReason = getStopReason(detail, runs);
  const unattempted =
    detail.unattempted ?? Math.max(0, detail.total - detail.completed);
  return (
    <div className="overview-flow">
      <section
        className={`finding-band ${finding.kind}`}
        aria-labelledby="finding-heading"
      >
        <div className="finding-copy">
          <p className="section-label">Key finding</p>
          <h2 id="finding-heading">{finding.headline}</h2>
          <p>{finding.detail}</p>
          {stopReason && (
            <p className="stop-reason">
              <WarningCircle size={18} aria-hidden="true" />
              <span>{stopReason}</span>
            </p>
          )}
        </div>
        <div className="collection-health">
          <div className="collection-title">
            <div>
              <span>Collection health</span>
              <strong>
                {state.attempted} of {detail.total} attempted
              </strong>
            </div>
            <span>{Math.round(state.coverage * 100)}%</span>
          </div>
          <progress value={state.attempted} max={detail.total} />
          <dl>
            <div>
              <dt>{state.eligible}</dt>
              <dd>
                eligible
                <br />
                <small>for analysis</small>
              </dd>
            </div>
            <div>
              <dt>{detail.failed}</dt>
              <dd>
                failed
                <br />
                <small>error or blocked</small>
              </dd>
            </div>
            <div>
              <dt>{unattempted}</dt>
              <dd>
                unattempted
                <br />
                <small>
                  {detail.status === "interrupted"
                    ? "never requested"
                    : "not yet run"}
                </small>
              </dd>
            </div>
            <div>
              <dt>{detail.manifest.models.length}</dt>
              <dd>
                model target{detail.manifest.models.length === 1 ? "" : "s"}
                <br />
                <small>{detail.manifest.prompts.length} prompts</small>
              </dd>
            </div>
          </dl>
        </div>
      </section>
      <Visibility detail={detail} />
      <ExplainabilityLedger detail={detail} runs={runs} />
      <section className="evidence-trail" aria-labelledby="trail-heading">
        <div className="section-heading-row">
          <div>
            <p className="section-label">Recent evidence trail</p>
            <h2 id="trail-heading">From result to original answer</h2>
          </div>
          <button className="text-button arrow-link" onClick={onViewAll}>
            View all responses <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
        <ResponseList
          runs={runs.slice(-4).reverse()}
          onSelect={onOpenEvidence}
          compact
        />
      </section>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChartBar,
  CheckCircle,
  Cube,
  DownloadSimple,
  Flask,
  House,
  MagnifyingGlass,
  Moon,
  Play,
  Pulse,
  Sun,
  WarningCircle,
} from "@phosphor-icons/react";
import { api, date, modelName } from "./api";
import {
  EvidenceDialog,
  Methodology,
  ResponseTable,
  RunDialog,
  Status,
  Visibility,
} from "./components";
import type { Detail, Experiment, Run } from "./types";

const pages = [
  { id: "overview", name: "Overview", icon: House },
  { id: "experiments", name: "Experiments", icon: Flask },
  { id: "responses", name: "Response explorer", icon: MagnifyingGlass },
  { id: "methodology", name: "Methodology", icon: BookOpen },
];
const readQuery = () => new URLSearchParams(window.location.search);

export default function App() {
  const [query, setQuery] = useState(readQuery);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [runOpen, setRunOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const page = query.get("page") || "overview";
  const selectedId = query.get("experiment") || experiments[0]?.id;
  const search = query.get("q") || "";
  const model = query.get("model") || "";
  const status = query.get("status") || "";
  const selectedRun = runs.find((r) => r.id === query.get("run")) ?? null;
  const loading = !detail || detail.id !== selectedId;
  const active = detail?.status === "running" || detail?.status === "queued";

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
  const refreshList = useCallback(async () => {
    setExperiments(await api<Experiment[]>("/experiments"));
  }, []);
  useEffect(() => {
    refreshList().catch((e) => setError(e.message));
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
      } catch (e) {
        if (!disposed) setError((e as Error).message);
      }
    };
    load();
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [selectedId, refreshList]);

  const filtered = runs.filter(
    (r) =>
      (!model || r.model === model) &&
      (!status || r.status === status) &&
      `${r.prompt} ${r.raw_text}`.toLowerCase().includes(search.toLowerCase()),
  );
  const pageNumber = Math.max(1, Number(query.get("p")) || 1);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 12));
  const currentPage = Math.min(pageNumber, pageCount);
  const visibleRuns = filtered.slice((currentPage - 1) * 12, currentPage * 12);
  const title =
    page === "overview"
      ? "How AI sees your category."
      : page === "responses"
        ? "The evidence behind the answer."
        : page === "experiments"
          ? "A question worth testing."
          : "Measurement you can inspect.";
  const subtitle =
    page === "overview"
      ? "Explore brand visibility, compare models, inspect the evidence."
      : page === "responses"
        ? "Search every response. See exactly what was said and how it was collected."
        : page === "experiments"
          ? "Your experiments, their progress, and the questions that drive them."
          : "Transparent definitions, explicit limitations, and preserved provenance.";
  const link = (target: string) =>
    `?${new URLSearchParams({ ...Object.fromEntries(query), page: target, run: "" })}`;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="wordmark" href="?">
          <Cube size={31} weight="duotone" />
          <span>
            enigma<span className="wordmark-dot">.</span>
          </span>
        </a>
        <div className="workspace">
          <div className="workspace-avatar">E</div>
          <div>
            <strong>Research lab</strong>
            <small>Local workspace</small>
          </div>
          <span className="workspace-label">V1</span>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {pages.map(({ id, name, icon: Icon }) => (
            <a
              href={link(id)}
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              aria-label={name}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  navigate({ page: id, run: "" });
                }
              }}
            >
              <Icon size={20} weight={page === id ? "fill" : "regular"} />
              <span>{name}</span>
              {id === "experiments" && (
                <span className="nav-count">{experiments.length}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="lab-note">
            <Flask size={20} />
            <h3>A space to ask better questions.</h3>
            <p>
              Start with an experiment.
              <br />
              Follow the evidence.
            </p>
            <a
              href={link("methodology")}
              onClick={(e) => {
                e.preventDefault();
                navigate({ page: "methodology" });
              }}
            >
              Read the methodology <ArrowUpRight size={15} />
            </a>
          </div>
          <button className="theme-button" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            <span>{dark ? "Light appearance" : "Dark appearance"}</span>
          </button>
          <div className="reviewer">
            <span className="reviewer-avatar">PR</span>
            <div>
              <strong>Product reviewer</strong>
              <small>Local preview</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="app-shell">
        <header className="topbar">
          <div>
            Workspace <span>/</span>{" "}
            <strong>
              {pages.find((p) => p.id === page)?.name ?? "Overview"}
            </strong>
          </div>
          <span className="local-indicator">
            <span />
            Local environment
          </span>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">AI BRAND INTELLIGENCE</div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            <button
              className="primary"
              onClick={() => setRunOpen(true)}
              disabled={active}
            >
              <Play size={16} weight="fill" />
              Run experiment
            </button>
          </div>
          <div className="preview-notice">
            <div>
              <Flask size={18} />
              <strong>Reviewer preview</strong>
              <span>Synthetic example data. No live model queries.</span>
            </div>
            <a
              href={link("methodology")}
              onClick={(e) => {
                e.preventDefault();
                navigate({ page: "methodology" });
              }}
            >
              About this data <ArrowUpRight size={15} />
            </a>
          </div>
          {error && (
            <div className="error-banner" role="alert">
              <WarningCircle size={20} />
              <span>{error}</span>
              <button onClick={() => window.location.reload()}>
                Retry connection
              </button>
            </div>
          )}
          {notice && (
            <div role="status" className="success-banner">
              {notice}
              <button className="text-button" onClick={() => setNotice("")}>
                Dismiss
              </button>
            </div>
          )}
          {page !== "experiments" && (
            <div className="experiment-toolbar">
              <label>
                <span className="sr-only">Selected experiment</span>
                <select
                  value={selectedId || ""}
                  onChange={(e) =>
                    navigate({ experiment: e.target.value, run: "", p: "" })
                  }
                >
                  {experiments.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} · {e.id.slice(0, 6)}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                {detail && <Status value={detail.status} />}
                <a
                  className="secondary export-link"
                  href={
                    selectedId
                      ? `/api/experiments/${selectedId}/export`
                      : undefined
                  }
                  download
                >
                  <DownloadSimple size={16} />
                  Export evidence
                </a>
              </div>
            </div>
          )}
          {loading && page !== "experiments" && !error ? (
            <div className="loading" role="status">
              <Pulse size={30} />
              <h2>Loading the research workspace…</h2>
              <p>Reading saved experiments and responses.</p>
            </div>
          ) : (
            detail && (
              <>
                {active && (
                  <div className="progress-banner" role="status">
                    <span>
                      Replaying fixtures{" "}
                      <strong>
                        {detail.completed} / {detail.total}
                      </strong>
                    </span>
                    <progress value={detail.completed} max={detail.total} />
                    <small>Raw evidence is saved after each response.</small>
                  </div>
                )}
                {page === "overview" && (
                  <>
                    <div className="metrics">
                      <div>
                        <span>
                          <Pulse size={19} />
                          Responses collected
                        </span>
                        <strong>
                          {detail.completed}
                          <small> / {detail.total}</small>
                        </strong>
                        <p>
                          {detail.summary.successful} successful ·{" "}
                          {detail.failed} failed
                        </p>
                      </div>
                      <div>
                        <span>
                          <ChartBar size={19} />
                          Brands in scope
                        </span>
                        <strong>{detail.manifest.brands.length}</strong>
                        <p>One controlled competitor set</p>
                      </div>
                      <div>
                        <span>
                          <Cube size={19} />
                          Model targets
                        </span>
                        <strong>{detail.manifest.models.length}</strong>
                        <p>Synthetic fixtures, not providers</p>
                      </div>
                      <div>
                        <span>
                          <CheckCircle size={19} />
                          Collection progress
                        </span>
                        <strong>
                          {Math.round((detail.completed / detail.total) * 100)}
                          <small>%</small>
                        </strong>
                        <p>
                          {detail.manifest.prompts.length} prompts ·{" "}
                          {detail.manifest.repeats} repeats
                        </p>
                      </div>
                    </div>
                    <div className="overview-grid">
                      <Visibility detail={detail} />
                      <section className="panel brief">
                        <div className="section-head">
                          <h2>Experiment brief</h2>
                          <Flask size={20} />
                        </div>
                        <p className="brief-question">
                          Which tools enter the conversation?
                        </p>
                        <p>
                          Explore how a controlled set of prompts represents
                          project management brands.
                        </p>
                        <dl className="facts">
                          <div>
                            <dt>Category</dt>
                            <dd>{detail.category}</dd>
                          </div>
                          <div>
                            <dt>Prompt variants</dt>
                            <dd>{detail.manifest.prompts.length}</dd>
                          </div>
                          <div>
                            <dt>Repeats per target</dt>
                            <dd>{detail.manifest.repeats}</dd>
                          </div>
                          <div>
                            <dt>Persona</dt>
                            <dd>{detail.manifest.persona}</dd>
                          </div>
                          <div>
                            <dt>Geography</dt>
                            <dd>{detail.manifest.geography}</dd>
                          </div>
                        </dl>
                        <a
                          className="brief-link"
                          href={link("methodology")}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate({ page: "methodology" });
                          }}
                        >
                          Inspect the experiment definition{" "}
                          <ArrowRight size={16} />
                        </a>
                      </section>
                    </div>
                    <section className="panel recent">
                      <div className="section-head">
                        <div>
                          <h2>Response trail</h2>
                          <p>Go from an aggregate to the original answer.</p>
                        </div>
                        <a
                          className="text-link"
                          href={link("responses")}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate({ page: "responses" });
                          }}
                        >
                          View all responses <ArrowRight size={16} />
                        </a>
                      </div>
                      <ResponseTable
                        runs={runs.slice(-4).reverse()}
                        onSelect={(run) => navigate({ run: run.id })}
                      />
                    </section>
                  </>
                )}
                {page === "responses" && (
                  <section className="panel response-panel">
                    <div className="section-head">
                      <div>
                        <h2>Response explorer</h2>
                        <p>
                          {filtered.length} of {runs.length} responses match
                          your selection
                        </p>
                      </div>
                    </div>
                    <div className="filters">
                      <label className="search">
                        <MagnifyingGlass size={18} />
                        <input
                          aria-label="Search responses"
                          name="search"
                          autoComplete="off"
                          placeholder="Search prompts or answers…"
                          value={search}
                          onChange={(e) =>
                            navigate({ q: e.target.value, p: "" }, true)
                          }
                        />
                      </label>
                      <select
                        aria-label="Filter model"
                        value={model}
                        onChange={(e) =>
                          navigate({ model: e.target.value, p: "" })
                        }
                      >
                        <option value="">All model targets</option>
                        {detail.manifest.models.map((m) => (
                          <option key={m} value={m}>
                            {modelName(m)}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Filter status"
                        value={status}
                        onChange={(e) =>
                          navigate({ status: e.target.value, p: "" })
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
                    <ResponseTable
                      runs={visibleRuns}
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
                            navigate({ p: String(currentPage - 1) })
                          }
                        >
                          Previous
                        </button>
                        <button
                          className="secondary"
                          disabled={currentPage >= pageCount}
                          onClick={() =>
                            navigate({ p: String(currentPage + 1) })
                          }
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </section>
                )}
                {page === "experiments" && (
                  <section className="panel">
                    <div className="section-head">
                      <div>
                        <h2>Your experiments</h2>
                        <p>Saved locally, with the evidence preserved.</p>
                      </div>
                      <span className="subtle">
                        {experiments.length} experiments
                      </span>
                    </div>
                    <div className="experiment-list">
                      {experiments.map((exp) => (
                        <a
                          href={`?page=overview&experiment=${exp.id}`}
                          className="experiment-item"
                          key={exp.id}
                          onClick={(e) => {
                            if (!e.ctrlKey && !e.metaKey) {
                              e.preventDefault();
                              navigate({
                                page: "overview",
                                experiment: exp.id,
                                run: "",
                              });
                            }
                          }}
                        >
                          <span className="experiment-icon">
                            <Flask size={24} />
                          </span>
                          <div>
                            <h3>{exp.name}</h3>
                            <p>
                              {date(exp.created_at)} · {exp.completed}/
                              {exp.total} responses
                            </p>
                          </div>
                          <Status value={exp.status} />
                          <ArrowUpRight size={20} />
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
        onStarted={(exp) => {
          setExperiments((prev) => [exp, ...prev]);
          navigate({ experiment: exp.id, page: "overview", run: "" });
          setNotice(
            "Replay started. Each response will be saved to your local workspace.",
          );
        }}
      />
      <EvidenceDialog run={selectedRun} onClose={() => navigate({ run: "" })} />
    </>
  );
}

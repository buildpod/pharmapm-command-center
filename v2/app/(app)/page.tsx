"use client";

// Dashboard — refactored to the AivelloStudio design system per
// design/dashboard-reference.html. Visual chrome only. All data hooks
// (getKpis, useProject, useEntityStore, riskTrend, budgetTrend) are
// unchanged.
//
// Layout follows the reference exactly:
//   .page-header → .kpi-grid → .charter → .grid-2 (Phase + Health)
//   → .grid-2 (Risk + Budget charts) → .grid-2 (Milestones + Decisions)

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import "@/app/styles/dashboard.css";
import { getKpis, budgetTrend, riskTrend } from "@/lib/mockData";
import { SAMPLE_OPTIN_KEY, useProject } from "@/components/projects/project-provider";
import { GuidedWorkPanel } from "@/components/guidance/guided-work-panel";
import { GUIDANCE_ROLE_EVENT, GUIDANCE_ROLE_KEY } from "@/components/guidance/role-selector";
import { useEntityStore } from "@/lib/stores/entity-store";
import { useProjectEvm } from "@/lib/hooks/use-project-evm";
import { guidanceRoleLabel, type GuidanceRole } from "@/lib/guidance/guided-work";
import { calculateDeliveryTruth, calculateForecastDate, type DeliveryTruthSource } from "@/lib/domain/delivery-truth";
import { daysBetween } from "@/lib/domain/dates";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function sourceHref(source?: DeliveryTruthSource) {
  if (!source) return "/truth";
  const route = {
    milestone: "/milestones",
    task: "/tasks",
    risk: "/risks",
    document: "/documents",
    cost: "/costs",
  }[source.kind];
  return `${route}?focus=${encodeURIComponent(source.id)}`;
}

// Map task status → pill tone (used for milestone status across the dashboard)
const milestoneStatusPill: Record<string, string> = {
  "complete":    "pill pill--ok",
  "in-progress": "pill pill--info",
  "at-risk":     "pill pill--warn",
  "pending":     "pill pill--neutral",
};

const charterStatusPill: Record<string, string> = {
  draft:     "pill pill--neutral",
  submitted: "pill pill--warn",
  approved:  "pill pill--ok",
};

const SETUP_REVIEW_TOUR_KEY = "aivello_pending_setup_review_v1";
const launchpadRoles: GuidanceRole[] = ["pm", "sponsor", "qa"];
const launchpadRoleCopy: Record<GuidanceRole, string> = {
  pm: "Show me setup, schedule impact, ownership, blockers, and what to do next.",
  sponsor: "Show me confidence, decisions, budget pressure, and SteerCo-ready reporting.",
  qa: "Show me validation evidence, readiness gates, approvals, risks, and audit-facing records.",
};

function readLaunchpadRole(): GuidanceRole {
  try {
    const stored = localStorage.getItem(GUIDANCE_ROLE_KEY);
    return launchpadRoles.includes(stored as GuidanceRole) ? stored as GuidanceRole : "pm";
  } catch {
    return "pm";
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { projects, activeProjectId, activeProject } = useProject();
  const kpis = getKpis(activeProjectId);
  const charters = useEntityStore((s) => s.charters);
  const milestones = useEntityStore((s) => s.milestones);
  const tasks = useEntityStore((s) => s.tasks);
  const risks = useEntityStore((s) => s.risks);
  const documents = useEntityStore((s) => s.documents);
  const costLines = useEntityStore((s) => s.costLines);
  const charter  = charters.find((c) => c.projectId === activeProjectId);
  const [showSetupReview, setShowSetupReview] = useState(false);
  const [sampleOptedIn, setSampleOptedIn] = useState(false);
  const [launchpadRole, setLaunchpadRole] = useState<GuidanceRole>("pm");

  useEffect(() => {
    try {
      setShowSetupReview(sessionStorage.getItem(SETUP_REVIEW_TOUR_KEY) === activeProjectId);
    } catch {
      setShowSetupReview(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    try {
      setSampleOptedIn(localStorage.getItem(SAMPLE_OPTIN_KEY) === "1");
    } catch {
      setSampleOptedIn(false);
    }
  }, []);

  useEffect(() => {
    setLaunchpadRole(readLaunchpadRole());
  }, []);

  function dismissSetupReview() {
    try {
      sessionStorage.removeItem(SETUP_REVIEW_TOUR_KEY);
    } catch {}
    setShowSetupReview(false);
  }

  function exploreSampleProject() {
    try {
      localStorage.setItem(SAMPLE_OPTIN_KEY, "1");
    } catch {}
    setSampleOptedIn(true);
  }

  function updateLaunchpadRole(role: GuidanceRole) {
    setLaunchpadRole(role);
    try {
      localStorage.setItem(GUIDANCE_ROLE_KEY, role);
      window.dispatchEvent(new CustomEvent(GUIDANCE_ROLE_EVENT, { detail: role }));
    } catch {}
  }

  const hasRealProject = projects.some((project) => !project.isSample);

  // One schedule truth: same milestone-drift source as the Delivery Signals
  // page (calculateForecastDate), replacing the mock scheduleVariance that
  // contradicted it ("+7d At Risk" here vs "On target" there).
  const projectMilestones = milestones.filter((m) => m.projectId === activeProjectId);

  // Phase progress is computed live from this project's milestones (grouped by
  // their declared phase) — no hand-set lifecycle percentages.
  const phaseProgress = useMemo(() => {
    const order: string[] = [];
    const byPhase = new Map<string, { complete: number; total: number }>();
    for (const m of projectMilestones) {
      if (!byPhase.has(m.phase)) { byPhase.set(m.phase, { complete: 0, total: 0 }); order.push(m.phase); }
      const bucket = byPhase.get(m.phase)!;
      bucket.total += 1;
      if (m.status === "complete") bucket.complete += 1;
    }
    return order.map((name) => {
      const { complete, total } = byPhase.get(name)!;
      const pct = total ? Math.round((complete / total) * 100) : 0;
      return { name, pct, state: pct === 100 ? "done" : pct > 0 ? "active" : "pending" };
    });
  }, [projectMilestones]);
  const overallPhasePct = phaseProgress.length
    ? Math.round(phaseProgress.reduce((sum, p) => sum + p.pct, 0) / phaseProgress.length)
    : 0;

  const forecastDate = calculateForecastDate(activeProject, projectMilestones);
  const scheduleDeltaDays = daysBetween(activeProject.goLiveDate, forecastDate);
  const scheduleOnTrack = scheduleDeltaDays <= 0;
  const scheduleVarianceLabel = scheduleDeltaDays === 0
    ? "Forecast matches the go-live target"
    : scheduleDeltaDays > 0
      ? `Forecast ${scheduleDeltaDays} day${scheduleDeltaDays === 1 ? "" : "s"} past the go-live target`
      : `Forecast ${Math.abs(scheduleDeltaDays)} day${scheduleDeltaDays === -1 ? "" : "s"} ahead of the go-live target`;

  const scheduleKpiAccent = scheduleOnTrack ? "kpi--ok" : "kpi--warn";

  const riskKpiAccent =
    kpis.highRisks > 0 ? "kpi--risk" :
    kpis.medRisks > 0  ? "kpi--warn" :
    "kpi--ok";

  const budgetKpiAccent =
    kpis.budgetPct >= 85 ? "kpi--risk" :
    kpis.budgetPct >= 60 ? "kpi--warn" :
    "kpi--ok";

  // Phase-2: shared hook — the SAME computation Delivery Signals uses, so the
  // two surfaces cannot disagree. Coverage gate + status-date clamp live there.
  const { coverage, evm } = useProjectEvm();
  const coverageHint = `Add ${coverage.missing.join(" and ")} to activate the verdict.`;
  const truth = useMemo(() => calculateDeliveryTruth({
    project: activeProject,
    milestones,
    tasks,
    risks,
    documents,
    costLines,
    evm: evm?.snapshot,
  }), [activeProject, milestones, tasks, risks, documents, costLines, evm]);
  const verdictPill = !evm
    ? "pill pill--neutral"
    : evm.verdict.level === "on-track" ? "pill pill--ok"
    : evm.verdict.level === "watch" ? "pill pill--warn"
    : "pill pill--risk";
  const verdictToneVar = !evm
    ? "var(--color-status-neutral-dot)"
    : evm.verdict.level === "on-track" ? "var(--color-status-ok-dot)"
    : evm.verdict.level === "watch" ? "var(--color-status-warn-dot)"
    : "var(--color-status-risk-dot)";
  const planOnly = !!evm?.verdict.planOnly;
  const fmtM = (v: number) => `$${(v / 1_000_000).toFixed(2)}M`;

  if (!hasRealProject && !sampleOptedIn) {
    const timeline = [
      ["Discover", "Capture the project type, dates, regions, governance needs, and starting evidence."],
      ["Build", "Create the command center from a pharma playbook, import, saved template, or blank skeleton."],
      ["Validate", "Check generated milestones, tasks, risks, approvals, owners, and dates before the plan becomes active."],
      ["Run", "Use live signals, worklists, readiness gates, and schedule impact to manage delivery week by week."],
      ["Report", "Turn the same evidence into leadership-ready status, SteerCo, and workstream reports."],
    ];

    return (
      <section className="command-launchpad" aria-label="Command Center Launchpad">
        <div className="command-launchpad__hero" data-tour-id="dashboard-verdict">
          <div>
            <div className="page-header__eyebrow">Command Center Launchpad</div>
            <h1 className="t-page-title page-header__title">Run regulated implementation projects with evidence you can defend.</h1>
            <p>
              Run regulated implementation projects with live delivery evidence, schedule impact, governance, cost, and SteerCo-ready reporting.
            </p>
            <p>
              Core issue it solves: project teams usually maintain one plan for delivery, another story for sponsors, and scattered evidence for audit. This command center keeps those views connected.
            </p>
          </div>
          <div className="command-launchpad__role" data-tour-id="dashboard-confidence">
            <span>Guidance role</span>
            <div className="command-launchpad__role-options" role="group" aria-label="Guidance role">
              {launchpadRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={role === launchpadRole ? "command-launchpad__role-option command-launchpad__role-option--active" : "command-launchpad__role-option"}
                  onClick={() => updateLaunchpadRole(role)}
                  aria-pressed={role === launchpadRole}
                >
                  {guidanceRoleLabel(role)}
                </button>
              ))}
            </div>
            <p>{launchpadRoleCopy[launchpadRole]}</p>
          </div>
        </div>

        <div className="command-launchpad__journey" data-tour-id="dashboard-what-now">
          <div className="command-launchpad__section-head">
            <div className="command-launchpad__eyebrow">Journey timeline</div>
            <h2>Discover → Build → Validate → Run → Report</h2>
          </div>
          <ol className="command-launchpad__timeline">
            {timeline.map(([label, body]) => (
              <li key={label}>
                <strong>{label}</strong>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="command-launchpad__grid" data-tour-id="dashboard-kpis">
          <button type="button" className="command-launchpad__card command-launchpad__card--button" onClick={exploreSampleProject}>
            <span>1</span>
            <strong>Explore sample project</strong>
            <p>Use the seeded Veeva RIM project to see the command center with realistic delivery evidence.</p>
          </button>
          <Link href="/setup?start=playbook" className="command-launchpad__card">
            <span>2</span>
            <strong>Create from playbook</strong>
            <p>Start from a pharma implementation pattern when the project resembles a known rollout.</p>
          </Link>
          <Link href="/setup?start=import" className="command-launchpad__card">
            <span>3</span>
            <strong>Import existing plan</strong>
            <p>Bring in an existing schedule, preview what maps, and review before creating records.</p>
          </Link>
          <Link href="/setup?start=blank" className="command-launchpad__card">
            <span>4</span>
            <strong>Start blank skeleton</strong>
            <p>Create the minimum structure when the team wants to build the plan manually.</p>
          </Link>
        </div>

        <div className="command-launchpad__knowledge" data-tour-id="dashboard-confidence">
          <details>
            <summary>What is this?</summary>
            <p>
              PharmaPM Command Center is a working control room for regulated implementation delivery. It connects plan records, evidence, readiness, cost, governance, and reporting so a PM can explain what is true and what needs action.
            </p>
          </details>
          <details>
            <summary>How the command center works</summary>
            <p>
              You create or import a project, validate the generated records, then operate from live dashboards, Delivery Signals, worklists, readiness gates, and reports. Guidance stays available through the Guide drawer and DAP toggle after setup.
            </p>
          </details>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Page header — eyebrow + display title + meta row */}
      <div className="page-header">
        <div className="page-header__eyebrow">Project Dashboard</div>
        <h1 className="t-page-title page-header__title">{activeProject.name}</h1>
        <div className="page-header__meta">
          <span>{activeProject.phase}</span>
          <em>•</em>
          <span>Go-Live target {formatDate(activeProject.goLiveDate)}</span>
          <em>•</em>
          <span>Last refresh just now</span>
        </div>
      </div>

      {showSetupReview && (
        <section className="setup-review-banner" aria-label="Project setup review">
          <div>
            <div className="setup-review-banner__eyebrow">Guided setup review</div>
            <h2 className="setup-review-banner__title">Check the generated project before the team starts work</h2>
            <p className="setup-review-banner__copy">
              Confirm milestones, task owners, risks, charter, and due dates so the template becomes your project plan, not just a starting point.
            </p>
            <div className="setup-review-banner__steps" aria-label="Recommended review steps">
              <span>1. Milestones</span>
              <span>2. Tasks and owners</span>
              <span>3. Risks and documents</span>
              <span>4. Charter approval</span>
            </div>
          </div>
          <div className="setup-review-banner__actions">
            <button type="button" className="btn btn--secondary" onClick={dismissSetupReview}>
              Skip for now
            </button>
            <Link href="/milestones" className="btn btn--primary" onClick={dismissSetupReview}>
              Review setup
            </Link>
          </div>
        </section>
      )}

      <Link href="/truth" className="executive-verdict" aria-label="Executive verdict — open Delivery Signals" data-tour-id="dashboard-verdict">
        <div>
          <div className="executive-verdict__label">Executive Verdict</div>
          <div className="executive-verdict__title">{evm ? evm.verdict.headline : "Verdict pending"}</div>
          <p className="executive-verdict__copy">
            {evm
              ? evm.verdict.reason
              : `${coverageHint} The score is computed from real delivery data — never hand-set.`}
          </p>
        </div>
        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <span className={!evm || planOnly ? "pill pill--neutral" : verdictPill}>{!evm ? "Pending data" : planOnly ? "Plan only" : `${evm.verdict.score}/100 confidence`}</span>
          <span className="card-link-hint">See the evidence →</span>
        </span>
      </Link>

      <GuidedWorkPanel route="/" showChecklist />

      <section className="what-now" data-tour-id="dashboard-what-now">
        <div className="what-now__header">
          <div>
            <div className="what-now__eyebrow">What needs attention</div>
            <h2 className="what-now__title">Next actions from this project</h2>
          </div>
          <Link href="/truth" className="card-link-hint">Open Delivery Signals →</Link>
        </div>
        <div className="what-now__body">
          {truth.signals.length > 0 ? (
            truth.signals.slice(0, 3).map((signal) => {
              const topSource = signal.sources[0];
              return (
                <Link key={signal.id} href={sourceHref(topSource)} className="what-now__row">
                  <span className={`pill pill--${signal.severity === "high" || signal.severity === "critical" ? "risk" : signal.severity === "medium" ? "warn" : "info"}`}>
                    {signal.metric?.value ?? signal.severity}
                  </span>
                  <span>
                    <strong>{signal.nextAction}</strong>
                    <em>{topSource ? `${topSource.kind}: ${topSource.label}` : "Open Delivery Signals for the evidence."}</em>
                  </span>
                </Link>
              );
            })
          ) : !coverage.ready ? (
            <div className="what-now__empty">
              <strong>{coverageHint}</strong>
              <Link href={coverage.missing.includes("budget lines") ? "/costs" : "/tasks"} className="btn btn--secondary">
                {coverage.missing.includes("budget lines") ? "Add budget lines" : "Add tasks"}
              </Link>
            </div>
          ) : (
            <div className="what-now__empty">
              <strong>No pressure signals — keep the next status cycle focused on the current path.</strong>
            </div>
          )}
        </div>
      </section>

      {/* KPI grid */}
      <div className="kpi-grid" data-tour-id="dashboard-kpis">
        <Link href="/milestones" className={`kpi ${scheduleKpiAccent}`}>
          <div className="kpi__label">Schedule Health</div>
          <div className="kpi__value-row">
            <span className="t-kpi-value kpi__value">{scheduleOnTrack ? "On Track" : "At Risk"}</span>
          </div>
          <div className="kpi__sub">{scheduleVarianceLabel}</div>        </Link>

        <Link href="/risks" className={`kpi ${riskKpiAccent}`}>
          <div className="kpi__label">Open Risks</div>
          <div className="kpi__value-row">
            <span className="t-kpi-value kpi__value">{kpis.openRisksCount}</span>
          </div>
          <div className="kpi__sub" style={{ display: "flex", gap: "var(--space-1)", flexWrap: "wrap" }}>
            {kpis.highRisks > 0 && <span className="pill pill--risk">{kpis.highRisks} high</span>}
            {kpis.medRisks > 0 && <span className="pill pill--warn">{kpis.medRisks} medium</span>}
            {kpis.highRisks === 0 && kpis.medRisks === 0 && (
              <span className="pill pill--ok">All low</span>
            )}
          </div>        </Link>

        <Link href="/costs" className={`kpi ${budgetKpiAccent}`}>
          <div className="kpi__label">Budget Utilised</div>
          <div className="kpi__value-row">
            <span className="t-kpi-value kpi__value">{kpis.budgetPct}%</span>
          </div>
          <div className="kpi__sub">
            <strong>${(kpis.latestActualK / 1000).toFixed(2)}M</strong> of ${(kpis.totalBudgetK / 1000).toFixed(1)}M
          </div>        </Link>

        <Link href="/milestones" className="kpi kpi--info">
          <div className="kpi__label">Days to Go-Live</div>
          <div className="kpi__value-row">
            <span className="t-kpi-value kpi__value">{kpis.daysToGoLive}</span>
          </div>
          <div className="kpi__sub">Target <strong>{formatDate(activeProject.goLiveDate)}</strong></div>        </Link>
      </div>

      {/* Charter strip — full-width status row */}
      {charter && (
        <Link href="/charter" className="charter">
          <div>
            <div className="charter__title">
              Project Charter — {charter.status === "approved" ? "Approved" : charter.status === "submitted" ? "Submitted" : "Draft"}
            </div>
            <div className="charter__sub">
              Sponsor: {charter.sponsor} · Go-live {formatDate(activeProject.goLiveDate)}
            </div>
          </div>
          <span className={charterStatusPill[charter.status]}>
            {charter.status === "approved" ? "Approved" : charter.status === "submitted" ? "Submitted" : "Draft"}
          </span>
          <div className="charter__meta">
            Last updated<br />
            <strong>{formatDate(charter.lastUpdated)}</strong>
          </div>
        </Link>
      )}

      {/* Phase tracker + Project health */}
      <div className="grid-2">
        <section className="card" data-tour-id="dashboard-confidence">
          <div className="card__header">
            <div>
              <div className="t-card-title">
                Project Phase Progress <Link href="/milestones" className="card-link-hint">View milestones →</Link>
              </div>
              <div className="t-meta">
                {phaseProgress.length > 0
                  ? `${phaseProgress.length}-phase lifecycle · ${overallPhasePct}% complete`
                  : "Milestone lifecycle"}
              </div>
            </div>
            {phaseProgress.length > 0 && <span className="pill pill--info">{overallPhasePct}% complete</span>}
          </div>
          <div className="card__body">
            {phaseProgress.length > 0 ? (
              <div className="phase-tracker">
                {phaseProgress.map((p) => (
                  <div key={p.name} className={`phase phase--${p.state}`}>
                    <div className="phase__fill" style={{ width: `${p.pct}%` }} />
                    <div className="phase__name">{p.name}</div>
                    <div className="phase__pct">{p.pct}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="t-meta">Add milestones with a phase to see lifecycle progress.</div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div className="t-card-title">
              Confidence drivers <Link href="/truth" className="card-link-hint">Open Delivery Signals →</Link>
            </div>
            <span className={!evm || planOnly ? "pill pill--neutral" : verdictPill}>{!evm ? "Pending data" : planOnly ? "Plan only" : evm.verdict.headline}</span>
          </div>
          <div className="health">
            <div>
              <span className="health__score" style={{ color: verdictToneVar }}>{evm && !planOnly ? evm.verdict.score : "—"}</span>
              <span className="health__score-max"> / 100</span>
            </div>
            <div className="health__bar">
              <div
                className="health__bar-fill"
                style={{
                  width: `${evm && !planOnly ? evm.verdict.score : 0}%`,
                  background: verdictToneVar,
                }}
              />
            </div>
          </div>
          {evm && !planOnly ? (
            <>
              <div className="alert-row">
                <div className="alert-row__icon">$</div>
                <div>
                  <div className="alert-row__title">Cost efficiency {evm.snapshot.cpi.toFixed(2)}</div>
                  <div className="t-meta">Earning ${evm.snapshot.cpi.toFixed(2)} of planned work per $1 spent</div>
                </div>
              </div>
              <div className="alert-row">
                <div className="alert-row__icon">⏱</div>
                <div>
                  <div className="alert-row__title">Schedule pace {evm.snapshot.spit.toFixed(2)}</div>
                  <div className="t-meta">
                    {evm.snapshot.spit >= 1 ? "Earning planned work on pace in real time" : "Behind pace in real time — earning planned work slower than scheduled"}
                  </div>
                </div>
              </div>
              <div className="alert-row">
                <div className="alert-row__icon">→</div>
                <div>
                  <div className="alert-row__title">Forecast final cost {fmtM(evm.range.likely)}</div>
                  <div className="t-meta">Range {fmtM(evm.range.low)} – {fmtM(evm.range.high)} across forecast methods</div>
                </div>
              </div>
            </>
          ) : planOnly ? (
            <div className="alert-row">
              <div className="alert-row__icon">○</div>
              <div>
                <div className="alert-row__title">Plan only — no actuals yet</div>
                <div className="t-meta">Confidence sharpens once work and spend start to register.</div>
              </div>
            </div>
          ) : (
            <div className="alert-row">
              <div className="alert-row__icon">!</div>
              <div>
                <div className="alert-row__title">Not enough data to judge this project</div>
                <div className="t-meta">{coverageHint}</div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Risk + Budget charts */}
      <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="card">
          <div className="card__header">
            <div>
              <div className="t-card-title">Risk Profile</div>
              <div className="t-meta">Open risks per month</div>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="t-eyebrow">{riskTrend.at(-1)?.open ?? 0} open</span>
              <Link href="/risks" className="card-link-hint">View risks →</Link>
            </span>
          </div>
          <div className="card__body">
            <div className="chart">
              <svg viewBox="0 0 600 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="riskGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#b54322" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#b54322" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const max = Math.max(...riskTrend.map((d) => d.open), 1);
                  const step = riskTrend.length > 1 ? 600 / (riskTrend.length - 1) : 0;
                  const points = riskTrend.map((d, i) => {
                    const x = i * step;
                    const y = 130 - (d.open / max) * 90;
                    return `${x},${y}`;
                  });
                  const pathLine = `M${points.join(" L")}`;
                  const pathArea = `${pathLine} L600,140 L0,140 Z`;
                  return (
                    <>
                      <path d={pathArea} fill="url(#riskGrad)" />
                      <path d={pathLine} fill="none" stroke="#b54322" strokeWidth="2" />
                      <g fontFamily="JetBrains Mono" fontSize="10" fill="#8b93a3">
                        {riskTrend.map((d, i) => (
                          <text key={d.month} x={i * step} y="138">{d.month}</text>
                        ))}
                      </g>
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <div className="t-card-title">Budget Burn</div>
              <div className="t-meta">Cumulative $k spent</div>
            </div>
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="t-eyebrow">${budgetTrend.filter((d) => d.actual > 0).at(-1)?.actual ?? 0}k</span>
              <Link href="/costs" className="card-link-hint">View costs →</Link>
            </span>
          </div>
          <div className="card__body">
            <div className="chart">
              <svg viewBox="0 0 600 140" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="budGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0f7c6c" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#0f7c6c" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {(() => {
                  const data = budgetTrend.filter((d) => d.actual > 0);
                  const max = Math.max(...data.map((d) => d.actual), 1);
                  const step = data.length > 1 ? 600 / (data.length - 1) : 0;
                  const points = data.map((d, i) => {
                    const x = i * step;
                    const y = 130 - (d.actual / max) * 90;
                    return `${x},${y}`;
                  });
                  const pathLine = `M${points.join(" L")}`;
                  const pathArea = `${pathLine} L600,140 L0,140 Z`;
                  return (
                    <>
                      <path d={pathArea} fill="url(#budGrad)" />
                      <path d={pathLine} fill="none" stroke="#0f7c6c" strokeWidth="2" />
                      <g fontFamily="JetBrains Mono" fontSize="10" fill="#8b93a3">
                        {data.map((d, i) => (
                          <text key={d.month} x={i * step} y="138">{d.month}</text>
                        ))}
                      </g>
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>
        </section>
      </div>

      <details className="dashboard-details">
        <summary>Expand details</summary>
        {/* Upcoming milestones + Decisions Needed */}
        <div className="grid-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="card">
          <div className="card__header">
            <div>
              <div className="t-card-title">Upcoming Milestones</div>
              <div className="t-meta">Next 60 days · variance vs. baseline shown</div>
            </div>
            <Link href="/milestones" style={{ fontSize: "var(--text-sm)", color: "var(--color-accent-700)", textDecoration: "none", fontWeight: 500 }}>
              View all →
            </Link>
          </div>
          {kpis.upcomingMilestones.map((m) => {
            const variance = Math.ceil(
              (new Date(m.forecastDate).getTime() - new Date(m.plannedDate).getTime()) / 86_400_000
            );
            const pillCls =
              variance > 0 ? "pill pill--warn" :
              variance < 0 ? "pill pill--ok" :
              milestoneStatusPill[m.status] ?? "pill pill--neutral";
            const pillLabel =
              variance > 0 ? `+${variance}d` :
              variance < 0 ? `${variance}d` :
              "On track";
            return (
              <Link key={m.id} href="/milestones" className="list-row">
                <div>
                  <div className="list-row__primary">{m.name}</div>
                  <div className="list-row__secondary">{m.phase} phase</div>
                </div>
                <div className="list-row__date">{formatDate(m.forecastDate)}</div>
                <span className={pillCls}>{pillLabel}</span>
              </Link>
            );
          })}
        </section>

        <section className="card">
          <div className="card__header">
            <div>
              <div className="t-card-title">Decisions Needed</div>
              <div className="t-meta">Cycle approvals per document</div>
            </div>
            <Link href="/documents" style={{ fontSize: "var(--text-sm)", color: "var(--color-accent-700)", textDecoration: "none", fontWeight: 500 }}>
              View all →
            </Link>
          </div>
          {kpis.pendingDocs.map((doc) => {
            const all = [...doc.reviewers, ...doc.approvers];
            const pendingCount = all.filter((d) => d.status === "pending").length;
            const pillCls =
              pendingCount >= 3 ? "pill pill--risk" :
              pendingCount >= 1 ? "pill pill--warn" :
              "pill pill--ok";
            return (
              <Link key={doc.id} href="/documents" className="list-row">
                <div>
                  <div className="list-row__primary">{doc.name}</div>
                  <div className="list-row__secondary">
                    {doc.type} · v{doc.version} · due {formatDate(doc.dueDate)}
                  </div>
                </div>
                <div className="approvers">
                  {all.slice(0, 5).map((d, i) => (
                    <div
                      key={i}
                      className={d.status === "approved" ? "approver approver--done" : "approver approver--pending"}
                      title={`${d.person} (${d.role}): ${d.status}`}
                    >
                      {d.initials}
                    </div>
                  ))}
                </div>
                <span className={pillCls}>
                  {pendingCount === 0 ? "Complete" : `${pendingCount} pending`}
                </span>
              </Link>
            );
          })}
        </section>
        </div>
      </details>
    </>
  );
}

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
import { useEffect, useState } from "react";
import "@/app/styles/dashboard.css";
import { getKpis, budgetTrend, riskTrend } from "@/lib/mockData";
import { useProject } from "@/components/projects/project-provider";
import { useEntityStore } from "@/lib/stores/entity-store";
import { computeProjectEvm } from "@/lib/domain/evm-project";
import { evmCoverage, effectiveStatusDate } from "@/lib/domain/evm-coverage";
import { calculateForecastDate } from "@/lib/domain/delivery-truth";
import { daysBetween } from "@/lib/domain/dates";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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

// Phase progress shown as 6 segments in the reference; pull live values
// from the existing PhaseProgress data source via the mockData export.
const PHASES = [
  { key: "p1", name: "Initiation", pct: 100, state: "done" },
  { key: "p2", name: "Design",     pct: 90,  state: "done" },
  { key: "p3", name: "Config",     pct: 45,  state: "active" },
  { key: "p4", name: "Testing",    pct: 0,   state: "pending" },
  { key: "p5", name: "Training",   pct: 0,   state: "pending" },
  { key: "p6", name: "Go-Live",    pct: 0,   state: "pending" },
] as const;

const SETUP_REVIEW_TOUR_KEY = "aivello_pending_setup_review_v1";
const DASHBOARD_STATUS_DATE = "2026-05-19";

// ─── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { activeProjectId, activeProject } = useProject();
  const kpis = getKpis(activeProjectId);
  const charters = useEntityStore((s) => s.charters);
  const tasks = useEntityStore((s) => s.tasks);
  const costLines = useEntityStore((s) => s.costLines);
  const milestones = useEntityStore((s) => s.milestones);
  const charter  = charters.find((c) => c.projectId === activeProjectId);
  const [showSetupReview, setShowSetupReview] = useState(false);

  useEffect(() => {
    try {
      setShowSetupReview(sessionStorage.getItem(SETUP_REVIEW_TOUR_KEY) === activeProjectId);
    } catch {
      setShowSetupReview(false);
    }
  }, [activeProjectId]);

  function dismissSetupReview() {
    try {
      sessionStorage.removeItem(SETUP_REVIEW_TOUR_KEY);
    } catch {}
    setShowSetupReview(false);
  }

  // One schedule truth: same milestone-drift source as the Delivery Signals
  // page (calculateForecastDate), replacing the mock scheduleVariance that
  // contradicted it ("+7d At Risk" here vs "On target" there).
  const projectMilestones = milestones.filter((m) => m.projectId === activeProjectId);
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

  const projectTasks = tasks.filter((task) => task.projectId === activeProjectId);
  const projectCostLines = costLines.filter((line) => line.projectId === activeProjectId);
  // Coverage gate (CX-1 fix-it): with no cost lines, safeDiv fallbacks make
  // every index 1 → a fabricated "On track 100/100" on every fresh import.
  // No data, no score — name what's missing instead.
  const coverage = evmCoverage({ costLineCount: projectCostLines.length, taskCount: projectTasks.length });
  const evm = coverage.ready
    ? computeProjectEvm({
        costLines: projectCostLines,
        plannedCurve: budgetTrend.map((point) => ({ month: point.month, planned: point.planned })),
        tasks: projectTasks,
        projectStart: activeProject.startDate,
        statusDate: effectiveStatusDate(activeProject.startDate, DASHBOARD_STATUS_DATE),
        curveYear: new Date(`${activeProject.startDate}T00:00:00`).getFullYear(),
      })
    : null;
  const coverageHint = `Add ${coverage.missing.join(" and ")} to activate the verdict.`;
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
  const fmtM = (v: number) => `$${(v / 1_000_000).toFixed(2)}M`;

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

      <section className="executive-verdict" aria-label="Executive verdict">
        <div>
          <div className="executive-verdict__label">Executive Verdict</div>
          <div className="executive-verdict__title">{evm ? evm.verdict.headline : "Verdict pending"}</div>
          <p className="executive-verdict__copy">
            {evm
              ? evm.verdict.reason
              : `${coverageHint} The score is computed from real delivery data — never hand-set.`}
          </p>
        </div>
        <span className={verdictPill}>{evm ? `${evm.verdict.score}/100 confidence` : "Pending data"}</span>
      </section>

      {/* KPI grid */}
      <div className="kpi-grid">
        <div className={`kpi ${scheduleKpiAccent}`}>
          <div className="kpi__label">Schedule Health</div>
          <div className="kpi__value-row">
            <span className="t-kpi-value kpi__value">{scheduleOnTrack ? "On Track" : "At Risk"}</span>
          </div>
          <div className="kpi__sub">{scheduleVarianceLabel}</div>
          <KpiSparkline />
        </div>

        <div className={`kpi ${riskKpiAccent}`}>
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
          </div>
          <KpiSparkline />
        </div>

        <div className={`kpi ${budgetKpiAccent}`}>
          <div className="kpi__label">Budget Utilised</div>
          <div className="kpi__value-row">
            <span className="t-kpi-value kpi__value">{kpis.budgetPct}%</span>
          </div>
          <div className="kpi__sub">
            <strong>${(kpis.latestActualK / 1000).toFixed(2)}M</strong> of ${(kpis.totalBudgetK / 1000).toFixed(1)}M
          </div>
          <KpiSparkline />
        </div>

        <div className="kpi kpi--info">
          <div className="kpi__label">Days to Go-Live</div>
          <div className="kpi__value-row">
            <span className="t-kpi-value kpi__value">{kpis.daysToGoLive}</span>
          </div>
          <div className="kpi__sub">Target <strong>{formatDate(activeProject.goLiveDate)}</strong></div>
          <KpiSparkline />
        </div>
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
        <section className="card">
          <div className="card__header">
            <div>
              <div className="t-card-title">Project Phase Progress</div>
              <div className="t-meta">6-phase GAMP 5 lifecycle · {PHASES.reduce((s, p) => s + p.pct, 0) / PHASES.length | 0}% overall</div>
            </div>
            <span className="pill pill--info">Phase 3 of 6</span>
          </div>
          <div className="card__body">
            <div className="phase-tracker">
              {PHASES.map((p) => (
                <div
                  key={p.key}
                  className={`phase phase--${p.state}`}
                >
                  <div className="phase__fill" style={{ width: `${p.pct}%` }} />
                  <div className="phase__name">{p.name}</div>
                  <div className="phase__pct">{p.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card__header">
            <div className="t-card-title">Confidence drivers</div>
            <span className={verdictPill}>{evm ? evm.verdict.headline : "Pending data"}</span>
          </div>
          <div className="health">
            <div>
              <span className="health__score" style={{ color: verdictToneVar }}>{evm ? evm.verdict.score : "—"}</span>
              <span className="health__score-max"> / 100</span>
            </div>
            <div className="health__bar">
              <div
                className="health__bar-fill"
                style={{
                  width: `${evm ? evm.verdict.score : 0}%`,
                  background: verdictToneVar,
                }}
              />
            </div>
          </div>
          {evm ? (
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
            <span className="t-eyebrow">{riskTrend.at(-1)?.open ?? 0} open</span>
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
            <span className="t-eyebrow">${budgetTrend.filter((d) => d.actual > 0).at(-1)?.actual ?? 0}k</span>
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

function KpiSparkline() {
  return (
    <div className="kpi-trend" aria-hidden="true">
      <svg viewBox="0 0 120 28" preserveAspectRatio="none">
        <path d="M2 22 C18 18 26 20 40 14 S66 8 82 12 104 10 118 4" />
      </svg>
    </div>
  );
}

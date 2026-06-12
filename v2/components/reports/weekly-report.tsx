"use client";

import { useMemo } from "react";
import { Printer, Download, AlertTriangle, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import { useProject } from "@/components/projects/project-provider";
import { useProjectEvm } from "@/lib/hooks/use-project-evm";
import {
  buildWeeklyReportData,
  daysBetween,
  fmtReportDate,
  type WeeklyReportData,
} from "@/lib/reports/report-data";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";

function slugFile(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "project";
}

function scoreBandStyles(score: number) {
  if (score >= 15) return "bg-rose-50 text-rose-700 border border-rose-200";
  if (score >= 8) return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-emerald-50 text-emerald-700 border border-emerald-200";
}

function exportExcel(data: WeeklyReportData) {
  const wb = XLSX.utils.book_new();

  const summaryRows = [
    ["AivelloStudio - Weekly Status Report"],
    ["Project", data.project.name],
    ["Client", data.project.client],
    ["Phase", data.project.phase],
    ["Report Date", data.reportWeek],
    [],
    ["KPI", "Value"],
    ["Schedule Health", data.scheduleHealth],
    ["Open Risks", data.openRisks.length],
    ["High Risks", data.highRisks.length],
    ["Budget Utilised", data.budget.label],
    ["Days to Go-Live", data.daysToGoLive],
    ["Budget Evidence", data.budget.detail],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), "Summary");

  const msHeaders = ["ID", "Milestone", "Phase", "Status", "Planned", "Forecast", "Variance (days)"];
  const msRows = data.upcomingMs.map((m) => [
    m.id,
    m.name,
    m.phase,
    m.status,
    fmtReportDate(m.plannedDate),
    fmtReportDate(m.forecastDate),
    daysBetween(m.plannedDate, m.forecastDate),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([msHeaders, ...msRows]), "Milestones (Next 2 Weeks)");

  const riskHeaders = ["ID", "Risk", "Category", "P", "I", "Score", "Owner", "Mitigation"];
  const riskRows = data.openRisks.map((r) => [r.id, r.title, r.category, r.probability, r.impact, r.score, r.owner, r.mitigation]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([riskHeaders, ...riskRows]), "Open Risks");

  const decHeaders = ["Document", "Type", "Person", "Role"];
  const decRows = data.pendingDecisions.map((d) => [d.docTitle, d.docType, d.person, d.role]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([decHeaders, ...decRows]), "Decisions Needed");

  const taskHeaders = ["ID", "Task", "Workstream", "Priority", "Owner", "Due", "Status", "Progress %"];
  const taskRows = data.upcomingTasks.map((t) => [t.id, t.name, t.workstream, t.priority, t.owner, fmtReportDate(t.dueDate), t.status, t.progress]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([taskHeaders, ...taskRows]), "Tasks (Next 2 Weeks)");

  const evidenceHeaders = ["Report claim", "Source evidence", "Source page"];
  const evidenceRows = data.evidenceRows.map((row) => [row.claim, row.source, row.route]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([evidenceHeaders, ...evidenceRows]), "Evidence Trail");

  XLSX.writeFile(wb, `AivelloStudio_WeeklyReport_${slugFile(data.project.code ?? data.project.name)}.xlsx`);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 print:break-inside-avoid">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
        {title}
      </h3>
      {children}
    </section>
  );
}

const msStatusStyles: Record<string, string> = {
  complete: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  "in-progress": "bg-blue-50 text-blue-700 border border-blue-200",
  "at-risk": "bg-rose-50 text-rose-700 border border-rose-200",
  pending: "bg-muted text-muted-foreground",
};

export function WeeklyReport() {
  const { activeProject } = useProject();
  const milestones = useEntityStore((state) => state.milestones);
  const tasks = useEntityStore((state) => state.tasks);
  const risks = useEntityStore((state) => state.risks);
  const documents = useEntityStore((state) => state.documents);
  const costLines = useEntityStore((state) => state.costLines);
  const decisionRecords = useEntityStore((state) => state.decisionRecords);
  const issues = useEntityStore((state) => state.issues);
  const evm = useProjectEvm();

  const data = useMemo(
    () => buildWeeklyReportData({ project: activeProject, milestones, tasks, risks, documents, costLines, decisionRecords, issues, evm }),
    [activeProject, milestones, tasks, risks, documents, costLines, decisionRecords, issues, evm]
  );

  const healthColor =
    data.scheduleHealth === "Green" ? "text-green-600" :
    data.scheduleHealth === "Amber" ? "text-amber-600" :
    "text-rose-600";
  const budgetColor =
    !data.budget.ready || data.budget.burnPct === null ? "text-amber-600" :
    data.budget.burnPct > 85 ? "text-rose-600" :
    data.budget.burnPct > 60 ? "text-amber-600" :
    "text-foreground";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 print:hidden">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          Print / Save PDF
        </button>
        <button
          onClick={() => exportExcel(data)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export Excel
        </button>
        <span className="text-[10px] text-muted-foreground ml-2">
          6-sheet workbook: Summary · Milestones · Risks · Decisions · Tasks · Evidence
        </span>
      </div>

      <div
        id="weekly-report"
        className="rounded-lg border border-border bg-card shadow-sm p-6 space-y-6 print:shadow-none print:border-0 print:p-0 print:rounded-none"
      >
        <div className="flex items-start justify-between border-b border-border pb-4 print:pb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AivelloStudio</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Weekly Status Report</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{data.project.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{data.project.phase} · {data.project.client}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-0.5">
            <p className="font-semibold text-foreground">{data.reportWeek}</p>
            <p>Go-Live: {fmtReportDate(data.project.goLiveDate)}</p>
            <p>Methodology: {data.project.methodology}</p>
          </div>
        </div>

        <div className="report-summary print:break-inside-avoid">
          <div className="report-verdict">
            <p className="report-verdict__label">Executive readout</p>
            <h3 className="report-verdict__title">
              {data.scheduleHealth === "Red" ? "Leadership attention needed" : "Project story is traceable"}
            </h3>
            <p className="report-verdict__body">
              The weekly status is backed by source records from milestones, risks, documents, costs, and tasks. Use the evidence trail before sending the report to SteerCo.
            </p>
          </div>

          <div className="report-evidence">
            <div className="report-evidence__head">
              <h3 className="report-evidence__title">Evidence trail</h3>
              <span className="report-evidence__meta">Backtrace to source pages</span>
            </div>
            <div className="report-evidence__list">
              {data.evidenceRows.map((row) => (
                <div key={row.claim} className="report-evidence__row">
                  <span className="report-evidence__claim">{row.claim}</span>
                  <span className="report-evidence__source">{row.source}</span>
                  <a className="report-evidence__link print:hidden" href={row.route}>{row.label}</a>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Section title="Headline Metrics">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Schedule Health", value: data.scheduleHealth, sub: "RAG status", color: healthColor },
              { label: "Days to Go-Live", value: data.daysToGoLive, sub: fmtReportDate(data.project.goLiveDate), color: "text-foreground" },
              { label: "Open Risks", value: data.openRisks.length, sub: `${data.highRisks.length} high`, color: data.openRisks.length > 3 ? "text-rose-600" : "text-foreground" },
              { label: "Budget Utilised", value: data.budget.label, sub: data.budget.detail, color: budgetColor },
              { label: "Decisions Pending", value: data.pendingDecisions.length, sub: "across all docs", color: data.pendingDecisions.length > 0 ? "text-amber-600" : "text-foreground" },
              { label: "Tasks In Flight", value: data.tasksInFlight.length, sub: `${data.blockedTasks.length} blocked`, color: "text-foreground" },
            ].map((k) => (
              <div key={k.label} className="rounded-md border border-border bg-muted/20 px-3 py-2.5 print:border-border">
                <p className={cn("text-xl font-bold tabular-nums", k.color)}>{k.value}</p>
                <p className="text-[10px] font-semibold text-foreground mt-0.5">{k.label}</p>
                <p className="text-[10px] text-muted-foreground">{k.sub}</p>
              </div>
            ))}
          </div>
        </Section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-2">
          <Section title="This Week (completed / due)">
            {data.thisWeekMs.length === 0 && data.thisWeekTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No milestones or tasks fell due this week. The weekly brief stays quiet when delivery has no new commitments to report.
              </p>
            ) : (
              <div className="space-y-2">
                {data.thisWeekMs.map((m) => (
                  <div key={m.id} className="flex items-start gap-2 rounded-md border border-border px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground leading-tight truncate">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.phase} · {fmtReportDate(m.forecastDate)}</p>
                    </div>
                    <span className={cn("ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold shrink-0", msStatusStyles[m.status])}>
                      {m.status}
                    </span>
                  </div>
                ))}
                {data.thisWeekTasks.map((t) => (
                  <div key={t.id} className="flex items-start gap-2 rounded-md border border-border px-3 py-2">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-green-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground leading-tight truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.workstream} · {t.owner}</p>
                    </div>
                    <span className="ml-auto rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-700 shrink-0">
                      Complete
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title={data.nextWindowLabel}>
            {data.upcomingMs.length === 0 && data.upcomingTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Nothing due in the next 14 days. This gives the PM space to work ahead before the next delivery checkpoint.
              </p>
            ) : (
              <div className="space-y-2">
                {data.upcomingMs.map((m) => {
                  const variance = daysBetween(m.plannedDate, m.forecastDate);
                  return (
                    <div key={m.id} className="flex items-start gap-2 rounded-md border border-border px-3 py-2">
                      <Clock className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground leading-tight truncate">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground">{m.phase} · Due {fmtReportDate(m.forecastDate)}</p>
                      </div>
                      {variance > 0 && (
                        <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700 shrink-0">
                          +{variance}d
                        </span>
                      )}
                    </div>
                  );
                })}
                {data.upcomingTasks.map((t) => (
                  <div key={t.id} className="flex items-start gap-2 rounded-md border border-border px-3 py-2">
                    <Clock className="h-3.5 w-3.5 mt-0.5 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground leading-tight truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.workstream} · {t.owner} · Due {fmtReportDate(t.dueDate)}</p>
                    </div>
                    <span className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold shrink-0",
                      t.priority === "Critical" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                      t.priority === "High" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Top Open Risks">
            {data.openRisks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No open risks. The report can stay focused on progress and upcoming decisions.
              </p>
            ) : (
              <div className="rounded-md border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-1.5 text-center w-12">Score</th>
                      <th className="px-3 py-1.5 text-left">Risk</th>
                      <th className="px-3 py-1.5 text-center w-12">Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.openRisks.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 text-center">
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums", scoreBandStyles(r.score))}>
                            {r.score}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-foreground leading-tight">{r.title}</p>
                          <p className="text-[10px] text-muted-foreground">{r.category} · P{r.probability}xI{r.impact}</p>
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{r.owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Decisions Needed">
            {data.pendingDecisions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No pending decisions. Governance is not waiting on approvals for this reporting cycle.
              </p>
            ) : (
              <div className="rounded-md border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-1.5 text-left">Document</th>
                      <th className="px-3 py-1.5 text-left">Person</th>
                      <th className="px-3 py-1.5 text-left w-20">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.pendingDecisions.map((d) => (
                      <tr key={d.id}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-foreground leading-tight">{d.docTitle}</p>
                          <span className="text-[9px] text-muted-foreground">{d.docType}</span>
                        </td>
                        <td className="px-3 py-2 text-foreground">{d.person}</td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                            d.role === "Approver" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-muted text-muted-foreground"
                          )}>
                            {d.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        </div>

        <div className="border-t border-border pt-3 flex items-center justify-between text-[10px] text-muted-foreground print:pt-2">
          <span>Generated by AivelloStudio · {data.reportWeek}</span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Confidential - for internal project use only
          </span>
        </div>
      </div>
    </div>
  );
}

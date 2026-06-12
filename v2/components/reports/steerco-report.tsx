"use client";

import { useMemo } from "react";
import { Printer, Download, ChevronRight, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import { useProject } from "@/components/projects/project-provider";
import { useProjectEvm } from "@/lib/hooks/use-project-evm";
import {
  buildSteerCoReportData,
  daysBetween,
  fmtReportDate,
  type Rag,
  type SteerCoReportData,
} from "@/lib/reports/report-data";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";

function slugFile(value: string) {
  return value.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "project";
}

const ragBg: Record<Rag, string> = {
  Green: "bg-green-500",
  Amber: "bg-amber-500",
  Red: "bg-rose-500",
};
const ragBorder: Record<Rag, string> = {
  Green: "border-green-200 bg-green-50",
  Amber: "border-amber-200 bg-amber-50",
  Red: "border-rose-200 bg-rose-50",
};
const ragText: Record<Rag, string> = {
  Green: "text-green-700",
  Amber: "text-amber-700",
  Red: "text-rose-700",
};

function RagDot({ rag }: { rag: Rag }) {
  return <span className={cn("inline-block h-3 w-3 rounded-full shrink-0", ragBg[rag])} />;
}

function RagCard({ label, rag, detail }: { label: string; rag: Rag; detail: string }) {
  return (
    <div className={cn("rounded-lg border p-3 space-y-1", ragBorder[rag])}>
      <div className="flex items-center gap-2">
        <RagDot rag={rag} />
        <span className="text-xs font-bold text-foreground">{label}</span>
        <span className={cn("ml-auto text-xs font-bold", ragText[rag])}>{rag}</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">{detail}</p>
    </div>
  );
}

function scorePill(score: number) {
  if (score >= 15) return "bg-rose-50 text-rose-700 border border-rose-200";
  if (score >= 8) return "bg-amber-50 text-amber-700 border border-amber-200";
  return "bg-emerald-50 text-emerald-700 border border-emerald-200";
}

function exportSteerCoExcel(data: SteerCoReportData) {
  const wb = XLSX.utils.book_new();

  const budgetDetail = data.budget.ready
    ? `${data.budget.label} of $${data.budget.totalBudgetK}k spent`
    : data.budget.detail;
  const summaryRows = [
    ["AivelloStudio - Steering Committee Report"],
    ["Project", data.project.name],
    ["Client", data.project.client],
    ["Meeting Date", data.meetingDate],
    [],
    ["RAG Dashboard", "Status", "Detail"],
    ["Overall", data.overallRag, ""],
    ["Schedule", data.scheduleRag, `Variance: ${data.scheduleVariance >= 0 ? "+" : ""}${data.scheduleVariance} days`],
    ["Budget", data.budgetRag, budgetDetail],
    ["Quality", data.qualityRag, `${data.escalatedRisks.length} escalated risks`],
    ["Scope", data.scopeRag, `${data.criticalNotStarted.length} critical tasks not started`],
    [],
    ["Days to Go-Live", data.daysToGoLive],
    ["Milestones Complete", `${data.completedMs.length}/${data.milestoneCount}`],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), "SteerCo Summary");

  const msHeaders = ["Milestone", "Phase", "Status", "Planned", "Forecast", "Variance (days)"];
  const msRows = data.keyMilestones.map((m) => [
    m.name,
    m.phase,
    m.status,
    fmtReportDate(m.plannedDate),
    fmtReportDate(m.forecastDate),
    daysBetween(m.plannedDate, m.forecastDate),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([msHeaders, ...msRows]), "Key Milestones");

  const decHeaders = ["Decision", "Type", "Person", "Source Page"];
  const decRows = data.steerCoDecisions.map((d) => [d.title, d.type, d.person, d.route]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([decHeaders, ...decRows]), "Decisions Needed");

  const riskHeaders = ["Risk", "Category", "Score", "P", "I", "Owner", "Mitigation"];
  const riskRows = data.escalatedRisks.map((r) => [r.title, r.category, r.score, r.probability, r.impact, r.owner, r.mitigation]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([riskHeaders, ...riskRows]), "Escalated Risks");

  XLSX.writeFile(wb, `AivelloStudio_SteerCo_${slugFile(data.project.code ?? data.project.name)}.xlsx`);
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

export function SteerCoReport() {
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
    () => buildSteerCoReportData({ project: activeProject, milestones, tasks, risks, documents, costLines, decisionRecords, issues, evm }),
    [activeProject, milestones, tasks, risks, documents, costLines, decisionRecords, issues, evm]
  );

  const budgetDetail = data.budget.ready
    ? `$${data.budget.totalActualK}k of $${data.budget.totalBudgetK}k (${data.budget.label}) spent`
    : data.budget.detail;

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
          onClick={() => exportSteerCoExcel(data)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export Excel
        </button>
        <span className="text-[10px] text-muted-foreground ml-2">
          4-sheet workbook: SteerCo Summary · Key Milestones · Decisions · Escalated Risks
        </span>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm p-6 space-y-6 print:shadow-none print:border-0 print:p-0 print:rounded-none">
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">AivelloStudio</span>
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Steering Committee Report</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{data.project.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{data.project.phase} · {data.project.client}</p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-xs text-muted-foreground">Overall Status</span>
              <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold", ragBorder[data.overallRag], ragText[data.overallRag])}>
                <RagDot rag={data.overallRag} />
                {data.overallRag}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Meeting: {data.meetingDate}</p>
            <p className="text-xs text-muted-foreground">Go-Live: {fmtReportDate(data.project.goLiveDate)} · <strong>{data.daysToGoLive} days</strong></p>
          </div>
        </div>

        <Section title="RAG Dashboard">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <RagCard
              label="Schedule"
              rag={data.scheduleRag}
              detail={data.scheduleVariance === 0 ? "All milestones on track" : `Next milestone ${data.scheduleVariance > 0 ? `+${data.scheduleVariance}d late` : "on track"}`}
            />
            <RagCard label="Budget" rag={data.budgetRag} detail={budgetDetail} />
            <RagCard
              label="Quality / Risk"
              rag={data.qualityRag}
              detail={`${data.escalatedRisks.length} risk${data.escalatedRisks.length !== 1 ? "s" : ""} requiring SteerCo awareness`}
            />
            <RagCard
              label="Scope"
              rag={data.scopeRag}
              detail={data.criticalNotStarted.length === 0 ? "All critical tasks in flight" : `${data.criticalNotStarted.length} critical task${data.criticalNotStarted.length !== 1 ? "s" : ""} not yet started`}
            />
          </div>
        </Section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-2">
          <Section title="Critical Path Milestones">
            <div className="rounded-md border border-border overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-1.5 text-left">Milestone</th>
                    <th className="px-3 py-1.5 text-center w-20">Forecast</th>
                    <th className="px-3 py-1.5 text-center w-16">Var.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.keyMilestones.map((m) => {
                    const variance = daysBetween(m.plannedDate, m.forecastDate);
                    return (
                      <tr key={m.id}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-foreground leading-tight">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground">{m.phase}</p>
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{fmtReportDate(m.forecastDate)}</td>
                        <td className="px-3 py-2 text-center">
                          {variance === 0 ? (
                            <span className="text-green-600 font-semibold text-[10px]">On plan</span>
                          ) : (
                            <span className={cn("font-semibold text-[10px]", variance > 0 ? "text-amber-600" : "text-green-600")}>
                              {variance > 0 ? `+${variance}d` : `${variance}d`}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 mt-1">
              <span>{data.completedMs.length} of {data.milestoneCount} milestones complete</span>
              <span>{data.daysToGoLive} days to go-live</span>
            </div>
          </Section>

          <Section title="Phase Completion">
            <div className="space-y-2">
              {data.phaseCompletion.map((phase) => (
                <div key={phase.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-medium text-foreground">{phase.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] tabular-nums text-muted-foreground">{phase.pct}%</span>
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                        phase.status === "complete" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        phase.status === "active" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {phase.status === "complete" ? "Done" : phase.status === "active" ? "Active" : "Pending"}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full",
                        phase.status === "complete" ? "bg-green-500" :
                        phase.status === "active" ? "bg-primary" :
                        "bg-muted-foreground/20"
                      )}
                      style={{ width: `${phase.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Risks Requiring SteerCo Awareness">
            {data.escalatedRisks.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No high-score risks currently open. Leadership can focus on decisions instead of exception management.
              </p>
            ) : (
              <div className="rounded-md border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/40 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-1.5 text-center w-12">Score</th>
                      <th className="px-3 py-1.5 text-left">Risk</th>
                      <th className="px-3 py-1.5 text-left">Mitigation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.escalatedRisks.map((r) => (
                      <tr key={r.id}>
                        <td className="px-3 py-2 text-center">
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", scorePill(r.score))}>
                            {r.score}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <p className="font-medium text-foreground leading-tight">{r.title}</p>
                          <p className="text-[10px] text-muted-foreground">{r.category} · P{r.probability}xI{r.impact} · {r.owner}</p>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-[10px] leading-snug">{r.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>

          <Section title="Decisions Required from SteerCo">
            {data.steerCoDecisions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No approvals or decision records are waiting on steering committee action.
              </p>
            ) : (
              <div className="space-y-2">
                {data.steerCoDecisions.map((decision) => (
                  <a key={decision.id} href={decision.route} className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 hover:bg-amber-100 transition-colors">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{decision.title}</p>
                      <p className="text-[10px] text-muted-foreground">{decision.type} · Pending from {decision.person}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}

            <div className="mt-3">
              <p className="text-[10px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Budget Evidence</p>
              <div className="rounded-md border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-3 py-1.5 font-medium">Approved budget</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                        {data.budget.ready ? `$${data.budget.totalBudgetK}k` : "Pending"}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-medium">Actual spend</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-foreground">
                        {data.budget.ready ? `$${data.budget.totalActualK}k` : data.budget.detail}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-medium">Budget confidence</td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-foreground">{data.budget.label}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Section>
        </div>

        <div className="border-t border-border pt-3 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>AivelloStudio · Steering Committee Report · {data.meetingDate}</span>
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Strictly Confidential - Steering Committee Use Only
          </span>
        </div>
      </div>
    </div>
  );
}

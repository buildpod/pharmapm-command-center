import type {
  CostLine,
  DecisionRecord,
  Document,
  Issue,
  Milestone,
  Project,
  Risk,
  Task,
} from "@/lib/mockData";
import type { EvmCoverage } from "@/lib/domain/evm-coverage";
import type { ProjectEvm } from "@/lib/domain/evm-project";
import type { AuditAction } from "@/lib/stores/audit";
import type { RebaselineEvent } from "@/lib/stores/baseline-store";
import { computeStatusIntegrity } from "../domain/status-integrity";

const BASE_ROUTE = "/pharmapm-command-center/v2";
const DAY_MS = 86_400_000;

export type Rag = "Green" | "Amber" | "Red";

export interface ReportEvmContext {
  coverage: EvmCoverage;
  evm: ProjectEvm | null;
  statusDate: string;
}

export interface ReportDataInput {
  project: Project;
  milestones: Milestone[];
  tasks: Task[];
  risks: Risk[];
  documents: Document[];
  costLines: CostLine[];
  decisionRecords: DecisionRecord[];
  issues: Issue[];
  evm: ReportEvmContext;
  // O9.2 — the project's audit log, so the report can include the decisions /
  // slips ACCEPTED this period, not just current state. Optional for callers
  // that don't supply it.
  auditLog?: AuditAction[];
  // O8.4 — re-baseline history (who/when/why the committed go-live moved), so
  // the report shows baseline changes rather than hiding them. Optional.
  rebaselines?: RebaselineEvent[];
}

export interface ReportBudgetSummary {
  ready: boolean;
  burnPct: number | null;
  totalActualK: number;
  totalBudgetK: number;
  label: string;
  detail: string;
}

export interface PendingDocumentDecision {
  id: string;
  docId: string;
  docTitle: string;
  docType: string;
  person: string;
  role: string;
}

export interface EvidenceRow {
  claim: string;
  source: string;
  route: string;
  label: string;
}

// O9.2 — a governed change accepted this period (from the audit log): a slip
// accepted, a modelled over-charge, an owner-absence impact, etc.
export interface AcceptedChange {
  id: string;
  when: string;
  summary: string;
}

export interface WeeklyReportData {
  project: Project;
  reportWeek: string;
  nextWindowLabel: string;
  daysToGoLive: number;
  scheduleHealth: Rag;
  scheduleVariance: number;
  budget: ReportBudgetSummary;
  thisWeekMs: Milestone[];
  upcomingMs: Milestone[];
  thisWeekTasks: Task[];
  upcomingTasks: Task[];
  openRisks: Risk[];
  highRisks: Risk[];
  pendingDecisions: PendingDocumentDecision[];
  tasksInFlight: Task[];
  blockedTasks: Task[];
  evidenceRows: EvidenceRow[];
  // O9.2 — decisions/slips accepted this period (from the audit log).
  acceptedChanges: AcceptedChange[];
  // O9.3 — when reported progress may be overstated, the report carries the
  // integrity caveat so the verdict isn't read at face value. null = no caveat.
  integrityCaveat: string | null;
  // O8.4 — re-baseline events (who/when/why the committed go-live moved).
  rebaselines: RebaselineEvent[];
}

export interface SteerCoDecisionItem {
  id: string;
  title: string;
  type: string;
  person: string;
  route: string;
}

export interface PhaseCompletion {
  name: string;
  pct: number;
  status: "complete" | "active" | "pending";
}

export interface SteerCoReportData {
  project: Project;
  meetingDate: string;
  milestoneCount: number;
  daysToGoLive: number;
  scheduleRag: Rag;
  budgetRag: Rag;
  qualityRag: Rag;
  scopeRag: Rag;
  overallRag: Rag;
  scheduleVariance: number;
  budget: ReportBudgetSummary;
  keyMilestones: Milestone[];
  completedMs: Milestone[];
  phaseCompletion: PhaseCompletion[];
  steerCoDecisions: SteerCoDecisionItem[];
  escalatedRisks: Risk[];
  criticalNotStarted: Task[];
}

export interface WorkstreamReportData {
  project: Project;
  workstreams: string[];
  selectedWorkstream: string;
  projectTasks: Task[];
  wsTasks: Task[];
  total: number;
  complete: number;
  inProgress: number;
  blocked: number;
  notStarted: number;
  avgProgress: number;
  linkedMilestones: Milestone[];
  overdue: Task[];
  upcoming: Task[];
  uniqueExternal: Task[];
  wsRisks: Risk[];
  reportDate: string;
}

function scoped<T extends { projectId: string }>(items: T[], projectId: string): T[] {
  return items.filter((item) => item.projectId === projectId);
}

export function daysBetween(a: Date | string, b: Date | string): number {
  const da = typeof a === "string" ? new Date(`${a}T00:00:00`) : a;
  const db = typeof b === "string" ? new Date(`${b}T00:00:00`) : b;
  return Math.ceil((db.getTime() - da.getTime()) / DAY_MS);
}

function addDays(date: string, days: number): Date {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d;
}

export function fmtReportDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function route(path: string, focusId?: string): string {
  return `${BASE_ROUTE}${path}${focusId ? `?focus=${encodeURIComponent(focusId)}` : ""}`;
}

function buildBudgetSummary(input: ReportDataInput): ReportBudgetSummary {
  if (!input.evm.coverage.ready || !input.evm.evm) {
    const missing = input.evm.coverage.missing.join(" and ") || "project evidence";
    return {
      ready: false,
      burnPct: null,
      totalActualK: 0,
      totalBudgetK: 0,
      label: "Budget confidence pending",
      detail: `Add ${missing} before reporting budget confidence.`,
    };
  }

  const totalBudgetK = Math.round(input.evm.evm.snapshot.bac / 1000);
  const totalActualK = Math.round(input.evm.evm.snapshot.ac / 1000);
  const burnPct = totalBudgetK > 0 ? Math.round((totalActualK / totalBudgetK) * 100) : 0;
  return {
    ready: true,
    burnPct,
    totalActualK,
    totalBudgetK,
    label: `${burnPct}%`,
    detail: `$${totalActualK}k / $${totalBudgetK}k`,
  };
}

function pendingDocumentDecisions(documents: Document[]): PendingDocumentDecision[] {
  return documents.flatMap((doc) =>
    [...(doc.reviewers ?? []), ...(doc.approvers ?? [])]
      .filter((decision) => decision.status === "pending")
      .map((decision, index) => ({
        id: `${doc.id}-${decision.initials}-${decision.role}-${index}`,
        docId: doc.id,
        docTitle: doc.name,
        docType: doc.type,
        person: decision.person,
        role: decision.role,
      }))
  );
}

function scheduleSummary(milestones: Milestone[]): { health: Rag; variance: number; evidence?: Milestone } {
  const open = milestones
    .filter((m) => m.status !== "complete")
    .slice()
    .sort((a, b) => a.forecastDate.localeCompare(b.forecastDate));
  const evidence = open[0] ?? milestones.slice().sort((a, b) => b.forecastDate.localeCompare(a.forecastDate))[0];
  const variance = evidence ? daysBetween(evidence.plannedDate, evidence.forecastDate) : 0;
  const health: Rag = variance >= 5 ? "Red" : variance > 0 ? "Amber" : "Green";
  return { health, variance, evidence };
}

function buildEvidenceRows(data: Omit<WeeklyReportData, "evidenceRows">): EvidenceRow[] {
  const scheduleEvidence = data.upcomingMs[0] ?? data.thisWeekMs[0];
  return [
    {
      claim: `Schedule health is ${data.scheduleHealth}`,
      source: scheduleEvidence
        ? `${scheduleEvidence.name} is ${data.scheduleVariance >= 0 ? "+" : ""}${data.scheduleVariance} days vs plan`
        : `${data.project.name} has no milestone evidence yet`,
      route: route("/milestones/", scheduleEvidence?.id),
      label: "Open milestones",
    },
    {
      claim: `${data.openRisks.length} open risks`,
      source: `${data.openRisks.length} active risk records, ${data.highRisks.length} high`,
      route: route("/risks/"),
      label: "Open risks",
    },
    {
      claim: `${data.pendingDecisions.length} decisions pending`,
      source: "Pending document reviewers and approvers",
      route: route("/documents/"),
      label: "Open documents",
    },
    {
      claim: data.budget.ready ? `${data.budget.label} budget utilised` : data.budget.label,
      source: data.budget.ready
        ? `${data.project.name} cost evidence, ${data.budget.detail} actual`
        : data.budget.detail,
      route: route("/costs/"),
      label: "Open costs",
    },
    {
      claim: `${data.tasksInFlight.length} tasks in flight`,
      source: `${data.tasksInFlight.length + data.blockedTasks.length} active task records, ${data.blockedTasks.length} blocked`,
      route: route("/tasks/"),
      label: "Open tasks",
    },
  ];
}

export function buildWeeklyReportData(input: ReportDataInput): WeeklyReportData {
  const projectId = input.project.id;
  const milestones = scoped(input.milestones, projectId);
  const tasks = scoped(input.tasks, projectId);
  const risks = scoped(input.risks, projectId);
  const documents = scoped(input.documents, projectId);

  const statusDate = input.evm.statusDate;
  const today = new Date(`${statusDate}T00:00:00`);
  const weekStart = addDays(statusDate, -7);
  const nextWindow = addDays(statusDate, 14);
  const schedule = scheduleSummary(milestones);

  const thisWeekMs = milestones.filter((m) => {
    const d = new Date(`${m.forecastDate}T00:00:00`);
    return d >= weekStart && d <= today;
  });
  const upcomingMs = milestones
    .filter((m) => {
      const d = new Date(`${m.forecastDate}T00:00:00`);
      return d > today && d <= nextWindow && m.status !== "complete";
    })
    .sort((a, b) => a.forecastDate.localeCompare(b.forecastDate));
  const thisWeekTasks = tasks.filter((t) => {
    const d = new Date(`${t.dueDate}T00:00:00`);
    return d >= weekStart && d <= today && t.status === "Complete";
  });
  const upcomingTasks = tasks
    .filter((t) => {
      const d = new Date(`${t.dueDate}T00:00:00`);
      return d > today && d <= nextWindow && t.status !== "Complete";
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const openRisks = risks.filter((r) => r.status === "open").sort((a, b) => b.score - a.score);
  const tasksInFlight = tasks.filter((t) => t.status === "In Progress");
  const blockedTasks = tasks.filter((t) => t.status === "Blocked");

  // O9.2 — governed changes accepted this period, newest first (the audit log
  // is already capped + newest-first). Acceptance/model entries carry a note.
  const acceptedChanges: AcceptedChange[] = (input.auditLog ?? [])
    .filter((a) => a.projectId === projectId && (/^(Accepted|Modelled)\b/.test(a.note ?? "") || a.type === "cascade-apply"))
    .slice(0, 8)
    .map((a) => ({
      id: a.id,
      when: fmtReportDate(a.timestamp.slice(0, 10)),
      summary: a.note ?? `${a.type} · ${a.entityKind}`,
    }));

  // O9.3 — integrity caveat: when reported progress may be overstated, carry it
  // into the report so the score isn't taken at face value.
  const snapshot = input.evm.evm?.snapshot;
  const integrity = snapshot
    ? computeStatusIntegrity({
        percentComplete: snapshot.percentComplete,
        percentSpent: snapshot.percentSpent,
        cpi: snapshot.cpi,
        gatesTotal: milestones.length,
        gatesComplete: milestones.filter((m) => m.status === "complete").length,
      })
    : null;
  const integrityCaveat =
    integrity && integrity.band !== "consistent" ? integrity.flags.map((f) => f.message).join(" ") : null;

  const base: Omit<WeeklyReportData, "evidenceRows"> = {
    project: input.project,
    reportWeek: `Week of ${fmtReportDate(statusDate)}`,
    nextWindowLabel: `Next 2 Weeks (due by ${fmtReportDate(nextWindow.toISOString().slice(0, 10))})`,
    daysToGoLive: daysBetween(statusDate, input.project.goLiveDate),
    scheduleHealth: schedule.health,
    scheduleVariance: schedule.variance,
    budget: buildBudgetSummary(input),
    thisWeekMs,
    upcomingMs,
    thisWeekTasks,
    upcomingTasks,
    openRisks,
    highRisks: openRisks.filter((r) => r.score >= 15),
    pendingDecisions: pendingDocumentDecisions(documents),
    tasksInFlight,
    blockedTasks,
    acceptedChanges,
    integrityCaveat,
    rebaselines: input.rebaselines ?? [],
  };

  return { ...base, evidenceRows: buildEvidenceRows(base) };
}

function ragFromBudget(budget: ReportBudgetSummary): Rag {
  if (!budget.ready || budget.burnPct === null) return "Amber";
  return budget.burnPct > 85 ? "Red" : budget.burnPct > 70 ? "Amber" : "Green";
}

function phaseCompletion(milestones: Milestone[]): PhaseCompletion[] {
  const phases = Array.from(new Set(milestones.map((m) => m.phase)));
  return phases.map((name) => {
    const phaseMilestones = milestones.filter((m) => m.phase === name);
    const score = phaseMilestones.reduce((sum, m) => {
      if (m.status === "complete") return sum + 100;
      if (m.status === "in-progress") return sum + 50;
      if (m.status === "at-risk") return sum + 25;
      return sum;
    }, 0);
    const pct = phaseMilestones.length ? Math.round(score / phaseMilestones.length) : 0;
    return {
      name,
      pct,
      status: pct === 100 ? "complete" : pct > 0 ? "active" : "pending",
    };
  });
}

export function buildSteerCoReportData(input: ReportDataInput): SteerCoReportData {
  const projectId = input.project.id;
  const milestones = scoped(input.milestones, projectId);
  const tasks = scoped(input.tasks, projectId);
  const risks = scoped(input.risks, projectId);
  const documents = scoped(input.documents, projectId);
  const decisionRecords = scoped(input.decisionRecords, projectId);
  const schedule = scheduleSummary(milestones);
  const budget = buildBudgetSummary(input);
  const openHighRisks = risks.filter((r) => r.status === "open" && r.score >= 15);
  const escalatedRisks = risks
    .filter((r) => r.status === "open" && r.score >= 12)
    .sort((a, b) => b.score - a.score);
  const criticalNotStarted = tasks.filter((t) => t.priority === "Critical" && t.status === "Not Started");
  const qualityRag: Rag = openHighRisks.length >= 3 ? "Red" : openHighRisks.length >= 1 ? "Amber" : "Green";
  const scopeRag: Rag = criticalNotStarted.length >= 2 ? "Red" : criticalNotStarted.length >= 1 ? "Amber" : "Green";
  const budgetRag = ragFromBudget(budget);
  const overallRag: Rag =
    [schedule.health, budgetRag, qualityRag, scopeRag].includes("Red") ? "Red" :
    [schedule.health, budgetRag, qualityRag, scopeRag].includes("Amber") ? "Amber" : "Green";

  const pendingDocApprovals = documents.flatMap((doc) =>
    (doc.approvers ?? [])
      .filter((approver) => approver.status === "pending")
      .map((approver, index) => ({
        id: `${doc.id}-approver-${index}`,
        title: doc.name,
        type: doc.type,
        person: approver.person,
        route: route("/documents/", doc.id),
      }))
  );

  const pendingDecisionRecords = decisionRecords
    .filter((decision) => decision.status === "Pending")
    .map((decision) => ({
      id: decision.id,
      title: decision.title,
      type: "Decision log",
      person: decision.decidedBy,
      route: route("/decisions/", decision.id),
    }));

  return {
    project: input.project,
    meetingDate: fmtReportDate(input.evm.statusDate),
    milestoneCount: milestones.length,
    daysToGoLive: daysBetween(input.evm.statusDate, input.project.goLiveDate),
    scheduleRag: schedule.health,
    budgetRag,
    qualityRag,
    scopeRag,
    overallRag,
    scheduleVariance: schedule.variance,
    budget,
    keyMilestones: milestones
      .filter((m) => m.status !== "complete")
      .sort((a, b) => a.forecastDate.localeCompare(b.forecastDate))
      .slice(0, 4),
    completedMs: milestones.filter((m) => m.status === "complete"),
    phaseCompletion: phaseCompletion(milestones),
    steerCoDecisions: [...pendingDecisionRecords, ...pendingDocApprovals],
    escalatedRisks,
    criticalNotStarted,
  };
}

export function buildWorkstreamReportData(input: ReportDataInput, selectedWorkstream?: string): WorkstreamReportData {
  const projectId = input.project.id;
  const tasks = scoped(input.tasks, projectId);
  const milestones = scoped(input.milestones, projectId);
  const risks = scoped(input.risks, projectId);
  const workstreams = Array.from(new Set(tasks.map((t) => t.workstream))).sort();
  const selected = selectedWorkstream && workstreams.includes(selectedWorkstream)
    ? selectedWorkstream
    : workstreams[0] ?? "No workstream";
  const wsTasks = tasks.filter((t) => t.workstream === selected);
  const total = wsTasks.length;
  const complete = wsTasks.filter((t) => t.status === "Complete").length;
  const inProgress = wsTasks.filter((t) => t.status === "In Progress").length;
  const blocked = wsTasks.filter((t) => t.status === "Blocked").length;
  const notStarted = wsTasks.filter((t) => t.status === "Not Started").length;
  const avgProgress = total > 0 ? Math.round(wsTasks.reduce((s, t) => s + t.progress, 0) / total) : 0;
  const linkedMilestoneIds = new Set(wsTasks.map((t) => t.milestoneId).filter(Boolean));
  const linkedMilestones = milestones
    .filter((m) => linkedMilestoneIds.has(m.id))
    .sort((a, b) => a.forecastDate.localeCompare(b.forecastDate));
  const statusDate = input.evm.statusDate;
  const nextWindow = addDays(statusDate, 14).toISOString().slice(0, 10);
  const overdue = wsTasks.filter((t) => t.dueDate < statusDate && t.status !== "Complete");
  const upcoming = wsTasks
    .filter((t) => t.dueDate > statusDate && t.dueDate <= nextWindow && t.status !== "Complete")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const allMyDeps = wsTasks.flatMap((t) => t.dependsOn ?? []);
  const externalDeps = allMyDeps
    .map((depId) => tasks.find((t) => t.id === depId))
    .filter((t): t is Task => !!t && t.workstream !== selected);
  const uniqueExternal = Array.from(new Map(externalDeps.map((t) => [t.id, t])).values());
  const wsOwners = new Set(wsTasks.map((t) => t.owner));
  const wsRisks = risks.filter((r) => wsOwners.has(r.owner) && r.status === "open");

  return {
    project: input.project,
    workstreams,
    selectedWorkstream: selected,
    projectTasks: tasks,
    wsTasks,
    total,
    complete,
    inProgress,
    blocked,
    notStarted,
    avgProgress,
    linkedMilestones,
    overdue,
    upcoming,
    uniqueExternal,
    wsRisks,
    reportDate: statusDate,
  };
}

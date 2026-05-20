import type { CostLine, Document, Milestone, Project, Risk, Task } from "@/lib/mockData";
import { compare, daysBetween } from "./dates";

export const DEFAULT_TRUTH_DATE = "2026-05-19";

export type DeliveryTruthSeverity = "critical" | "high" | "medium" | "low";
export type DeliveryTruthTone = "rose" | "amber" | "blue" | "emerald" | "slate";
export type DeliveryTruthBand = "credible" | "watch" | "at-risk" | "unlikely" | "not-ready";

export type DeliveryTruthSignalKind =
  | "schedule-drift"
  | "cost-pressure"
  | "decision-debt"
  | "readiness-compression"
  | "blocked-work"
  | "risk-pressure";

export interface DeliveryTruthSource {
  kind: "milestone" | "task" | "risk" | "document" | "cost";
  id: string;
  label: string;
}

export interface DeliveryTruthSignal {
  id: string;
  kind: DeliveryTruthSignalKind;
  severity: DeliveryTruthSeverity;
  tone: DeliveryTruthTone;
  title: string;
  summary: string;
  whyItMatters: string;
  nextAction: string;
  sources: DeliveryTruthSource[];
  metric?: {
    label: string;
    value: string;
  };
}

export interface DeliveryDecisionOption {
  id: string;
  title: string;
  summary: string;
  ownerHint: string;
  tone: DeliveryTruthTone;
  signalKinds: DeliveryTruthSignalKind[];
}

export interface DeliveryTruthBudget {
  budgetK: number;
  actualK: number;
  burnPct: number;
  expectedElapsedPct: number;
  variancePct: number;
}

export interface DeliveryTruthCoverage {
  isReady: boolean;
  reasons: string[];
  counts: {
    milestones: number;
    tasks: number;
    risks: number;
    documents: number;
    costLines: number;
  };
}

export interface DeliveryTruthResult {
  confidenceScore: number;
  confidenceBand: DeliveryTruthBand;
  targetDate: string;
  forecastDate: string;
  scheduleDeltaDays: number;
  budget: DeliveryTruthBudget;
  coverage: DeliveryTruthCoverage;
  signals: DeliveryTruthSignal[];
  decisionOptions: DeliveryDecisionOption[];
}

export interface DeliveryTruthInput {
  project: Project;
  milestones: Milestone[];
  tasks: Task[];
  risks: Risk[];
  documents: Document[];
  costLines: CostLine[];
  currentDate?: string;
}

const severityRank: Record<DeliveryTruthSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const severityDeduction: Record<DeliveryTruthSeverity, number> = {
  critical: 18,
  high: 12,
  medium: 7,
  low: 3,
};

function projectOnly<T extends { projectId?: string }>(items: T[], projectId: string): T[] {
  return items.filter((item) => !item.projectId || item.projectId === projectId);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundPct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function isCompleteMilestone(milestone: Milestone): boolean {
  return milestone.status === "complete";
}

function isCompleteTask(task: Task): boolean {
  return task.status === "Complete" || task.progress >= 100;
}

function pendingDecisionCount(document: Document): number {
  return [...document.reviewers, ...document.approvers].filter((decision) => decision.status === "pending").length;
}

function source(kind: DeliveryTruthSource["kind"], id: string, label: string): DeliveryTruthSource {
  return { kind, id, label };
}

function toneForSeverity(severity: DeliveryTruthSeverity): DeliveryTruthTone {
  return severity === "critical" || severity === "high" ? "rose" : "amber";
}

function sortSignals(signals: DeliveryTruthSignal[]): DeliveryTruthSignal[] {
  return signals.slice().sort((a, b) => {
    const bySeverity = severityRank[b.severity] - severityRank[a.severity];
    if (bySeverity !== 0) return bySeverity;
    return a.title.localeCompare(b.title);
  });
}

function calculateForecastDate(project: Project, milestones: Milestone[]): string {
  const goLiveMilestone = milestones.find((milestone) => milestone.phase === "Go-Live" || milestone.name.toLowerCase().includes("go-live"));
  if (goLiveMilestone?.forecastDate) return goLiveMilestone.forecastDate;
  return milestones.reduce((latest, milestone) => (
    compare(latest, milestone.forecastDate) < 0 ? milestone.forecastDate : latest
  ), project.goLiveDate);
}

function buildScheduleSignal(project: Project, milestones: Milestone[], forecastDate: string): DeliveryTruthSignal | null {
  const drifted = milestones
    .filter((milestone) => !isCompleteMilestone(milestone))
    .map((milestone) => ({
      milestone,
      driftDays: daysBetween(milestone.plannedDate, milestone.forecastDate),
    }))
    .filter((item) => item.driftDays > 0)
    .sort((a, b) => b.driftDays - a.driftDays);

  const goLiveDelta = daysBetween(project.goLiveDate, forecastDate);
  const maxDrift = drifted[0]?.driftDays ?? 0;
  if (goLiveDelta <= 0 && maxDrift <= 0) return null;

  const severity: DeliveryTruthSeverity =
    goLiveDelta > 0 ? "critical" :
    maxDrift >= 10 ? "high" :
    maxDrift >= 5 ? "medium" :
    "low";

  const lead = drifted[0]?.milestone;
  return {
    id: "schedule-drift",
    kind: "schedule-drift",
    severity,
    tone: toneForSeverity(severity),
    title: goLiveDelta > 0 ? "Delivery date is moving past the promise" : "Near-term milestones are drifting",
    summary: goLiveDelta > 0
      ? `Forecast is ${goLiveDelta} day${goLiveDelta === 1 ? "" : "s"} later than the target go-live.`
      : `${lead?.name ?? "A milestone"} is forecasting ${maxDrift} day${maxDrift === 1 ? "" : "s"} later than planned.`,
    whyItMatters: "Schedule drift compresses testing, training, documentation, and sponsor decision time before go-live.",
    nextAction: "Review whether to protect the go-live date by changing scope, adding capacity, or moving the target date.",
    sources: drifted.slice(0, 4).map((item) => source("milestone", item.milestone.id, item.milestone.name)),
    metric: {
      label: goLiveDelta > 0 ? "Go-live delta" : "Largest milestone drift",
      value: `${goLiveDelta > 0 ? goLiveDelta : maxDrift} days`,
    },
  };
}

function buildCostSignal(project: Project, costLines: CostLine[], currentDate: string): { signal: DeliveryTruthSignal | null; budget: DeliveryTruthBudget } {
  const budgetK = costLines.reduce((sum, line) => sum + line.budgetK, 0);
  const actualK = costLines.reduce((sum, line) => sum + line.actualK, 0);
  const burnPct = roundPct(actualK, budgetK);
  const elapsed = Math.max(0, daysBetween(project.startDate, currentDate));
  const duration = Math.max(1, daysBetween(project.startDate, project.goLiveDate));
  const expectedElapsedPct = clamp(roundPct(elapsed, duration), 0, 100);
  const variancePct = burnPct - expectedElapsedPct;

  const budget = { budgetK, actualK, burnPct, expectedElapsedPct, variancePct };
  const overrun = actualK > budgetK && budgetK > 0;
  if (!overrun && burnPct < 60 && variancePct < 15) return { signal: null, budget };

  const severity: DeliveryTruthSeverity = overrun ? "critical" : burnPct >= 85 ? "high" : "medium";
  const topLine = costLines.slice().sort((a, b) => b.actualK - a.actualK)[0];

  return {
    budget,
    signal: {
      id: "cost-pressure",
      kind: "cost-pressure",
      severity,
      tone: toneForSeverity(severity),
      title: overrun ? "Budget is already exceeded" : "Spend is running ahead of the delivery path",
      summary: `$${actualK}k spent against $${budgetK}k budget (${burnPct}%).`,
      whyItMatters: "Budget pressure reduces the room to add people, extend hypercare, or absorb late rework.",
      nextAction: "Review the cost line driving the pressure and decide whether to reforecast, reduce scope, or approve more budget.",
      sources: topLine ? [source("cost", topLine.id, topLine.description)] : [],
      metric: { label: "Budget used", value: `${burnPct}%` },
    },
  };
}

function buildDecisionDebtSignal(documents: Document[], currentDate: string): DeliveryTruthSignal | null {
  const docsWithDebt = documents
    .map((document) => {
      const pending = pendingDecisionCount(document);
      const daysToDue = daysBetween(currentDate, document.dueDate);
      const draftControlledDoc = document.status === "draft" && ["Validation", "Training", "Go-Live"].includes(document.phase);
      return { document, pending, daysToDue, draftControlledDoc };
    })
    .filter(({ document, pending, daysToDue, draftControlledDoc }) => {
      const reviewDebt = document.status === "in-review" && pending > 0;
      return reviewDebt || draftControlledDoc || (pending > 0 && daysToDue <= 7);
    })
    .sort((a, b) => a.daysToDue - b.daysToDue);

  if (!docsWithDebt.length) return null;

  const overdue = docsWithDebt.filter((item) => item.daysToDue < 0);
  const nearDue = docsWithDebt.filter((item) => item.daysToDue >= 0 && item.daysToDue <= 7);
  const pending = docsWithDebt.reduce((sum, item) => sum + item.pending, 0);
  const severity: DeliveryTruthSeverity = overdue.length ? "high" : nearDue.length ? "medium" : "low";

  return {
    id: "decision-debt",
    kind: "decision-debt",
    severity,
    tone: toneForSeverity(severity),
    title: overdue.length ? "Approval debt is already overdue" : "Decisions are approaching their due date",
    summary: `${docsWithDebt.length} document${docsWithDebt.length === 1 ? "" : "s"} need attention; ${pending} pending decision${pending === 1 ? "" : "s"} remain.`,
    whyItMatters: "Unmade document decisions turn into validation and readiness compression later in the plan.",
    nextAction: "Pull the pending reviewers and approvers into the next decision pack and clear the oldest document first.",
    sources: docsWithDebt.slice(0, 5).map((item) => source("document", item.document.id, item.document.name)),
    metric: { label: "Pending decisions", value: String(pending) },
  };
}

function buildReadinessSignal(tasks: Task[], documents: Document[], currentDate: string): DeliveryTruthSignal | null {
  const readinessTasks = tasks
    .map((task) => ({ task, daysToDue: daysBetween(currentDate, task.dueDate) }))
    .filter(({ task, daysToDue }) => {
      if (isCompleteTask(task)) return false;
      const readinessWorkstream = ["Validation", "Training", "Data Migration"].includes(task.workstream);
      const priorityPressure = task.priority === "Critical" || task.priority === "High";
      return readinessWorkstream && priorityPressure && (daysToDue <= 30 || task.status === "Blocked");
    })
    .sort((a, b) => a.daysToDue - b.daysToDue);

  const readinessDocs = documents.filter((document) => {
    if (!["Validation", "Training", "Go-Live"].includes(document.phase)) return false;
    if (document.status === "approved") return false;
    return daysBetween(currentDate, document.dueDate) <= 45;
  });

  if (!readinessTasks.length && !readinessDocs.length) return null;

  const urgentTask = readinessTasks.find(({ task, daysToDue }) => task.status === "Blocked" || daysToDue < 0);
  const lowProgressTask = readinessTasks.find(({ task }) => task.progress < 50);
  const severity: DeliveryTruthSeverity = urgentTask ? "high" : lowProgressTask || readinessDocs.length >= 2 ? "medium" : "low";

  return {
    id: "readiness-compression",
    kind: "readiness-compression",
    severity,
    tone: toneForSeverity(severity),
    title: "Readiness work is being compressed",
    summary: `${readinessTasks.length} readiness task${readinessTasks.length === 1 ? "" : "s"} and ${readinessDocs.length} controlled document${readinessDocs.length === 1 ? "" : "s"} are still open.`,
    whyItMatters: "When validation, training, and go-live evidence compress, teams often borrow time from quality or hypercare.",
    nextAction: "Protect the readiness path by naming what must finish this week and what needs a sponsor tradeoff.",
    sources: [
      ...readinessTasks.slice(0, 3).map(({ task }) => source("task", task.id, task.name)),
      ...readinessDocs.slice(0, 3).map((document) => source("document", document.id, document.name)),
    ],
    metric: { label: "Open readiness items", value: String(readinessTasks.length + readinessDocs.length) },
  };
}

function buildBlockedWorkSignal(tasks: Task[]): DeliveryTruthSignal | null {
  const blocked = tasks
    .filter((task) => task.status === "Blocked")
    .sort((a, b) => severityRank[taskPrioritySeverity(b)] - severityRank[taskPrioritySeverity(a)]);

  if (!blocked.length) return null;

  const highPriorityBlocked = blocked.filter((task) => task.priority === "Critical" || task.priority === "High");
  const severity: DeliveryTruthSeverity = highPriorityBlocked.length ? "high" : "medium";

  return {
    id: "blocked-work",
    kind: "blocked-work",
    severity,
    tone: toneForSeverity(severity),
    title: highPriorityBlocked.length ? "High-priority work is blocked" : "Work is blocked",
    summary: `${blocked.length} task${blocked.length === 1 ? "" : "s"} cannot move until their blocker is cleared.`,
    whyItMatters: "Blocked work hides schedule pressure until dependent tasks run out of room.",
    nextAction: "Assign one blocker owner and one unblock date for each blocked task before the next status cycle.",
    sources: blocked.slice(0, 5).map((task) => source("task", task.id, task.name)),
    metric: { label: "Blocked tasks", value: String(blocked.length) },
  };
}

function taskPrioritySeverity(task: Task): DeliveryTruthSeverity {
  if (task.priority === "Critical" || task.priority === "High") return "high";
  if (task.priority === "Medium") return "medium";
  return "low";
}

function buildRiskPressureSignal(risks: Risk[]): DeliveryTruthSignal | null {
  const openRisks = risks.filter((risk) => risk.status === "open").sort((a, b) => b.score - a.score);
  const highest = openRisks[0];
  if (!highest || highest.score < 8) return null;

  const severity: DeliveryTruthSeverity = highest.score >= 15 ? "high" : "medium";
  const highRisks = openRisks.filter((risk) => risk.score >= 15);

  return {
    id: "risk-pressure",
    kind: "risk-pressure",
    severity,
    tone: toneForSeverity(severity),
    title: highRisks.length ? "High-impact risks are still open" : "Risk pressure needs watch",
    summary: highRisks.length
      ? `${highRisks.length} high-impact risk${highRisks.length === 1 ? "" : "s"} remain open.`
      : `${openRisks.length} open risk${openRisks.length === 1 ? "" : "s"} remain in the register.`,
    whyItMatters: "Open risks become delivery truth when they start consuming schedule, cost, or decision capacity.",
    nextAction: "Confirm whether each high-impact risk still has an owner, mitigation date, and sponsor escalation threshold.",
    sources: openRisks.slice(0, 5).map((risk) => source("risk", risk.id, risk.title)),
    metric: { label: "Highest score", value: String(highest.score) },
  };
}

function confidenceBand(score: number, signals: DeliveryTruthSignal[]): DeliveryTruthBand {
  const hasCritical = signals.some((signal) => signal.severity === "critical");
  if (score >= 75 && !hasCritical) return "credible";
  if (score >= 55) return "watch";
  if (score >= 35) return "at-risk";
  return "unlikely";
}

function buildCoverage(
  milestones: Milestone[],
  tasks: Task[],
  risks: Risk[],
  documents: Document[],
  costLines: CostLine[],
): DeliveryTruthCoverage {
  const counts = {
    milestones: milestones.length,
    tasks: tasks.length,
    risks: risks.length,
    documents: documents.length,
    costLines: costLines.length,
  };
  const reasons: string[] = [];
  if (counts.milestones === 0) reasons.push("Add at least one milestone so the promise has a target path.");
  if (counts.tasks === 0) reasons.push("Add tasks or import a plan so workstream pressure can be measured.");
  if (counts.documents === 0) reasons.push("Add controlled documents so readiness and decision debt can be measured.");
  if (counts.costLines === 0) reasons.push("Add budget lines so cost pressure can be measured.");

  return {
    counts,
    reasons,
    isReady: reasons.length === 0,
  };
}

function buildDecisionOptions(signals: DeliveryTruthSignal[]): DeliveryDecisionOption[] {
  const kinds = new Set(signals.map((signal) => signal.kind));
  const options: DeliveryDecisionOption[] = [];

  if (kinds.has("schedule-drift") || kinds.has("blocked-work")) {
    options.push({
      id: "delivery-tradeoff",
      title: "Choose the delivery tradeoff",
      summary: "Decide whether the team protects the go-live date by changing scope, adding capacity, or accepting a later forecast.",
      ownerHint: "PM + Sponsor",
      tone: "amber",
      signalKinds: ["schedule-drift", "blocked-work"],
    });
  }

  if (kinds.has("decision-debt") || kinds.has("readiness-compression")) {
    options.push({
      id: "protect-readiness",
      title: "Protect readiness and evidence",
      summary: "Clear the document and readiness items that would otherwise get squeezed into the final delivery window.",
      ownerHint: "PM + QA + Workstream Leads",
      tone: "blue",
      signalKinds: ["decision-debt", "readiness-compression"],
    });
  }

  if (kinds.has("cost-pressure")) {
    options.push({
      id: "budget-response",
      title: "Reconfirm the budget envelope",
      summary: "Decide whether the current spend curve is accepted, reduced, or reforecast before it limits recovery options.",
      ownerHint: "PM + Finance + Sponsor",
      tone: "amber",
      signalKinds: ["cost-pressure"],
    });
  }

  if (kinds.has("risk-pressure")) {
    options.push({
      id: "risk-escalation",
      title: "Escalate the risks that can change the promise",
      summary: "Confirm which open risks have crossed from watchlist to delivery impact and need a sponsor decision.",
      ownerHint: "PM + Risk Owners",
      tone: "rose",
      signalKinds: ["risk-pressure"],
    });
  }

  if (!options.length) {
    options.push({
      id: "maintain-course",
      title: "Maintain the current course",
      summary: "No major delivery-truth signal is active. Keep the next status cycle focused on sustaining the current path.",
      ownerHint: "PM",
      tone: "emerald",
      signalKinds: [],
    });
  }

  return options;
}

export function calculateDeliveryTruth(input: DeliveryTruthInput): DeliveryTruthResult {
  const currentDate = input.currentDate ?? DEFAULT_TRUTH_DATE;
  const milestones = projectOnly(input.milestones, input.project.id);
  const tasks = projectOnly(input.tasks, input.project.id);
  const risks = projectOnly(input.risks, input.project.id);
  const documents = projectOnly(input.documents, input.project.id);
  const costLines = projectOnly(input.costLines, input.project.id);
  const coverage = buildCoverage(milestones, tasks, risks, documents, costLines);

  const forecastDate = calculateForecastDate(input.project, milestones);
  const scheduleSignal = buildScheduleSignal(input.project, milestones, forecastDate);
  const { signal: costSignal, budget } = buildCostSignal(input.project, costLines, currentDate);
  const signals = sortSignals([
    scheduleSignal,
    costSignal,
    buildDecisionDebtSignal(documents, currentDate),
    buildReadinessSignal(tasks, documents, currentDate),
    buildBlockedWorkSignal(tasks),
    buildRiskPressureSignal(risks),
  ].filter((signal): signal is DeliveryTruthSignal => Boolean(signal)));

  const deduction = signals.reduce((sum, signal) => sum + severityDeduction[signal.severity], 0);
  const confidenceScore = coverage.isReady ? clamp(100 - deduction, 0, 100) : 0;

  return {
    confidenceScore,
    confidenceBand: coverage.isReady ? confidenceBand(confidenceScore, signals) : "not-ready",
    targetDate: input.project.goLiveDate,
    forecastDate,
    scheduleDeltaDays: daysBetween(input.project.goLiveDate, forecastDate),
    budget,
    coverage,
    signals,
    decisionOptions: coverage.isReady ? buildDecisionOptions(signals) : [{
      id: "finish-setup",
      title: "Finish the project setup",
      summary: "Delivery Truth needs milestones, tasks, controlled documents, and budget lines before it can judge the promise.",
      ownerHint: "PM",
      tone: "blue",
      signalKinds: [],
    }],
  };
}

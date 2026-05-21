import type { CostLine, Document, Milestone, Project, Risk, Task } from "../mockData";
import { calculateDeliveryTruth, DEFAULT_TRUTH_DATE, type DeliveryTruthResult, type DeliveryTruthSignal } from "./delivery-truth";
import { daysBetween } from "./dates";

export type SteerCoTone = "rose" | "amber" | "blue" | "emerald" | "slate";

export type SteerCoDecision = {
  id: string;
  title: string;
  owner: string;
  summary: string;
  href: string;
  tone: SteerCoTone;
};

export type SteerCoAction = {
  id: string;
  title: string;
  detail: string;
  owner: string;
  href: string;
  tone: SteerCoTone;
};

export type SteerCoEvidence = {
  id: string;
  label: string;
  sourceType: string;
  reason: string;
  href: string;
  tone: SteerCoTone;
};

export type WorkstreamBrief = {
  name: string;
  total: number;
  complete: number;
  blocked: number;
  criticalOpen: number;
  averageProgress: number;
  nextDueDate?: string;
  tone: SteerCoTone;
};

export type SteerCoBrief = {
  truth: DeliveryTruthResult;
  headline: string;
  promiseAnswer: string;
  promiseDetail: string;
  pendingDecisionCount: number;
  overdueTaskCount: number;
  blockedTaskCount: number;
  highRiskCount: number;
  readinessItemCount: number;
  decisions: SteerCoDecision[];
  actions: SteerCoAction[];
  evidence: SteerCoEvidence[];
  workstreams: WorkstreamBrief[];
};

export type SteerCoBriefInput = {
  project: Project;
  milestones: Milestone[];
  tasks: Task[];
  risks: Risk[];
  documents: Document[];
  costLines: CostLine[];
  currentDate?: string;
};

function pendingDecisionCount(document: Document): number {
  return [...document.reviewers, ...document.approvers].filter((decision) => decision.status === "pending").length;
}

function sourceHref(kind: SteerCoEvidence["sourceType"]): string {
  if (kind === "milestone") return "/milestones";
  if (kind === "task") return "/tasks";
  if (kind === "risk") return "/risks";
  if (kind === "document") return "/documents";
  if (kind === "cost") return "/costs";
  return "/";
}

function signalHref(signal: DeliveryTruthSignal): string {
  return signal.sources[0] ? sourceHref(signal.sources[0].kind) : "/truth";
}

function buildPromiseAnswer(truth: DeliveryTruthResult): string {
  if (truth.confidenceBand === "not-ready") return "Not ready to judge";
  if (truth.confidenceBand === "credible") return "Yes, with current controls";
  if (truth.confidenceBand === "watch") return "Yes, but watch pressure";
  if (truth.confidenceBand === "at-risk") return "Only with leadership action";
  return "Unlikely without a reset";
}

function buildHeadline(truth: DeliveryTruthResult): string {
  if (truth.confidenceBand === "not-ready") return "The project story is not board-ready yet.";
  if (truth.confidenceBand === "credible") return "The project promise is credible right now.";
  if (truth.confidenceBand === "watch") return "The promise is credible, but pressure is visible.";
  if (truth.confidenceBand === "at-risk") return "SteerCo needs to choose a delivery tradeoff.";
  return "The current promise is unlikely without a reset.";
}

function buildPromiseDetail(truth: DeliveryTruthResult): string {
  const datePhrase = truth.scheduleDeltaDays > 0
    ? `Forecast is ${truth.scheduleDeltaDays} day${truth.scheduleDeltaDays === 1 ? "" : "s"} past target.`
    : "Forecast still holds the target date.";
  const signalPhrase = truth.signals.length
    ? `${truth.signals.length} delivery signal${truth.signals.length === 1 ? "" : "s"} need attention.`
    : "No material delivery signal is active.";
  return `${datePhrase} Confidence is ${truth.confidenceScore}/100. ${signalPhrase}`;
}

function buildDecisions(truth: DeliveryTruthResult): SteerCoDecision[] {
  return truth.decisionOptions.slice(0, 3).map((option) => ({
    id: option.id,
    title: option.title,
    owner: option.ownerHint,
    summary: option.summary,
    href: "/truth",
    tone: option.tone,
  }));
}

function buildActions(input: SteerCoBriefInput, truth: DeliveryTruthResult, currentDate: string): SteerCoAction[] {
  const actions: SteerCoAction[] = [];
  const blocked = input.tasks.filter((task) => task.status === "Blocked");
  const overdueTasks = input.tasks
    .filter((task) => task.status !== "Complete" && daysBetween(currentDate, task.dueDate) < 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const pendingDocs = input.documents
    .map((document) => ({ document, pending: pendingDecisionCount(document), daysToDue: daysBetween(currentDate, document.dueDate) }))
    .filter((item) => item.pending > 0)
    .sort((a, b) => a.daysToDue - b.daysToDue);
  const highRisks = input.risks
    .filter((risk) => risk.status === "open" && risk.score >= 15)
    .sort((a, b) => b.score - a.score);
  const readinessSignal = truth.signals.find((signal) => signal.kind === "readiness-compression");

  if (blocked.length) {
    actions.push({
      id: "clear-blockers",
      title: `Clear ${blocked.length} blocked task${blocked.length === 1 ? "" : "s"}`,
      detail: `${blocked[0].name} is the first blocked item visible to SteerCo.`,
      owner: blocked[0].owner,
      href: "/tasks",
      tone: "rose",
    });
  }

  if (overdueTasks.length) {
    actions.push({
      id: "recover-overdue",
      title: `Recover ${overdueTasks.length} overdue task${overdueTasks.length === 1 ? "" : "s"}`,
      detail: `${overdueTasks[0].name} is already past its due date.`,
      owner: overdueTasks[0].owner,
      href: "/tasks",
      tone: "amber",
    });
  }

  if (pendingDocs.length) {
    actions.push({
      id: "close-decisions",
      title: `Close ${pendingDocs.reduce((sum, item) => sum + item.pending, 0)} pending document decision${pendingDocs.length === 1 ? "" : "s"}`,
      detail: `${pendingDocs[0].document.name} is the oldest unresolved decision pack item.`,
      owner: pendingDocs[0].document.owner,
      href: "/documents",
      tone: pendingDocs[0].daysToDue < 0 ? "rose" : "amber",
    });
  }

  if (highRisks.length) {
    actions.push({
      id: "risk-decision",
      title: "Decide the top delivery risk",
      detail: `${highRisks[0].title}. Current mitigation: ${highRisks[0].mitigation}`,
      owner: highRisks[0].owner,
      href: "/risks",
      tone: "rose",
    });
  }

  if (readinessSignal) {
    actions.push({
      id: "protect-readiness",
      title: readinessSignal.title,
      detail: readinessSignal.nextAction,
      owner: "PM + QA",
      href: signalHref(readinessSignal),
      tone: readinessSignal.tone,
    });
  }

  if (!actions.length) {
    actions.push({
      id: "prepare-story",
      title: "Prepare the SteerCo story",
      detail: "No urgent exception is active. Export the latest briefing and keep the delivery story aligned.",
      owner: "PM",
      href: "/reports",
      tone: "emerald",
    });
  }

  return actions.slice(0, 5);
}

function buildEvidence(truth: DeliveryTruthResult): SteerCoEvidence[] {
  return truth.signals.flatMap((signal) =>
    signal.sources.slice(0, 3).map((source) => ({
      id: `${signal.id}-${source.kind}-${source.id}`,
      label: source.label,
      sourceType: source.kind,
      reason: signal.summary,
      href: sourceHref(source.kind),
      tone: signal.tone,
    })),
  ).slice(0, 8);
}

function buildWorkstreams(tasks: Task[]): WorkstreamBrief[] {
  const names = Array.from(new Set(tasks.map((task) => task.workstream)));
  return names.map((name) => {
    const items = tasks.filter((task) => task.workstream === name);
    const complete = items.filter((task) => task.status === "Complete").length;
    const blocked = items.filter((task) => task.status === "Blocked").length;
    const criticalOpen = items.filter((task) => task.priority === "Critical" && task.status !== "Complete").length;
    const averageProgress = Math.round(items.reduce((sum, task) => sum + task.progress, 0) / Math.max(1, items.length));
    const nextDue = items
      .filter((task) => task.status !== "Complete")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0]?.dueDate;
    const tone: SteerCoTone = blocked ? "rose" : criticalOpen ? "amber" : averageProgress >= 80 ? "emerald" : "blue";
    return {
      name,
      total: items.length,
      complete,
      blocked,
      criticalOpen,
      averageProgress,
      nextDueDate: nextDue,
      tone,
    };
  }).sort((a, b) => {
    const toneRank: Record<SteerCoTone, number> = { rose: 4, amber: 3, blue: 2, emerald: 1, slate: 0 };
    return toneRank[b.tone] - toneRank[a.tone] || a.name.localeCompare(b.name);
  });
}

export function buildSteerCoBrief(input: SteerCoBriefInput): SteerCoBrief {
  const currentDate = input.currentDate ?? DEFAULT_TRUTH_DATE;
  const truth = calculateDeliveryTruth({ ...input, currentDate });
  const pendingDecisions = input.documents.reduce((sum, document) => sum + pendingDecisionCount(document), 0);
  const blockedTaskCount = input.tasks.filter((task) => task.status === "Blocked").length;
  const overdueTaskCount = input.tasks.filter((task) => task.status !== "Complete" && daysBetween(currentDate, task.dueDate) < 0).length;
  const highRiskCount = input.risks.filter((risk) => risk.status === "open" && risk.score >= 15).length;
  const readinessItemCount = truth.signals.find((signal) => signal.kind === "readiness-compression")?.metric?.value ?? "0";

  return {
    truth,
    headline: buildHeadline(truth),
    promiseAnswer: buildPromiseAnswer(truth),
    promiseDetail: buildPromiseDetail(truth),
    pendingDecisionCount: pendingDecisions,
    overdueTaskCount,
    blockedTaskCount,
    highRiskCount,
    readinessItemCount: Number(readinessItemCount),
    decisions: buildDecisions(truth),
    actions: buildActions(input, truth, currentDate),
    evidence: buildEvidence(truth),
    workstreams: buildWorkstreams(input.tasks),
  };
}

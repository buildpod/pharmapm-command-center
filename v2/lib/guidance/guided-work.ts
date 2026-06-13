import type {
  Charter,
  CostLine,
  DecisionRecord,
  Document,
  Issue,
  Milestone,
  Project,
  Risk,
  Task,
} from "../mockData";

export type GuidanceRole = "pm" | "sponsor" | "qa";
export type GuidanceTone = "ok" | "warn" | "risk" | "info" | "neutral";
export type ReadinessStatus = "done" | "action" | "watch";

export interface GuidanceInput {
  project: Project;
  charters: Charter[];
  milestones: Milestone[];
  tasks: Task[];
  risks: Risk[];
  documents: Document[];
  costLines: CostLine[];
  issues?: Issue[];
  decisionRecords?: DecisionRecord[];
}

export interface ReadinessItem {
  id: string;
  label: string;
  status: ReadinessStatus;
  description: string;
  href: string;
  cta: string;
  tone: GuidanceTone;
}

export interface SmartNudge {
  id: string;
  title: string;
  body: string;
  href: string;
  tone: GuidanceTone;
  sourceId?: string;
}

export interface PageGuidance {
  route: string;
  title: string;
  body: string;
  actions: string[];
}

const roleLabels: Record<GuidanceRole, string> = {
  pm: "PM",
  sponsor: "Sponsor",
  qa: "QA / Validation",
};

export function guidanceRoleLabel(role: GuidanceRole) {
  return roleLabels[role];
}

function inProject<T extends { projectId?: string }>(items: T[], projectId: string) {
  return items.filter((item) => item.projectId === projectId);
}

function focusHref(route: string, id?: string) {
  return id ? `${route}?focus=${encodeURIComponent(id)}` : route;
}

function pendingDecisionCount(document: Document) {
  return [...document.reviewers, ...document.approvers].filter((decision) => decision.status === "pending").length;
}

function hasMitigation(risk: Risk) {
  return risk.mitigation.trim().length > 0;
}

function projectEntities(input: GuidanceInput) {
  const projectId = input.project.id;
  const milestones = inProject(input.milestones, projectId);
  const tasks = inProject(input.tasks, projectId);
  const risks = inProject(input.risks, projectId);
  const documents = inProject(input.documents, projectId);
  return {
    charter: inProject(input.charters, projectId)[0],
    milestones,
    tasks,
    risks,
    documents,
    costLines: inProject(input.costLines, projectId),
    issues: inProject(input.issues ?? [], projectId),
    decisionRecords: inProject(input.decisionRecords ?? [], projectId),
    missingOwnerMilestone: milestones.find((milestone) => !milestone.owner.trim()),
    unlinkedTask: tasks.find((task) => !task.milestoneId),
    riskWithoutMitigation: risks.find((risk) => risk.status === "open" && !hasMitigation(risk)),
    pendingDocument: documents.find((document) => pendingDecisionCount(document) > 0),
  };
}

export const pageGuidanceByRoute: Record<string, PageGuidance> = {
  "/": {
    route: "/",
    title: "Run today from the project verdict.",
    body: "Start with the live confidence story, then use the checklist and nudges to close the records that make the story credible.",
    actions: ["Clear missing setup records.", "Open the evidence before reporting.", "Keep SteerCo focused on live pressure signals."],
  },
  "/plan": {
    route: "/plan",
    title: "Confirm the project shape.",
    body: "Use this page to check whether the charter, milestone spine, task links, and dependency structure describe the project clearly.",
    actions: ["Review the milestone spine.", "Find unlinked tasks.", "Open the exact record that needs cleanup."],
  },
  "/milestones": {
    route: "/milestones",
    title: "Confirm decision gates.",
    body: "Milestones should be proof points and leadership gates, not every activity. Predecessors should reflect real timing dependencies.",
    actions: ["Check owner and locked-date discipline.", "Use predecessor links only when timing truly depends.", "Review downstream impact before saving date changes."],
  },
  "/tasks": {
    route: "/tasks",
    title: "Manage work and schedule impact.",
    body: "Tasks should show who owns the work, what proof point it supports, and which upstream work it is waiting for.",
    actions: ["Link tasks to milestones.", "Use dependencies for real waiting relationships.", "Review schedule impact before saving shifts."],
  },
  "/risks": {
    route: "/risks",
    title: "Protect the delivery promise.",
    body: "Risks are useful only when probability, impact, owner, and mitigation are specific enough for SteerCo action.",
    actions: ["Prioritize high score risks.", "Add mitigation before reporting.", "Escalate risks that need decisions."],
  },
  "/documents": {
    route: "/documents",
    title: "Evidence and decisions.",
    body: "Documents carry approval debt and audit evidence. Use this page to close reviewer and approver decisions before reporting.",
    actions: ["Resolve pending approvers.", "Keep evidence tied to phase gates.", "Open decision history when a report claim needs proof."],
  },
  "/reports": {
    route: "/reports",
    title: "Communicate with traceability.",
    body: "Reports should be the board-ready story backed by source records, not a hand-written status slide.",
    actions: ["Use the evidence trail before sending.", "Check pending decisions.", "Open the source register when a claim looks wrong."],
  },
  "/truth": {
    route: "/truth",
    title: "Understand what is changing the promise.",
    body: "Delivery Signals explains the arithmetic behind confidence: schedule, cost, approvals, blocked work, readiness, and risk pressure.",
    actions: ["Open source chips for evidence.", "Fix missing coverage before trusting confidence.", "Use next actions as the SteerCo agenda."],
  },
  "/costs": {
    route: "/costs",
    title: "Make cost confidence visible.",
    body: "Budget lines let the confidence model see whether delivery is still credible financially.",
    actions: ["Add approved budget lines.", "Keep actual spend current.", "Investigate categories approaching their ceiling."],
  },
};

export function buildProjectReadiness(input: GuidanceInput): ReadinessItem[] {
  const entities = projectEntities(input);
  const {
    charter,
    milestones,
    tasks,
    risks,
    documents,
    costLines,
    missingOwnerMilestone,
    unlinkedTask,
    riskWithoutMitigation,
    pendingDocument,
  } = entities;
  const pendingDocs = documents.reduce((sum, document) => sum + pendingDecisionCount(document), 0);
  const spineReviewed = milestones.length >= 3 && !missingOwnerMilestone;
  const tasksLinked = tasks.length > 0 && !unlinkedTask;
  const risksReviewed = risks.length > 0 && !riskWithoutMitigation;
  const evidenceReady = documents.length > 0 && pendingDocs === 0;
  const reportReady = Boolean(charter && spineReviewed && tasksLinked && risksReviewed && costLines.length > 0 && documents.length > 0);

  return [
    {
      id: "charter",
      label: "Charter drafted",
      status: charter ? "done" : "action",
      description: charter ? `Charter is ${charter.status}.` : "Create the authorising story before delivery reporting.",
      href: focusHref("/charter", charter?.id),
      cta: charter ? "Open charter" : "Create charter",
      tone: charter ? "ok" : "warn",
    },
    {
      id: "milestones",
      label: "Milestone spine reviewed",
      status: spineReviewed ? "done" : milestones.length ? "watch" : "action",
      description: missingOwnerMilestone ? `${missingOwnerMilestone.name} needs an accountable owner.` : `${milestones.length} milestone gates in this project.`,
      href: focusHref("/milestones", missingOwnerMilestone?.id),
      cta: missingOwnerMilestone ? "Assign owner" : "Review milestones",
      tone: spineReviewed ? "ok" : "warn",
    },
    {
      id: "tasks",
      label: "Tasks linked to milestones",
      status: tasksLinked ? "done" : tasks.length ? "watch" : "action",
      description: unlinkedTask ? `${unlinkedTask.name} is not linked to a proof point.` : `${tasks.length} tasks are linked to project proof points.`,
      href: focusHref("/tasks", unlinkedTask?.id),
      cta: unlinkedTask ? "Link task" : "Open tasks",
      tone: tasksLinked ? "ok" : "warn",
    },
    {
      id: "risks",
      label: "Risks reviewed",
      status: risksReviewed ? "done" : risks.length ? "watch" : "action",
      description: riskWithoutMitigation ? `${riskWithoutMitigation.title} needs a mitigation.` : `${risks.length} risks reviewed for SteerCo.`,
      href: focusHref("/risks", riskWithoutMitigation?.id),
      cta: riskWithoutMitigation ? "Add mitigation" : "Open risks",
      tone: risksReviewed ? "ok" : "risk",
    },
    {
      id: "budget",
      label: "Budget lines added",
      status: costLines.length ? "done" : "action",
      description: costLines.length ? `${costLines.length} budget lines support cost confidence.` : "Add budget lines so confidence is not blind to cost.",
      href: focusHref("/costs", costLines[0]?.id),
      cta: costLines.length ? "Open costs" : "Add budget",
      tone: costLines.length ? "ok" : "warn",
    },
    {
      id: "documents",
      label: "Documents and approvals added",
      status: evidenceReady ? "done" : documents.length ? "watch" : "action",
      description: pendingDocument ? `${pendingDocs} document decisions are still pending.` : documents.length ? `${documents.length} evidence records available.` : "Add controlled evidence before reporting.",
      href: focusHref("/documents", pendingDocument?.id ?? documents[0]?.id),
      cta: pendingDocument ? "Resolve approvals" : "Open documents",
      tone: evidenceReady ? "ok" : "warn",
    },
    {
      id: "report",
      label: "First SteerCo report ready",
      status: reportReady ? "done" : "action",
      description: reportReady ? "The report has live records behind the story." : "Complete setup records before sharing the SteerCo story.",
      href: "/reports",
      cta: "Open reports",
      tone: reportReady ? "ok" : "info",
    },
  ];
}

export function buildSmartNudges(input: GuidanceInput, role: GuidanceRole): SmartNudge[] {
  const entities = projectEntities(input);
  const nudges: SmartNudge[] = [];

  if (!entities.costLines.length) {
    nudges.push({
      id: "budget-missing",
      title: "Add budget lines so confidence is not blind to cost.",
      body: "Cost confidence needs approved budget and actual spend, even if the first numbers are rough.",
      href: "/costs",
      tone: "warn",
    });
  }

  if (entities.missingOwnerMilestone) {
    nudges.push({
      id: "milestone-owner",
      title: "Assign an accountable owner.",
      body: `${entities.missingOwnerMilestone.name} has no owner, so the gate has no clear follow-up path.`,
      href: focusHref("/milestones", entities.missingOwnerMilestone.id),
      tone: "warn",
      sourceId: entities.missingOwnerMilestone.id,
    });
  }

  if (entities.unlinkedTask) {
    nudges.push({
      id: "task-milestone",
      title: "Link this task to a proof point.",
      body: `${entities.unlinkedTask.name} will not roll up cleanly until it supports a milestone.`,
      href: focusHref("/tasks", entities.unlinkedTask.id),
      tone: "warn",
      sourceId: entities.unlinkedTask.id,
    });
  }

  if (entities.riskWithoutMitigation) {
    nudges.push({
      id: "risk-mitigation",
      title: "Add a mitigation before SteerCo.",
      body: `${entities.riskWithoutMitigation.title} is open without a specific response.`,
      href: focusHref("/risks", entities.riskWithoutMitigation.id),
      tone: "risk",
      sourceId: entities.riskWithoutMitigation.id,
    });
  }

  if (entities.pendingDocument) {
    const count = pendingDecisionCount(entities.pendingDocument);
    nudges.push({
      id: "document-approvals",
      title: "Resolve approval debt before reporting.",
      body: `${entities.pendingDocument.name} has ${count} pending reviewer or approver decision${count === 1 ? "" : "s"}.`,
      href: focusHref("/documents", entities.pendingDocument.id),
      tone: "warn",
      sourceId: entities.pendingDocument.id,
    });
  }

  if (role === "pm") {
    const blockedTask = entities.tasks.find((task) => task.status === "Blocked" || task.status === "On Hold");
    if (blockedTask) {
      nudges.push({
        id: "pm-blocked-task",
        title: "Clear blocked work before the next status cycle.",
        body: `${blockedTask.name} needs a dependency or owner decision to move.`,
        href: focusHref("/tasks", blockedTask.id),
        tone: "risk",
        sourceId: blockedTask.id,
      });
    }
  }

  if (role === "sponsor") {
    const pendingDecision = entities.decisionRecords.find((decision) => decision.status === "Pending");
    if (pendingDecision) {
      nudges.push({
        id: "sponsor-decision",
        title: "A leadership decision is waiting.",
        body: `${pendingDecision.title} needs a clear decision or escalation path.`,
        href: focusHref("/decisions", pendingDecision.id),
        tone: "info",
        sourceId: pendingDecision.id,
      });
    }
  }

  if (role === "qa") {
    const evidenceDoc = entities.documents.find((document) => document.status !== "approved");
    if (evidenceDoc) {
      nudges.push({
        id: "qa-evidence",
        title: "Close evidence before audit pressure builds.",
        body: `${evidenceDoc.name} is ${evidenceDoc.status.replace("-", " ")}.`,
        href: focusHref("/documents", evidenceDoc.id),
        tone: "warn",
        sourceId: evidenceDoc.id,
      });
    }
  }

  return nudges;
}

export function buildGuidedWork(input: GuidanceInput, role: GuidanceRole, route: string) {
  const page = pageGuidanceByRoute[route] ?? pageGuidanceByRoute["/"];
  return {
    page,
    role,
    readiness: buildProjectReadiness(input),
    nudges: buildSmartNudges(input, role),
  };
}

import type {
  Charter,
  CostLine,
  Document,
  Milestone,
  Project,
  Risk,
  Task,
  TeamMember,
} from "../mockData";
import { addDays, daysBetween } from "../domain/dates";

const STORAGE_KEY = "aivello_custom_project_templates_v1";

export type CustomProjectTemplate = {
  id: string;
  name: string;
  description: string;
  sourceProjectId: string;
  sourceProjectName: string;
  sourceStartDate: string;
  sourceGoLiveDate: string;
  recommendedPhase: string;
  recommendedMethodology: string;
  createdAt: string;
  coverage: {
    workstreams: string[];
    milestones: number;
    tasks: number;
    documents: number;
    risks: number;
    costLines: number;
    teamMembers: number;
  };
  model: {
    charter?: Charter;
    milestones: Milestone[];
    tasks: Task[];
    documents: Document[];
    risks: Risk[];
    costLines: CostLine[];
    teamMembers: TeamMember[];
  };
};

export type ProjectTemplateEntityInput = {
  project: Project;
  templateName: string;
  description?: string;
  milestones: Milestone[];
  tasks: Task[];
  documents: Document[];
  risks: Risk[];
  costLines: CostLine[];
  teamMembers: TeamMember[];
  charter?: Charter;
};

export type InstantiateCustomTemplateInput = {
  template: CustomProjectTemplate;
  projectId: string;
  projectName: string;
  client: string;
  startDate: string;
  goLiveDate: string;
  methodology: string;
};

export type CustomTemplateOperatingModel = {
  template: CustomProjectTemplate;
  charter?: Charter;
  milestones: Milestone[];
  tasks: Task[];
  documents: Document[];
  risks: Risk[];
  costLines: CostLine[];
  teamMembers: TeamMember[];
};

export function loadCustomProjectTemplates(): CustomProjectTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomProjectTemplate(template: CustomProjectTemplate): CustomProjectTemplate[] {
  const next = [
    template,
    ...loadCustomProjectTemplates().filter((item) => item.id !== template.id),
  ];
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function deleteCustomProjectTemplate(id: string): CustomProjectTemplate[] {
  const next = loadCustomProjectTemplates().filter((item) => item.id !== id);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function buildCustomProjectTemplate(input: ProjectTemplateEntityInput): CustomProjectTemplate {
  const sourceProjectItems = {
    milestones: input.milestones.filter((item) => item.projectId === input.project.id),
    tasks: input.tasks.filter((item) => item.projectId === input.project.id),
    documents: input.documents.filter((item) => item.projectId === input.project.id),
    risks: input.risks.filter((item) => item.projectId === input.project.id),
    costLines: input.costLines.filter((item) => item.projectId === input.project.id),
    teamMembers: input.teamMembers.filter((item) => item.projectId === input.project.id),
  };
  const workstreams = Array.from(new Set([
    ...sourceProjectItems.tasks.map((item) => item.workstream),
    ...sourceProjectItems.milestones.map((item) => item.phase),
    ...sourceProjectItems.teamMembers.map((item) => item.workstream),
  ].filter(Boolean))).sort();

  const templateName = input.templateName.trim() || `${input.project.name} operating model`;

  return {
    id: `custom-${slug(templateName)}-${Date.now()}`,
    name: templateName,
    description: input.description?.trim() || `Reusable operating model saved from ${input.project.name}.`,
    sourceProjectId: input.project.id,
    sourceProjectName: input.project.name,
    sourceStartDate: input.project.startDate,
    sourceGoLiveDate: input.project.goLiveDate,
    recommendedPhase: input.project.phase,
    recommendedMethodology: input.project.methodology,
    createdAt: new Date().toISOString(),
    coverage: {
      workstreams,
      milestones: sourceProjectItems.milestones.length,
      tasks: sourceProjectItems.tasks.length,
      documents: sourceProjectItems.documents.length,
      risks: sourceProjectItems.risks.length,
      costLines: sourceProjectItems.costLines.length,
      teamMembers: sourceProjectItems.teamMembers.length,
    },
    model: {
      charter: input.charter,
      ...sourceProjectItems,
    },
  };
}

export function instantiateCustomProjectTemplate(input: InstantiateCustomTemplateInput): CustomTemplateOperatingModel {
  const offset = daysBetween(input.template.sourceStartDate, input.startDate);
  const milestoneIdMap = new Map<string, string>();
  const taskIdMap = new Map<string, string>();
  const memberIdMap = new Map<string, string>();

  input.template.model.milestones.forEach((milestone, index) => {
    milestoneIdMap.set(milestone.id, `${input.projectId}-milestone-${index + 1}`);
  });
  input.template.model.tasks.forEach((task, index) => {
    taskIdMap.set(task.id, `${input.projectId}-task-${index + 1}`);
  });
  input.template.model.teamMembers.forEach((member, index) => {
    memberIdMap.set(member.id, `${input.projectId}-member-${index + 1}`);
  });

  const milestones = input.template.model.milestones.map((milestone, index) => ({
    ...milestone,
    id: milestoneIdMap.get(milestone.id) ?? `${input.projectId}-milestone-${index + 1}`,
    plannedDate: shiftDate(milestone.plannedDate, offset),
    forecastDate: shiftDate(milestone.forecastDate, offset),
    status: "pending" as const,
    predecessor: milestone.predecessor ? milestoneIdMap.get(milestone.predecessor) : undefined,
    projectId: input.projectId,
  }));

  const tasks = input.template.model.tasks.map((task, index) => {
    const dependsOn = task.dependsOn
      ?.map((id) => taskIdMap.get(id))
      .filter((id): id is string => Boolean(id));
    const parallelDeps = task.parallelDeps
      ?.map((id) => taskIdMap.get(id))
      .filter((id): id is string => Boolean(id));

    return {
      ...task,
      id: taskIdMap.get(task.id) ?? `${input.projectId}-task-${index + 1}`,
      status: "Not Started" as const,
      progress: 0,
      dueDate: shiftDate(task.dueDate, offset),
      milestoneId: task.milestoneId ? milestoneIdMap.get(task.milestoneId) : undefined,
      dependsOn: dependsOn && dependsOn.length > 0 ? dependsOn : undefined,
      parallelDeps: parallelDeps && parallelDeps.length > 0 ? parallelDeps : undefined,
      depNotes: undefined,
      projectId: input.projectId,
    };
  });

  const documents = input.template.model.documents.map((document, index) => ({
    ...document,
    id: `${input.projectId}-document-${index + 1}`,
    status: "draft" as const,
    version: "0.1",
    dueDate: shiftDate(document.dueDate, offset),
    reviewers: document.reviewers.map((reviewer) => ({ ...reviewer, status: "pending" as const, date: undefined })),
    approvers: document.approvers.map((approver) => ({ ...approver, status: "pending" as const, date: undefined })),
    projectId: input.projectId,
  }));

  const risks = input.template.model.risks.map((risk, index) => ({
    ...risk,
    id: `${input.projectId}-risk-${index + 1}`,
    status: "open" as const,
    projectId: input.projectId,
  }));

  const costLines = input.template.model.costLines.map((line, index) => ({
    ...line,
    id: `${input.projectId}-cost-${index + 1}`,
    actualK: 0,
    projectId: input.projectId,
  }));

  const teamMembers = input.template.model.teamMembers.map((member, index) => ({
    ...member,
    id: memberIdMap.get(member.id) ?? `${input.projectId}-member-${index + 1}`,
    name: roleName(member),
    projectId: input.projectId,
  }));

  const charter = input.template.model.charter ? {
    ...input.template.model.charter,
    id: `charter-${input.projectId}`,
    projectId: input.projectId,
    purpose: input.template.model.charter.purpose.replace(input.template.sourceProjectName, input.projectName),
    status: "draft" as const,
    approvedBy: undefined,
    approvedDate: undefined,
    lastUpdated: input.startDate,
  } : undefined;

  return {
    template: input.template,
    charter,
    milestones,
    tasks,
    documents,
    risks,
    costLines,
    teamMembers,
  };
}

function shiftDate(value: string, offset: number): string {
  return addDays(value, offset) ?? value;
}

function roleName(member: TeamMember): string {
  if (member.workstream === "Executive") return member.name;
  return member.name.includes("Lead") || member.name.includes("Manager") ? member.name : `${member.workstream} Lead`;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "template";
}

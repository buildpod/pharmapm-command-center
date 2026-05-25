import type { Charter, CostLine, Document, Milestone, Risk, Task, TeamMember } from "../mockData";
import { addDays } from "../domain/dates";

export type ProjectTemplateId =
  | "veeva-rim"
  | "veeva-qualitydocs"
  | "veeva-clinical-ops"
  | "veeva-promomats"
  | "sap-s4hana"
  | "sap-master-data"
  | "sap-ewm"
  | "lims-qc-lab"
  | "eqms-capa"
  | "mes-ebmr"
  | "csv-validation"
  | "data-migration"
  | "generic-implementation";

export type ProjectIntentKey = "regulated" | "validation" | "migration" | "integrations" | "uat" | "cutover" | "aiDelivery";

export interface ProjectTemplateSummary {
  id: ProjectTemplateId;
  name: string;
  category: string;
  description: string;
  recommendedName: string;
  recommendedPhase: string;
  recommendedMethodology: string;
  intentDefaults: Record<ProjectIntentKey, boolean>;
  coverage: {
    workstreams: string[];
    milestones: number;
    tasks: number;
    documents: number;
    risks: number;
    costLines: number;
  };
}

export interface TemplateBuildInput {
  templateId: ProjectTemplateId;
  projectId: string;
  projectName: string;
  client: string;
  startDate: string;
  goLiveDate: string;
  methodology: string;
}

export interface TemplateOperatingModel {
  template: ProjectTemplateSummary;
  charter: Charter;
  milestones: Milestone[];
  tasks: Task[];
  documents: Document[];
  risks: Risk[];
  teamMembers: TeamMember[];
  costLines: CostLine[];
  operatingNotes: string[];
}

export const PROJECT_TEMPLATES: ProjectTemplateSummary[] = [
  {
    id: "veeva-rim",
    name: "Veeva RIM implementation",
    category: "Regulatory",
    description: "Full RIM rollout across Registrations, Submissions, Publishing, Archive, Vault Connections, migration, validation, UAT, cutover, and hypercare.",
    recommendedName: "Veeva RIM Global Implementation",
    recommendedPhase: "Phase 1 - Mobilise",
    recommendedMethodology: "GAMP 5 / CSV",
    intentDefaults: {
      regulated: true,
      validation: true,
      migration: true,
      integrations: true,
      uat: true,
      cutover: true,
      aiDelivery: true,
    },
    coverage: {
      workstreams: [
        "Program Governance",
        "Registrations",
        "Submissions",
        "Publishing",
        "Archive",
        "Vault Connections",
        "Data Migration",
        "Validation",
        "UAT",
        "DAP / Adoption",
        "Cutover",
      ],
      milestones: 13,
      tasks: 31,
      documents: 12,
      risks: 7,
      costLines: 6,
    },
  },
  {
    id: "veeva-qualitydocs",
    name: "Veeva QualityDocs rollout",
    category: "Veeva Quality",
    description: "Controlled document management rollout for policies, SOPs, training impact, migration, approval workflows, validation, and go-live.",
    recommendedName: "Veeva QualityDocs Implementation",
    recommendedPhase: "Phase 1 - Mobilise",
    recommendedMethodology: "GAMP 5 / CSV",
    intentDefaults: {
      regulated: true,
      validation: true,
      migration: true,
      integrations: false,
      uat: true,
      cutover: true,
      aiDelivery: true,
    },
    coverage: {
      workstreams: ["Governance", "Document Taxonomy", "Lifecycle Design", "Migration", "Validation", "Training", "Cutover"],
      milestones: 7,
      tasks: 18,
      documents: 8,
      risks: 5,
      costLines: 4,
    },
  },
  {
    id: "veeva-clinical-ops",
    name: "Veeva Clinical operations rollout",
    category: "Veeva Clinical",
    description: "Clinical Vault rollout for study startup, site documents, TMF readiness, integrations, migration, UAT, and operational adoption.",
    recommendedName: "Veeva Clinical Operations Rollout",
    recommendedPhase: "Phase 1 - Discovery",
    recommendedMethodology: "GAMP 5 / CSV",
    intentDefaults: {
      regulated: true,
      validation: true,
      migration: true,
      integrations: true,
      uat: true,
      cutover: true,
      aiDelivery: true,
    },
    coverage: {
      workstreams: ["Clinical Governance", "Study Startup", "eTMF", "Integrations", "Migration", "Validation", "Site Adoption", "Cutover"],
      milestones: 8,
      tasks: 20,
      documents: 8,
      risks: 5,
      costLines: 5,
    },
  },
  {
    id: "veeva-promomats",
    name: "Veeva PromoMats implementation",
    category: "Veeva Commercial",
    description: "Commercial content and MLR implementation covering claims, review workflows, digital asset controls, training, validation, and launch readiness.",
    recommendedName: "Veeva PromoMats Implementation",
    recommendedPhase: "Phase 1 - Mobilise",
    recommendedMethodology: "Hybrid",
    intentDefaults: {
      regulated: true,
      validation: true,
      migration: true,
      integrations: true,
      uat: true,
      cutover: true,
      aiDelivery: true,
    },
    coverage: {
      workstreams: ["Governance", "MLR Process", "Content Migration", "Claims", "Integrations", "Validation", "Training", "Launch"],
      milestones: 8,
      tasks: 19,
      documents: 7,
      risks: 5,
      costLines: 4,
    },
  },
  {
    id: "sap-s4hana",
    name: "SAP S/4HANA implementation",
    category: "SAP ERP",
    description: "ERP implementation structure for fit-to-standard, process design, data migration, integrations, testing, cutover, controls, and hypercare.",
    recommendedName: "SAP S/4HANA Implementation",
    recommendedPhase: "Discover / Prepare",
    recommendedMethodology: "SAP Activate",
    intentDefaults: {
      regulated: true,
      validation: true,
      migration: true,
      integrations: true,
      uat: true,
      cutover: true,
      aiDelivery: true,
    },
    coverage: {
      workstreams: ["Program Governance", "Fit-to-Standard", "Finance", "Supply Chain", "Data Migration", "Integrations", "Testing", "Controls", "Cutover"],
      milestones: 9,
      tasks: 24,
      documents: 9,
      risks: 6,
      costLines: 6,
    },
  },
  {
    id: "sap-master-data",
    name: "SAP master data migration",
    category: "SAP Data",
    description: "Master data program for inventory, ownership, mapping, cleanse, mock loads, reconciliation, governance, and production cutover.",
    recommendedName: "SAP Master Data Migration",
    recommendedPhase: "Phase 1 - Discovery",
    recommendedMethodology: "SAP Activate / data migration",
    intentDefaults: {
      regulated: false,
      validation: false,
      migration: true,
      integrations: true,
      uat: true,
      cutover: true,
      aiDelivery: true,
    },
    coverage: {
      workstreams: ["Data Governance", "Material Master", "Vendor Master", "Customer Master", "Data Quality", "Mock Loads", "Reconciliation", "Cutover"],
      milestones: 8,
      tasks: 19,
      documents: 6,
      risks: 5,
      costLines: 4,
    },
  },
  {
    id: "sap-ewm",
    name: "SAP EWM warehouse rollout",
    category: "SAP Supply Chain",
    description: "Warehouse rollout covering process design, devices, integration touchpoints, master data, testing, cutover rehearsal, and site readiness.",
    recommendedName: "SAP EWM Warehouse Rollout",
    recommendedPhase: "Phase 1 - Mobilise",
    recommendedMethodology: "SAP Activate",
    intentDefaults: {
      regulated: false,
      validation: false,
      migration: true,
      integrations: true,
      uat: true,
      cutover: true,
      aiDelivery: true,
    },
    coverage: {
      workstreams: ["Warehouse Process", "Devices", "Interfaces", "Master Data", "Testing", "Training", "Cutover", "Site Readiness"],
      milestones: 8,
      tasks: 18,
      documents: 6,
      risks: 5,
      costLines: 5,
    },
  },
  {
    id: "lims-qc-lab",
    name: "LIMS QC laboratory rollout",
    category: "Laboratory",
    description: "LIMS delivery model for QC lab workflows, instruments, methods, sample lifecycle, validation, migration, training, and go-live readiness.",
    recommendedName: "QC Laboratory LIMS Rollout",
    recommendedPhase: "Phase 1 - Mobilise",
    recommendedMethodology: "GAMP 5 / CSV",
    intentDefaults: {
      regulated: true,
      validation: true,
      migration: true,
      integrations: true,
      uat: true,
      cutover: true,
      aiDelivery: true,
    },
    coverage: {
      workstreams: ["Lab Governance", "Sample Lifecycle", "Methods", "Instrument Interfaces", "Data Migration", "Validation", "Training", "Cutover"],
      milestones: 8,
      tasks: 20,
      documents: 9,
      risks: 6,
      costLines: 5,
    },
  },
  {
    id: "eqms-capa",
    name: "eQMS CAPA and deviation rollout",
    category: "Quality",
    description: "Quality process rollout for deviations, CAPA, change control, workflows, validation, training, inspection readiness, and hypercare.",
    recommendedName: "eQMS CAPA and Deviation Rollout",
    recommendedPhase: "Phase 1 - Process Design",
    recommendedMethodology: "GAMP 5 / CSV",
    intentDefaults: {
      regulated: true,
      validation: true,
      migration: false,
      integrations: true,
      uat: true,
      cutover: true,
      aiDelivery: true,
    },
    coverage: {
      workstreams: ["Quality Governance", "Deviation Process", "CAPA Process", "Change Control", "Validation", "Training", "Audit Readiness"],
      milestones: 7,
      tasks: 17,
      documents: 8,
      risks: 5,
      costLines: 4,
    },
  },
  {
    id: "mes-ebmr",
    name: "MES electronic batch record rollout",
    category: "Manufacturing",
    description: "MES/eBR rollout for master batch records, equipment interfaces, recipe design, validation, training, cutover, and shop-floor readiness.",
    recommendedName: "MES Electronic Batch Record Rollout",
    recommendedPhase: "Phase 1 - Mobilise",
    recommendedMethodology: "GAMP 5 / CSV",
    intentDefaults: {
      regulated: true,
      validation: true,
      migration: true,
      integrations: true,
      uat: true,
      cutover: true,
      aiDelivery: true,
    },
    coverage: {
      workstreams: ["Manufacturing Governance", "Recipe Design", "Equipment Interfaces", "Master Data", "Validation", "Operator Training", "Cutover"],
      milestones: 7,
      tasks: 19,
      documents: 8,
      risks: 6,
      costLines: 5,
    },
  },
  {
    id: "csv-validation",
    name: "CSV validation project",
    category: "Quality",
    description: "Validation-focused plan for URS, risk assessment, UAT/PQ, traceability, evidence, and validation summary approval.",
    recommendedName: "GxP System Validation Project",
    recommendedPhase: "Phase 1 - Validation Planning",
    recommendedMethodology: "GAMP 5 / CSV",
    intentDefaults: {
      regulated: true,
      validation: true,
      migration: false,
      integrations: false,
      uat: true,
      cutover: true,
      aiDelivery: false,
    },
    coverage: {
      workstreams: ["Validation", "QA", "Business Process", "UAT", "Cutover"],
      milestones: 7,
      tasks: 13,
      documents: 8,
      risks: 4,
      costLines: 3,
    },
  },
  {
    id: "data-migration",
    name: "Data migration project",
    category: "Migration",
    description: "Migration control structure for inventory, mapping, cleanse, dry runs, validation load, production load, and reconciliation.",
    recommendedName: "Regulated Data Migration Project",
    recommendedPhase: "Phase 1 - Discovery",
    recommendedMethodology: "Migration factory / CSV evidence",
    intentDefaults: {
      regulated: true,
      validation: true,
      migration: true,
      integrations: true,
      uat: false,
      cutover: true,
      aiDelivery: true,
    },
    coverage: {
      workstreams: ["Migration Governance", "Source Extract", "Data Quality", "Load Factory", "Reconciliation", "Cutover"],
      milestones: 8,
      tasks: 16,
      documents: 6,
      risks: 5,
      costLines: 4,
    },
  },
  {
    id: "generic-implementation",
    name: "Generic implementation",
    category: "General",
    description: "Reusable system implementation plan with governance, design, configuration, testing, training, go-live, and hypercare.",
    recommendedName: "Enterprise System Implementation",
    recommendedPhase: "Phase 1 - Mobilise",
    recommendedMethodology: "Agile / stage-gate",
    intentDefaults: {
      regulated: false,
      validation: false,
      migration: false,
      integrations: true,
      uat: true,
      cutover: true,
      aiDelivery: true,
    },
    coverage: {
      workstreams: ["Governance", "Process Design", "Configuration", "Testing", "Training", "Cutover"],
      milestones: 8,
      tasks: 15,
      documents: 5,
      risks: 4,
      costLines: 4,
    },
  },
];

export function getProjectTemplate(id: ProjectTemplateId): ProjectTemplateSummary {
  return PROJECT_TEMPLATES.find((template) => template.id === id) ?? PROJECT_TEMPLATES[0];
}

export function buildTemplateOperatingModel(input: TemplateBuildInput): TemplateOperatingModel {
  switch (input.templateId) {
    case "veeva-rim":
      return buildVeevaRimTemplate(input);
    case "veeva-qualitydocs":
    case "veeva-clinical-ops":
    case "veeva-promomats":
    case "sap-s4hana":
    case "sap-master-data":
    case "sap-ewm":
    case "lims-qc-lab":
    case "eqms-capa":
    case "mes-ebmr":
    case "csv-validation":
    case "data-migration":
    case "generic-implementation":
      return buildFocusedTemplate(input, getProjectTemplate(input.templateId));
    default:
      return buildFocusedTemplate(input, getProjectTemplate(input.templateId));
  }
}

function dateFrom(startDate: string, offsetDays: number): string {
  return addDays(startDate, offsetDays) ?? startDate;
}

function clampDate(iso: string, latestIso: string): string {
  return iso > latestIso ? latestIso : iso;
}

function clampMilestonesToGoLive(milestones: Milestone[], goLiveDate: string): Milestone[] {
  return milestones.map((milestone) => ({
    ...milestone,
    plannedDate: clampDate(milestone.plannedDate, goLiveDate),
    forecastDate: clampDate(milestone.forecastDate, goLiveDate),
  }));
}

function clampTasksToMilestones(tasks: Task[], milestones: Milestone[]): Task[] {
  const milestoneDateById = new Map(milestones.map((milestone) => [milestone.id, milestone.plannedDate]));
  return tasks.map((task) => {
    const milestoneDate = task.milestoneId ? milestoneDateById.get(task.milestoneId) : undefined;
    if (!milestoneDate || task.dueDate <= milestoneDate) return task;
    return { ...task, dueDate: milestoneDate };
  });
}

function makeTeam(projectId: string, members: Array<Omit<TeamMember, "projectId">>): TeamMember[] {
  return members.map((member) => ({ ...member, projectId }));
}

function buildCharter(input: TemplateBuildInput, template: ProjectTemplateSummary, specificScope: string[]): Charter {
  return {
    id: `charter-${input.projectId}`,
    projectId: input.projectId,
    purpose: `${input.projectName} gives ${input.client} a controlled operating model for delivery, validation, readiness, and executive decision-making.`,
    objectives: [
      "Confirm scope, ownership, and delivery gates before build begins",
      "Track schedule, quality, validation, migration, and adoption readiness in one command center",
      "Give SteerCo a traceable view of decisions, risks, budget, and go-live confidence",
    ],
    inScope: specificScope,
    outOfScope: [
      "Production data integrations beyond planned project scope",
      "Custom product development outside approved configuration and reporting",
      "Backend, SSO, and multi-user permissions in this static command-center prototype",
    ],
    successCriteria: [
      "All critical milestones have named owners and dates",
      "No go-live gate is marked ready without supporting documents or tasks",
      "Open high risks and decisions are visible before each SteerCo review",
      "Cutover and hypercare ownership is clear before final readiness review",
    ],
    assumptions: [
      "Business and IT workstream leads are available for design, UAT, and signoff windows",
      "Source-system owners can provide timely extracts and data-quality decisions",
      "Quality owns the validation strategy and evidence acceptance criteria",
    ],
    constraints: [
      `Target go-live is ${input.goLiveDate}`,
      "Validated or regulated scope cannot bypass QA review",
      "Material scope changes require sponsor decision before go-live readiness is claimed",
    ],
    sponsor: "Executive Sponsor",
    projectManager: "Project Manager",
    budgetSummary: "Budget is estimated by workstream and refined after design baseline.",
    status: "draft",
    lastUpdated: input.startDate,
  };
}

function buildVeevaRimTemplate(input: TemplateBuildInput): TemplateOperatingModel {
  const template = getProjectTemplate("veeva-rim");
  const p = input.projectId;
  const milestone = (n: number): string => `${p}-m${n}`;
  const task = (n: number): string => `${p}-t${n}`;
  const document = (n: number): string => `${p}-d${n}`;
  const risk = (n: number): string => `${p}-r${n}`;
  const cost = (n: number): string => `${p}-c${n}`;

  const teamMembers = makeTeam(p, [
    { id: `${p}-tm1`, initials: "PM", name: "Project Manager", role: "Project Manager", workstream: "Program Governance", steercoRole: "mandatory" },
    { id: `${p}-tm2`, initials: "RO", name: "Regulatory Operations Lead", role: "Regulatory Operations Lead", workstream: "Registrations", steercoRole: "mandatory" },
    { id: `${p}-tm3`, initials: "RG", name: "Registrations Workstream Lead", role: "Workstream Lead", workstream: "Registrations" },
    { id: `${p}-tm4`, initials: "SU", name: "Submissions Workstream Lead", role: "Workstream Lead", workstream: "Submissions" },
    { id: `${p}-tm5`, initials: "PU", name: "Publishing Lead", role: "Workstream Lead", workstream: "Publishing" },
    { id: `${p}-tm6`, initials: "AR", name: "Archive Lead", role: "Workstream Lead", workstream: "Archive" },
    { id: `${p}-tm7`, initials: "CL", name: "Clinical Integration Lead", role: "Integration Lead", workstream: "Vault Connections" },
    { id: `${p}-tm8`, initials: "SA", name: "Safety Integration Lead", role: "Integration Lead", workstream: "Vault Connections" },
    { id: `${p}-tm9`, initials: "QM", name: "Quality/eQMS Lead", role: "Integration Lead", workstream: "Vault Connections" },
    { id: `${p}-tm10`, initials: "PR", name: "PromoMats Integration Lead", role: "Integration Lead", workstream: "Vault Connections" },
    { id: `${p}-tm11`, initials: "DM", name: "Data Migration Lead", role: "Migration Lead", workstream: "Data Migration", steercoRole: "optional" },
    { id: `${p}-tm12`, initials: "QA", name: "Validation / QA Lead", role: "Validation Lead", workstream: "Validation", steercoRole: "optional" },
    { id: `${p}-tm13`, initials: "DA", name: "DAP / Adoption Lead", role: "Adoption Lead", workstream: "DAP / Adoption" },
    { id: `${p}-tm14`, initials: "CT", name: "CTO / IT Architecture Lead", role: "Architecture Lead", workstream: "Architecture", steercoRole: "mandatory" },
    { id: `${p}-tm15`, initials: "SP", name: "Sponsor / SteerCo", role: "Executive Sponsor", workstream: "Executive", steercoRole: "mandatory" },
  ]);

  const rawMilestones: Milestone[] = [
    { id: milestone(1), name: "Charter and governance approved", phase: "Initiation", plannedDate: dateFrom(input.startDate, 5), forecastDate: dateFrom(input.startDate, 5), status: "pending", locked: false, owner: "PM", duration: 5, projectId: p },
    { id: milestone(2), name: "Process design baseline approved", phase: "Design", plannedDate: dateFrom(input.startDate, 25), forecastDate: dateFrom(input.startDate, 25), status: "pending", locked: false, owner: "RO", duration: 15, predecessor: milestone(1), lag: 1, projectId: p },
    { id: milestone(3), name: "RIM data model and scope frozen", phase: "Design", plannedDate: dateFrom(input.startDate, 35), forecastDate: dateFrom(input.startDate, 35), status: "pending", locked: false, owner: "RG", duration: 10, predecessor: milestone(2), lag: 0, projectId: p },
    { id: milestone(4), name: "Vault Connections design approved", phase: "Design", plannedDate: dateFrom(input.startDate, 42), forecastDate: dateFrom(input.startDate, 42), status: "pending", locked: false, owner: "CT", duration: 10, predecessor: milestone(2), lag: 0, projectId: p },
    { id: milestone(5), name: "Configuration sprint 1 complete", phase: "Config", plannedDate: dateFrom(input.startDate, 60), forecastDate: dateFrom(input.startDate, 60), status: "pending", locked: false, owner: "SU", duration: 15, predecessor: milestone(3), lag: 1, projectId: p },
    { id: milestone(6), name: "Migration dry run 1 reconciled", phase: "Config", plannedDate: dateFrom(input.startDate, 72), forecastDate: dateFrom(input.startDate, 72), status: "pending", locked: false, owner: "DM", duration: 10, predecessor: milestone(3), lag: 1, projectId: p },
    { id: milestone(7), name: "Validation strategy and URS approved", phase: "Testing", plannedDate: dateFrom(input.startDate, 78), forecastDate: dateFrom(input.startDate, 78), status: "pending", locked: false, owner: "QA", duration: 12, predecessor: milestone(5), lag: 0, projectId: p },
    { id: milestone(8), name: "SIT complete", phase: "Testing", plannedDate: dateFrom(input.startDate, 100), forecastDate: dateFrom(input.startDate, 100), status: "pending", locked: false, owner: "CT", duration: 15, predecessor: milestone(7), lag: 1, projectId: p },
    { id: milestone(9), name: "UAT complete", phase: "Testing", plannedDate: dateFrom(input.startDate, 120), forecastDate: dateFrom(input.startDate, 120), status: "pending", locked: false, owner: "QA", duration: 15, predecessor: milestone(8), lag: 1, projectId: p },
    { id: milestone(10), name: "PQ and validation summary approved", phase: "Testing", plannedDate: dateFrom(input.startDate, 132), forecastDate: dateFrom(input.startDate, 132), status: "pending", locked: false, owner: "QA", duration: 10, predecessor: milestone(9), lag: 0, projectId: p },
    { id: milestone(11), name: "Cutover rehearsal complete", phase: "Training", plannedDate: dateFrom(input.startDate, 142), forecastDate: dateFrom(input.startDate, 142), status: "pending", locked: false, owner: "PM", duration: 5, predecessor: milestone(10), lag: 1, projectId: p },
    { id: milestone(12), name: "Go-live readiness approved", phase: "Go-Live", plannedDate: dateFrom(input.goLiveDate, -5), forecastDate: dateFrom(input.goLiveDate, -5), status: "pending", locked: false, owner: "SP", duration: 3, predecessor: milestone(11), lag: 1, projectId: p },
    { id: milestone(13), name: "Production go-live", phase: "Go-Live", plannedDate: input.goLiveDate, forecastDate: input.goLiveDate, status: "pending", locked: true, owner: "PM", duration: 1, predecessor: milestone(12), lag: 1, projectId: p },
  ];

  const milestones = clampMilestonesToGoLive(rawMilestones, input.goLiveDate);

  const rawTasks: Task[] = [
    { id: task(1), name: "Confirm RIM scope across Registrations, Submissions, Publishing, and Archive", workstream: "Program Governance", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(1), owner: "PM", dueDate: dateFrom(input.startDate, 5), projectId: p },
    { id: task(2), name: "Define SteerCo cadence, CCB rules, and decision log ownership", workstream: "Program Governance", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(1), owner: "PM", dueDate: dateFrom(input.startDate, 7), dependsOn: [task(1)], projectId: p },
    { id: task(3), name: "Map global registration data objects and market scope", workstream: "Registrations", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(3), owner: "RG", dueDate: dateFrom(input.startDate, 25), dependsOn: [task(1)], projectId: p },
    { id: task(4), name: "Design registration impact-assessment workflow", workstream: "Registrations", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(3), owner: "RG", dueDate: dateFrom(input.startDate, 35), dependsOn: [task(3)], projectId: p },
    { id: task(5), name: "Define application, submission, and regulatory objective relationships", workstream: "Submissions", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(2), owner: "SU", dueDate: dateFrom(input.startDate, 28), dependsOn: [task(1)], projectId: p },
    { id: task(6), name: "Configure submission content-plan template baseline", workstream: "Submissions", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(5), owner: "SU", dueDate: dateFrom(input.startDate, 58), dependsOn: [task(5)], projectId: p },
    { id: task(7), name: "Define publishing validation criteria and continuous-publishing checks", workstream: "Publishing", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(5), owner: "PU", dueDate: dateFrom(input.startDate, 55), dependsOn: [task(5)], projectId: p },
    { id: task(8), name: "Set up publishing overlays, TOC rules, lifecycle operations, and gateway checks", workstream: "Publishing", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(8), owner: "PU", dueDate: dateFrom(input.startDate, 92), dependsOn: [task(7)], projectId: p },
    { id: task(9), name: "Define archive import scope and active dossier viewer needs", workstream: "Archive", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(2), owner: "AR", dueDate: dateFrom(input.startDate, 32), dependsOn: [task(1)], projectId: p },
    { id: task(10), name: "Prepare legacy dossier import and archive verification plan", workstream: "Archive", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(8), owner: "AR", dueDate: dateFrom(input.startDate, 95), dependsOn: [task(9)], projectId: p },
    { id: task(11), name: "Design Clinical Operations Vault connection flow", workstream: "Vault Connections", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(4), owner: "CL", dueDate: dateFrom(input.startDate, 40), dependsOn: [task(5)], projectId: p },
    { id: task(12), name: "Design Safety Vault connection flow", workstream: "Vault Connections", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(4), owner: "SA", dueDate: dateFrom(input.startDate, 40), dependsOn: [task(5)], projectId: p },
    { id: task(13), name: "Design Quality/eQMS Vault connection flow", workstream: "Vault Connections", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(4), owner: "QM", dueDate: dateFrom(input.startDate, 42), dependsOn: [task(5)], projectId: p },
    { id: task(14), name: "Design PromoMats to RIM regulatory submission handoff", workstream: "Vault Connections", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(4), owner: "PR", dueDate: dateFrom(input.startDate, 42), dependsOn: [task(5)], projectId: p },
    { id: task(15), name: "Create source-system inventory and object mapping workbook", workstream: "Data Migration", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(6), owner: "DM", dueDate: dateFrom(input.startDate, 35), dependsOn: [task(1)], projectId: p },
    { id: task(16), name: "Run extract and transformation logic for migration dry run 1", workstream: "Data Migration", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(6), owner: "DM", dueDate: dateFrom(input.startDate, 65), dependsOn: [task(15)], projectId: p },
    { id: task(17), name: "Reconcile dry run 1 counts, relationships, renditions, and audit evidence", workstream: "Data Migration", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(6), owner: "DM", dueDate: dateFrom(input.startDate, 72), dependsOn: [task(16)], projectId: p },
    { id: task(18), name: "Approve validation strategy and risk-based testing scope", workstream: "Validation", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(7), owner: "QA", dueDate: dateFrom(input.startDate, 50), dependsOn: [task(1)], projectId: p },
    { id: task(19), name: "Author URS and trace requirements to configured RIM process areas", workstream: "Validation", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(7), owner: "QA", dueDate: dateFrom(input.startDate, 70), dependsOn: [task(18), task(6)], projectId: p },
    { id: task(20), name: "Prepare UAT/PQ scripts for Registrations, Submissions, Publishing, Archive", workstream: "UAT", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(9), owner: "QA", dueDate: dateFrom(input.startDate, 95), dependsOn: [task(19)], projectId: p },
    { id: task(21), name: "Execute SIT for Vault Connections and migration load paths", workstream: "UAT", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(8), owner: "CT", dueDate: dateFrom(input.startDate, 100), dependsOn: [task(8), task(14), task(17)], projectId: p },
    { id: task(22), name: "Run business UAT and capture defects by persona", workstream: "UAT", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(9), owner: "QA", dueDate: dateFrom(input.startDate, 118), dependsOn: [task(20), task(21)], projectId: p },
    { id: task(23), name: "Approve validation summary report and PQ evidence pack", workstream: "Validation", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(10), owner: "QA", dueDate: dateFrom(input.startDate, 132), dependsOn: [task(22)], projectId: p },
    { id: task(24), name: "Prepare role-based training and in-app adoption guidance", workstream: "DAP / Adoption", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(11), owner: "DA", dueDate: dateFrom(input.startDate, 120), dependsOn: [task(22)], projectId: p },
    { id: task(25), name: "Run readiness walkthroughs for regulatory operations and affiliates", workstream: "DAP / Adoption", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(11), owner: "DA", dueDate: dateFrom(input.startDate, 138), dependsOn: [task(24)], projectId: p },
    { id: task(26), name: "Finalize production cutover sequence and rollback plan", workstream: "Cutover", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(11), owner: "PM", dueDate: dateFrom(input.startDate, 140), dependsOn: [task(23), task(25)], projectId: p },
    { id: task(27), name: "Complete production migration load and reconciliation", workstream: "Cutover", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(13), owner: "DM", dueDate: dateFrom(input.goLiveDate, -1), dependsOn: [task(26)], projectId: p },
    { id: task(28), name: "Confirm gateway readiness and submission publishing smoke test", workstream: "Cutover", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(12), owner: "PU", dueDate: dateFrom(input.goLiveDate, -3), dependsOn: [task(26)], projectId: p },
    { id: task(29), name: "Hold final go-live decision meeting", workstream: "Program Governance", priority: "Critical", status: "Not Started", progress: 0, milestoneId: milestone(12), owner: "SP", dueDate: dateFrom(input.goLiveDate, -2), dependsOn: [task(27), task(28)], projectId: p },
    { id: task(30), name: "Open hypercare triage and command-center rhythm", workstream: "Program Governance", priority: "High", status: "Not Started", progress: 0, milestoneId: milestone(13), owner: "PM", dueDate: input.goLiveDate, dependsOn: [task(29)], projectId: p },
    { id: task(31), name: "Close week-one hypercare findings and ownership handoff", workstream: "Program Governance", priority: "Medium", status: "Not Started", progress: 0, owner: "PM", dueDate: dateFrom(input.goLiveDate, 7), dependsOn: [task(30)], projectId: p },
  ];

  const tasks = clampTasksToMilestones(rawTasks, milestones);

  const docs = [
    ["Program Charter", "CHTR", "Governance", "Planning", 5, "Scope, governance, sponsor accountability, and success criteria."],
    ["Validation Master Plan", "VMP", "Compliance", "Planning", 18, "Validation strategy, roles, deliverables, and evidence acceptance."],
    ["User Requirements Specification", "URS", "Business", "Validation", 55, "Requirements for RIM modules, integrations, migration, and controls."],
    ["Configuration Specification", "CS", "Technical", "Configuration", 70, "Configured lifecycles, objects, security, and workflows."],
    ["Vault Connections Design", "VCD", "Technical", "Configuration", 45, "Clinical, Safety, Quality/eQMS, and PromoMats connection design."],
    ["Data Migration Strategy", "DMS", "Migration", "Planning", 35, "Extract, transform, dry-run, reconciliation, and load approach."],
    ["UAT / PQ Protocol", "UAT", "Validation", "Validation", 92, "Persona-based UAT/PQ scripts and execution rules."],
    ["Traceability Matrix", "TMX", "Validation", "Validation", 112, "URS to configuration to UAT/PQ evidence coverage."],
    ["Validation Summary Report", "VSR", "Compliance", "Validation", 132, "Final validation outcome and residual-risk signoff."],
    ["Training and DAP Plan", "DAP", "Training", "Training", 118, "Role-based training and adoption support plan."],
    ["Cutover Runbook", "CUT", "Go-Live", "Go-Live", 138, "Production cutover, rollback, ownership, and communication sequence."],
    ["Hypercare Playbook", "HYP", "Go-Live", "Go-Live", 145, "Issue triage, support rhythm, and handoff rules."],
  ] as const;

  const documents: Document[] = docs.map(([name, abbreviation, type, phase, offset, description], index) => ({
    id: document(index + 1),
    name,
    abbreviation,
    type,
    phase,
    version: "0.1",
    status: "draft",
    dueDate: dateFrom(input.startDate, offset),
    description,
    owner: index === 5 ? "DM" : index === 4 ? "CT" : index >= 1 && index <= 8 ? "QA" : "PM",
    reviewers: [
      { person: "Project Manager", initials: "PM", role: "PM", status: "pending" },
      { person: "Validation / QA Lead", initials: "QA", role: "QA", status: "pending" },
    ],
    approvers: [
      { person: "Sponsor / SteerCo", initials: "SP", role: "Sponsor", status: "pending" },
    ],
    projectId: p,
  }));

  const risks: Risk[] = [
    { id: risk(1), title: "Registration data model decisions arrive late", category: "Scope", probability: 3, impact: 5, score: 15, status: "open", owner: "RG", mitigation: "Run data-model decision workshops in mobilisation and track decisions weekly.", projectId: p },
    { id: risk(2), title: "Vault Connections scope expands after design baseline", category: "Integration", probability: 4, impact: 4, score: 16, status: "open", owner: "CT", mitigation: "Freeze connection object flows and route new flows through CCB.", projectId: p },
    { id: risk(3), title: "Legacy migration quality blocks dry-run reconciliation", category: "Migration", probability: 4, impact: 5, score: 20, status: "open", owner: "DM", mitigation: "Profile source data early and agree mandatory cleanse rules before dry run 1.", projectId: p },
    { id: risk(4), title: "UAT scripts do not cover real regulatory user journeys", category: "Validation", probability: 3, impact: 5, score: 15, status: "open", owner: "QA", mitigation: "Trace every critical persona journey to URS and PQ evidence.", projectId: p },
    { id: risk(5), title: "Publishing gateway readiness is discovered too late", category: "Technical", probability: 3, impact: 4, score: 12, status: "open", owner: "PU", mitigation: "Add gateway smoke test before final readiness gate.", projectId: p },
    { id: risk(6), title: "Affiliate users resist new RIM process", category: "Adoption", probability: 3, impact: 3, score: 9, status: "open", owner: "DA", mitigation: "Use role-based walkthroughs and hypercare floor-walking.", projectId: p },
    { id: risk(7), title: "Validation evidence is scattered across tools", category: "Compliance", probability: 2, impact: 5, score: 10, status: "open", owner: "QA", mitigation: "Define evidence location, naming, and traceability ownership before UAT.", projectId: p },
  ];

  const costLines: CostLine[] = [
    { id: cost(1), category: "Implementation", description: "RIM configuration and workstream delivery", budgetK: 780, actualK: 0, contractType: "T&M", owner: "PM", projectId: p },
    { id: cost(2), category: "Integration", description: "Vault Connections and gateway readiness", budgetK: 360, actualK: 0, contractType: "T&M", owner: "CT", projectId: p },
    { id: cost(3), category: "Migration", description: "Legacy-to-Vault migration factory", budgetK: 420, actualK: 0, contractType: "Fixed", owner: "DM", projectId: p },
    { id: cost(4), category: "Validation", description: "CSV, UAT/PQ, traceability, and evidence", budgetK: 340, actualK: 0, contractType: "T&M", owner: "QA", projectId: p },
    { id: cost(5), category: "Training", description: "DAP, training, and hypercare adoption", budgetK: 180, actualK: 0, contractType: "T&M", owner: "DA", projectId: p },
    { id: cost(6), category: "Internal", description: "Program governance and SteerCo overhead", budgetK: 220, actualK: 0, contractType: "Internal", owner: "PM", projectId: p },
  ];

  return {
    template,
    charter: buildCharter(input, template, [
      "Veeva Registrations, Submissions, Submissions Publishing, and Submissions Archive implementation",
      "Vault Connections with Clinical Operations, Safety, Quality/eQMS, and PromoMats",
      "Legacy regulatory data and document migration into Vault RIM",
      "Risk-based validation, UAT/PQ, traceability, cutover, go-live, and hypercare",
    ]),
    milestones,
    tasks,
    documents,
    risks,
    teamMembers,
    costLines,
    operatingNotes: [
      "Vault Connections are represented as workstream tasks in this pass; a first-class connection register is a P0 follow-up.",
      "Migration dry runs are represented as tasks and milestones; a migration run object is a P0 follow-up.",
      "Validation traceability is represented by documents and tasks; a URS-to-test traceability model is a P0 follow-up.",
    ],
  };
}

function buildFocusedTemplate(input: TemplateBuildInput, template: ProjectTemplateSummary): TemplateOperatingModel {
  const p = input.projectId;
  const milestone = (n: number): string => `${p}-m${n}`;
  const task = (n: number): string => `${p}-t${n}`;
  const document = (n: number): string => `${p}-d${n}`;
  const risk = (n: number): string => `${p}-r${n}`;
  const cost = (n: number): string => `${p}-c${n}`;

  const teamMembers = makeTeam(p, template.coverage.workstreams.slice(0, 8).map((workstream, index) => ({
    id: `${p}-tm${index + 1}`,
    initials: workstream.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    name: `${workstream} Lead`,
    role: index === 0 ? "Project Manager" : "Workstream Lead",
    workstream,
    steercoRole: index === 0 ? "mandatory" as const : undefined,
  })));

  const rawMilestones: Milestone[] = template.coverage.workstreams.slice(0, template.coverage.milestones).map((workstream, index) => ({
    id: milestone(index + 1),
    name: `${workstream} gate approved`,
    phase: index < 2 ? "Initiation" : index < 4 ? "Design" : index < 6 ? "Testing" : index < 7 ? "Training" : "Go-Live",
    plannedDate: index === template.coverage.milestones - 1 ? input.goLiveDate : dateFrom(input.startDate, 7 + (index * 14)),
    forecastDate: index === template.coverage.milestones - 1 ? input.goLiveDate : dateFrom(input.startDate, 7 + (index * 14)),
    status: "pending",
    locked: index === template.coverage.milestones - 1,
    owner: teamMembers[index % teamMembers.length]?.initials ?? "PM",
    duration: 5,
    predecessor: index > 0 ? milestone(index) : undefined,
    lag: index > 0 ? 1 : undefined,
    projectId: p,
  }));

  const milestones = clampMilestonesToGoLive(rawMilestones, input.goLiveDate);

  const rawTasks: Task[] = Array.from({ length: template.coverage.tasks }, (_, index) => {
    const workstream = template.coverage.workstreams[index % template.coverage.workstreams.length];
    const owner = teamMembers.find((member) => member.workstream === workstream)?.initials ?? teamMembers[0]?.initials ?? "PM";
    return {
      id: task(index + 1),
      name: `${workstream}: complete setup activity ${index + 1}`,
      workstream,
      priority: index < 3 ? "Critical" : index < 8 ? "High" : "Medium",
      status: "Not Started",
      progress: 0,
      milestoneId: milestones[index % milestones.length]?.id,
      owner,
      dueDate: dateFrom(input.startDate, 10 + (index * 5)),
      dependsOn: index > 0 ? [task(index)] : undefined,
      projectId: p,
    };
  });

  const tasks = clampTasksToMilestones(rawTasks, milestones);

  const documents: Document[] = Array.from({ length: template.coverage.documents }, (_, index) => ({
    id: document(index + 1),
    name: `${template.name} document ${index + 1}`,
    abbreviation: `DOC${index + 1}`,
    type: index < 2 ? "Governance" : index < 5 ? "Validation" : "Operational",
    phase: index < 2 ? "Planning" : index < 4 ? "Configuration" : index < 6 ? "Validation" : index < 7 ? "Training" : "Go-Live",
    version: "0.1",
    status: "draft",
    dueDate: dateFrom(input.startDate, 14 + (index * 10)),
    description: `Starter artifact for ${template.name}.`,
    owner: teamMembers[index % teamMembers.length]?.initials ?? "PM",
    reviewers: [{ person: "Project Manager", initials: "PM", role: "PM", status: "pending" }],
    approvers: [{ person: "Sponsor", initials: "SP", role: "Sponsor", status: "pending" }],
    projectId: p,
  }));

  const risks: Risk[] = Array.from({ length: template.coverage.risks }, (_, index) => ({
    id: risk(index + 1),
    title: `${template.category} delivery risk ${index + 1}`,
    category: index % 2 === 0 ? "Delivery" : "Quality",
    probability: index < 2 ? 3 : 2,
    impact: index < 2 ? 4 : 3,
    score: index < 2 ? 12 : 6,
    status: "open",
    owner: teamMembers[index % teamMembers.length]?.initials ?? "PM",
    mitigation: "Confirm owner, decision path, and next review date during mobilisation.",
    projectId: p,
  }));

  const costLines: CostLine[] = Array.from({ length: template.coverage.costLines }, (_, index) => ({
    id: cost(index + 1),
    category: ["Implementation", "Validation", "Migration", "Integration", "Training", "Internal"][index] ?? "Delivery",
    description: `${template.name} cost line ${index + 1}`,
    budgetK: [300, 180, 220, 160, 120, 90][index] ?? 100,
    actualK: 0,
    contractType: index === template.coverage.costLines - 1 ? "Internal" : "T&M",
    owner: teamMembers[index % teamMembers.length]?.initials ?? "PM",
    projectId: p,
  }));

  return {
    template,
    charter: buildCharter(input, template, template.coverage.workstreams.map((workstream) => `${workstream} delivery and readiness`)),
    milestones,
    tasks,
    documents,
    risks,
    teamMembers,
    costLines,
    operatingNotes: [
      "This focused template uses the standard registers and can be deepened with project-specific entities later.",
    ],
  };
}

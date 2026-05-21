import { daysBetween } from "../domain/dates";
import type { ProjectTemplateId } from "../templates/project-templates";

export type IntakeOption<T extends string> = {
  id: T;
  label: string;
  description: string;
  example: string;
};

export type IndustryId =
  | "pharma-biotech"
  | "medtech"
  | "finance"
  | "healthcare"
  | "manufacturing"
  | "public-sector"
  | "generic-it";

export type ProjectTypeId =
  | "implementation"
  | "migration"
  | "upgrade"
  | "validation"
  | "rollout"
  | "remediation"
  | "assessment"
  | "workshop"
  | "cutover-rehearsal";

export type SystemFamilyId =
  | "veeva"
  | "sap"
  | "eqms"
  | "lims"
  | "mes"
  | "microsoft"
  | "salesforce"
  | "custom"
  | "generic";

export type ControlModelId =
  | "gxp-csv"
  | "csa"
  | "sox"
  | "hipaa"
  | "iso"
  | "internal-controls"
  | "public-security"
  | "non-regulated";

export type RegionId = "europe" | "us" | "uk" | "global" | "dach" | "apac" | "country-rollout";

export type ScopeElementId =
  | "migration"
  | "integrations"
  | "validation"
  | "uat"
  | "training"
  | "cutover"
  | "hypercare"
  | "reporting"
  | "data-quality"
  | "board-governance";

export type OwnershipModelId = "human-led" | "agent-led" | "hybrid";
export type ReportingModelId = "pm-only" | "workstream" | "steerco" | "board" | "audit-ready";
export type TimelineCriticalityId = "fixed" | "target" | "flexible";
export type DeliveryMethodId = "gamp-csv" | "sap-activate" | "agile" | "waterfall" | "hybrid";

export type FeasibilityStatus = "credible" | "compressed" | "impossible";

export type SetupIntake = {
  industry: IndustryId;
  projectType: ProjectTypeId;
  systemFamily: SystemFamilyId;
  controlModel: ControlModelId;
  region: RegionId;
  scopeElements: ScopeElementId[];
  ownershipModel: OwnershipModelId;
  reportingModels: ReportingModelId[];
  timelineCriticality: TimelineCriticalityId;
  deliveryMethod: DeliveryMethodId;
};

export type SetupFeasibility = {
  status: FeasibilityStatus;
  title: string;
  summary: string;
  minimumDays: number;
  plannedDays: number;
  reasons: string[];
  suggestions: string[];
  boardWarning?: string;
};

export const INDUSTRY_OPTIONS: IntakeOption<IndustryId>[] = [
  { id: "pharma-biotech", label: "Pharma / Biotech", description: "Life-sciences delivery with regulatory, quality, validation, and market readiness expectations.", example: "Veeva RIM, SAP GxP, eQMS, LIMS." },
  { id: "medtech", label: "MedTech", description: "Device or quality-system programs with controlled process and evidence needs.", example: "eQMS rollout, complaint/CAPA workflow." },
  { id: "finance", label: "Finance / Banking", description: "Controlled delivery with audit, risk, privacy, and financial reporting needs.", example: "SOX control platform migration." },
  { id: "healthcare", label: "Healthcare", description: "Operational or data programs with privacy and clinical safety controls.", example: "Patient portal rollout." },
  { id: "manufacturing", label: "Manufacturing", description: "Plant, quality, ERP, MES, and traceability-heavy programs.", example: "SAP manufacturing rollout." },
  { id: "public-sector", label: "Public Sector", description: "Programs with procurement, security, accessibility, and formal governance gates.", example: "Case-management system rollout." },
  { id: "generic-it", label: "Generic IT / SaaS", description: "Business-system implementation without a heavy regulated evidence model.", example: "CRM or collaboration tool rollout." },
];

export const PROJECT_TYPE_OPTIONS: IntakeOption<ProjectTypeId>[] = [
  { id: "implementation", label: "Full implementation", description: "Design, build, test, cutover, go-live, and hypercare.", example: "SAP S/4HANA or Veeva RIM rollout." },
  { id: "migration", label: "Migration", description: "Move data/documents/processes from old to new platform.", example: "Legacy dossier migration." },
  { id: "upgrade", label: "Upgrade", description: "Move an existing system to a new release or architecture.", example: "ECC to S/4 technical upgrade." },
  { id: "validation", label: "Validation", description: "Evidence-led work around URS, risk, UAT/PQ, traceability, and signoff.", example: "GxP validation package." },
  { id: "rollout", label: "Rollout", description: "Deploy an existing capability to new users, markets, or sites.", example: "EU affiliate rollout." },
  { id: "remediation", label: "Remediation", description: "Fix audit, data-quality, quality, or control gaps.", example: "Inspection finding remediation." },
  { id: "assessment", label: "Assessment", description: "Short discovery or readiness review with recommendations.", example: "2-day SAP readiness assessment." },
  { id: "workshop", label: "Workshop", description: "Focused working session or decision workshop.", example: "Fit-gap workshop." },
  { id: "cutover-rehearsal", label: "Cutover rehearsal", description: "Practice or validate a cutover plan without claiming full implementation.", example: "Weekend migration rehearsal." },
];

export const SYSTEM_FAMILY_OPTIONS: IntakeOption<SystemFamilyId>[] = [
  { id: "veeva", label: "Veeva", description: "Vault/RIM/quality/commercial Veeva programs.", example: "Veeva RIM implementation." },
  { id: "sap", label: "SAP", description: "ERP, quality, master data, manufacturing, and S/4HANA programs.", example: "SAP S/4HANA GxP rollout." },
  { id: "eqms", label: "eQMS", description: "Quality management systems and controlled quality workflows.", example: "Deviation/CAPA implementation." },
  { id: "lims", label: "LIMS", description: "Laboratory systems and lab data/process programs.", example: "QC lab LIMS rollout." },
  { id: "mes", label: "MES", description: "Manufacturing execution and plant-floor systems.", example: "MES batch-record rollout." },
  { id: "microsoft", label: "Microsoft", description: "Planner, Project, Power Platform, SharePoint, Dynamics, or M365 programs.", example: "Power Platform governance rollout." },
  { id: "salesforce", label: "Salesforce", description: "CRM and commercial/business process programs.", example: "Salesforce service rollout." },
  { id: "custom", label: "Custom system", description: "Bespoke or internally-built system delivery.", example: "Internal portal replacement." },
  { id: "generic", label: "Generic / unsure", description: "Use when system family is not yet known.", example: "Early discovery." },
];

export const CONTROL_MODEL_OPTIONS: IntakeOption<ControlModelId>[] = [
  { id: "gxp-csv", label: "GxP / CSV", description: "Validated life-sciences controls with QA evidence and signoff.", example: "Veeva RIM, SAP GxP, LIMS, MES." },
  { id: "csa", label: "CSA / risk-based validation", description: "Risk-based computerized system assurance.", example: "Modern GxP system assurance." },
  { id: "sox", label: "SOX / financial controls", description: "Financial reporting and internal-control evidence.", example: "ERP finance process change." },
  { id: "hipaa", label: "HIPAA / healthcare privacy", description: "Privacy, access, and healthcare data controls.", example: "Patient data platform." },
  { id: "iso", label: "ISO / quality controls", description: "Quality-system and audit control expectations.", example: "ISO 13485 quality process." },
  { id: "internal-controls", label: "Internal controls", description: "Controlled delivery without external validation package.", example: "Enterprise IT rollout." },
  { id: "public-security", label: "Public-sector security", description: "Procurement/security/classification gates.", example: "Government platform rollout." },
  { id: "non-regulated", label: "Non-regulated", description: "No formal compliance evidence beyond good delivery practice.", example: "Team collaboration app rollout." },
];

export const REGION_OPTIONS: IntakeOption<RegionId>[] = [
  { id: "europe", label: "Europe / EU", description: "European markets, privacy, languages, affiliate rollout, and EMA-style expectations where relevant.", example: "EU regulatory rollout." },
  { id: "us", label: "US", description: "US market, FDA/HIPAA/SOX style control expectations where relevant.", example: "US quality rollout." },
  { id: "uk", label: "UK", description: "UK market, MHRA/privacy/procurement considerations where relevant.", example: "UK affiliate cutover." },
  { id: "global", label: "Global", description: "Multiple regions, global governance, rollout waves, and calendar complexity.", example: "Global SAP rollout." },
  { id: "dach", label: "DACH", description: "Germany/Austria/Switzerland rollout, language and local calendar needs.", example: "DACH affiliate rollout." },
  { id: "apac", label: "APAC", description: "APAC rollout waves, time zones, and market readiness.", example: "APAC market deployment." },
  { id: "country-rollout", label: "Country rollout", description: "A single local-market rollout or affiliate deployment.", example: "Italy affiliate go-live." },
];

export const SCOPE_OPTIONS: IntakeOption<ScopeElementId>[] = [
  { id: "migration", label: "Migration", description: "Source inventory, mapping, dry runs, reconciliation.", example: "Legacy dossiers to Vault." },
  { id: "integrations", label: "Integrations", description: "Connections, APIs, interfaces, gateway or system handoffs.", example: "Vault-to-Vault or SAP interfaces." },
  { id: "validation", label: "Validation", description: "URS, risk, UAT/PQ, evidence, summary report.", example: "GxP validation package." },
  { id: "uat", label: "UAT / PQ", description: "Business or validation testing with scripts, defects, signoff.", example: "Affiliate UAT." },
  { id: "training", label: "Training / DAP", description: "Role-based training, adoption, and hypercare enablement.", example: "Regulatory user training." },
  { id: "cutover", label: "Cutover", description: "Go-live runbook, readiness, rollback, communication.", example: "Production cutover weekend." },
  { id: "hypercare", label: "Hypercare", description: "Post go-live triage, support, handoff.", example: "30-day hypercare." },
  { id: "reporting", label: "Reporting", description: "Dashboards, board packs, status outputs.", example: "SteerCo reporting." },
  { id: "data-quality", label: "Data quality", description: "Profiling, cleansing, defect resolution.", example: "Master data cleanse." },
  { id: "board-governance", label: "Board governance", description: "Decision cadence and executive transparency.", example: "Board-ready monthly pack." },
];

export const OWNERSHIP_OPTIONS: IntakeOption<OwnershipModelId>[] = [
  { id: "human-led", label: "Human-led", description: "Humans own workstreams and updates.", example: "Traditional PM + workstream leads." },
  { id: "agent-led", label: "Agent-led", description: "Agents own selected work packages with human accountability.", example: "Migration Agent prepares reconciliation draft." },
  { id: "hybrid", label: "Hybrid", description: "Humans and agents both own delivery lanes.", example: "PM plus QA/Data agents." },
];

export const REPORTING_OPTIONS: IntakeOption<ReportingModelId>[] = [
  { id: "pm-only", label: "PM only", description: "Lightweight PM tracking.", example: "Small internal project." },
  { id: "workstream", label: "Workstream", description: "Each lead reports owned work.", example: "Weekly workstream review." },
  { id: "steerco", label: "SteerCo", description: "Executive governance and decision packs.", example: "Biweekly SteerCo." },
  { id: "board", label: "Board", description: "Board-level transparency and escalation clarity.", example: "Monthly board update." },
  { id: "audit-ready", label: "Audit-ready", description: "Traceability and evidence confidence matter.", example: "Validated or inspected program." },
];

export const TIMELINE_OPTIONS: IntakeOption<TimelineCriticalityId>[] = [
  { id: "fixed", label: "Fixed date", description: "Date is externally committed; scope/cost must flex.", example: "Regulatory deadline." },
  { id: "target", label: "Target date", description: "Date matters but can be revised through governance.", example: "Planned go-live." },
  { id: "flexible", label: "Flexible", description: "Outcome is more important than date.", example: "Discovery or assessment." },
];

export const DELIVERY_METHOD_OPTIONS: IntakeOption<DeliveryMethodId>[] = [
  { id: "gamp-csv", label: "GAMP 5 / CSV", description: "Validated life-sciences delivery.", example: "Veeva RIM or LIMS." },
  { id: "sap-activate", label: "SAP Activate", description: "SAP phased delivery and quality gates.", example: "S/4HANA implementation." },
  { id: "agile", label: "Agile", description: "Iterative delivery with backlog and increments.", example: "SaaS rollout." },
  { id: "waterfall", label: "Waterfall / stage-gate", description: "Sequential design-build-test-go-live delivery.", example: "Formal procurement program." },
  { id: "hybrid", label: "Hybrid", description: "Mix of stage gates and iterative build.", example: "Regulated agile program." },
];

export function intakeFromTemplate(templateId: ProjectTemplateId): SetupIntake {
  if (templateId === "veeva-rim") {
    return {
      industry: "pharma-biotech",
      projectType: "implementation",
      systemFamily: "veeva",
      controlModel: "gxp-csv",
      region: "global",
      scopeElements: ["migration", "integrations", "validation", "uat", "training", "cutover", "hypercare", "board-governance"],
      ownershipModel: "hybrid",
      reportingModels: ["workstream", "steerco", "audit-ready"],
      timelineCriticality: "fixed",
      deliveryMethod: "gamp-csv",
    };
  }
  if (templateId === "data-migration") {
    return {
      industry: "pharma-biotech",
      projectType: "migration",
      systemFamily: "generic",
      controlModel: "gxp-csv",
      region: "europe",
      scopeElements: ["migration", "data-quality", "validation", "cutover", "reporting"],
      ownershipModel: "hybrid",
      reportingModels: ["workstream", "steerco", "audit-ready"],
      timelineCriticality: "target",
      deliveryMethod: "hybrid",
    };
  }
  if (templateId === "csv-validation") {
    return {
      industry: "pharma-biotech",
      projectType: "validation",
      systemFamily: "generic",
      controlModel: "gxp-csv",
      region: "europe",
      scopeElements: ["validation", "uat", "reporting", "board-governance"],
      ownershipModel: "human-led",
      reportingModels: ["workstream", "steerco", "audit-ready"],
      timelineCriticality: "target",
      deliveryMethod: "gamp-csv",
    };
  }
  return {
    industry: "generic-it",
    projectType: "implementation",
    systemFamily: "generic",
    controlModel: "internal-controls",
    region: "global",
    scopeElements: ["uat", "training", "cutover", "hypercare", "reporting"],
    ownershipModel: "hybrid",
    reportingModels: ["pm-only", "workstream"],
    timelineCriticality: "target",
    deliveryMethod: "hybrid",
  };
}

export function deliveryMethodLabel(method: DeliveryMethodId): string {
  return DELIVERY_METHOD_OPTIONS.find((option) => option.id === method)?.label ?? "Hybrid";
}

export function controlOptionsForIndustry(industry: IndustryId): IntakeOption<ControlModelId>[] {
  if (industry === "pharma-biotech" || industry === "medtech") {
    return CONTROL_MODEL_OPTIONS.filter((option) => ["gxp-csv", "csa", "iso", "internal-controls", "non-regulated"].includes(option.id));
  }
  if (industry === "finance") {
    return CONTROL_MODEL_OPTIONS.filter((option) => ["sox", "internal-controls", "non-regulated"].includes(option.id));
  }
  if (industry === "healthcare") {
    return CONTROL_MODEL_OPTIONS.filter((option) => ["hipaa", "internal-controls", "non-regulated"].includes(option.id));
  }
  if (industry === "public-sector") {
    return CONTROL_MODEL_OPTIONS.filter((option) => ["public-security", "internal-controls", "non-regulated"].includes(option.id));
  }
  if (industry === "manufacturing") {
    return CONTROL_MODEL_OPTIONS.filter((option) => ["iso", "gxp-csv", "internal-controls", "non-regulated"].includes(option.id));
  }
  return CONTROL_MODEL_OPTIONS.filter((option) => ["internal-controls", "non-regulated"].includes(option.id));
}

export function systemOptionsForIndustry(industry: IndustryId): IntakeOption<SystemFamilyId>[] {
  if (industry === "pharma-biotech" || industry === "medtech") {
    return SYSTEM_FAMILY_OPTIONS.filter((option) => ["veeva", "sap", "eqms", "lims", "mes", "microsoft", "custom", "generic"].includes(option.id));
  }
  if (industry === "manufacturing") {
    return SYSTEM_FAMILY_OPTIONS.filter((option) => ["sap", "mes", "eqms", "microsoft", "custom", "generic"].includes(option.id));
  }
  if (industry === "finance") {
    return SYSTEM_FAMILY_OPTIONS.filter((option) => ["sap", "microsoft", "salesforce", "custom", "generic"].includes(option.id));
  }
  return SYSTEM_FAMILY_OPTIONS;
}

export function evaluateSetupFeasibility(input: SetupIntake, startDate: string, goLiveDate: string): SetupFeasibility {
  const plannedDays = Math.max(0, daysBetween(startDate, goLiveDate));
  const minimumDays = estimateMinimumDays(input);
  const reasons: string[] = [];
  const suggestions: string[] = [];

  if (plannedDays < minimumDays * 0.35) {
    reasons.push(`${plannedDays} days is far below the ${minimumDays}-day minimum shape for this setup.`);
    suggestions.push("Change project type to assessment, workshop, or cutover rehearsal.");
    suggestions.push("Reduce scope elements or extend the timeline.");
    suggestions.push("Create only as a sponsor-approved exception if the date cannot move.");
    return {
      status: "impossible",
      title: "Timeline is not credible",
      summary: "The selected setup cannot honestly be run in this window.",
      minimumDays,
      plannedDays,
      reasons,
      suggestions,
      boardWarning: "Board pack must show this as an exception, not a normal implementation plan.",
    };
  }

  if (plannedDays < minimumDays) {
    reasons.push(`${plannedDays} days is below the ${minimumDays}-day recommended shape.`);
    if (input.timelineCriticality === "fixed") reasons.push("Fixed-date delivery means scope, cost, or risk must be actively governed.");
    suggestions.push("Keep the date only if scope is reduced or extra capacity is approved.");
    suggestions.push("Seed a timeline-compression risk and review it in SteerCo.");
    return {
      status: "compressed",
      title: "Timeline is compressed",
      summary: "The project can be created, but the plan should start with visible risk and governance.",
      minimumDays,
      plannedDays,
      reasons,
      suggestions,
      boardWarning: "Leadership should see the date pressure before the project appears green.",
    };
  }

  reasons.push(`${plannedDays} days supports the selected setup shape.`);
  if (input.reportingModels.includes("audit-ready")) reasons.push("Audit-ready reporting will require evidence ownership and update rhythm.");
  suggestions.push("Create the command center and review seeded owners, risks, and readiness gates.");
  return {
    status: "credible",
    title: "Setup shape is credible",
    summary: "The timeline and scope are plausible for a starting operating model.",
    minimumDays,
    plannedDays,
    reasons,
    suggestions,
  };
}

function estimateMinimumDays(input: SetupIntake): number {
  let days = {
    assessment: 5,
    workshop: 2,
    "cutover-rehearsal": 3,
    remediation: 30,
    validation: 45,
    rollout: 45,
    migration: 60,
    upgrade: 75,
    implementation: 90,
  }[input.projectType];

  if (input.systemFamily === "sap" && input.projectType === "implementation") days = 160;
  if (input.systemFamily === "veeva" && input.projectType === "implementation") days = 120;
  if (input.systemFamily === "mes" || input.systemFamily === "lims") days += 20;

  if (input.controlModel === "gxp-csv" || input.controlModel === "csa") days += 20;
  if (input.controlModel === "sox" || input.controlModel === "hipaa" || input.controlModel === "public-security") days += 10;

  const scopeAdders: Partial<Record<ScopeElementId, number>> = {
    migration: 20,
    integrations: 15,
    validation: 15,
    uat: 8,
    training: 5,
    cutover: 8,
    hypercare: 3,
    "data-quality": 10,
    "board-governance": 5,
  };
  days += input.scopeElements.reduce((sum, scope) => sum + (scopeAdders[scope] ?? 0), 0);

  if (input.region === "global") days += 10;
  if (input.region === "country-rollout") days -= 5;
  if (input.reportingModels.includes("board")) days += 5;
  if (input.reportingModels.includes("audit-ready")) days += 8;

  if (input.deliveryMethod === "sap-activate" && input.systemFamily !== "sap") days += 5;
  if (input.projectType === "workshop" || input.projectType === "assessment" || input.projectType === "cutover-rehearsal") {
    return Math.max(2, days);
  }
  return Math.max(14, days);
}

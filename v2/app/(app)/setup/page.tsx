"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  Library,
  Loader2,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useProject } from "@/components/projects/project-provider";
import { Field, inputCls } from "@/components/ui/entity-drawer";
import { useEntityStore } from "@/lib/stores/entity-store";
import { cn } from "@/lib/utils";
import {
  buildImportPreview,
  parseDelimitedTable,
  previewOwnersToTeamMembers,
  previewTasksToTasks,
  recordsFromMatrix,
  type ImportPreview,
} from "@/lib/import/project-import";
import {
  PROJECT_TEMPLATES,
  buildTemplateOperatingModel,
  getProjectTemplate,
  type ProjectTemplateId,
} from "@/lib/templates/project-templates";
import {
  loadCustomProjectTemplates,
  instantiateCustomProjectTemplate,
  type CustomProjectTemplate,
  type CustomTemplateOperatingModel,
} from "@/lib/templates/custom-project-templates";
import {
  INDUSTRY_OPTIONS,
  OWNERSHIP_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  REGION_OPTIONS,
  REPORTING_OPTIONS,
  SCOPE_OPTIONS,
  controlOptionsForIndustry,
  evaluateSetupFeasibility,
  intakeFromTemplate,
  systemOptionsForIndustry,
  type IntakeOption,
  type ReportingModelId,
  type ScopeElementId,
  type SetupFeasibility,
  type SetupIntake,
} from "@/lib/setup/project-intake";
import { isIsoDate } from "@/lib/validation";

type SetupMode = "template" | "import" | "saved" | "blank";
type ImportSource = "planner" | "project" | "excel" | "manual";

const SAMPLE_IMPORT = `ID,Task Name,Workstream,Start,Finish,Resource Names,Priority,% Complete,Predecessors
1,Confirm project charter,Project Mgmt,2026-06-01,2026-06-03,Vineet Pathak,High,50%,
2,Prepare validation approach,Validation,2026-06-04,2026-06-12,QA Agent,High,0%,1
3,Map source data,Data Migration,2026-06-04,2026-06-14,Data Migration Lead,Critical,0%,1
4,Configure first workflow,Configuration,2026-06-15,2026-06-26,Config Agent,High,0%,2;3`;

const PLANNER_SAMPLE_IMPORT = `Task ID,Task title,Bucket Name,Status,Start Date,Due Date,Assignments,Priority
1,Confirm validation scope,Validation,In progress,2026-06-01,2026-06-10,Priya Sharma,Important
2,Run dry migration,Data Migration,Not started,2026-06-11,2026-06-20,Migration Agent,Medium
3,Approve cutover checklist,Cutover,Not started,2026-06-21,2026-06-24,Vineet Pathak,Urgent`;

const TEMPLATE_IMPORT = `ID,Task Name,Workstream,Start,Finish,Resource Names,Priority,% Complete,Predecessors
1,Confirm project charter and delivery model,Project Mgmt,2026-06-01,2026-06-05,Project Manager,Critical,0%,
2,Set up workstream plan and owners,Project Mgmt,2026-06-06,2026-06-10,Project Manager,High,0%,1
3,Confirm validation strategy,Validation,2026-06-11,2026-06-20,QA Lead,High,0%,2
4,Confirm data migration approach,Data Migration,2026-06-11,2026-06-20,Data Agent,High,0%,2
5,Configure core process workflow,Configuration,2026-06-21,2026-07-05,Config Agent,High,0%,3;4
6,Prepare training and adoption plan,Training,2026-07-06,2026-07-20,Training Lead,Medium,0%,5
7,Run readiness review,Readiness,2026-07-21,2026-07-31,Project Manager,Critical,0%,6`;

const IMPORT_SAMPLE_BASE = "/pharmapm-command-center/v2/samples";

const modeCards = [
  {
    id: "template" as const,
    title: "Build with template",
    description: "Use the closest predefined setup for this project type.",
    icon: Sparkles,
  },
  {
    id: "import" as const,
    title: "Import existing plan",
    description: "Upload an export, map the columns, and validate before creating records.",
    icon: FileSpreadsheet,
  },
  {
    id: "saved" as const,
    title: "Build from saved template",
    description: "Reuse a proven project model for a release, rollout, or repeat delivery.",
    icon: Library,
  },
  {
    id: "blank" as const,
    title: "Start base skeleton",
    description: "Create only the command center shell.",
    icon: ClipboardList,
  },
];

export default function GuidedSetupPage() {
  const router = useRouter();
  const { projects, createProject, setActiveProjectId } = useProject();
  const addCharter = useEntityStore((s) => s.addCharter);
  const addMilestone = useEntityStore((s) => s.addMilestone);
  const addTask = useEntityStore((s) => s.addTask);
  const addRisk = useEntityStore((s) => s.addRisk);
  const addDocument = useEntityStore((s) => s.addDocument);
  const addCostLine = useEntityStore((s) => s.addCostLine);
  const addTeamMember = useEntityStore((s) => s.addTeamMember);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [mode, setMode] = useState<SetupMode>("template");
  const [templateId, setTemplateId] = useState<ProjectTemplateId>("veeva-rim");
  const selectedTemplate = getProjectTemplate(templateId);
  const [customTemplates, setCustomTemplates] = useState<CustomProjectTemplate[]>([]);
  const [customTemplateId, setCustomTemplateId] = useState("");
  const selectedCustomTemplate = customTemplates.find((template) => template.id === customTemplateId) ?? null;
  const [name, setName] = useState(selectedTemplate.recommendedName);
  const [client, setClient] = useState("AivelloStudio Demo Corp");
  const [projectCode, setProjectCode] = useState(() => buildProjectCode(selectedTemplate.recommendedName, "AivelloStudio Demo Corp", "2026-06-01"));
  const [projectCodeTouched, setProjectCodeTouched] = useState(false);
  const [phase, setPhase] = useState(selectedTemplate.recommendedPhase);
  const [startDate, setStartDate] = useState("2026-06-01");
  const [goLiveDate, setGoLiveDate] = useState("2026-09-30");
  const [methodology, setMethodology] = useState(selectedTemplate.recommendedMethodology);
  const [intake, setIntake] = useState<SetupIntake>(() => intakeFromTemplate("veeva-rim"));
  const [importSource, setImportSource] = useState<ImportSource>("project");
  const [importText, setImportText] = useState(SAMPLE_IMPORT);
  const [importError, setImportError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  useEffect(() => {
    const templates = loadCustomProjectTemplates();
    setCustomTemplates(templates);
    setCustomTemplateId((current) => current || templates[0]?.id || "");
  }, []);

  const preview = useMemo<ImportPreview | null>(() => {
    if (mode === "blank" || mode === "saved") return null;
    try {
      const records = parseDelimitedTable(mode === "template" ? TEMPLATE_IMPORT : importText);
      return buildImportPreview(records, {
        defaultOwnerName: "Project Manager",
        fallbackDueDate: goLiveDate || startDate,
      });
    } catch {
      return buildImportPreview([]);
    }
  }, [goLiveDate, importText, mode, startDate]);

  const templateModel = useMemo(() => (
    mode === "template"
      ? buildTemplateOperatingModel({
          templateId,
          projectId: "preview-project",
          projectName: name,
          client,
          startDate,
          goLiveDate,
          methodology,
        })
      : null
  ), [client, goLiveDate, methodology, mode, name, startDate, templateId]);

  const customTemplateModel = useMemo<CustomTemplateOperatingModel | null>(() => (
    mode === "saved" && selectedCustomTemplate
      ? instantiateCustomProjectTemplate({
          template: selectedCustomTemplate,
          projectId: "preview-project",
          projectName: name,
          client,
          startDate,
          goLiveDate,
          methodology,
        })
      : null
  ), [client, goLiveDate, methodology, mode, name, selectedCustomTemplate, startDate]);

  const feasibility = useMemo(
    () => evaluateSetupFeasibility(intake, startDate, goLiveDate),
    [goLiveDate, intake, startDate],
  );

  const systemOptions = useMemo(() => systemOptionsForIndustry(intake.industry), [intake.industry]);
  const controlOptions = useMemo(() => controlOptionsForIndustry(intake.industry), [intake.industry]);

  function selectTemplate(nextTemplateId: ProjectTemplateId) {
    const previousTemplate = selectedTemplate;
    const template = getProjectTemplate(nextTemplateId);
    setTemplateId(nextTemplateId);
    setName((current) => current.trim() && current !== previousTemplate.recommendedName ? current : template.recommendedName);
    setProjectCode((current) => {
      const previousCode = buildProjectCode(previousTemplate.recommendedName, client, startDate);
      return projectCodeTouched || current !== previousCode ? current : buildProjectCode(template.recommendedName, client, startDate);
    });
    setPhase((current) => current.trim() && current !== previousTemplate.recommendedPhase ? current : template.recommendedPhase);
    setMethodology(template.recommendedMethodology);
  }

  function recommendTemplateId(input: SetupIntake): ProjectTemplateId {
    if (input.systemFamily === "sap") {
      if (input.projectType === "migration") return "sap-master-data";
      if (input.projectType === "rollout") return "sap-ewm";
      return "sap-s4hana";
    }
    if (input.systemFamily === "lims") return "lims-qc-lab";
    if (input.systemFamily === "eqms") return "eqms-capa";
    if (input.systemFamily === "mes") return "mes-ebmr";
    if (input.systemFamily === "veeva") {
      if (input.projectType === "rollout") return "veeva-clinical-ops";
      if (input.projectType === "validation") return "csv-validation";
      return "veeva-rim";
    }
    if (input.projectType === "migration") return "data-migration";
    if (input.projectType === "validation") return "csv-validation";
    return "generic-implementation";
  }

  function updateIntake<K extends keyof SetupIntake>(key: K, value: SetupIntake[K]) {
    setIntake((current) => ({ ...current, [key]: value }));
  }

  function updateIndustry(industry: SetupIntake["industry"]) {
    setIntake((current) => {
      const nextSystems = systemOptionsForIndustry(industry);
      const nextControls = controlOptionsForIndustry(industry);
      const systemFamily = nextSystems.some((option) => option.id === current.systemFamily)
        ? current.systemFamily
        : nextSystems[0].id;
      const controlModel = nextControls.some((option) => option.id === current.controlModel)
        ? current.controlModel
        : nextControls[0].id;
      return { ...current, industry, systemFamily, controlModel };
    });
  }

  function toggleScope(scope: ScopeElementId) {
    setIntake((current) => ({
      ...current,
      scopeElements: current.scopeElements.includes(scope)
        ? current.scopeElements.filter((item) => item !== scope)
        : [...current.scopeElements, scope],
    }));
  }

  function toggleReporting(reporting: ReportingModelId) {
    setIntake((current) => ({
      ...current,
      reportingModels: current.reportingModels.includes(reporting)
        ? current.reportingModels.filter((item) => item !== reporting)
        : [...current.reportingModels, reporting],
    }));
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setIsReadingFile(true);
    setImportError(null);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "xlsx" || extension === "xls") {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames.find((sheet) => sheet.toLowerCase().includes("project tasks")) ?? workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
        const records = recordsFromMatrix(matrix as string[][]);
        if (records.length === 0) {
          setImportText("");
          setImportError("The file opened, but no task table was found. Exports need recognizable task columns so the command center can map owners, dates, and dependencies.");
          return;
        }
        const headers = Object.keys(records[0] ?? {});
        const body = records
          .map((record) => headers.map((header) => csvEscape(String(record[header] ?? ""))).join(","))
          .join("\n");
        setImportText([headers.join(","), body].filter(Boolean).join("\n"));
      } else {
        const text = await file.text();
        const records = parseDelimitedTable(text);
        if (records.length === 0) {
          setImportText(text);
          setImportError("No recognizable task table was found. Use the sample format or include Task Name plus Start/Finish or Due Date columns so the plan can be mapped safely.");
          return;
        }
        setImportText(text);
      }
      setMode("import");
    } catch {
      setImportError("We could not read that file. Save the Microsoft export as Excel or CSV, then try again.");
    } finally {
      setIsReadingFile(false);
    }
  }

  function validateProject(): string | null {
    if (!name.trim()) return "Add a project name before creating the setup.";
    if (!client.trim()) return "Add the client or business area before creating the setup.";
    if (!projectCode.trim()) return "Add a project code before creating the setup.";
    if (projects.some((project) => normalizeProjectCode(project.code ?? project.id) === normalizeProjectCode(projectCode))) {
      return "This project code is already used. Change it before creating the setup.";
    }
    if (!startDate || !isIsoDate(startDate)) return "Add a valid project start date.";
    if (!goLiveDate || !isIsoDate(goLiveDate)) return "Add a valid target go-live date.";
    if (startDate >= goLiveDate) return "Target go-live must be after the project start date.";
    if (mode === "template" && !templateModel) {
      return "Choose a project template before creating the setup.";
    }
    if (mode === "template" && feasibility.status === "impossible") {
      return "Timeline is not credible for this setup. Change project type, scope, or dates before creating it.";
    }
    if (mode === "saved" && !selectedCustomTemplate) {
      return "Choose a saved project template before creating the setup.";
    }
    if (mode === "import" && (!preview || preview.tasks.length === 0)) {
      return "No tasks are ready to import. Paste a task table or choose the guided template.";
    }
    if (mode === "import" && preview && preview.stats.unresolvedDependencies > 0) {
      return "Some dependency links could not be matched. Fix the import table or remove the unresolved links before creating it.";
    }
    return null;
  }

  function handleCreate() {
    const error = validateProject();
    if (error) {
      toast.error("Setup needs one fix", { description: error });
      return;
    }

    const created = createProject({
      code: normalizeProjectCode(projectCode),
      name: name.trim(),
      client: client.trim(),
      phase: phase.trim() || "Mobilise",
      startDate,
      goLiveDate,
      methodology: methodology.trim() || "GAMP 5 / CSV",
    });

    if (mode === "template") {
      const model = buildTemplateOperatingModel({
        templateId,
        projectId: created.id,
        projectName: created.name,
        client: created.client,
        startDate: created.startDate,
        goLiveDate: created.goLiveDate,
        methodology: created.methodology,
      });
      addCharter(model.charter, { source: "import", note: `${model.template.name} setup` });
      model.milestones.forEach((milestone) => addMilestone(milestone, { source: "import", note: `${model.template.name} setup` }));
      model.teamMembers.forEach((member) => addTeamMember(member, { source: "import", note: `${model.template.name} setup` }));
      model.tasks.forEach((task) => addTask(task, { source: "import", note: `${model.template.name} setup` }));
      model.documents.forEach((document) => addDocument(document, { source: "import", note: `${model.template.name} setup` }));
      model.risks.forEach((risk) => addRisk(risk, { source: "import", note: `${model.template.name} setup` }));
      model.costLines.forEach((line) => addCostLine(line, { source: "import", note: `${model.template.name} setup` }));
      toast.success("Project operating model created", {
        description: `${model.tasks.length} tasks, ${model.milestones.length} milestones, ${model.documents.length} documents, and ${model.risks.length} risks prepared.`,
      });
    } else if (mode === "saved" && selectedCustomTemplate) {
      const model = instantiateCustomProjectTemplate({
        template: selectedCustomTemplate,
        projectId: created.id,
        projectName: created.name,
        client: created.client,
        startDate: created.startDate,
        goLiveDate: created.goLiveDate,
        methodology: created.methodology,
      });
      if (model.charter) addCharter(model.charter, { source: "import", note: `${model.template.name} saved template` });
      model.milestones.forEach((milestone) => addMilestone(milestone, { source: "import", note: `${model.template.name} saved template` }));
      model.teamMembers.forEach((member) => addTeamMember(member, { source: "import", note: `${model.template.name} saved template` }));
      model.tasks.forEach((task) => addTask(task, { source: "import", note: `${model.template.name} saved template` }));
      model.documents.forEach((document) => addDocument(document, { source: "import", note: `${model.template.name} saved template` }));
      model.risks.forEach((risk) => addRisk(risk, { source: "import", note: `${model.template.name} saved template` }));
      model.costLines.forEach((line) => addCostLine(line, { source: "import", note: `${model.template.name} saved template` }));
      toast.success("Project created from saved template", {
        description: `${model.tasks.length} tasks, ${model.milestones.length} milestones, and ${model.teamMembers.length} roles reused.`,
      });
    } else if (preview && preview.tasks.length > 0) {
      const teamMembers = previewOwnersToTeamMembers(created.id, preview);
      const tasks = previewTasksToTasks(created.id, preview);
      teamMembers.forEach((member) => addTeamMember(member, {
        source: "import",
        note: "Created from guided setup",
      }));
      tasks.forEach((task) => addTask(task, {
        source: "import",
        note: "Created from guided setup",
      }));
      toast.success("Project setup created", {
        description: `${preview.tasks.length} tasks and ${preview.owners.length} owners prepared.`,
      });
    } else {
      toast.success("Project shell created", {
        description: "Blank project shell is ready.",
      });
    }

    setActiveProjectId(created.id);
    router.push("/");
  }

  // ==== RENDER STEPS ====

  function renderStep1() {
    return (
      <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Project Discovery</h2>
          <p className="mt-2 text-sm text-muted-foreground">Capture only the facts needed to recommend the right command-center setup.</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/40 p-8 shadow-xl backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Project Name" required>
              <input
                value={name}
                onChange={(event) => {
                  const nextName = event.target.value;
                  setName(nextName);
                  if (!projectCodeTouched) setProjectCode(buildProjectCode(nextName, client, startDate));
                }}
                className={cn(inputCls, "bg-background/50")}
              />
            </Field>
            <Field label="Client or business area" required>
              <input
                value={client}
                onChange={(event) => {
                  const nextClient = event.target.value;
                  setClient(nextClient);
                  if (!projectCodeTouched) setProjectCode(buildProjectCode(name, nextClient, startDate));
                }}
                className={cn(inputCls, "bg-background/50")}
              />
            </Field>
            <Field label="Project Code" required>
              <input
                value={projectCode}
                onChange={(event) => {
                  setProjectCodeTouched(true);
                  setProjectCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "-").replace(/--+/g, "-"));
                }}
                className={cn(inputCls, "bg-background/50 font-mono")}
              />
            </Field>
            <div className="hidden md:block"></div>
            <SelectField
              label="Industry"
              value={intake.industry}
              options={INDUSTRY_OPTIONS}
              onChange={updateIndustry}
            />
            <SelectField
              label="System Family"
              value={intake.systemFamily}
              options={systemOptions}
              onChange={(value) => updateIntake("systemFamily", value)}
            />
            <SelectField
              label="Project Type"
              value={intake.projectType}
              options={PROJECT_TYPE_OPTIONS}
              onChange={(value) => updateIntake("projectType", value)}
            />
            <SelectField
              label="Control Model"
              value={intake.controlModel}
              options={controlOptions}
              onChange={(value) => updateIntake("controlModel", value)}
            />
            <SelectField
              label="Region"
              value={intake.region}
              options={REGION_OPTIONS}
              onChange={(value) => updateIntake("region", value)}
            />
            <Field label="Start Date" required>
              <input
                type="date"
                value={startDate}
                onChange={(event) => {
                  const nextStartDate = event.target.value;
                  setStartDate(nextStartDate);
                  if (!projectCodeTouched) setProjectCode(buildProjectCode(name, client, nextStartDate));
                }}
                className={cn(inputCls, "bg-background/50")}
              />
            </Field>
            <Field label="Target Go-live" required>
              <input type="date" value={goLiveDate} onChange={(event) => setGoLiveDate(event.target.value)} className={cn(inputCls, "bg-background/50")} />
            </Field>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => {
              if (!name.trim() || !client.trim() || !startDate || !goLiveDate) {
                toast.error("Please fill in all required fields.");
                return;
              }
              if (startDate >= goLiveDate) {
                toast.error("Target go-live must be after the start date.");
                return;
              }
              setStep(2);
            }}
            className="group flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-primary/25"
          >
            Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Build Method</h2>
          <p className="mt-2 text-sm text-muted-foreground">How would you like to initialize the command center?</p>
        </div>

        <div className="space-y-4">
          {modeCards.map((card) => {
            const Icon = card.icon;
            const active = mode === card.id;
            return (
              <button
                key={card.id}
                onClick={() => setMode(card.id)}
                className={cn(
                  "flex w-full items-center gap-6 rounded-2xl border bg-card/40 p-6 text-left shadow-lg backdrop-blur-xl transition-all duration-200",
                  active ? "border-primary ring-2 ring-primary/20 shadow-primary/10" : "border-border/50 hover:border-primary/50 hover:bg-card/60"
                )}
              >
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                </div>
                <div className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", active ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                  {active && <div className="h-2.5 w-2.5 rounded-full bg-background" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={() => {
              if (mode === "blank") {
                setStep(4);
              } else {
                if (mode === "template") {
                  selectTemplate(recommendTemplateId(intake));
                }
                if (mode === "saved" && customTemplates.length === 0) {
                  toast.error("No saved templates yet", { description: "Save an existing project as a template from Manage Projects first." });
                  return;
                }
                if (mode === "saved" && selectedCustomTemplate) {
                  setPhase(selectedCustomTemplate.recommendedPhase);
                  setMethodology(selectedCustomTemplate.recommendedMethodology);
                }
                setStep(3);
              }
            }}
            className="group flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-primary/25"
          >
            Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {mode === "template" ? "Template Recommendation" : mode === "saved" ? "Saved Project Template" : "Import & Map Existing Plan"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "template"
              ? "Discovery selects the first recommendation. You can change it before review."
              : mode === "saved"
              ? "Reuse a project model your team already trusts, with fresh dates and reset progress."
              : "Convert an existing plan into command-center tasks, owners, workstreams, and links."}
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/40 p-8 shadow-xl backdrop-blur-xl">
          {mode === "template" && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Recommended build template</h3>
                <Field label="Template">
                  <select value={templateId} onChange={(event) => selectTemplate(event.target.value as ProjectTemplateId)} className={cn(inputCls, "bg-background/50 text-base py-2")}>
                    {PROJECT_TEMPLATES.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.category} - {template.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">{selectedTemplate.category}</p>
                      <p className="mt-1 text-lg font-bold text-foreground">{selectedTemplate.name}</p>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{selectedTemplate.description}</p>
                    </div>
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">{selectedTemplate.coverage.workstreams.length} streams</span>
                    <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">{selectedTemplate.coverage.tasks} tasks</span>
                    <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">{selectedTemplate.coverage.documents} docs</span>
                    <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">{selectedTemplate.coverage.risks} risks</span>
                  </div>
                </div>
              </div>

              <details className="rounded-xl border border-border/50 bg-background/30 p-5">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  Advanced setup options
                  <span className="ml-2 font-normal text-muted-foreground">scope, reporting, and ownership are prefilled from discovery</span>
                </summary>
                <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-6">
                    <ChipGroup
                      label="Scope Elements"
                      options={SCOPE_OPTIONS}
                      selected={intake.scopeElements}
                      onToggle={toggleScope}
                    />
                  </div>
                  <div className="space-y-6">
                    <ChipGroup
                      label="Reporting Requirements"
                      options={REPORTING_OPTIONS}
                      selected={intake.reportingModels}
                      onToggle={toggleReporting}
                    />
                    <div>
                      <p className="mb-3 text-sm font-semibold text-foreground">Data Ownership</p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {OWNERSHIP_OPTIONS.map((option) => {
                          const active = intake.ownershipModel === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => updateIntake("ownershipModel", option.id)}
                              className={cn(
                                "rounded-xl border p-3 text-left transition-all",
                                active ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border/50 bg-background/50 text-muted-foreground hover:border-border hover:bg-background"
                              )}
                              title={option.example}
                            >
                              <span className="block text-sm font-semibold">{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )}

          {mode === "saved" && (
            <div className="space-y-6">
              {customTemplates.length === 0 ? (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">No saved templates yet</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Open Manage Projects, choose a finished or trusted project, then save its operating model as a reusable template.
                      </p>
                      <Link href="/projects" className="mt-4 inline-flex rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
                        Manage Projects
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Field label="Saved template">
                    <select
                      value={customTemplateId}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        const nextTemplate = customTemplates.find((template) => template.id === nextId);
                        setCustomTemplateId(nextId);
                        if (nextTemplate) {
                          setPhase(nextTemplate.recommendedPhase);
                          setMethodology(nextTemplate.recommendedMethodology);
                        }
                      }}
                      className={cn(inputCls, "bg-background/50 text-base py-2")}
                    >
                      {customTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  {selectedCustomTemplate && (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Saved from {selectedCustomTemplate.sourceProjectName}</p>
                          <p className="mt-1 text-lg font-bold text-foreground">{selectedCustomTemplate.name}</p>
                          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{selectedCustomTemplate.description}</p>
                        </div>
                        <Library className="h-5 w-5 text-primary" />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">{selectedCustomTemplate.coverage.workstreams.length} streams</span>
                        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">{selectedCustomTemplate.coverage.tasks} tasks</span>
                        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">{selectedCustomTemplate.coverage.milestones} milestones</span>
                        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">{selectedCustomTemplate.coverage.documents} docs</span>
                        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">{selectedCustomTemplate.coverage.risks} risks</span>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-border/50 bg-background/40 p-5">
                    <p className="text-sm font-semibold text-foreground">Release reuse behavior</p>
                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                      <div className="rounded-lg border border-border/60 bg-card p-3">
                        <p className="font-semibold text-foreground">Dates shift</p>
                        <p className="mt-1 text-muted-foreground">Milestones, tasks, and documents move from the saved baseline to your new start date.</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card p-3">
                        <p className="font-semibold text-foreground">Work resets</p>
                        <p className="mt-1 text-muted-foreground">Task progress returns to 0%, documents return to draft, and risks reopen.</p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-card p-3">
                        <p className="font-semibold text-foreground">Structure stays</p>
                        <p className="mt-1 text-muted-foreground">Workstreams, owners, dependencies, costs, and governance model are reused.</p>
                      </div>
                    </div>
                  </div>

                  {customTemplateModel && (
                    <div className="rounded-xl border border-border/50 bg-background/50 p-5">
                      <p className="text-sm font-semibold text-foreground">Template preview for this project</p>
                      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                        <Metric label="Tasks" value={customTemplateModel.tasks.length} />
                        <Metric label="Owners" value={customTemplateModel.teamMembers.length} />
                        <Metric label="Docs" value={customTemplateModel.documents.length} />
                        <Metric label="Risks" value={customTemplateModel.risks.length} />
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground">
                        Source baseline starts {selectedCustomTemplate?.sourceStartDate}; this project starts {startDate}. Dates will be shifted automatically.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {mode === "import" && (
            <div className="space-y-6">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Migration approach</p>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      This does not copy Microsoft Project or Planner one-to-one. It imports the useful delivery records, maps them into the command-center structure, then asks you to review gaps before anything is created.
                    </p>
                  </div>
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
                  <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                    <p className="font-semibold text-foreground">1. Source</p>
                    <p className="mt-1 text-muted-foreground">Choose where the plan came from.</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                    <p className="font-semibold text-foreground">2. Mapping</p>
                    <p className="mt-1 text-muted-foreground">Task, owner, dates, status, and dependencies are normalized.</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                    <p className="font-semibold text-foreground">3. Validation</p>
                    <p className="mt-1 text-muted-foreground">Unmatched links or missing owners are shown before create.</p>
                  </div>
                </div>
              </div>

              <Field label="Import source">
                <select value={importSource} onChange={(event) => setImportSource(event.target.value as ImportSource)} className={cn(inputCls, "bg-background/50")}>
                  <option value="project">Microsoft Project export to Excel</option>
                  <option value="planner">Microsoft Planner export to Excel</option>
                  <option value="excel">Team Excel or CSV tracker</option>
                  <option value="manual">Paste table manually</option>
                </select>
              </Field>

              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-background/50 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Samples</span>
                <button type="button" onClick={() => { setImportError(null); setImportText(SAMPLE_IMPORT); }} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
                  Use Project sample
                </button>
                <button type="button" onClick={() => { setImportError(null); setImportText(PLANNER_SAMPLE_IMPORT); }} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
                  Use Planner sample
                </button>
                <a href={`${IMPORT_SAMPLE_BASE}/microsoft-project-export-sample.csv`} download className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
                  Download Project CSV
                </a>
                <a href={`${IMPORT_SAMPLE_BASE}/microsoft-planner-export-sample.csv`} download className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
                  Download Planner CSV
                </a>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <MappingCard source="Task title / Task Name" target="Task record" />
                <MappingCard source="Bucket / Workstream / Phase" target="Workstream" />
                <MappingCard source="Assignments / Resource Names" target="Owner and team member" />
                <MappingCard source="Start, Due Date, Finish" target="Schedule fields" />
                <MappingCard source="Status, Priority, % Complete" target="Progress and pressure" />
                <MappingCard source="Predecessors / Depends on" target="Task dependencies" />
              </div>

              <label className="flex w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/50 bg-background/30 px-6 py-12 transition-all hover:bg-muted/50">
                {isReadingFile ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Upload Excel or CSV export</p>
                  <p className="mt-1 text-xs text-muted-foreground">For .mpp files, export from Microsoft Project to Excel first.</p>
                </div>
                <input
                  type="file"
                  accept=".csv,.txt,.tsv,.xlsx,.xls"
                  className="sr-only"
                  onChange={(event) => handleFile(event.target.files?.[0])}
                />
              </label>
              
              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                className="min-h-[240px] w-full rounded-xl border border-border/50 bg-background/50 p-4 font-mono text-sm leading-relaxed text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                spellCheck={false}
                placeholder="Or paste your raw CSV data here..."
              />
              {importError && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-500">
                  <AlertTriangle className="h-4 w-4" />
                  <p>{importError}</p>
                </div>
              )}

              {preview && (
                <div className="rounded-xl border border-border/50 bg-background/50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Import preview</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Detected {preview.sourceKind.replace("-", " ")} format. Review this before creating the command center.
                      </p>
                    </div>
                    <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                      {preview.stats.totalRows} source rows
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Metric label="Tasks" value={preview.stats.importedTasks} />
                    <Metric label="Owners" value={preview.owners.length} />
                    <Metric label="Workstreams" value={preview.workstreams.length} />
                    <Metric label="Links" value={preview.stats.linkedDependencies} />
                  </div>
                  {preview.stats.importedTasks === 0 && (
                    <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-300">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="h-4 w-4" />
                        Cannot import this file yet
                      </div>
                      <p className="mt-2">
                        Add or map a task-name column and at least one schedule column. Accepted headers include Task Name, Task Title, Name, Start, Finish, Due Date, Resource Names, Assignments, and Predecessors.
                      </p>
                    </div>
                  )}
                  {(preview.warnings.length > 0 || preview.stats.unresolvedDependencies > 0) && (
                    <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertTriangle className="h-4 w-4" />
                        Needs review before create
                      </div>
                      <ul className="mt-2 space-y-1">
                        {preview.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                        {preview.stats.unresolvedDependencies > 0 && <li>{preview.stats.unresolvedDependencies} dependency link(s) could not be matched.</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={() => setStep(4)}
            className="group flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-primary/25"
          >
            Review <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    );
  }

  function renderStep4() {
    const summaryTasks = templateModel?.tasks.length ?? customTemplateModel?.tasks.length ?? preview?.stats.importedTasks ?? 0;
    const summaryMilestones = templateModel?.milestones.length ?? customTemplateModel?.milestones.length ?? 0;
    const summaryOwners = templateModel?.teamMembers.length ?? customTemplateModel?.teamMembers.length ?? preview?.owners.length ?? 0;
    const summaryRisks = templateModel?.risks.length ?? customTemplateModel?.risks.length ?? 0;

    return (
      <div className="mx-auto max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Review & Create</h2>
          <p className="mt-2 text-sm text-muted-foreground">Verify the architecture before finalizing the command center.</p>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-card/40 p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-foreground">Project Identity</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium text-foreground">{name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-medium text-foreground">{client}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Project Code</p>
                <p className="font-mono font-medium text-foreground">{normalizeProjectCode(projectCode)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Timeline</p>
                <p className="font-medium text-foreground">{startDate} to {goLiveDate}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Methodology</p>
                <p className="font-medium text-foreground">{methodology}</p>
              </div>
            </div>
          </div>

          {mode === "template" && <FeasibilityCard feasibility={feasibility} onRevisitTimeline={() => setStep(1)} />}

          {mode === "saved" && selectedCustomTemplate && (
            <div className="rounded-2xl border border-border/50 bg-card/40 p-6 shadow-xl backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-foreground">Saved Template Reuse</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedCustomTemplate.name} will be reused from {selectedCustomTemplate.sourceProjectName}. Work status resets, dependency links are rebuilt, and dates shift from {selectedCustomTemplate.sourceStartDate} to {startDate}.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-border/50 bg-card/40 p-6 shadow-xl backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-foreground">Generation Summary</h3>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Metric label="Tasks" value={summaryTasks} />
              <Metric label="Milestones" value={summaryMilestones} />
              <Metric label="Owners" value={summaryOwners} />
              <Metric label="Risks" value={summaryRisks} />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep(mode === "blank" ? 2 : 3)}
            className="flex items-center gap-2 rounded-full border border-border/50 bg-background/50 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <button
            onClick={handleCreate}
            className="group flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-primary/25"
          >
            <Sparkles className="h-4 w-4 text-primary-foreground/80" /> Create Command Center
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] px-4 py-8">
      {/* Progress Stepper */}
      <div className="mb-12 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300",
                step === s
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.5)] ring-4 ring-primary/20"
                  : step > s
                  ? "bg-primary/80 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
            </div>
            {s < 4 && (
              <div className={cn("h-1 w-12 rounded-full transition-all duration-300", step > s ? "bg-primary/80" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </div>
  );
}

// ==== SUBCOMPONENTS ====

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: IntakeOption<T>[];
  onChange: (value: T) => void;
}) {
  const selected = options.find((option) => option.id === value) ?? options[0];

  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value as T)} className={cn(inputCls, "bg-background/50")} title={selected.example}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </Field>
  );
}

function ChipGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: IntakeOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onToggle(option.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                active ? "border-primary bg-primary/10 text-primary shadow-sm" : "border-border/50 bg-background/50 text-muted-foreground hover:bg-muted"
              )}
              title={option.example}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FeasibilityCard({ feasibility, onRevisitTimeline }: { feasibility: SetupFeasibility; onRevisitTimeline: () => void }) {
  const tone = {
    credible: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    compressed: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    impossible: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  }[feasibility.status];

  return (
    <div className={cn("rounded-2xl border p-6 shadow-xl backdrop-blur-xl", tone)}>
      <div className="flex items-start gap-4">
        {feasibility.status === "credible" ? <CheckCircle2 className="mt-1 h-6 w-6 shrink-0" /> : <AlertTriangle className="mt-1 h-6 w-6 shrink-0" />}
        <div>
          <p className="text-lg font-bold">{feasibility.title}</p>
          <p className="mt-1 text-sm opacity-90">{feasibility.summary}</p>
          <p className="mt-3 text-sm font-medium">
            <span className="font-bold">{feasibility.plannedDays}</span> planned days · <span className="font-bold">{feasibility.minimumDays}</span> recommended minimum
          </p>
          <ul className="mt-3 space-y-2 text-sm opacity-90">
            {feasibility.suggestions.map((suggestion) => (
              <li key={suggestion} className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> {suggestion}</li>
            ))}
          </ul>
          {feasibility.status !== "credible" && (
            <button
              type="button"
              onClick={onRevisitTimeline}
              className="mt-5 rounded-md border border-current/30 bg-background/70 px-3 py-1.5 text-xs font-semibold text-current shadow-sm hover:bg-background"
            >
              Revisit timeline
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/50 p-4 text-center transition-all hover:bg-background">
      <p className="text-3xl font-black tabular-nums text-foreground">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function MappingCard({ source, target }: { source: string; target: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-background/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Map</p>
      <p className="mt-1 text-sm font-medium text-foreground">{source}</p>
      <p className="mt-2 text-xs text-muted-foreground">to</p>
      <p className="mt-1 text-sm font-semibold text-primary">{target}</p>
    </div>
  );
}

function csvEscape(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function buildProjectCode(name: string, client: string, startDate: string): string {
  const clientPrefix = acronym(client) || "PRJ";
  const projectPrefix = acronym(name) || slugPart(name) || "NEW";
  const year = /^\d{4}/.test(startDate) ? startDate.slice(0, 4) : "YYYY";
  return normalizeProjectCode(`${clientPrefix}-${projectPrefix}-${year}`);
}

function acronym(value: string): string {
  return value
    .replace(/&/g, " ")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function slugPart(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 8);
}

function normalizeProjectCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
}

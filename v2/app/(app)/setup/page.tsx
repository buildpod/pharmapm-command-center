"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  Upload,
  Users,
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
import { isIsoDate } from "@/lib/validation";

type SetupMode = "template" | "import" | "blank";

const SAMPLE_IMPORT = `ID,Task Name,Workstream,Start,Finish,Resource Names,Priority,% Complete,Predecessors
1,Confirm project charter,Project Mgmt,2026-06-01,2026-06-03,Vineet Pathak,High,50%,
2,Prepare validation approach,Validation,2026-06-04,2026-06-12,QA Agent,High,0%,1
3,Map source data,Data Migration,2026-06-04,2026-06-14,Data Migration Lead,Critical,0%,1
4,Configure first workflow,Configuration,2026-06-15,2026-06-26,Config Agent,High,0%,2;3`;

const TEMPLATE_IMPORT = `ID,Task Name,Workstream,Start,Finish,Resource Names,Priority,% Complete,Predecessors
1,Confirm project charter and delivery model,Project Mgmt,2026-06-01,2026-06-05,Project Manager,Critical,0%,
2,Set up workstream plan and owners,Project Mgmt,2026-06-06,2026-06-10,Project Manager,High,0%,1
3,Confirm validation strategy,Validation,2026-06-11,2026-06-20,QA Lead,High,0%,2
4,Confirm data migration approach,Data Migration,2026-06-11,2026-06-20,Data Agent,High,0%,2
5,Configure core process workflow,Configuration,2026-06-21,2026-07-05,Config Agent,High,0%,3;4
6,Prepare training and adoption plan,Training,2026-07-06,2026-07-20,Training Lead,Medium,0%,5
7,Run readiness review,Readiness,2026-07-21,2026-07-31,Project Manager,Critical,0%,6`;

const modeCards: Array<{
  id: SetupMode;
  title: string;
  description: string;
  icon: typeof Sparkles;
}> = [
  {
    id: "template",
    title: "Start from guided template",
    description: "Use a pharma delivery structure with human and agent-led workstreams already shaped.",
    icon: Sparkles,
  },
  {
    id: "import",
    title: "Import Microsoft plan",
    description: "Bring tasks from Project, Planner, Excel, CSV, or a pasted table, then review before save.",
    icon: FileSpreadsheet,
  },
  {
    id: "blank",
    title: "Start blank",
    description: "Create the project shell first and add workstreams when you are ready.",
    icon: ClipboardList,
  },
];

export default function GuidedSetupPage() {
  const router = useRouter();
  const { createProject, setActiveProjectId } = useProject();
  const addTask = useEntityStore((s) => s.addTask);
  const addTeamMember = useEntityStore((s) => s.addTeamMember);

  const [mode, setMode] = useState<SetupMode>("template");
  const [name, setName] = useState("Veeva RIM Command Center");
  const [client, setClient] = useState("AivelloStudio Demo Corp");
  const [phase, setPhase] = useState("Phase 1 - Mobilise");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [goLiveDate, setGoLiveDate] = useState("2026-09-30");
  const [methodology, setMethodology] = useState("GAMP 5 / CSV");
  const [importText, setImportText] = useState(SAMPLE_IMPORT);
  const [importError, setImportError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const preview = useMemo<ImportPreview | null>(() => {
    if (mode === "blank") return null;
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
        const headers = Object.keys(records[0] ?? {});
        const body = records
          .map((record) => headers.map((header) => csvEscape(String(record[header] ?? ""))).join(","))
          .join("\n");
        setImportText([headers.join(","), body].filter(Boolean).join("\n"));
      } else {
        setImportText(await file.text());
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
    if (!startDate || !isIsoDate(startDate)) return "Add a valid project start date.";
    if (!goLiveDate || !isIsoDate(goLiveDate)) return "Add a valid target go-live date.";
    if (startDate >= goLiveDate) return "Target go-live must be after the project start date.";
    if (mode !== "blank" && (!preview || preview.tasks.length === 0)) {
      return "No tasks are ready to import. Paste a task table or choose the guided template.";
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
      name: name.trim(),
      client: client.trim(),
      phase: phase.trim() || "Mobilise",
      startDate,
      goLiveDate,
      methodology: methodology.trim() || "GAMP 5 / CSV",
    });

    if (preview && preview.tasks.length > 0) {
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
    }

    setActiveProjectId(created.id);
    toast.success("Project setup created", {
      description: preview ? `${preview.tasks.length} tasks and ${preview.owners.length} owners prepared.` : "Blank project shell is ready.",
    });
    router.push("/");
  }

  const selectedMode = modeCards.find((card) => card.id === mode) ?? modeCards[0];
  const SelectedModeIcon = selectedMode.icon;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Guided setup</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Set up a project that humans and agents can run</h1>
          <p className="text-sm text-muted-foreground">
            Start from a template, import Microsoft Project or Planner work, and review the structure before it becomes the active command center.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Create setup <ArrowRight className="h-4 w-4" />
        </button>
      </header>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {modeCards.map((card) => {
          const Icon = card.icon;
          const active = mode === card.id;
          return (
            <button
              key={card.id}
              onClick={() => setMode(card.id)}
              className={cn(
                "rounded-lg border bg-card p-4 text-left shadow-sm transition-all hover:shadow-md",
                active ? "border-primary/60 ring-2 ring-primary/10" : "border-border",
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={cn("rounded-md p-2", active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                  <Icon className="h-4 w-4" />
                </span>
                {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <p className="font-semibold text-foreground">{card.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.description}</p>
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
              <span className="rounded-md bg-blue-50 p-2 text-blue-700 dark:bg-blue-950/30">
                <ClipboardList className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">Project basics</h2>
                <p className="text-xs text-muted-foreground">These fields become the project shell and active command-center context.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Project name" required>
                <input value={name} onChange={(event) => setName(event.target.value)} className={inputCls} />
              </Field>
              <Field label="Client or business area" required>
                <input value={client} onChange={(event) => setClient(event.target.value)} className={inputCls} />
              </Field>
              <Field label="Current phase">
                <input value={phase} onChange={(event) => setPhase(event.target.value)} className={inputCls} />
              </Field>
              <Field label="Delivery method">
                <input value={methodology} onChange={(event) => setMethodology(event.target.value)} className={inputCls} />
              </Field>
              <Field label="Start date" required>
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={inputCls} />
              </Field>
              <Field label="Target go-live" required>
                <input type="date" value={goLiveDate} onChange={(event) => setGoLiveDate(event.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>

          {mode === "import" && (
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="rounded-md bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/30">
                    <FileSpreadsheet className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Import tasks</h2>
                    <p className="text-xs text-muted-foreground">
                      Use an Excel/CSV export from Microsoft Planner or Project. The import is reviewed before save.
                    </p>
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted">
                  {isReadingFile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Upload file
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv,.xlsx,.xls"
                    className="sr-only"
                    onChange={(event) => handleFile(event.target.files?.[0])}
                  />
                </label>
              </div>
              <textarea
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
                className="min-h-64 w-full rounded-md border border-border bg-background p-3 font-mono text-xs leading-5 text-foreground outline-none focus:border-primary"
                spellCheck={false}
              />
              {importError && (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30">
                  {importError}
                </p>
              )}
            </div>
          )}

          {mode === "template" && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-base font-semibold text-foreground">Guided template selected</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This creates a starter structure with project management, validation, data migration, configuration, training, and readiness workstreams. Two sample workstreams are agent-ready by default.
                  </p>
                </div>
              </div>
            </div>
          )}

          {mode === "blank" && (
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <ClipboardList className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <h2 className="text-base font-semibold text-foreground">Blank project shell</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This creates only the project context. Use it when you want to structure workstreams manually after the project exists.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
              <span className="rounded-md bg-primary/10 p-2 text-primary">
                <SelectedModeIcon className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">Review before create</h2>
                <p className="text-xs text-muted-foreground">{selectedMode.title}</p>
              </div>
            </div>

            {preview ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Tasks" value={preview.stats.importedTasks} />
                  <Metric label="Workstreams" value={preview.workstreams.length} />
                  <Metric label="Owners" value={preview.owners.length} />
                  <Metric label="Waiting links" value={preview.stats.linkedDependencies} />
                </div>

                {preview.stats.unresolvedDependencies > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30">
                    <div className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <p>{preview.stats.unresolvedDependencies} waiting link could not be matched. You can still create the project and review links from Plan.</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workstream shape</p>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.workstreams.map((workstream) => (
                      <span key={workstream} className="rounded-full border border-border bg-muted px-2 py-1 text-[11px] text-foreground">
                        {workstream}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Human and agent owners</p>
                  <div className="space-y-2">
                    {preview.owners.slice(0, 6).map((owner) => (
                      <div key={owner.initials} className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5">
                        {owner.name.toLowerCase().includes("agent") ? <Bot className="h-3.5 w-3.5 text-blue-600" /> : <Users className="h-3.5 w-3.5 text-muted-foreground" />}
                        <span className="min-w-0 flex-1 truncate text-xs text-foreground">{owner.name}</span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{owner.initials}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">First tasks</p>
                  <div className="space-y-2">
                    {preview.tasks.slice(0, 5).map((task) => (
                      <div key={task.sourceKey} className="rounded-md border border-border bg-background p-2">
                        <p className="line-clamp-1 text-xs font-medium text-foreground">{task.name}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {task.workstream} · {task.ownerName} · due {task.dueDate}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Metric label="Tasks" value={0} />
                  <Metric label="Workstreams" value={0} />
                  <Metric label="Owners" value={0} />
                  <Metric label="Waiting links" value={0} />
                </div>
                <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-950/30">
                  Blank setup creates only the project shell. Add workstreams from Plan or import tasks later.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">What happens next</h2>
            <ol className="mt-3 space-y-3 text-xs text-muted-foreground">
              <li className="flex gap-2"><span className="font-semibold text-foreground">1.</span> Create the project shell and make it active.</li>
              <li className="flex gap-2"><span className="font-semibold text-foreground">2.</span> Add imported tasks and owners with audit entries.</li>
              <li className="flex gap-2"><span className="font-semibold text-foreground">3.</span> Open Command Center so the PM can run the next actions.</li>
            </ol>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function csvEscape(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

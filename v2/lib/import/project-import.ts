import type { Task, TaskPriority, TaskStatus, TeamMember, Milestone, MilestoneStatus, CostLine } from "@/lib/mockData";

export type ImportCell = string | number | boolean | Date | null | undefined;
export type ImportRecord = Record<string, ImportCell>;

export type ImportSourceKind = "microsoft-planner" | "microsoft-project" | "generic";

export type ImportPreviewTask = {
  sourceKey: string;
  name: string;
  workstream: string;
  ownerName: string;
  ownerInitials: string;
  startDate?: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  predecessorKeys: string[];
  dependsOn: string[];
  warnings: string[];
};

// A milestone row detected in the plan (MS Project flags these via a
// Milestone=Yes column and/or zero duration). Extracting these gives the
// imported project a real gate spine, so the impact engine anchors on actual
// milestones instead of estimating from the latest task.
export type ImportPreviewMilestone = {
  sourceKey: string;
  name: string;
  phase: string;
  ownerInitials: string;
  plannedDate: string;
  status: MilestoneStatus;
  predecessorKeys: string[];
  predecessorSourceKey?: string; // resolved to another milestone row, if any
};

// Cost rolled up per workstream from a cost/budget column — gives the imported
// project a BAC so the confidence verdict computes instead of coverage-gating.
export type ImportPreviewCostLine = {
  category: string;
  budgetK: number;
  actualK: number;
};

export type ImportPreview = {
  sourceKind: ImportSourceKind;
  tasks: ImportPreviewTask[];
  milestones: ImportPreviewMilestone[];
  costLines: ImportPreviewCostLine[];
  workstreams: string[];
  owners: Array<{ name: string; initials: string; workstream: string }>;
  warnings: string[];
  stats: {
    totalRows: number;
    importedTasks: number;
    importedMilestones: number;
    importedBudgetK: number;
    linkedDependencies: number;
    unresolvedDependencies: number;
  };
};

export type BuildImportOptions = {
  defaultWorkstream?: string;
  defaultOwnerName?: string;
  fallbackDueDate?: string;
  // Explicit field → header mapping from the mapper UI. Overrides synonym
  // guessing so non-standard sheets import correctly.
  columnMap?: ColumnMap;
};

const TASK_NAME_KEYS = [
  "task title", "task name", "name", "title", "task", "subject",
];

const SOURCE_ID_KEYS = [
  "task id", "id", "unique id", "outline number", "wbs", "number",
];

const WORKSTREAM_KEYS = [
  "bucket name", "bucket", "workstream", "stream", "phase", "group", "section",
];

const OWNER_KEYS = [
  "assignments", "assigned to", "assignee", "owner", "resource names", "resources",
];

const START_KEYS = ["start", "start date", "planned start"];
const DUE_KEYS = ["due date", "finish", "finish date", "end", "end date", "planned finish"];
const STATUS_KEYS = ["status", "progress state", "state"];
const PRIORITY_KEYS = ["priority", "importance"];
const PROGRESS_KEYS = ["% complete", "percent complete", "complete", "progress", "percentage complete"];
const PREDECESSOR_KEYS = ["predecessors", "predecessor", "depends on", "dependencies", "blocked by"];
const MILESTONE_FLAG_KEYS = ["milestone", "is milestone"];
const DURATION_KEYS = ["duration", "dur"];
const TYPE_KEYS = ["type", "task type", "item type"];
const COST_KEYS = ["cost", "budget", "baseline cost", "total cost", "planned cost", "budget ($)"];
const ACTUAL_COST_KEYS = ["actual cost", "actuals", "actual spend", "spent", "spend to date"];

// Parse a currency/number cell: "$1,200.50" → 1200.5. Returns 0 when blank/NaN.
function parseCurrency(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// A row is a milestone when the plan says so: an explicit Milestone=Yes flag,
// a type of "milestone", or zero duration (the MS Project convention).
function isMilestoneRow(record: ImportRecord, columnMap?: ColumnMap): boolean {
  const flag = (columnMap?.milestone
    ? getField(record, "milestone", columnMap)
    : getFirst(record, MILESTONE_FLAG_KEYS)).toLowerCase();
  if (["yes", "true", "1", "y", "x"].includes(flag)) return true;
  if (/milestone/.test(getFirst(record, TYPE_KEYS).toLowerCase())) return true;
  const dur = getFirst(record, DURATION_KEYS);
  if (dur && /^0(\s*(d|day|days|h|hr|hrs|hour|hours))?$/i.test(dur.trim())) return true;
  return false;
}

function mapMilestoneStatus(status: TaskStatus): MilestoneStatus {
  if (status === "Complete") return "complete";
  if (status === "In Progress") return "in-progress";
  if (status === "Blocked" || status === "On Hold") return "at-risk";
  return "pending";
}

// ─── Column mapping (import fidelity for non-standard sheets) ─────────────────
//
// When a file's headers don't match the auto-recognized names, the PM maps their
// own columns to our fields. A ColumnMap (field → that file's header) overrides
// the synonym guessing; absent a mapping, we fall back to synonyms as before.

export type ImportField =
  | "name" | "workstream" | "owner" | "start" | "due"
  | "status" | "priority" | "progress" | "predecessors" | "milestone"
  | "cost" | "actualCost";

export type ColumnMap = Partial<Record<ImportField, string>>;

const FIELD_SYNONYMS: Record<ImportField, string[]> = {
  name: TASK_NAME_KEYS,
  workstream: WORKSTREAM_KEYS,
  owner: OWNER_KEYS,
  start: START_KEYS,
  due: DUE_KEYS,
  status: STATUS_KEYS,
  priority: PRIORITY_KEYS,
  progress: PROGRESS_KEYS,
  predecessors: PREDECESSOR_KEYS,
  milestone: MILESTONE_FLAG_KEYS,
  cost: COST_KEYS,
  actualCost: ACTUAL_COST_KEYS,
};

// Read a field: the PM's explicit mapping wins; otherwise synonym auto-match.
function getField(record: ImportRecord, field: ImportField, columnMap?: ColumnMap): string {
  const mapped = columnMap?.[field];
  if (mapped) {
    const wanted = normalizeHeader(mapped);
    const match = Object.entries(record).find(([key]) => normalizeHeader(key) === wanted);
    return normalizeCell(match?.[1]);
  }
  return getFirst(record, FIELD_SYNONYMS[field]);
}

// The file's actual column headers — what the mapper UI offers as choices.
export function detectHeaders(records: ImportRecord[]): string[] {
  return records[0] ? Object.keys(records[0]) : [];
}

// Pre-fill a mapping by matching each field's synonyms against the file headers.
export function guessColumnMap(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  (Object.keys(FIELD_SYNONYMS) as ImportField[]).forEach((field) => {
    const hit = headers.find((h) => FIELD_SYNONYMS[field].includes(normalizeHeader(h)));
    if (hit) map[field] = hit;
  });
  return map;
}

export type ParseOptions = {
  // When the auto-recognized header row isn't found, still parse using the
  // first substantial row as headers — so the mapper UI can show the columns.
  lenient?: boolean;
};

export function parseDelimitedTable(text: string, options: ParseOptions = {}): ImportRecord[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const delimiter = detectDelimiter(trimmed);
  const rows = parseRows(trimmed, delimiter);
  return recordsFromMatrix(rows, options);
}

export function recordsFromMatrix(matrix: ImportCell[][], options: ParseOptions = {}): ImportRecord[] {
  const normalizedRows = matrix
    .map((row) => row.map((cell) => normalizeCell(cell)))
    .filter((row) => row.some((cell) => cell.trim().length > 0));

  if (normalizedRows.length < 2) return [];

  let headerIndex = findHeaderRow(normalizedRows);
  if (headerIndex === -1) {
    if (!options.lenient) return [];
    // Lenient: first row with at least two non-empty cells is the header row.
    headerIndex = normalizedRows.findIndex((row) => row.filter((c) => c.trim().length > 0).length >= 2);
    if (headerIndex === -1) return [];
  }

  const headers = normalizedRows[headerIndex].map((header, index) => normalizeHeader(header) || `column ${index + 1}`);
  const records: ImportRecord[] = [];

  for (const row of normalizedRows.slice(headerIndex + 1)) {
    const record: ImportRecord = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    if (Object.values(record).some((value) => normalizeCell(value).trim().length > 0)) {
      records.push(record);
    }
  }

  return records;
}

export function buildImportPreview(records: ImportRecord[], options: BuildImportOptions = {}): ImportPreview {
  const sourceKind = detectSourceKind(records);
  const fallbackDueDate = options.fallbackDueDate ?? new Date().toISOString().slice(0, 10);
  const defaultWorkstream = options.defaultWorkstream ?? "Imported Plan";
  const defaultOwnerName = options.defaultOwnerName ?? "Project Manager";

  const columnMap = options.columnMap;
  const tasks: ImportPreviewTask[] = [];
  const milestones: ImportPreviewMilestone[] = [];
  const costByWorkstream = new Map<string, { budget: number; actual: number }>();
  const warnings: string[] = [];

  records.forEach((record, rowIndex) => {
    const name = getField(record, "name", columnMap);
    if (!name) return;

    const sourceKey = getFirst(record, SOURCE_ID_KEYS) || String(rowIndex + 1);
    const workstream = getField(record, "workstream", columnMap) || defaultWorkstream;
    const ownerName = cleanOwnerName(getField(record, "owner", columnMap) || defaultOwnerName);

    // Roll cost up per workstream (when a cost/budget column is mapped) → BAC.
    const rowBudget = parseCurrency(getField(record, "cost", columnMap));
    const rowActual = parseCurrency(getField(record, "actualCost", columnMap));
    if (rowBudget > 0 || rowActual > 0) {
      const bucket = costByWorkstream.get(workstream) ?? { budget: 0, actual: 0 };
      bucket.budget += rowBudget;
      bucket.actual += rowActual;
      costByWorkstream.set(workstream, bucket);
    }
    const startDate = parseDate(getField(record, "start", columnMap));
    const dueDate = parseDate(getField(record, "due", columnMap)) ?? startDate ?? fallbackDueDate;
    const status = mapStatus(getField(record, "status", columnMap), getField(record, "progress", columnMap));
    const predecessorKeys = parsePredecessors(getField(record, "predecessors", columnMap));

    // Milestone rows become the gate spine, not tasks.
    if (isMilestoneRow(record, columnMap)) {
      milestones.push({
        sourceKey,
        name,
        phase: workstream,
        ownerInitials: initialsFor(ownerName),
        plannedDate: dueDate,
        status: mapMilestoneStatus(status),
        predecessorKeys,
      });
      return;
    }

    const priority = mapPriority(getField(record, "priority", columnMap));
    const progress = mapProgress(getField(record, "progress", columnMap), status);
    const taskWarnings: string[] = [];
    if (!parseDate(getField(record, "due", columnMap)) && !startDate) {
      taskWarnings.push("No date found; using project fallback date.");
    }
    if (!getField(record, "owner", columnMap)) {
      taskWarnings.push("No owner found; assigning to project manager.");
    }

    tasks.push({
      sourceKey,
      name,
      workstream,
      ownerName,
      ownerInitials: initialsFor(ownerName),
      startDate,
      dueDate,
      status,
      priority,
      progress,
      predecessorKeys,
      dependsOn: [],
      warnings: taskWarnings,
    });
  });

  let unresolvedDependencies = 0;
  let linkedDependencies = 0;

  const sourceKeyToTaskKey = new Map<string, string>();
  tasks.forEach((task, index) => {
    sourceKeyToTaskKey.set(normalizeDependencyKey(task.sourceKey), `import-task-${index + 1}`);
  });

  for (const task of tasks) {
    task.dependsOn = task.predecessorKeys.flatMap((key) => {
      const match = sourceKeyToTaskKey.get(normalizeDependencyKey(key));
      if (match) {
        linkedDependencies += 1;
        return [match];
      }
      unresolvedDependencies += 1;
      task.warnings.push(`Waiting link "${key}" was not found in the import.`);
      return [];
    });
  }

  // Milestone → milestone predecessor: link to the first predecessor that is
  // itself a milestone, so the gate spine chains (drives go-live in the engine).
  const milestoneSourceKeys = new Set(milestones.map((m) => normalizeDependencyKey(m.sourceKey)));
  for (const ms of milestones) {
    ms.predecessorSourceKey = ms.predecessorKeys.find((key) => milestoneSourceKeys.has(normalizeDependencyKey(key)));
  }

  if (tasks.length === 0 && milestones.length === 0 && records.length > 0) {
    warnings.push("No task title column was found. Map a column to Task Name, Task Title, Name, or Title.");
  }
  if (records.length === 0) {
    warnings.push("No recognizable task table was found. Use a Microsoft Project or Planner export, or a CSV with Task Name plus Start/Finish or Due Date.");
  }

  // Roll the per-workstream cost buckets into cost lines (stored in $k).
  const costLines: ImportPreviewCostLine[] = Array.from(costByWorkstream.entries()).map(([category, v]) => ({
    category,
    budgetK: Math.round(v.budget / 1000),
    actualK: Math.round(v.actual / 1000),
  }));
  const importedBudgetK = costLines.reduce((sum, line) => sum + line.budgetK, 0);

  const workstreams = unique([...tasks.map((task) => task.workstream), ...milestones.map((m) => m.phase)]);
  const owners = uniqueBy(
    tasks.map((task) => ({
      name: task.ownerName,
      initials: task.ownerInitials,
      workstream: task.workstream,
    })),
    (owner) => owner.initials,
  );

  return {
    sourceKind,
    tasks,
    milestones,
    costLines,
    workstreams,
    owners,
    warnings,
    stats: {
      totalRows: records.length,
      importedTasks: tasks.length,
      importedMilestones: milestones.length,
      importedBudgetK,
      linkedDependencies,
      unresolvedDependencies,
    },
  };
}

export function previewTasksToTasks(projectId: string, preview: ImportPreview): Task[] {
  const keyMap = new Map<string, string>();
  preview.tasks.forEach((task, index) => {
    keyMap.set(`import-task-${index + 1}`, `${projectId}-task-${index + 1}`);
  });

  return preview.tasks.map((task, index) => ({
    id: `${projectId}-task-${index + 1}`,
    name: task.name,
    workstream: task.workstream,
    priority: task.priority,
    status: task.status,
    progress: task.progress,
    owner: task.ownerInitials,
    dueDate: task.dueDate,
    dependsOn: task.dependsOn.map((id) => keyMap.get(id)).filter(Boolean) as string[],
    projectId,
  }));
}

export function previewToMilestones(projectId: string, preview: ImportPreview): Milestone[] {
  // Ids are "m1".."mN" so the schedule engine's id parsing (parseInt after "m")
  // resolves them; scoped per project, so reuse across projects is harmless.
  const sourceKeyToId = new Map<string, string>();
  preview.milestones.forEach((m, index) => sourceKeyToId.set(m.sourceKey, `m${index + 1}`));

  return preview.milestones.map((m, index) => ({
    id: `m${index + 1}`,
    name: m.name,
    phase: m.phase,
    plannedDate: m.plannedDate,
    forecastDate: m.plannedDate,
    status: m.status,
    locked: false,
    owner: m.ownerInitials,
    duration: 1,
    predecessor: m.predecessorSourceKey ? sourceKeyToId.get(m.predecessorSourceKey) : undefined,
    lag: 0,
    projectId,
  }));
}

export function previewToCostLines(projectId: string, preview: ImportPreview): CostLine[] {
  return preview.costLines.map((line, index) => ({
    id: `${projectId}-cost-${index + 1}`,
    category: line.category,
    description: `${line.category} (imported)`,
    budgetK: line.budgetK,
    actualK: line.actualK,
    contractType: "T&M",
    owner: "PM",
    projectId,
  }));
}

export function previewOwnersToTeamMembers(projectId: string, preview: ImportPreview): TeamMember[] {
  return preview.owners.map((owner, index) => ({
    id: `${projectId}-member-${index + 1}`,
    initials: owner.initials,
    name: owner.name,
    role: owner.name.toLowerCase().includes("agent") ? "Agent Workstream" : "Workstream Lead",
    workstream: owner.workstream,
    projectId,
  }));
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const candidates = [",", "\t", ";"];
  return candidates
    .map((delimiter) => ({ delimiter, count: splitCsvLine(firstLine, delimiter).length }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter ?? ",";
}

function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);
  rows.push(row);
  return rows;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  return parseRows(line, delimiter)[0] ?? [];
}

function findHeaderRow(rows: string[][]): number {
  return rows.findIndex((row) => {
    const headers = row.map(normalizeHeader);
    const hasTaskName = headers.some((header) => TASK_NAME_KEYS.includes(header));
    const hasProjectLikeTask = headers.some((header) => ["finish", "due date", "start", "status", "predecessors"].includes(header));
    return hasTaskName && hasProjectLikeTask;
  });
}

function detectSourceKind(records: ImportRecord[]): ImportSourceKind {
  const keys = new Set(records.flatMap((record) => Object.keys(record).map(normalizeHeader)));
  if (keys.has("plan id") || keys.has("bucket name") || keys.has("labels")) return "microsoft-planner";
  if (keys.has("predecessors") || keys.has("resource names") || keys.has("outline number")) return "microsoft-project";
  return "generic";
}

function getFirst(record: ImportRecord, keys: string[]): string {
  const entries = Object.entries(record);
  for (const wanted of keys) {
    const match = entries.find(([key]) => normalizeHeader(key) === wanted);
    const value = normalizeCell(match?.[1]);
    if (value) return value;
  }
  return "";
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeCell(value: ImportCell): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseDate(value: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

function mapStatus(value: string, progressValue: string): TaskStatus {
  const normalized = value.toLowerCase();
  if (normalized.includes("block")) return "Blocked";
  if (normalized.includes("hold") || normalized.includes("defer")) return "On Hold";
  if (normalized.includes("complete") || normalized.includes("done")) return "Complete";
  if (normalized.includes("progress") || normalized.includes("active")) return "In Progress";
  if (normalized.includes("not started") || normalized.includes("to do") || normalized.includes("todo")) return "Not Started";

  const progress = numberFromPercent(progressValue) ?? 0;
  if (progress >= 100) return "Complete";
  if (progress > 0) return "In Progress";
  return "Not Started";
}

function mapPriority(value: string): TaskPriority {
  const normalized = value.toLowerCase();
  if (normalized.includes("critical") || normalized.includes("urgent")) return "Critical";
  if (normalized.includes("high") || normalized.includes("important")) return "High";
  if (normalized.includes("low")) return "Low";
  return "Medium";
}

function mapProgress(value: string, status: TaskStatus): number {
  const parsed = numberFromPercent(value);
  if (parsed !== null) return Math.max(0, Math.min(100, parsed));
  if (status === "Complete") return 100;
  if (status === "In Progress") return 50;
  return 0;
}

function numberFromPercent(value: string): number | null {
  if (!value) return null;
  const match = value.match(/\d+(\.\d+)?/);
  if (!match) return null;
  return Math.round(Number(match[0]));
}

function parsePredecessors(value: string): string[] {
  if (!value) return [];
  return value
    .split(/[;,| ]+/)
    .map((part) => part.replace(/[A-Za-z]+$/g, "").trim())
    .filter(Boolean);
}

function normalizeDependencyKey(value: string): string {
  return value.trim().toLowerCase().replace(/^0+/, "");
}

function cleanOwnerName(value: string): string {
  const first = value.split(/[;,]/)[0]?.trim();
  return first || "Project Manager";
}

function initialsFor(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9 ]+/g, " ").trim();
  if (!cleaned) return "PM";
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function uniqueBy<T>(values: T[], keyFn: (value: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const value of values) {
    const key = keyFn(value);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(value);
    }
  }
  return result;
}

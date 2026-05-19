import type { Task, TaskPriority, TaskStatus, TeamMember } from "@/lib/mockData";

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

export type ImportPreview = {
  sourceKind: ImportSourceKind;
  tasks: ImportPreviewTask[];
  workstreams: string[];
  owners: Array<{ name: string; initials: string; workstream: string }>;
  warnings: string[];
  stats: {
    totalRows: number;
    importedTasks: number;
    linkedDependencies: number;
    unresolvedDependencies: number;
  };
};

export type BuildImportOptions = {
  defaultWorkstream?: string;
  defaultOwnerName?: string;
  fallbackDueDate?: string;
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

export function parseDelimitedTable(text: string): ImportRecord[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const delimiter = detectDelimiter(trimmed);
  const rows = parseRows(trimmed, delimiter);
  return recordsFromMatrix(rows);
}

export function recordsFromMatrix(matrix: ImportCell[][]): ImportRecord[] {
  const normalizedRows = matrix
    .map((row) => row.map((cell) => normalizeCell(cell)))
    .filter((row) => row.some((cell) => cell.trim().length > 0));

  if (normalizedRows.length < 2) return [];

  const headerIndex = findHeaderRow(normalizedRows);
  if (headerIndex === -1) return [];

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

  const tasks: ImportPreviewTask[] = [];
  const sourceKeyToIndex = new Map<string, number>();
  const warnings: string[] = [];

  records.forEach((record, rowIndex) => {
    const name = getFirst(record, TASK_NAME_KEYS);
    if (!name) return;

    const sourceKey = getFirst(record, SOURCE_ID_KEYS) || String(rowIndex + 1);
    const workstream = getFirst(record, WORKSTREAM_KEYS) || defaultWorkstream;
    const ownerName = cleanOwnerName(getFirst(record, OWNER_KEYS) || defaultOwnerName);
    const startDate = parseDate(getFirst(record, START_KEYS));
    const dueDate = parseDate(getFirst(record, DUE_KEYS)) ?? startDate ?? fallbackDueDate;
    const status = mapStatus(getFirst(record, STATUS_KEYS), getFirst(record, PROGRESS_KEYS));
    const priority = mapPriority(getFirst(record, PRIORITY_KEYS));
    const progress = mapProgress(getFirst(record, PROGRESS_KEYS), status);
    const predecessorKeys = parsePredecessors(getFirst(record, PREDECESSOR_KEYS));
    const taskWarnings: string[] = [];

    if (!parseDate(getFirst(record, DUE_KEYS)) && !startDate) {
      taskWarnings.push("No date found; using project fallback date.");
    }
    if (!getFirst(record, OWNER_KEYS)) {
      taskWarnings.push("No owner found; assigning to project manager.");
    }

    sourceKeyToIndex.set(normalizeDependencyKey(sourceKey), tasks.length);
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

  if (tasks.length === 0 && records.length > 0) {
    warnings.push("No task title column was found. Check that the export includes task names or titles.");
  }
  if (records.length === 0) {
    warnings.push("No rows were found. Paste or upload a Microsoft Project, Planner, or CSV task export.");
  }

  const workstreams = unique(tasks.map((task) => task.workstream));
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
    workstreams,
    owners,
    warnings,
    stats: {
      totalRows: records.length,
      importedTasks: tasks.length,
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

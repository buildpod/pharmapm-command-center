export type TourStep = {
  route?: string;
  anchor: string;
  title: string;
  body: string;
  nextLabel?: string;
};

export const TOUR_STORAGE_KEY = "aivello_tours_seen_v1";
export const COMMAND_CENTER_JOURNEY_SEEN_KEY = "aivello_command_center_journey_seen_v1";
export const ACTIVE_COMMAND_CENTER_JOURNEY_KEY = "aivello_active_command_center_journey_v1";

// ── Seen-state (single source of truth) ─────────────────────────────────────
// The tour engine, the topbar launcher badge, and the Guide drawer's "Viewed"
// chips all read/write through these. Mutations broadcast TOURS_SEEN_EVENT so
// live badges update the moment a tour is completed or skipped.

export type TourSeenMap = Record<string, boolean>;
export const TOURS_SEEN_EVENT = "aivello:tours-seen-change";

function notifySeenChange() {
  try {
    window.dispatchEvent(new CustomEvent(TOURS_SEEN_EVENT));
  } catch {}
}

export function readTourSeen(): TourSeenMap {
  try {
    const raw = window.localStorage.getItem(TOUR_STORAGE_KEY);
    return raw ? JSON.parse(raw) as TourSeenMap : {};
  } catch {
    return {};
  }
}

export function markTourSeen(route: string) {
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify({ ...readTourSeen(), [route]: true }));
  } catch {}
  notifySeenChange();
}

export function readJourneySeen(): boolean {
  try {
    return window.localStorage.getItem(COMMAND_CENTER_JOURNEY_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markJourneySeen() {
  try {
    window.localStorage.setItem(COMMAND_CENTER_JOURNEY_SEEN_KEY, "1");
    window.sessionStorage.removeItem(ACTIVE_COMMAND_CENTER_JOURNEY_KEY);
  } catch {}
  notifySeenChange();
}

export const commandCenterJourney = {
  id: "command-center",
  eyebrow: "Command Center Launch",
  title: "Welcome to PharmaPM Command Center.",
  body: "This guide follows the practical PM path: choose a start, create or import the project, validate the generated plan, run the dashboard, then report from live evidence.",
  primaryAction: "Start command center guide",
  steps: [
    {
      route: "/",
      anchor: "dashboard-verdict",
      // Copy must hold in BOTH states this anchor exists in: the first-run
      // launchpad (choose a start) and an active project (live verdict).
      title: "Start from the dashboard",
      body: "First run, this is the launchpad — explore the sample, create from a playbook, or import a plan. With a project active, it becomes the live verdict the whole command center runs from.",
      nextLabel: "Go to setup",
    },
    {
      route: "/setup",
      anchor: "setup-discovery",
      title: "Discover the project shape",
      body: "Setup captures the minimum facts needed to recommend a playbook or prepare an import for review.",
      nextLabel: "Open dashboard",
    },
    {
      route: "/",
      anchor: "dashboard-verdict",
      title: "Run from the computed verdict",
      body: "After creation, the dashboard turns schedule, cost, risk, and evidence records into a defensible delivery story.",
      nextLabel: "Go to milestones",
    },
    {
      route: "/milestones",
      anchor: "guided-work",
      title: "Validate delivery gates",
      body: "Milestones show whether the schedule promise has credible owners, gates, and proof points.",
      nextLabel: "Go to tasks",
    },
    {
      route: "/tasks",
      anchor: "tasks-register",
      title: "Work from source records",
      body: "Task rows are where ownership, dates, progress, and dependencies change the delivery story in real time.",
      nextLabel: "Go to reports",
    },
    {
      route: "/reports",
      anchor: "reports-picker",
      title: "Report from the same evidence",
      body: "Reports reshape the live command-center truth for weekly status, SteerCo, or workstream audiences without breaking the evidence trail.",
    },
  ] satisfies TourStep[],
};

export const toursByRoute: Record<string, TourStep[]> = {
  "/": [
    {
      anchor: "dashboard-verdict",
      title: "Your verdict is computed",
      body: "The project verdict comes from delivery evidence and cost/schedule signals. It is not hand-set.",
    },
    {
      anchor: "dashboard-kpis",
      title: "Every number is a door",
      body: "Open the KPI cards to inspect the source records behind schedule, risk, budget, and go-live timing.",
    },
    {
      anchor: "dashboard-what-now",
      title: "What needs attention",
      body: "This panel turns the project's live signals into the next practical actions for the PM.",
    },
    {
      anchor: "dashboard-confidence",
      title: "Confidence drivers explain the score",
      body: "Cost efficiency, schedule pace, and forecast cost show why confidence is moving.",
    },
  ],
  "/truth": [
    {
      anchor: "truth-score",
      title: "The score's arithmetic",
      body: "Delivery Signals explains why the current promise is credible, watch, at risk, or not ready.",
    },
    {
      anchor: "truth-actions",
      title: "Leadership choices",
      body: "Decision options summarize the choices implied by the current project data.",
    },
    {
      anchor: "truth-trace",
      title: "Trace chips land on records",
      body: "Each source link opens the exact task, risk, document, milestone, or cost line behind the claim.",
    },
  ],
  "/tasks": [
    {
      anchor: "tasks-summary",
      title: "Workstream status first",
      body: "The top summary shows progress, blockers, and work in flight before the detailed register.",
    },
    {
      anchor: "tasks-filters",
      title: "Focus the register",
      body: "Use filters to reduce the task list to the ownership, status, or workstream you need.",
    },
    {
      anchor: "tasks-register",
      title: "Edit from the row",
      body: "Open a task row to update owner, progress, due date, or dependencies.",
    },
  ],
  "/costs": [
    {
      anchor: "costs-kpis",
      title: "Budget pressure at a glance",
      body: "Budget, spend, and remaining room show whether the financial story is still credible.",
    },
    {
      anchor: "costs-burn",
      title: "Burn explains pressure",
      body: "The burn bar shows how much approved budget has already been consumed.",
    },
    {
      anchor: "costs-lines",
      title: "Cost lines are evidence",
      body: "Each line should map to a vendor, work package, environment, or internal effort the sponsor can understand.",
    },
  ],
  "/reports": [
    {
      anchor: "reports-picker",
      title: "Choose the audience",
      body: "Weekly Status, Steering Committee, and Workstream reports answer different leadership questions.",
    },
    {
      anchor: "reports-actions",
      title: "Export what you see",
      body: "Print/PDF and Excel exports should match the live report on screen.",
    },
    {
      anchor: "reports-evidence",
      title: "Backtrace before sending",
      body: "Use the evidence links to verify claims before the report goes to SteerCo.",
    },
  ],
  "/setup": [
    {
      anchor: "setup-discovery",
      title: "Start with the project facts",
      body: "Discovery captures the identity, regulated context, and dates that shape the command-center operating model.",
    },
    {
      anchor: "setup-source",
      title: "Choose the right starting source",
      body: "Pick a playbook, import, saved template, or blank skeleton based on what the PM already has.",
    },
    {
      anchor: "setup-template",
      title: "Shape the operating model",
      body: "Review why the recommendation or mapping fits before the system creates milestones, work, evidence, and risks.",
    },
    {
      anchor: "setup-summary",
      title: "Validate before creating",
      body: "Confirm the records and the after-create review path before the command center becomes active.",
    },
  ],
  "/activity": [
    {
      anchor: "activity-summary",
      title: "The audit trail, humanized",
      body: "Everything that changed on this project, newest first — who did what, when, grouped by day.",
    },
    {
      anchor: "activity-feed",
      title: "Every entry traces to its source",
      body: "Each item comes from a real recorded action — nothing is fabricated, and nothing recorded can quietly disappear.",
    },
    {
      anchor: "topbar-help",
      title: "Replay any time",
      body: "The Guide drawer gives page help, tours, and the glossary whenever you need them.",
    },
  ],
  "/plan": [
    {
      anchor: "plan-summary",
      title: "The project's shape at a glance",
      body: "Charter status, milestone gates, task counts, and the dependency links that drive schedule movement.",
    },
    {
      anchor: "plan-shape",
      title: "Each card is a door",
      body: "Charter, milestones, tasks, and waiting links — click any card to open the register behind the number.",
    },
    {
      anchor: "guided-work",
      title: "Cleanup nudges from live gaps",
      body: "The guided panel flags plan weaknesses computed from your records — missing owners, unlinked tasks, thin structure.",
    },
  ],
  "/milestones": [
    {
      anchor: "milestones-summary",
      title: "The schedule promise, gate by gate",
      body: "Every milestone shows its planned date next to the live forecast, so drift is visible before it becomes a surprise.",
    },
    {
      anchor: "milestones-board",
      title: "Edit a date, see the consequences first",
      body: "The banner tracks drift against the committed baseline. Click any planned date to edit — downstream impact is shown for review before you save.",
    },
    {
      anchor: "guided-work",
      title: "Live nudges for this page",
      body: "Guided work points at schedule and ownership gaps computed from your real records — never generic tips.",
    },
  ],
  "/worklist": [
    {
      anchor: "worklist-summary",
      title: "What is active right now",
      body: "Blockers first, then due work, approvals, high risks, and the next delivery gates — the triage view for a working day.",
    },
    {
      anchor: "worklist-actions",
      title: "Rows open the exact record",
      body: "Next Best Actions deep-links each item to the task, risk, document, or milestone that needs the decision.",
    },
    {
      anchor: "topbar-help",
      title: "Replay any time",
      body: "Open Guide for page help and to run this walkthrough again.",
    },
  ],
  "/my-items": [
    {
      anchor: "my-items-summary",
      title: "Your personal action list",
      body: "Everything assigned to you in this project — tasks, documents, risks, and milestones in one queue.",
    },
    {
      anchor: "my-items-buckets",
      title: "Overdue and blocked surface first",
      body: "The buckets triage your load: overdue, then blocked, due this week, and on-track — scan top to bottom.",
    },
    {
      anchor: "topbar-help",
      title: "Replay any time",
      body: "The Guide drawer gives how-to help and runs this walkthrough again.",
    },
  ],
  "/readiness": [
    {
      anchor: "readiness-summary",
      title: "Go-live gates computed from evidence",
      body: "Gate readiness is calculated from live document approvals and milestone completion — not from anyone's opinion.",
    },
    {
      anchor: "readiness-gates",
      title: "Each gate counts its evidence",
      body: "The percentage is approved evidence over required evidence. Click a gate to open the exact missing item.",
    },
    {
      anchor: "topbar-help",
      title: "Replay any time",
      body: "Guide provides page help, the glossary, and this tour again when needed.",
    },
  ],
  "/governance": [
    {
      anchor: "governance-summary",
      title: "The controls leadership actually checks",
      body: "Open risks, pending decision packs, budget truth, and charter status — the four questions every SteerCo opens with.",
    },
    {
      anchor: "governance-controls",
      title: "Four controls, each one a door",
      body: "Every card links to its source register, so a number is never more than one click from its evidence.",
    },
    {
      anchor: "topbar-help",
      title: "Replay any time",
      body: "The Guide drawer explains this page and can run the tour again.",
    },
  ],
  "/charter": [
    {
      anchor: "charter-summary",
      title: "The authority document",
      body: "The formal authorisation for this project — the reference every SteerCo decision points back to.",
    },
    {
      anchor: "charter-doc",
      title: "Scope, objectives, sponsor, approval",
      body: "Purpose, measurable outcomes, assumptions, constraints, and who signed it off — kept current, not buried in a drive.",
    },
    {
      anchor: "topbar-help",
      title: "Replay any time",
      body: "Guide gives page help and runs this walkthrough again without touching the record.",
    },
  ],
  "/decisions": [
    {
      anchor: "decisions-summary",
      title: "The decision log auditors ask for",
      body: "What was decided, when, by whom, which alternatives were weighed, and why — so nobody reconstructs it from meeting minutes.",
    },
    {
      anchor: "decisions-board",
      title: "Each card is a complete record",
      body: "Context, chosen option, alternatives considered, and the supersession chain when a decision replaces an earlier one.",
    },
    {
      anchor: "topbar-help",
      title: "Replay any time",
      body: "The Guide has page help, the glossary, and this tour whenever you need it again.",
    },
  ],
  "/risks": [
    {
      anchor: "risks-summary",
      title: "Exceptions that threaten the promise",
      body: "Risks are potential future events, scored probability × impact, each with an owner and a mitigation.",
    },
    {
      anchor: "risks-board",
      title: "The matrix and the cards are linked",
      body: "Click any dot in the heatmap to jump to that risk's full mitigation context beside it.",
    },
    {
      anchor: "guided-work",
      title: "Guidance from live exposure",
      body: "Nudges highlight risks missing owners, mitigations, or leadership attention — computed from the register itself.",
    },
  ],
  "/issues": [
    {
      anchor: "issues-summary",
      title: "Live problems, not future risks",
      body: "Issues are happening now; risks are what might happen. Keeping them separate keeps both registers honest.",
    },
    {
      anchor: "issues-board",
      title: "Severity, owner, resolution",
      body: "Every issue carries who owns it and the plan to clear it — critical-to-clear items surface first.",
    },
    {
      anchor: "topbar-help",
      title: "Replay any time",
      body: "The Guide drawer gives practical help and lets you run this tour again.",
    },
  ],
  "/documents": [
    {
      anchor: "documents-summary",
      title: "Approvals and evidence in one place",
      body: "Lifecycle artefacts grouped by validation phase — the paper trail an audit or readiness gate will ask for.",
    },
    {
      anchor: "documents-board",
      title: "Record decisions on the person chips",
      body: "Click a reviewer or approver chip to record their decision. Document status derives automatically — it is never hand-set.",
    },
    {
      anchor: "guided-work",
      title: "Approval-debt nudges",
      body: "Guided work surfaces pending reviews that block readiness or weaken the next report.",
    },
  ],
  "/resources": [
    {
      anchor: "resources-summary",
      title: "People, availability, meetings",
      body: "Who is on the project, when they're away, and the governance cadence that keeps delivery moving.",
    },
    {
      anchor: "resources-board",
      title: "Absences show their delivery impact",
      body: "Record an absence and the affected tasks and milestones surface automatically — cover gaps before they become slips.",
    },
    {
      anchor: "topbar-help",
      title: "Replay any time",
      body: "Guide gives page help and runs this tour again when needed.",
    },
  ],
  "/projects": [
    {
      anchor: "projects-summary",
      title: "Manage your command centers",
      body: "Switch between projects, create new ones, and remove test data — the active project drives every other view.",
    },
    {
      anchor: "projects-list",
      title: "Search, switch, export, reuse",
      body: "Find a project, make it active, export its data, or save it as a reusable template for the next rollout.",
    },
    {
      anchor: "topbar-help",
      title: "Replay any time",
      body: "Guide explains this admin surface and runs the walkthrough again when needed.",
    },
  ],
  "/settings": [
    {
      anchor: "settings-summary",
      title: "The rules that drive the math",
      body: "Working calendars, holidays, and status bands shape every schedule calculation — set once, applied everywhere.",
    },
    {
      anchor: "settings-rules",
      title: "Calendars, bands, and your identity",
      body: "Holiday calendars keep schedule shifts realistic per region, and your name here is what every record signs as. Scoring thresholds are fixed by design — a verdict you can tune is a verdict you can game.",
    },
    {
      anchor: "topbar-help",
      title: "Replay any time",
      body: "Guide explains why these rules matter and runs the tour again when needed.",
    },
  ],
};

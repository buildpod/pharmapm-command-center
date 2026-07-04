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
      anchor: "route-context",
      title: "Know where you are",
      body: "Activity is the recent-change view for understanding what moved since the last project conversation.",
    },
    {
      anchor: "primary-nav",
      title: "Move from signal to source",
      body: "Use the primary navigation to jump from recent changes into the command, plan, governance, finance, or people view.",
    },
    {
      anchor: "topbar-help",
      title: "Replay guidance when needed",
      body: "The Guide drawer gives page help, tours, the product journey, and the glossary without crowding the topbar.",
    },
  ],
  "/plan": [
    {
      anchor: "guided-work",
      title: "Plan guidance uses live gaps",
      body: "The guided panel highlights plan cleanup based on project records, such as missing owners or thin structure.",
    },
    {
      anchor: "primary-nav",
      title: "Open the plan records",
      body: "Use Plan navigation to move into milestones, tasks, worklist, your items, and readiness gates.",
    },
    {
      anchor: "topbar-help",
      title: "Use Guide for the walkthrough",
      body: "Start the page tour or product journey from the Guide drawer whenever you need a replay.",
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
      anchor: "route-context",
      title: "Charter defines authority",
      body: "Use this page to make scope, outcomes, sponsor ownership, and approval visible.",
    },
    {
      anchor: "primary-nav",
      title: "Connect charter to governance",
      body: "Move between charter, risks, decisions, issues, and documents when the control story needs support.",
    },
    {
      anchor: "topbar-help",
      title: "Open charter help",
      body: "Guide gives page help and starts a walkthrough without changing the record data.",
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
      anchor: "route-context",
      title: "People and meetings show operating rhythm",
      body: "Use this route to see who owns work and which governance conversations keep delivery moving.",
    },
    {
      anchor: "primary-nav",
      title: "Move from people to work",
      body: "Use navigation to inspect tasks, issues, decisions, and readiness records tied to ownership.",
    },
    {
      anchor: "topbar-help",
      title: "Open people guidance",
      body: "Guide gives page help and a replayable tour for this operating view.",
    },
  ],
  "/projects": [
    {
      anchor: "route-context",
      title: "Manage command centers",
      body: "Projects is where you switch, export, delete, or save reusable project templates.",
    },
    {
      anchor: "primary-nav",
      title: "Return to command work",
      body: "Use navigation to move back into dashboard, plan, governance, finance, or people views.",
    },
    {
      anchor: "topbar-help",
      title: "Get project management help",
      body: "Guide explains this admin surface and starts a route walkthrough when needed.",
    },
  ],
  "/settings": [
    {
      anchor: "route-context",
      title: "Settings control calculations",
      body: "Use settings to review calendars and rules that shape schedule impact and working-day logic.",
    },
    {
      anchor: "primary-nav",
      title: "Return to delivery surfaces",
      body: "Use navigation to validate how settings affect plan, tasks, milestones, and readiness views.",
    },
    {
      anchor: "topbar-help",
      title: "Open settings guidance",
      body: "Guide explains why these rules matter and can replay the page tour.",
    },
  ],
};

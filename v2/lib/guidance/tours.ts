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
      title: "Start from the launchpad",
      body: "Choose whether to explore the sample, create from a playbook, import a plan, or start with a blank skeleton.",
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
      anchor: "guided-work",
      title: "Milestone guidance focuses the review",
      body: "Guided work points to live schedule and ownership issues that can weaken the delivery promise.",
    },
    {
      anchor: "primary-nav",
      title: "Milestones connect to tasks",
      body: "Move between milestones and tasks to understand which work drives each delivery gate.",
    },
    {
      anchor: "topbar-help",
      title: "Open route help",
      body: "The Guide drawer explains schedule impact and gives a replayable tour for this page.",
    },
  ],
  "/worklist": [
    {
      anchor: "route-context",
      title: "Worklist is the action queue",
      body: "Use this route to triage blockers, overdue work, and records waiting for PM attention.",
    },
    {
      anchor: "primary-nav",
      title: "Jump back to source registers",
      body: "The navigation helps you move from action queue to the underlying plan or governance register.",
    },
    {
      anchor: "topbar-help",
      title: "Get page help",
      body: "Open Guide for page purpose, how-to help, and a replayable walkthrough.",
    },
  ],
  "/my-items": [
    {
      anchor: "route-context",
      title: "My Items narrows ownership",
      body: "This route collects work assigned to the current user across command-center records.",
    },
    {
      anchor: "primary-nav",
      title: "Open the record owner view",
      body: "Use navigation to move from personal action back to the source register when details need updating.",
    },
    {
      anchor: "topbar-help",
      title: "Use Guide for context",
      body: "The drawer gives how-to guidance and starts the walkthrough without adding more topbar controls.",
    },
  ],
  "/readiness": [
    {
      anchor: "route-context",
      title: "Readiness shows gate confidence",
      body: "Use this route to see which go-live gates are complete, blocked, or missing evidence.",
    },
    {
      anchor: "primary-nav",
      title: "Trace missing evidence",
      body: "Move from readiness into documents, risks, tasks, or governance records that explain each gap.",
    },
    {
      anchor: "topbar-help",
      title: "Replay readiness help",
      body: "Guide provides page help, product glossary, and a tour when DAP is on.",
    },
  ],
  "/governance": [
    {
      anchor: "route-context",
      title: "Governance collects control points",
      body: "This route brings charter, risks, issues, documents, and decisions into one leadership-control view.",
    },
    {
      anchor: "primary-nav",
      title: "Open the governance register",
      body: "Use the primary navigation to move from the summary into decisions, risks, issues, documents, or charter.",
    },
    {
      anchor: "topbar-help",
      title: "Get governance guidance",
      body: "The Guide drawer explains what to do here and can replay a basic page tour.",
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
      anchor: "route-context",
      title: "Decisions record leadership choices",
      body: "Use this page when Delivery Signals or governance discussions create a choice that needs ownership.",
    },
    {
      anchor: "primary-nav",
      title: "Connect decisions to evidence",
      body: "Move from decisions to risks, documents, reports, or Delivery Signals to support the choice.",
    },
    {
      anchor: "topbar-help",
      title: "Replay decision help",
      body: "Guide explains how decisions fit the command center and starts the page tour.",
    },
  ],
  "/risks": [
    {
      anchor: "guided-work",
      title: "Risk guidance uses live exposure",
      body: "Guided work points to risks that need mitigation, ownership, or leadership attention.",
    },
    {
      anchor: "primary-nav",
      title: "Connect risks to governance",
      body: "Use navigation to move from risk detail into issues, decisions, documents, or reports.",
    },
    {
      anchor: "topbar-help",
      title: "Open risk help",
      body: "Guide gives page help, glossary, and a route walkthrough when DAP is enabled.",
    },
  ],
  "/issues": [
    {
      anchor: "route-context",
      title: "Issues are active problems",
      body: "Use this route for delivery problems that require resolution, owner follow-up, and visible status.",
    },
    {
      anchor: "primary-nav",
      title: "Separate issues from risks",
      body: "Use governance navigation to move between issues, longer-horizon risks, and recorded decisions.",
    },
    {
      anchor: "topbar-help",
      title: "Get issue guidance",
      body: "The Guide drawer gives practical help and lets you replay the page tour.",
    },
  ],
  "/documents": [
    {
      anchor: "guided-work",
      title: "Document guidance finds approval gaps",
      body: "Guided work surfaces pending evidence and approval records that matter for readiness and audit.",
    },
    {
      anchor: "primary-nav",
      title: "Documents support governance",
      body: "Move between documents, readiness, risks, and reports to prove the project story.",
    },
    {
      anchor: "topbar-help",
      title: "Open document help",
      body: "Guide explains document evidence and can start a tour of the page.",
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

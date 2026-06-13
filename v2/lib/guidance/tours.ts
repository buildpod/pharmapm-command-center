export type TourStep = {
  anchor: string;
  title: string;
  body: string;
};

export const TOUR_STORAGE_KEY = "aivello_tours_seen_v1";

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
      title: "Start with project facts",
      body: "Discovery captures only the details needed to recommend a setup.",
    },
    {
      anchor: "setup-template",
      title: "Pick the closest playbook",
      body: "Playbooks create a stronger starting plan than a blank skeleton, and can be adjusted before creation.",
    },
    {
      anchor: "setup-summary",
      title: "Review before creating",
      body: "Check tasks, milestones, owners, risks, and scope before the command center becomes active.",
    },
  ],
};

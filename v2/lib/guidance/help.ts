import { routeToTabMap } from "../navigation";

export type HelpEntry = {
  question: string;
  canDo: string[];
};

export const evmGlossary = [
  {
    term: "CPI",
    definition: "Cost efficiency: how much planned work is earned for each $1 spent.",
  },
  {
    term: "SPI(t)",
    definition: "Schedule pace: whether the team is earning planned work on pace in real time.",
  },
  {
    term: "EAC",
    definition: "Forecast final cost if the current cost pattern continues.",
  },
  {
    term: "Earned value",
    definition: "The planned value of the work the team has actually completed.",
  },
  {
    term: "Forecast headroom",
    definition: "The remaining schedule or budget room before the promise becomes compressed.",
  },
];

export const helpByRoute: Record<string, HelpEntry> = {
  "/": {
    question: "Is the project healthy enough to trust?",
    canDo: [
      "Read the computed executive verdict before the detail.",
      "Open KPI cards to inspect schedule, risk, budget, and go-live evidence.",
      "Use What needs attention to decide the next PM action.",
    ],
  },
  "/truth": {
    question: "What evidence supports the delivery story?",
    canDo: [
      "See which signals are changing the project promise.",
      "Open trace links to the exact source record.",
      "Turn signal findings into SteerCo decision options.",
    ],
  },
  "/reports": {
    question: "What can I send to leadership?",
    canDo: [
      "Choose the report view for the audience.",
      "Backtrace claims to source records before sending.",
      "Print or export the current live report.",
    ],
  },
  "/activity": {
    question: "What changed recently?",
    canDo: [
      "Review the latest project changes in one place.",
      "Spot schedule, ownership, and evidence updates.",
      "Use recent changes to prepare status conversations.",
    ],
  },
  "/setup": {
    question: "How do I create or import the command center?",
    canDo: [
      "Capture discovery facts once.",
      "Choose a playbook, import an existing plan, or start with a skeleton.",
      "Review generated milestones, tasks, risks, owners, and scope before creating.",
    ],
  },
  "/worklist": {
    question: "What work is active?",
    canDo: [
      "Start with blockers and work waiting for action.",
      "Open rows directly in their source register.",
      "Use the list as a daily PM triage queue.",
    ],
  },
  "/my-items": {
    question: "What do I personally owe?",
    canDo: [
      "Find work assigned to you across registers.",
      "Separate action items from informational records.",
      "Open source records to update status or ownership.",
    ],
  },
  "/readiness": {
    question: "Are gates ready for go-live?",
    canDo: [
      "See which readiness gates are complete or blocked.",
      "Open missing evidence directly.",
      "Focus the team on approval and evidence gaps before go-live.",
    ],
  },
  "/plan": {
    question: "What is the project shape?",
    canDo: [
      "Read the charter-to-milestone-to-task structure.",
      "Open plan rows to the source register.",
      "Use counts and gaps to see where the plan is thin.",
    ],
  },
  "/milestones": {
    question: "Does the schedule promise still hold?",
    canDo: [
      "Review decision gates and delivery proof points.",
      "Edit planned or forecast dates when reality changes.",
      "Use schedule impact review before shifting dependent work.",
    ],
  },
  "/tasks": {
    question: "Who owns the next move?",
    canDo: [
      "Filter tasks by workstream, status, priority, or owner.",
      "Update progress and status from the task register.",
      "Review dependency impact before saving date shifts.",
    ],
  },
  "/governance": {
    question: "What decisions and controls matter?",
    canDo: [
      "See risks, decision packs, budget control, and charter status together.",
      "Open governance source records directly.",
      "Use the page before sponsor or audit conversations.",
    ],
  },
  "/charter": {
    question: "Is scope and authority clear?",
    canDo: [
      "Create or edit the authorising project charter.",
      "Record scope, outcomes, assumptions, constraints, sponsor, and approval.",
      "Load a standard template when starting from a blank project.",
    ],
  },
  "/decisions": {
    question: "What decisions are open or made?",
    canDo: [
      "Review pending and closed decisions.",
      "Record sponsor or governance choices.",
      "Trace decisions back to project evidence.",
    ],
  },
  "/issues": {
    question: "What issues need resolution?",
    canDo: [
      "Raise delivery issues that require active resolution.",
      "Track owner, severity, and current status.",
      "Separate issues from longer-horizon risks.",
    ],
  },
  "/risks": {
    question: "What exceptions need attention?",
    canDo: [
      "Prioritize risks by probability, impact, and mitigation.",
      "Open high-exposure risks before status meetings.",
      "Use the matrix to explain why a risk needs leadership attention.",
    ],
  },
  "/documents": {
    question: "What approvals and evidence are waiting?",
    canDo: [
      "See pending reviewers and approvers first.",
      "Open document cards to update evidence and decisions.",
      "Use pending decisions to prepare governance follow-up.",
    ],
  },
  "/costs": {
    question: "Is spend still credible?",
    canDo: [
      "Track budget, actuals, and remaining room.",
      "Open cost lines that explain pressure.",
      "Keep spend evidence current before SteerCo reporting.",
    ],
  },
  "/resources": {
    question: "Who is needed and what meeting actions remain?",
    canDo: [
      "Review people, roles, and meeting cadence.",
      "Add team members or meetings as delivery evidence.",
      "Spot ownership gaps that could slow decisions.",
    ],
  },
  "/projects": {
    question: "Which command center is active?",
    canDo: [
      "Search, switch, open, export, save, or delete projects.",
      "Create new projects from setup.",
      "Save reusable templates from a good project structure.",
    ],
  },
  "/settings": {
    question: "What rules drive schedule calculations?",
    canDo: [
      "Review calendars, working days, and schedule controls.",
      "Keep rules aligned with how the project team actually works.",
      "Use settings to make schedule impact reviews realistic.",
    ],
  },
};

export function missingHelpRoutes() {
  return Object.keys(routeToTabMap).filter((route) => !helpByRoute[route]);
}

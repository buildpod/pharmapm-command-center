import { routeToTabMap } from "../navigation";

export type HelpEntry = {
  question: string;
  canDo: string[];
  howDoI: string[];
};

export const productGlossary = [
  {
    term: "Delivery Signals",
    definition: "The evidence layer that explains whether the current delivery promise is credible, watch, at risk, or not ready.",
  },
  {
    term: "Schedule Impact",
    definition: "A review step that shows which downstream dates move before schedule changes are saved.",
  },
  {
    term: "Evidence Trail",
    definition: "Links from claims back to the exact task, risk, document, milestone, or cost line behind them.",
  },
  {
    term: "SteerCo Report",
    definition: "A leadership-ready status view that uses the same live project evidence as the dashboard.",
  },
  {
    term: "Command Center",
    definition: "The operating surface where plan, governance, evidence, cost, and reports stay connected.",
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
    howDoI: [
      "Open Delivery Signals to see why confidence changed.",
      "Use the readiness checklist to close missing setup records.",
      "Open Reports when the project story is ready for leadership.",
    ],
  },
  "/truth": {
    question: "What evidence supports the delivery story?",
    canDo: [
      "See which signals are changing the project promise.",
      "Open trace links to the exact source record.",
      "Turn signal findings into SteerCo decision options.",
    ],
    howDoI: [
      "Start with the score panel, then inspect the source chips.",
      "Open leadership choices to decide what needs escalation.",
      "Use the evidence trail before sending a report.",
    ],
  },
  "/reports": {
    question: "What can I send to leadership?",
    canDo: [
      "Choose the report view for the audience.",
      "Backtrace claims to source records before sending.",
      "Print or export the current live report.",
    ],
    howDoI: [
      "Pick Weekly Status for delivery rhythm.",
      "Pick Steering Committee when a sponsor needs a decision-ready story.",
      "Use evidence links before publishing or exporting.",
    ],
  },
  "/activity": {
    question: "What changed recently?",
    canDo: [
      "Review the latest project changes in one place.",
      "Spot schedule, ownership, and evidence updates.",
      "Use recent changes to prepare status conversations.",
    ],
    howDoI: [
      "Scan recent activity before a status meeting.",
      "Look for ownership or schedule changes that need follow-up.",
      "Use the list to explain what changed since the last review.",
    ],
  },
  "/setup": {
    question: "How do I create or import the command center?",
    canDo: [
      "Capture discovery facts once.",
      "Choose a playbook, import an existing plan, or start with a skeleton.",
      "Review generated milestones, tasks, risks, owners, and scope before creating.",
    ],
    howDoI: [
      "Use Create from playbook when the project resembles a known rollout.",
      "Use Import existing plan when the team already has a schedule.",
      "Review the generated plan before making it the active command center.",
    ],
  },
  "/worklist": {
    question: "What work is active?",
    canDo: [
      "Start with blockers and work waiting for action.",
      "Open rows directly in their source register.",
      "Use the list as a daily PM triage queue.",
    ],
    howDoI: [
      "Filter to blocked or overdue work first.",
      "Open the source record when ownership or dates need changing.",
      "Use Worklist as the daily action queue, not a full project plan.",
    ],
  },
  "/my-items": {
    question: "What do I personally owe?",
    canDo: [
      "Find work assigned to you across registers.",
      "Separate action items from informational records.",
      "Open source records to update status or ownership.",
    ],
    howDoI: [
      "Use My Items to see personal ownership across the command center.",
      "Open the source row to update status where the work lives.",
      "Clear pending decisions before the next governance review.",
    ],
  },
  "/readiness": {
    question: "Are gates ready for go-live?",
    canDo: [
      "See which readiness gates are complete or blocked.",
      "Open missing evidence directly.",
      "Focus the team on approval and evidence gaps before go-live.",
    ],
    howDoI: [
      "Review blocked gates before go-live readiness meetings.",
      "Open missing documents or risks directly from the gate.",
      "Use readiness gaps to focus validation and training follow-up.",
    ],
  },
  "/plan": {
    question: "What is the project shape?",
    canDo: [
      "Read the charter-to-milestone-to-task structure.",
      "Open plan rows to the source register.",
      "Use counts and gaps to see where the plan is thin.",
    ],
    howDoI: [
      "Start with the project shape, then inspect weak areas.",
      "Open milestones when the schedule promise needs checking.",
      "Open tasks when ownership or dependency detail is missing.",
    ],
  },
  "/milestones": {
    question: "Does the schedule promise still hold?",
    canDo: [
      "Review decision gates and delivery proof points.",
      "Edit planned or forecast dates when reality changes.",
      "Use schedule impact review before shifting dependent work.",
    ],
    howDoI: [
      "Use milestones for delivery gates, not every activity.",
      "Open related tasks to understand what drives each date.",
      "Review schedule impact before saving date movement.",
    ],
  },
  "/tasks": {
    question: "Who owns the next move?",
    canDo: [
      "Filter tasks by workstream, status, priority, or owner.",
      "Update progress and status from the task register.",
      "Review dependency impact before saving date shifts.",
    ],
    howDoI: [
      "Filter to the owner or workstream you need.",
      "Open a row to update status, progress, dates, or dependencies.",
      "Use the impact review when date changes affect downstream work.",
    ],
  },
  "/governance": {
    question: "What decisions and controls matter?",
    canDo: [
      "See risks, decision packs, budget control, and charter status together.",
      "Open governance source records directly.",
      "Use the page before sponsor or audit conversations.",
    ],
    howDoI: [
      "Open Decisions when leadership choices need recording.",
      "Open Risks when exceptions need mitigation.",
      "Open Charter when scope or authority is unclear.",
    ],
  },
  "/charter": {
    question: "Is scope and authority clear?",
    canDo: [
      "Create or edit the authorising project charter.",
      "Record scope, outcomes, assumptions, constraints, sponsor, and approval.",
      "Load a standard template when starting from a blank project.",
    ],
    howDoI: [
      "Use the template when the charter is blank.",
      "Record outcomes and constraints in plain PM language.",
      "Keep sponsor approval visible for governance and audit use.",
    ],
  },
  "/decisions": {
    question: "What decisions are open or made?",
    canDo: [
      "Review pending and closed decisions.",
      "Record sponsor or governance choices.",
      "Trace decisions back to project evidence.",
    ],
    howDoI: [
      "Record decisions when a signal requires leadership choice.",
      "Use pending decisions to prepare SteerCo agenda items.",
      "Close decisions only when the owner and outcome are clear.",
    ],
  },
  "/issues": {
    question: "What issues need resolution?",
    canDo: [
      "Raise delivery issues that require active resolution.",
      "Track owner, severity, and current status.",
      "Separate issues from longer-horizon risks.",
    ],
    howDoI: [
      "Create issues for active problems, not hypothetical risks.",
      "Assign an owner and severity so follow-up is visible.",
      "Resolve issues when the blocking condition is cleared.",
    ],
  },
  "/risks": {
    question: "What exceptions need attention?",
    canDo: [
      "Prioritize risks by probability, impact, and mitigation.",
      "Open high-exposure risks before status meetings.",
      "Use the matrix to explain why a risk needs leadership attention.",
    ],
    howDoI: [
      "Review high-score risks before leadership reporting.",
      "Add mitigation where a risk is open but unmanaged.",
      "Use risk evidence to explain confidence changes.",
    ],
  },
  "/documents": {
    question: "What approvals and evidence are waiting?",
    canDo: [
      "See pending reviewers and approvers first.",
      "Open document cards to update evidence and decisions.",
      "Use pending decisions to prepare governance follow-up.",
    ],
    howDoI: [
      "Find pending reviewers before readiness or validation meetings.",
      "Open documents to update approval and evidence status.",
      "Use documents as audit evidence behind the delivery story.",
    ],
  },
  "/costs": {
    question: "Is spend still credible?",
    canDo: [
      "Track budget, actuals, and remaining room.",
      "Open cost lines that explain pressure.",
      "Keep spend evidence current before SteerCo reporting.",
    ],
    howDoI: [
      "Start with budget pressure and burn.",
      "Open cost lines to explain vendor or work-package spend.",
      "Keep costs current so confidence and reporting stay aligned.",
    ],
  },
  "/resources": {
    question: "Who is needed and what meeting actions remain?",
    canDo: [
      "Review people, roles, and meeting cadence.",
      "Add team members or meetings as delivery evidence.",
      "Spot ownership gaps that could slow decisions.",
    ],
    howDoI: [
      "Add accountable owners for key delivery areas.",
      "Use meeting cadence to make governance rhythm visible.",
      "Review people gaps when tasks or decisions lack ownership.",
    ],
  },
  "/projects": {
    question: "Which command center is active?",
    canDo: [
      "Search, switch, open, export, save, or delete projects.",
      "Create new projects from setup.",
      "Save reusable templates from a good project structure.",
    ],
    howDoI: [
      "Switch projects when operating a different command center.",
      "Export project data before sharing or archiving.",
      "Save a reusable template from a project structure worth repeating.",
    ],
  },
  "/settings": {
    question: "What rules drive schedule calculations?",
    canDo: [
      "Review calendars, working days, and schedule controls.",
      "Keep rules aligned with how the project team actually works.",
      "Use settings to make schedule impact reviews realistic.",
    ],
    howDoI: [
      "Check working calendars before relying on schedule impact.",
      "Use settings to align calculations with the team’s actual rhythm.",
      "Review rules when forecast dates look surprising.",
    ],
  },
};

export function missingHelpRoutes() {
  return Object.keys(routeToTabMap).filter((route) => !helpByRoute[route]);
}

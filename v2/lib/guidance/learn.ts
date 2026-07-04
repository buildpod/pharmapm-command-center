// Learn — self-serve training for the non-certified PM.
// Three tracks: project-management fundamentals in plain words, how this
// command center computes its numbers, and why that beats generic PM tooling.
// Content only — rendering lives in app/(app)/learn/page.tsx; the Guide
// drawer links here. Keep lessons short (2–4 min), jargon-free, and honest.

export interface Lesson {
  id: string;
  title: string;
  minutes: number;      // honest reading time
  summary: string;      // one-line hook on the collapsed card
  body: string[];       // short paragraphs
  takeaways: string[];
}

export interface LessonTrack {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export const lessonTracks: LessonTrack[] = [
  {
    id: "pm-basics",
    title: "Project management, in plain words",
    description: "The four ideas that make a delivery plan defensible — no certification required.",
    lessons: [
      {
        id: "baselines",
        title: "Baselines — the promise you measure against",
        minutes: 3,
        summary: "Why a plan you can quietly edit is not a plan at all.",
        body: [
          "A plan says what you intend to do. A baseline is that plan frozen at the moment you committed to it — dates, cost, scope. From then on, progress is measured against the frozen copy, not against whatever the plan says today.",
          "This matters because plans drift. If the go-live date quietly moves every time work slips, the project never looks late — the target simply walks away. Auditors and sponsors call this re-baselining without governance, and it is the most common way delivery trouble stays hidden.",
          "The honest pattern: measure against the frozen commitment, and when a re-baseline is genuinely needed, record who moved it, when, and why — visibly.",
        ],
        takeaways: [
          "Measure against the frozen commitment, never the live editable plan.",
          "A moved target must carry a name, a date, and a reason.",
          "In this tool: the Milestones banner tracks drift; every re-baseline is audited.",
        ],
      },
      {
        id: "earned-value",
        title: "Earned value, without the jargon",
        minutes: 4,
        summary: "Three numbers that catch a troubled project months early.",
        body: [
          "Earned value compares three things: what you planned to have done by today, what you actually got done, and what you spent doing it. Everything else — CPI, SPI, EAC — is arithmetic on those three.",
          "Cost efficiency (CPI) asks: for every pound spent, how much planned work did we actually earn? 0.85 means you buy 85p of progress per £1 — the project will overrun unless something changes. Schedule pace, SPI(t), asks the same about time.",
          "The trap is measuring 'done' by asking people. Claimed percent-complete is the single most gamed number in project management — which is why serious earned value weights progress by each task's budget and cross-checks claims against observable records.",
        ],
        takeaways: [
          "Plan vs done vs spent — everything else is derived.",
          "CPI below 1.0 today predicts a cost overrun tomorrow; treat it early.",
          "In this tool: give every task a budget and earned value weights big work over small automatically.",
        ],
      },
      {
        id: "raid",
        title: "Risks, issues, decisions — a register that holds up",
        minutes: 3,
        summary: "The difference between RAID theatre and RAID an auditor accepts.",
        body: [
          "A risk is something that might happen; an issue is happening now. Mixing them ruins both: risks get firefighting urgency they don't need, and live problems hide behind probability scores.",
          "Decisions are the third register people forget until an audit asks 'who approved that, and what were the alternatives?'. A decision log written at the time — context, options weighed, rationale, owner — takes minutes. Reconstructing it from meeting minutes a year later takes days and convinces nobody.",
          "The test for all three registers is the same: could a stranger read this and know what to do next, who owns it, and why past choices were made?",
        ],
        takeaways: [
          "Risks might happen; issues are happening — keep the registers separate.",
          "Record decisions when they're made, with alternatives and rationale.",
          "In this tool: Risks, Issues, and Decisions are separate registers, and every save is audit-logged.",
        ],
      },
      {
        id: "status-integrity",
        title: "Why claimed progress gets checked",
        minutes: 2,
        summary: "The kindest thing a tool can do is doubt your green.",
        body: [
          "Most status reports are optimistic because humans are: nobody wants to be the red row in the SteerCo pack. So '80% complete' quietly means '80% of the pleasant work'.",
          "The fix is not blame — it's cross-checking. When claimed progress says one thing and observable records (dates slipping, dependencies blocked, approvals missing) say another, the gap itself is the signal.",
          "A report that flags its own weak spots earns more trust than one that's uniformly green. Sponsors know green-only packs are edited; a visible integrity check is what makes the rest of the numbers believable.",
        ],
        takeaways: [
          "Optimism bias is normal — design the process to catch it, not to punish it.",
          "Claimed vs computed: the gap is the signal.",
          "In this tool: the Status Integrity check flags progress the records don't support, and the report carries the caveat.",
        ],
      },
    ],
  },
  {
    id: "this-tool",
    title: "How this command center works",
    description: "Where the numbers come from — and why none of them can be hand-set.",
    lessons: [
      {
        id: "one-truth",
        title: "One financial truth",
        minutes: 2,
        summary: "Every money number traces to the same computation.",
        body: [
          "Confidence, cost pressure, budget burn, and forecast cost all come from one earned-value snapshot computed from your cost lines and task progress. No screen recomputes its own version, so two pages can never disagree about the money.",
          "Nothing financial is hand-set. There is no field where anyone can type a healthier number — the only way to change the score is to change the underlying records, and record changes are audit-logged.",
        ],
        takeaways: [
          "One computation feeds every surface — screens cannot contradict each other.",
          "The score can't be typed over; only real records move it.",
        ],
      },
      {
        id: "confidence-score",
        title: "The confidence score, opened up",
        minutes: 3,
        summary: "40% cost, 40% schedule, 20% forecast — shown, not hidden.",
        body: [
          "The 0–100 confidence score is: 40 × cost efficiency + 40 × schedule pace + 20 × forecast headroom, each capped at 1. The Delivery Signals page shows this arithmetic with your live values substituted in — the score is an explanation, not a verdict from a black box.",
          "Two honesty gates sit in front of it. If the project lacks enough data (no budget lines, no tasks), the verdict shows as pending rather than inventing one. And an untouched plan reads 'Plan only' — a fresh plan hasn't earned trust, it just hasn't deviated yet.",
        ],
        takeaways: [
          "The formula is visible on Delivery Signals — check the arithmetic yourself.",
          "'Plan only' and coverage gating stop the score flattering an empty project.",
        ],
      },
      {
        id: "schedule-impact",
        title: "Schedule impact before you save",
        minutes: 2,
        summary: "Move a date and see who it drags with it — before committing.",
        body: [
          "Tasks and milestones carry real dependencies. When you move a date, the impact review opens first: which downstream tasks shift, which milestones slip, whether the frozen go-live commitment is breached, and whether anything collides with a hard window like a regulatory freeze.",
          "You accept the consequences explicitly or adjust — and the acceptance itself becomes an audit-logged decision that shows up in the weekly report. Nothing slips silently.",
        ],
        takeaways: [
          "Date edits show their downstream consequences before saving.",
          "Accepting a slip is a recorded, reportable decision — not a quiet edit.",
        ],
      },
      {
        id: "evidence-doors",
        title: "Every number is a door",
        minutes: 2,
        summary: "Any claim on any screen opens the records behind it.",
        body: [
          "Dashboards usually summarize; this one traces. The KPI cards, the signals on Delivery Signals, the governance controls — each links to the exact tasks, risks, documents, or cost lines that produced it.",
          "Reports are generated from the same records, so the SteerCo pack and the working screens can never tell different stories. When a sponsor asks 'says who?', the answer is one click, not a follow-up email.",
        ],
        takeaways: [
          "Click any number to reach its source records.",
          "Reports and screens read the same data — one story, everywhere.",
        ],
      },
    ],
  },
  {
    id: "why-this",
    title: "Why this beats the usual tools",
    description: "What Excel, MS Project, and ticket trackers structurally cannot do.",
    lessons: [
      {
        id: "vs-spreadsheets",
        title: "Versus Excel and MS Project",
        minutes: 3,
        summary: "They record intent. They don't defend it.",
        body: [
          "Spreadsheets and Gantt tools are excellent at describing a plan. But every cell is hand-editable, so the plan and the status are whatever the last editor wanted them to be. There is no frozen baseline unless someone maintains one by discipline, no audit trail, and no computed verdict — the RAG colour is an opinion.",
          "Here the schedule math is the same, but the honesty layer is structural: commitments freeze, edits cascade visibly, progress is cross-checked, and the confidence score cannot be typed. The output isn't a plan file — it's a delivery story you can defend line by line.",
        ],
        takeaways: [
          "A hand-editable plan can't prove anything about itself.",
          "Structural honesty (frozen baseline, audit log, computed verdict) beats discipline-based honesty.",
        ],
      },
      {
        id: "vs-trackers",
        title: "Versus Jira, Asana, and Monday",
        minutes: 3,
        summary: "Ticket flow is not delivery truth.",
        body: [
          "Ticket trackers optimize for team throughput: boards, sprints, assignments. Useful — but they answer 'what is everyone doing?', not 'will we hit the date, at what cost, and can we prove it?'. They have no earned value, no frozen commitment, no schedule-impact review, and their reports summarize activity rather than evidence.",
          "This command center is built for the delivery question. It's not a replacement for how a team organizes its work — it's the layer that turns project records into an executive-grade, auditable answer about the promise.",
        ],
        takeaways: [
          "Trackers answer activity questions; this answers the delivery question.",
          "EVM + baseline + evidence trail is the layer trackers don't have.",
        ],
      },
      {
        id: "regulated",
        title: "Built for regulated delivery",
        minutes: 2,
        summary: "Audit-ready by design — and your data never leaves the machine.",
        body: [
          "Regulated implementations (GxP, validation-heavy rollouts) get audited on process: who approved what, when the baseline moved, where the evidence is. Generic tools bolt this on; here the audit log, approval chips, decision register, and readiness gates are the core design.",
          "And the data model is deliberately local: project records live in your browser, not on a vendor's cloud. For pharma delivery data, 'no third-party processing' is not a limitation — it's a compliance feature you can say out loud in a vendor assessment.",
        ],
        takeaways: [
          "Audit trail, approvals, and gates are the architecture, not add-ons.",
          "Local-only data is a compliance feature for regulated environments.",
        ],
      },
    ],
  },
];

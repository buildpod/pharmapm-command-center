// Video guides — the ONE place a video becomes visible in the app.
//
// Pipeline (docs/video/README.md): script doc → NotebookLM Video Overview →
// download MP4 → upload to YouTube (Unlisted) → paste the video id below.
// Entries WITHOUT a youtubeId are silently skipped — no placeholder
// thumbnails, no "coming soon" theatre (same no-fabricated-data rule as
// everything else). The Learn page renders whatever has a real id.

export interface VideoGuide {
  id: string;
  audience: "Project managers" | "Executives" | "Pitch";
  title: string;
  description: string;
  minutes: number;          // target runtime, from the script doc
  script: string;           // repo path of the source script (for maintenance)
  youtubeId?: string;       // e.g. "dQw4w9WgXcQ" — presence makes it render
}

export const videoGuides: VideoGuide[] = [
  {
    id: "pm-module-1",
    audience: "Project managers",
    title: "From plan to living command center",
    description: "First fifteen minutes: create or import a project, validate what was generated, and read the dashboard honestly.",
    minutes: 7,
    script: "docs/video/VIDEO_PM_MODULE_1.md",
  },
  {
    id: "pm-module-2",
    audience: "Project managers",
    title: "The weekly rhythm: run, absorb, report",
    description: "Update work in clicks, absorb a slip as a governed decision, and let the report assemble itself from evidence.",
    minutes: 7,
    script: "docs/video/VIDEO_PM_MODULE_2.md",
  },
  {
    id: "executive-brief",
    audience: "Executives",
    title: "Can you trust the plan?",
    description: "Why status from this system is more trustworthy than a normal SteerCo pack — in under three minutes.",
    minutes: 3,
    script: "docs/video/VIDEO_EXECUTIVE.md",
  },
  {
    id: "pitch",
    audience: "Pitch",
    title: "The honest delivery layer for regulated projects",
    description: "The problem priced, the wedge, and how the audit engagement works.",
    minutes: 3,
    script: "docs/video/VIDEO_PITCH.md",
  },
];

// Only videos that actually exist render anywhere.
export const publishedVideos = videoGuides.filter((v) => !!v.youtubeId);

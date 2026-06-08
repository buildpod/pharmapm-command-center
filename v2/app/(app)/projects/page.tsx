"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Check, ExternalLink, Trash2, Save, Search, X } from "lucide-react";
import { useProject } from "@/components/projects/project-provider";
import { ExportButton } from "@/components/projects/export-button";
import { Field, inputCls, ConfirmDelete } from "@/components/ui/entity-drawer";
import { useEntityStore } from "@/lib/stores/entity-store";
import { buildCustomProjectTemplate, saveCustomProjectTemplate } from "@/lib/templates/custom-project-templates";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const { projects, activeProjectId, setActiveProjectId, deleteProject } = useProject();
  const milestones = useEntityStore((s) => s.milestones);
  const tasks = useEntityStore((s) => s.tasks);
  const risks = useEntityStore((s) => s.risks);
  const documents = useEntityStore((s) => s.documents);
  const costLines = useEntityStore((s) => s.costLines);
  const teamMembers = useEntityStore((s) => s.teamMembers);
  const meetings = useEntityStore((s) => s.meetings);
  const absences = useEntityStore((s) => s.absences);
  const charters = useEntityStore((s) => s.charters);
  const replaceAllMilestones = useEntityStore((s) => s.replaceAllMilestones);
  const replaceAllTasks = useEntityStore((s) => s.replaceAllTasks);
  const replaceAllRisks = useEntityStore((s) => s.replaceAllRisks);
  const replaceAllDocuments = useEntityStore((s) => s.replaceAllDocuments);
  const replaceAllCostLines = useEntityStore((s) => s.replaceAllCostLines);
  const replaceAllTeamMembers = useEntityStore((s) => s.replaceAllTeamMembers);
  const replaceAllMeetings = useEntityStore((s) => s.replaceAllMeetings);
  const replaceAllAbsences = useEntityStore((s) => s.replaceAllAbsences);
  const replaceAllCharters = useEntityStore((s) => s.replaceAllCharters);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [templateSourceId, setTemplateSourceId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredProjects = projects.filter((project) => {
    if (!normalizedQuery) return true;
    return [
      project.name,
      project.code,
      project.id,
      project.client,
      project.phase,
      project.methodology,
      project.startDate,
      project.goLiveDate,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });

  function handleDelete(id: string) {
    const target = projects.find((p) => p.id === id);
    const auditNote = `Deleted project ${target?.name ?? id}`;
    replaceAllMilestones(milestones.filter((item) => item.projectId !== id), { source: "user-edit", note: auditNote });
    replaceAllTasks(tasks.filter((item) => item.projectId !== id), { source: "user-edit", note: auditNote });
    replaceAllRisks(risks.filter((item) => item.projectId !== id), { source: "user-edit", note: auditNote });
    replaceAllDocuments(documents.filter((item) => item.projectId !== id), { source: "user-edit", note: auditNote });
    replaceAllCostLines(costLines.filter((item) => item.projectId !== id), { source: "user-edit", note: auditNote });
    replaceAllTeamMembers(teamMembers.filter((item) => item.projectId !== id), { source: "user-edit", note: auditNote });
    replaceAllMeetings(meetings.filter((item) => item.projectId !== id), { source: "user-edit", note: auditNote });
    replaceAllAbsences(absences.filter((item) => item.projectId !== id), { source: "user-edit", note: auditNote });
    replaceAllCharters(charters.filter((item) => item.projectId !== id), { source: "user-edit", note: auditNote });
    deleteProject(id);
    toast.success("Project deleted", { description: target?.name });
    setConfirmDeleteId(null);
  }

  function startTemplateSave(id: string) {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    setTemplateSourceId(id);
    setTemplateName(`${target.name} release template`);
    setTemplateDescription(`Reusable workstream, governance, and control model from ${target.name}.`);
  }

  function handleSaveTemplate(id: string) {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    const template = buildCustomProjectTemplate({
      project: target,
      templateName,
      description: templateDescription,
      milestones,
      tasks,
      documents,
      risks,
      costLines,
      teamMembers,
      charter: charters.find((item) => item.projectId === id),
    });
    saveCustomProjectTemplate(template);
    toast.success("Template saved", {
      description: `${template.coverage.tasks} tasks, ${template.coverage.milestones} milestones, and ${template.coverage.workstreams.length} workstreams are reusable in setup.`,
    });
    setTemplateSourceId(null);
    setTemplateName("");
    setTemplateDescription("");
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Switch between projects, save reusable templates, and remove test projects. The active project drives every other view in the app.
          </p>
        </div>
        <Link
          href="/setup"
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          New Project
        </Link>
      </header>

      <section className="rounded-xl border border-border bg-card p-4 shadow-sm" aria-label="Search projects">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder="Search by project, code, client, phase, method, or date..."
              aria-label="Search projects"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear project search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-muted px-2.5 py-1">
              {filteredProjects.length} of {projects.length} projects
            </span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-primary">
              Active project stays highlighted
            </span>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {filteredProjects.map((p) => {
          const isActive = p.id === activeProjectId;
          const isConfirming = confirmDeleteId === p.id;
          return (
            <div
              key={p.id}
              className={cn(
                "rounded-xl border bg-card p-5 shadow-sm transition-all",
                isActive ? "border-primary/50 ring-2 ring-primary/10" : "border-border hover:shadow-md"
              )}
            >
              {isConfirming ? (
                <ConfirmDelete
                  label={`project "${p.name}"`}
                  onConfirm={() => handleDelete(p.id)}
                  onCancel={() => setConfirmDeleteId(null)}
                />
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-foreground">{p.name}</h3>
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                          {p.code ?? p.id}
                        </span>
                        {isActive && (
                          <span className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            <Check className="h-3 w-3" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.client} · {p.phase} · {p.methodology}
                      </p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Start <span className="font-medium text-foreground">{p.startDate}</span>
                        <span className="mx-2">→</span>
                        Go-live <span className="font-medium text-foreground">{p.goLiveDate}</span>
                      </p>
                    </div>
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
                      <ExportButton project={p} variant="compact" />
                      <button
                        onClick={() => startTemplateSave(p.id)}
                        className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        <Save className="mr-1 inline h-3 w-3" />
                        Save as template
                      </button>
                      {!isActive && (
                        <button
                          onClick={() => {
                            setActiveProjectId(p.id);
                            toast.success("Switched project", { description: p.name });
                          }}
                          className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                        >
                          Switch to
                        </button>
                      )}
                      <Link
                        href="/"
                        onClick={() => setActiveProjectId(p.id)}
                        className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </Link>
                      {projects.length > 1 && (
                        <button
                          onClick={() => setConfirmDeleteId(p.id)}
                          className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/30"
                          title="Delete project"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {templateSourceId === p.id && (
                    <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
                      <p className="text-sm font-semibold text-foreground">Save reusable project template</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Reuse this project&apos;s workstreams, milestones, tasks, risks, documents, costs, and team roles for future releases or rollouts.
                      </p>
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <Field label="Template name" required>
                          <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} className={inputCls} />
                        </Field>
                        <Field label="Description">
                          <input value={templateDescription} onChange={(event) => setTemplateDescription(event.target.value)} className={inputCls} />
                        </Field>
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <button onClick={() => setTemplateSourceId(null)} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
                          Cancel
                        </button>
                        <button onClick={() => handleSaveTemplate(p.id)} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                          Save template
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filteredProjects.length === 0 && (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Search className="mx-auto h-6 w-6 text-muted-foreground" />
            <h3 className="mt-3 text-sm font-semibold text-foreground">No matching projects</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a project code, client name, phase, methodology, or go-live date.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-4 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Deleting a project removes its locally created tasks, milestones, risks, documents, costs, people, meetings, absences, and charter records.
      </p>
    </div>
  );
}

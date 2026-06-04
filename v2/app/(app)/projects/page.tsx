"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Check, ExternalLink, Trash2, Save } from "lucide-react";
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

      <div className="space-y-3">
        {projects.map((p) => {
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
                    <div className="flex shrink-0 flex-wrap gap-2">
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
      </div>

      <p className="text-[11px] text-muted-foreground">
        Deleting a project removes its locally created tasks, milestones, risks, documents, costs, people, meetings, absences, and charter records.
      </p>
    </div>
  );
}

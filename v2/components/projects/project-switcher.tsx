"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronsUpDown, Check, Plus, Wand2, Search, X } from "lucide-react";
import { useProject } from "./project-provider";
import { cn } from "@/lib/utils";

// Sidebar dropdown replacing the static project card. Lists every project,
// click to switch (persists to localStorage via context). Footer link goes
// to /projects for create/manage.

export function ProjectSwitcher() {
  const { projects, activeProject, setActiveProjectId } = useProject();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

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
      project.goLiveDate,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-left hover:bg-muted/70 transition-colors"
        aria-expanded={open}
        aria-label="Switch project"
      >
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{activeProject.name}</p>
          <p className="truncate text-xs text-muted-foreground">{activeProject.code ?? activeProject.phase}</p>
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-border bg-card shadow-lg overflow-hidden">
          <div className="border-b border-border p-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-8 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="Search projects..."
                aria-label="Search projects"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Clear project search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </label>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {filteredProjects.map((p) => {
              const active = p.id === activeProject.id;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => { setActiveProjectId(p.id); setOpen(false); setQuery(""); }}
                    className={cn(
                      "flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted",
                      active && "bg-primary/5"
                    )}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{p.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {(p.code ?? p.id).toUpperCase()} · {p.client} · go-live {p.goLiveDate}
                      </p>
                    </div>
                    {active && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                  </button>
                </li>
              );
            })}
            {filteredProjects.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                No matching projects.
              </li>
            )}
          </ul>
          <Link
            href="/projects"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-t border-border bg-muted/30 px-3 py-2 text-xs font-medium text-primary hover:bg-muted/50"
          >
            <Plus className="h-3 w-3" />
            Manage projects
          </Link>
          <Link
            href="/setup"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 border-t border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <Wand2 className="h-3 w-3" />
            Create or import project
          </Link>
        </div>
      )}
    </div>
  );
}

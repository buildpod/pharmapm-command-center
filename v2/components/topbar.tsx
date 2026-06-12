"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Sun, Moon } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/sidebar";
import { CommandPaletteTrigger } from "@/components/command-palette";
import { NotificationBell } from "@/components/notification-bell";
import { ExportButton } from "@/components/projects/export-button";
import { useTheme } from "@/components/theme-provider";
import { useProject } from "@/components/projects/project-provider";
import { useState } from "react";

const routeLabels: Record<string, string> = {
  "/":           "Dashboard",
  "/truth":      "Delivery Signals",
  "/setup":      "New Project",
  "/worklist":   "Worklist",
  "/plan":       "Plan",
  "/governance": "Governance",
  "/decisions":  "Decisions",
  "/issues":     "Issues",
  "/readiness":  "Readiness Gates",
  "/my-items":   "My Items",
  "/projects":   "Projects",
  "/milestones": "Milestones",
  "/tasks":      "Tasks",
  "/risks":      "Risks",
  "/costs":      "Costs",
  "/resources":  "People & Meetings",
  "/documents":  "Documents",
  "/reports":    "Reports",
  "/settings":   "Rules & Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { activeProject } = useProject();

  const label =
    Object.entries(routeLabels).find(([path]) =>
      path === "/" ? pathname === "/" : pathname.startsWith(path)
    )?.[1] ?? "AivelloStudio";

  return (
    <>
      {/* Mobile menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button type="button" className="topbar-icon-button topbar-mobile-menu">
            <Menu />
            <span className="sr-only">Open menu</span>
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 overflow-y-auto p-0">
          <SheetTitle className="sr-only">Product navigation</SheetTitle>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Breadcrumb — shows the active project as live context */}
      <div className="crumbs">
        <strong>{label}</strong>
        <span>{activeProject.name}</span>
        <span>{activeProject.phase}</span>
        {activeProject.isSample && (
          <Link
            href="/projects"
            className="pill pill--warn"
            title="This is sample data for exploring the product — open Manage Projects to remove it"
          >
            Sample project
          </Link>
        )}
      </div>
      <div className="topbar-spacer" />

      {/* Actions */}
      <CommandPaletteTrigger />

      {/* Dark mode toggle */}
      <button
        type="button"
        className="topbar-icon-button"
        onClick={toggle}
        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      >
        {theme === "dark" ? <Sun /> : <Moon />}
      </button>

      {/* Alerts — live derived from project entities */}
      <NotificationBell />

      {/* Export — wired in M19: produces the 8-sheet project workbook */}
      <div className="hidden sm:flex">
        <ExportButton project={activeProject} />
      </div>
    </>
  );
}

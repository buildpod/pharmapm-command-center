"use client";

import { usePathname } from "next/navigation";
import { Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
    )?.[1] ?? "AivelloStudio RIM";

  return (
    <>
      {/* Mobile menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Breadcrumb — shows the active project as live context */}
      <div className="crumbs">
        <strong>{label}</strong>
        <span>{activeProject.name}</span>
        <span>{activeProject.phase}</span>
      </div>
      <div className="topbar-spacer" />

      {/* Actions */}
      <CommandPaletteTrigger />

      {/* Dark mode toggle */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Alerts — live derived from project entities */}
      <NotificationBell />

      {/* Export — wired in M19: produces the 8-sheet project workbook */}
      <div className="hidden sm:flex">
        <ExportButton project={activeProject} />
      </div>
    </>
  );
}

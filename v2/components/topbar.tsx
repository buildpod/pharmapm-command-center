"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HelpCircle, Menu, Sun, Moon, Plus, Settings } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/sidebar";
import { CommandPaletteTrigger } from "@/components/command-palette";
import { NotificationBell } from "@/components/notification-bell";
import { ExportButton } from "@/components/projects/export-button";
import { ProjectSwitcher } from "@/components/projects/project-switcher";
import { useTheme } from "@/components/theme-provider";
import { useProject } from "@/components/projects/project-provider";
import { HelpDrawer } from "@/components/guidance/help-drawer";
import { PageTour } from "@/components/guidance/page-tour";
import { RoleSelector } from "@/components/guidance/role-selector";
import { adminNavItems, appTabs, getRouteNavContext, isActiveRoute, routeToTabMap } from "@/lib/navigation";

function normalizeHelpRoute(pathname: string) {
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  return Object.keys(routeToTabMap)
    .sort((a, b) => b.length - a.length)
    .find((route) => isActiveRoute(normalizedPath, route)) ?? "/";
}

export function Topbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();
  const { activeProject } = useProject();
  const { tab, itemLabel } = getRouteNavContext(pathname);
  const helpRoute = normalizeHelpRoute(pathname);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (adminRef.current && !adminRef.current.contains(event.target as Node)) setAdminOpen(false);
    }
    if (adminOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [adminOpen]);

  return (
    <>
      <div className="topbar-row">
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
            <SidebarContent mode="mobile" onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Breadcrumb — shows WHERE you are (page context). Project identity
            (name + phase) lives in the ProjectSwitcher beside it; repeating it
            here just crammed and wrapped the header. */}
        <div className="crumbs">
          <strong>{tab.label} · {itemLabel}</strong>
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

        <div className="topbar-project">
          <ProjectSwitcher />
        </div>

        <CommandPaletteTrigger />

        <button
          type="button"
          className="topbar-icon-button"
          onClick={toggle}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </button>

        <NotificationBell />

        <RoleSelector />

        <button
          type="button"
          className="topbar-icon-button"
          onClick={() => setHelpOpen(true)}
          aria-label="How this page works"
          title="How this page works"
          data-tour-id="topbar-help"
        >
          <HelpCircle />
        </button>

        <div className="hidden sm:flex">
          <ExportButton project={activeProject} />
        </div>

        <Link href="/setup" className="topbar-new-project">
          <Plus />
          New Project
        </Link>

        <div className="topbar-admin" ref={adminRef}>
          <button
            type="button"
            className="topbar-icon-button"
            onClick={() => setAdminOpen((value) => !value)}
            aria-expanded={adminOpen}
            aria-label="Open admin menu"
            title="Admin"
          >
            <Settings />
          </button>
          {adminOpen && (
            <div className="topbar-admin__menu">
              {adminNavItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setAdminOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="app-tabs" aria-label="Primary navigation">
        {appTabs.map((item) => (
          <Link
            key={item.id}
            href={item.items[0].href}
            className={item.id === tab.id ? "app-tabs__item app-tabs__item--active" : "app-tabs__item"}
            aria-current={item.id === tab.id ? "page" : undefined}
            data-active={item.id === tab.id ? "true" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <HelpDrawer open={helpOpen} route={helpRoute} onClose={() => setHelpOpen(false)} />
      <PageTour />
    </>
  );
}

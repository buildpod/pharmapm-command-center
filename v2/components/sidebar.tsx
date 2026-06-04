"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart2,
  CheckSquare,
  DollarSign,
  FileText,
  FolderKanban,
  Gauge,
  GitBranch,
  Inbox,
  LayoutDashboard,
  Milestone,
  Rocket,
  Scale,
  Scroll,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { useProject } from "@/components/projects/project-provider";

const navGroups = [
  {
    label: "Briefing",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Delivery Signals", href: "/truth", icon: Gauge },
      { label: "Reports", href: "/reports", icon: BarChart2 },
    ],
  },
  {
    label: "Run",
    items: [
      { label: "New Project", href: "/setup", icon: Sparkles },
      { label: "Worklist", href: "/worklist", icon: Inbox },
      { label: "My Items", href: "/my-items", icon: CheckSquare },
      { label: "Readiness Gates", href: "/readiness", icon: Rocket },
    ],
  },
  {
    label: "Control",
    items: [
      { label: "Plan", href: "/plan", icon: GitBranch },
      { label: "Governance", href: "/governance", icon: Scale },
    ],
  },
  {
    label: "Records",
    items: [
      { label: "Charter", href: "/charter", icon: Scroll },
      { label: "Milestones", href: "/milestones", icon: Milestone },
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
      { label: "Risks", href: "/risks", icon: AlertTriangle, count: "3" },
      { label: "Documents", href: "/documents", icon: FileText, count: "2", countTone: "info" as const },
      { label: "Costs", href: "/costs", icon: DollarSign },
      { label: "People & Meetings", href: "/resources", icon: Users },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Manage Projects", href: "/projects", icon: FolderKanban },
      { label: "Rules & Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { activeProject } = useProject();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className="nav-brand">
        <div className="nav-brand__mark">A</div>
        <div className="nav-brand__name">AivelloStudio<span> RIM</span></div>
      </div>

      <div className="nav-project">
        <div className="nav-project__name">{activeProject.name}</div>
        <div className="nav-project__phase">{activeProject.phase}</div>
      </div>

      <nav style={{ flex: 1, overflowY: "auto", paddingBottom: "var(--space-3)" }}>
        {navGroups.map((group) => (
          <div key={group.label} className="nav-group">
            <div className="nav-group__title">{group.label}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={active ? "nav-item nav-item--active" : "nav-item"}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                    <Icon className="nav-item__icon" />
                    {item.label}
                  </span>
                  {"count" in item && item.count && (
                    <span
                      className={
                        "countTone" in item && item.countTone === "info"
                          ? "nav-item__count nav-item__count--info"
                          : "nav-item__count"
                      }
                    >
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="nav-user">
        <div className="nav-user__avatar">VP</div>
        <div>
          <div className="nav-user__name">Vineet Pathak</div>
          <div className="nav-user__role">Project Manager</div>
        </div>
      </div>
    </>
  );
}

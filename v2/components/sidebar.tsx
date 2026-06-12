"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Activity,
  AlertOctagon,
  BarChart2,
  CheckSquare,
  DollarSign,
  FileText,
  Gauge,
  GitBranch,
  Inbox,
  LayoutDashboard,
  Milestone,
  Rocket,
  Scale,
  Scroll,
  Sparkles,
  Users,
} from "lucide-react";
import { ProjectSwitcher } from "@/components/projects/project-switcher";
import { adminNavItems, appTabs, getRouteNavContext, isActiveRoute, utilityNavItems, type AppNavItem } from "@/lib/navigation";

const iconByHref = {
  "/": LayoutDashboard,
  "/truth": Gauge,
  "/reports": BarChart2,
  "/activity": Activity,
  "/setup": Sparkles,
  "/worklist": Inbox,
  "/my-items": CheckSquare,
  "/readiness": Rocket,
  "/plan": GitBranch,
  "/governance": Scale,
  "/decisions": Scale,
  "/issues": AlertOctagon,
  "/charter": Scroll,
  "/milestones": Milestone,
  "/tasks": CheckSquare,
  "/risks": AlertTriangle,
  "/documents": FileText,
  "/costs": DollarSign,
  "/resources": Users,
} satisfies Record<string, ComponentType<{ className?: string }>>;

export function SidebarContent({ mode = "desktop", onNavigate }: { mode?: "desktop" | "mobile"; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { tab } = getRouteNavContext(pathname);
  const navGroups = mode === "mobile" ? appTabs : [tab];

  return (
    <>
      <div className="nav-brand">
        <div className="nav-brand__mark">A</div>
        <div className="nav-brand__name">AivelloStudio</div>
      </div>

      {mode === "mobile" && (
        <div className="nav-project">
          <ProjectSwitcher />
        </div>
      )}

      <nav style={{ flex: 1, overflowY: "auto", paddingBottom: "var(--space-3)" }}>
        {navGroups.map((group) => (
          <div key={group.label} className="nav-group">
            <div className="nav-group__title">{group.label}</div>
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
            ))}
            {mode === "desktop" && <QuickActions items={group.quickActions} onNavigate={onNavigate} />}
          </div>
        ))}
        {mode === "mobile" && (
          <>
            <div className="nav-group">
              <div className="nav-group__title">Create</div>
              {utilityNavItems.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </div>
            <div className="nav-group">
              <div className="nav-group__title">Admin</div>
              {adminNavItems.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </div>
          </>
        )}
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

function NavLink({ item, pathname, onNavigate }: { item: AppNavItem; pathname: string; onNavigate?: () => void }) {
  const Icon = iconByHref[item.href as keyof typeof iconByHref] ?? Sparkles;
  const active = isActiveRoute(pathname, item.href);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={active ? "nav-item nav-item--active" : "nav-item"}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
        <Icon className="nav-item__icon" />
        {item.label}
      </span>
      {item.count && (
        <span className={item.countTone === "info" ? "nav-item__count nav-item__count--info" : "nav-item__count"}>
          {item.count}
        </span>
      )}
    </Link>
  );
}

function QuickActions({ items, onNavigate }: { items: AppNavItem[]; onNavigate?: () => void }) {
  if (items.length === 0) return null;
  return (
    <div className="nav-quick">
      <div className="nav-quick__title">Quick actions</div>
      {items.map((item) => (
        <Link key={item.label} href={item.href} onClick={onNavigate} className="nav-quick__item">
          {item.label}
        </Link>
      ))}
    </div>
  );
}

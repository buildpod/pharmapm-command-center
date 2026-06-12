export type AppTabId = "command" | "plan" | "governance" | "finance" | "people";

export type AppNavItem = {
  label: string;
  href: string;
  count?: string;
  countTone?: "risk" | "info";
};

export type AppTab = {
  id: AppTabId;
  label: string;
  items: AppNavItem[];
  quickActions: AppNavItem[];
};

export const appTabs: AppTab[] = [
  {
    id: "command",
    label: "Command",
    items: [
      { label: "Dashboard", href: "/" },
      { label: "Delivery Signals", href: "/truth" },
      { label: "Reports", href: "/reports" },
      { label: "Activity", href: "/activity" },
    ],
    quickActions: [
      { label: "Open report", href: "/reports" },
      { label: "Review signals", href: "/truth" },
    ],
  },
  {
    id: "plan",
    label: "Plan",
    items: [
      { label: "Plan", href: "/plan" },
      { label: "Milestones", href: "/milestones" },
      { label: "Tasks", href: "/tasks" },
      { label: "Worklist", href: "/worklist" },
      { label: "My Items", href: "/my-items" },
      { label: "Readiness Gates", href: "/readiness" },
    ],
    quickActions: [
      { label: "Add task", href: "/tasks" },
      { label: "Review schedule impact", href: "/tasks" },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    items: [
      { label: "Governance", href: "/governance" },
      { label: "Charter", href: "/charter" },
      { label: "Decisions", href: "/decisions" },
      { label: "Risks", href: "/risks", count: "3" },
      { label: "Issues", href: "/issues" },
      { label: "Documents", href: "/documents", count: "2", countTone: "info" },
    ],
    quickActions: [
      { label: "Record decision", href: "/decisions" },
      { label: "Raise issue", href: "/issues" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    items: [
      { label: "Costs", href: "/costs" },
    ],
    quickActions: [
      { label: "Add cost line", href: "/costs" },
      { label: "Open reports", href: "/reports" },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      { label: "Resources", href: "/resources" },
    ],
    quickActions: [
      { label: "Add member", href: "/resources" },
      { label: "Add meeting", href: "/resources" },
    ],
  },
];

export const adminNavItems: AppNavItem[] = [
  { label: "Manage Projects", href: "/projects" },
  { label: "Rules & Settings", href: "/settings" },
];

export const utilityNavItems: AppNavItem[] = [
  { label: "New Project", href: "/setup" },
];

export const routeToTabMap: Record<string, { tabId: AppTabId; label: string }> = {
  "/": { tabId: "command", label: "Dashboard" },
  "/truth": { tabId: "command", label: "Delivery Signals" },
  "/reports": { tabId: "command", label: "Reports" },
  "/activity": { tabId: "command", label: "Activity" },
  "/plan": { tabId: "plan", label: "Plan" },
  "/milestones": { tabId: "plan", label: "Milestones" },
  "/tasks": { tabId: "plan", label: "Tasks" },
  "/worklist": { tabId: "plan", label: "Worklist" },
  "/my-items": { tabId: "plan", label: "My Items" },
  "/readiness": { tabId: "plan", label: "Readiness Gates" },
  "/governance": { tabId: "governance", label: "Governance" },
  "/charter": { tabId: "governance", label: "Charter" },
  "/decisions": { tabId: "governance", label: "Decisions" },
  "/risks": { tabId: "governance", label: "Risks" },
  "/issues": { tabId: "governance", label: "Issues" },
  "/documents": { tabId: "governance", label: "Documents" },
  "/costs": { tabId: "finance", label: "Costs" },
  "/resources": { tabId: "people", label: "Resources" },
  "/setup": { tabId: "plan", label: "New Project" },
  "/projects": { tabId: "command", label: "Projects" },
  "/settings": { tabId: "command", label: "Rules & Settings" },
};

export function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getRouteNavContext(pathname: string) {
  const normalizedPath = pathname.replace(/\/$/, "") || "/";
  const route = Object.keys(routeToTabMap)
    .sort((a, b) => b.length - a.length)
    .find((path) => isActiveRoute(normalizedPath, path));
  const match = route ? routeToTabMap[route] : routeToTabMap["/"];
  const tab = appTabs.find((item) => item.id === match.tabId) ?? appTabs[0];
  return { tab, itemLabel: match.label };
}

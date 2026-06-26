import { GuidedWorkPanel } from "@/components/guidance/guided-work-panel";
import { PageHeader } from "@/components/ui/page-header";
import { TasksGrid } from "@/components/tasks/tasks-grid";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        tourId="tasks-summary"
        subtitle="Grouped by workstream. Click a status badge to advance, click a progress bar to edit. Upstream dependency tags flag what each task is waiting on."
      />
      <GuidedWorkPanel route="/tasks" compact />
      <TasksGrid />
    </div>
  );
}

import { GuidedWorkPanel } from "@/components/guidance/guided-work-panel";
import { PageHeader } from "@/components/ui/page-header";
import { MilestonesGrid } from "@/components/milestones/milestones-grid";

export default function MilestonesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Milestones"
        subtitle="Interactive schedule with dependency-aware impact review. Click a planned date to edit — downstream impact is shown before you commit."
      />
      <GuidedWorkPanel route="/milestones" compact />
      <MilestonesGrid />
    </div>
  );
}

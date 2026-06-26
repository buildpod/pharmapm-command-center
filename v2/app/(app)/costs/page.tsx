import { GuidedWorkPanel } from "@/components/guidance/guided-work-panel";
import { PageHeader } from "@/components/ui/page-header";
import { CostsGrid } from "@/components/costs/costs-grid";

export default function CostsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Costs"
        subtitle="Budget versus actual spend across all cost categories. Per-line burn bars surface anything approaching its budget ceiling."
      />
      <GuidedWorkPanel route="/costs" compact />
      <CostsGrid />
    </div>
  );
}

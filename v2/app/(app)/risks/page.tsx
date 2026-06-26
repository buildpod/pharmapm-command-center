import { GuidedWorkPanel } from "@/components/guidance/guided-work-panel";
import { PageHeader } from "@/components/ui/page-header";
import { RisksGrid } from "@/components/risks/risks-grid";

export default function RisksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Risks"
        subtitle="Probability × Impact heatmap with full mitigation context. The matrix on the left and the cards on the right are cross-linked — click any risk dot to jump to its detail."
      />
      <GuidedWorkPanel route="/risks" compact />
      <RisksGrid />
    </div>
  );
}

import { PageHeader } from "@/components/ui/page-header";
import { DecisionsGrid } from "@/components/decisions/decisions-grid";

export default function DecisionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Decisions"
        subtitle="Material decisions on this project — what was decided, when, by whom, what alternatives were considered, and the rationale. Every audit and SteerCo review reads from here."
      />
      <DecisionsGrid />
    </div>
  );
}

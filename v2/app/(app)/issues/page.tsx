import { PageHeader } from "@/components/ui/page-header";
import { IssuesGrid } from "@/components/issues/issues-grid";

export default function IssuesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Issues"
        subtitle="Live problems affecting the project — distinct from Risks (potential future events). Track raised date, owner, severity, and resolution plan. Every audit and SteerCo review reads from this register."
      />
      <IssuesGrid />
    </div>
  );
}

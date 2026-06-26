import { GuidedWorkPanel } from "@/components/guidance/guided-work-panel";
import { PageHeader } from "@/components/ui/page-header";
import { DocumentsList } from "@/components/documents/documents-list";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="GxP-aligned lifecycle artefacts. Cards are grouped by validation phase. Click a person chip to record their decision — document status auto-derives."
      />
      <GuidedWorkPanel route="/documents" compact />
      <DocumentsList />
    </div>
  );
}

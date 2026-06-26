import { PageHeader } from "@/components/ui/page-header";
import { ResourcesPanel } from "@/components/resources/resources-panel";

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="People & Meetings"
        subtitle="Team availability, meeting cadence, and pre-brief materials. Absences automatically surface impacted tasks and milestones; SteerCo and workstream pre-briefs derive per-attendee actions from live project data."
      />
      <ResourcesPanel />
    </div>
  );
}

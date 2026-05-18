import { SettingsPanel } from "@/components/settings/settings-panel";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Project Rules</h2>
        <p className="text-sm text-muted-foreground">
          Calendar, holidays, schedule status bands, and budget status bands used across the project.
        </p>
      </div>
      <SettingsPanel />
    </div>
  );
}

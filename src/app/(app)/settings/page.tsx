import { GhnAdminShell } from "@/features/ghn-shipping/components/GhnAdminShell";
import { GhnSettingsPage } from "@/features/ghn-shipping/components/GhnSettingsPage";

export default function SettingsPage() {
  return (
    <GhnAdminShell title="Settings">
      <GhnSettingsPage />
    </GhnAdminShell>
  );
}

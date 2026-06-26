import { GhnAdminShell } from "@/features/ghn-shipping/components/GhnAdminShell";
import { GhnSyncPage } from "@/features/ghn-shipping/components/GhnSyncPage";

export default function SyncPage() {
  return (
    <GhnAdminShell title="GHN Sync">
      <GhnSyncPage />
    </GhnAdminShell>
  );
}

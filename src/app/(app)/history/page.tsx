import { GhnAdminShell } from "@/features/ghn-shipping/components/GhnAdminShell";
import { ActionHistoryPage } from "@/features/ghn-shipping/components/ActionHistoryPage";

export default function HistoryPage() {
  return (
    <GhnAdminShell title="Action History">
      <ActionHistoryPage />
    </GhnAdminShell>
  );
}

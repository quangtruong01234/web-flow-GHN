import { GhnAdminShell } from "@/features/ghn-shipping/components/GhnAdminShell";
import { ShipmentDashboard } from "@/features/ghn-shipping/components/ShipmentDashboard";

export default function DashboardPage() {
  return (
    <GhnAdminShell title="Dashboard">
      <ShipmentDashboard />
    </GhnAdminShell>
  );
}

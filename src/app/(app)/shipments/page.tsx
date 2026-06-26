import { GhnAdminShell } from "@/features/ghn-shipping/components/GhnAdminShell";
import { ShipmentTable } from "@/features/ghn-shipping/components/ShipmentTable";

export default function ShipmentsPage() {
  return (
    <GhnAdminShell title="Shipments">
      <ShipmentTable />
    </GhnAdminShell>
  );
}

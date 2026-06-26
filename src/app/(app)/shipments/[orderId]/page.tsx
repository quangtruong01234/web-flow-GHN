import { notFound } from "next/navigation";
import { GhnAdminShell } from "@/features/ghn-shipping/components/GhnAdminShell";
import { ShipmentDetail } from "@/features/ghn-shipping/components/ShipmentDetail";
import { findShipment } from "@/features/ghn-shipping/data/mockShipments";

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const shipment = findShipment(orderId);
  if (!shipment) notFound();

  return (
    <GhnAdminShell title={`Shipment ${shipment.orderId}`}>
      <ShipmentDetail initialShipment={shipment} />
    </GhnAdminShell>
  );
}

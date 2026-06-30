import { notFound } from "next/navigation";
import { GhnAdminShell } from "@/features/ghn-shipping/components/GhnAdminShell";
import { ShipmentDetail } from "@/features/ghn-shipping/components/ShipmentDetail";

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const id = Number(orderId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  return (
    <GhnAdminShell title={`Shipment #${id}`}>
      <ShipmentDetail orderId={id} />
    </GhnAdminShell>
  );
}

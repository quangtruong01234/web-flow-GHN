import { notFound } from "next/navigation";
import { GhnAdminShell } from "@/features/ghn-shipping/components/GhnAdminShell";
import { ShipmentDetail } from "@/features/ghn-shipping/components/ShipmentDetail";
import { isOrderPublicId } from "@/features/ghn-shipping/lib/public-ids";

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  if (!isOrderPublicId(orderId)) notFound();

  return (
    <GhnAdminShell title={`Shipment #${orderId}`}>
      <ShipmentDetail orderId={orderId} />
    </GhnAdminShell>
  );
}

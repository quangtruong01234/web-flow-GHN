import { StatusBadge } from "@/components/ui/Badge";
import { ghnMeta, localMeta, PAYMENT_META } from "../lib/shipment-status";
import type { GhnStatus, LocalStatus, PaymentStatus } from "../types";

export function GhnStatusBadge({ status }: { status: GhnStatus }) {
  return <StatusBadge meta={ghnMeta(status)} />;
}

export function LocalStatusBadge({ status }: { status: LocalStatus }) {
  return <StatusBadge meta={localMeta(status)} />;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge meta={PAYMENT_META[status]} />;
}

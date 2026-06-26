"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useShipments } from "@/context/ShipmentContext";
import { fmtCod, fmtFee, fmtVND } from "../lib/shipment-formatters";
import type { Shipment } from "../types";
import { GhnStatusBadge, LocalStatusBadge, PaymentStatusBadge } from "./ShipmentStatusBadge";
import { ShipmentActionPanel } from "./ShipmentActionPanel";
import { ShipmentTimeline } from "./ShipmentTimeline";

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-ink-400">{label}</span>
      <span className="text-right font-medium text-ink-900">{value}</span>
    </div>
  );
}

export function ShipmentDetail({ initialShipment }: { initialShipment: Shipment }) {
  const { findShipment } = useShipments();
  const shipment = findShipment(initialShipment.orderId) ?? initialShipment;

  return (
    <div className="space-y-5">
      <Link href="/shipments">
        <Button variant="ghost" size="sm"><Icon name="chevronLeft" size={16} />Back to shipments</Button>
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-ink-400">Order summary</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink-900">{shipment.orderId}</h1>
            <p className="mt-1 text-sm text-ink-500">{shipment.product}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LocalStatusBadge status={shipment.localStatus} />
            <GhnStatusBadge status={shipment.ghnStatus} />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Receiver" subtitle="Delivery destination" />
              <div className="p-5">
                <FieldRow label="Name" value={shipment.receiver.name} />
                <FieldRow label="Phone" value={shipment.receiver.phone} />
                <FieldRow label="Address" value={`${shipment.receiver.address}, ${shipment.receiver.ward}`} />
                <FieldRow label="Area" value={`${shipment.receiver.district}, ${shipment.receiver.province}`} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Payment and COD" subtitle="Mock payment snapshot" />
              <div className="p-5">
                <FieldRow label="Payment" value={shipment.payment.method} />
                <FieldRow label="Payment status" value={<PaymentStatusBadge status={shipment.payment.status} />} />
                <FieldRow label="COD" value={fmtCod(shipment.codAmount)} />
                <FieldRow label="Total" value={fmtVND(shipment.total)} />
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="GHN shipment detail" subtitle="Carrier fields are read-only in Phase 1" />
            <div className="grid gap-x-8 p-5 lg:grid-cols-2">
              <FieldRow label="GHN code" value={shipment.ghnOrderCode} />
              <FieldRow label="Service" value={shipment.ghn.service} />
              <FieldRow label="Expected delivery" value={shipment.ghn.expected} />
              <FieldRow label="Pickup shift" value={shipment.ghn.pickShift} />
              <FieldRow label="Weight" value={shipment.ghn.weight} />
              <FieldRow label="Shipping fee" value={fmtFee(shipment.shippingFee)} />
              {shipment.ghn.failReason ? <FieldRow label="Fail reason" value={shipment.ghn.failReason} /> : null}
              {shipment.ghn.returnReason ? <FieldRow label="Return reason" value={shipment.ghn.returnReason} /> : null}
            </div>
          </Card>

          <Card>
            <CardHeader title="Shipping timeline" subtitle="Webhook, sync, and demo action history" />
            <div className="p-5"><ShipmentTimeline history={shipment.history} /></div>
          </Card>

          <Card>
            <CardHeader title="Product summary" subtitle="Marketplace order context" />
            <div className="p-5">
              <FieldRow label="Product" value={shipment.product} />
              <FieldRow label="Seller" value={shipment.seller} />
              <FieldRow label="Buyer" value={shipment.buyer} />
              <FieldRow label="Created" value={shipment.createdAt} />
              <FieldRow label="Last synced" value={shipment.lastSyncedAt} />
            </div>
          </Card>
        </div>

        <ShipmentActionPanel shipment={shipment} />
      </div>
    </div>
  );
}

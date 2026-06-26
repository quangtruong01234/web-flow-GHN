"use client";

import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useShipments } from "@/context/ShipmentContext";
import { useToast } from "@/context/ToastContext";

export function GhnSyncPage() {
  const { shipments } = useShipments();
  const { push } = useToast();
  const pending = shipments.filter((shipment) =>
    ["ready_to_pick", "delivery_fail", "waiting_to_return"].includes(shipment.ghnStatus),
  );

  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Card className="p-5">
        <p className="text-xs font-medium text-ink-400">Webhook connection</p>
        <div className="mt-3 flex items-center gap-2 text-green-700">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span className="font-semibold">Connected (mock)</span>
        </div>
        <p className="mt-2 text-sm text-ink-500">No live webhook probe is made from the browser.</p>
      </Card>
      <Card className="p-5">
        <p className="text-xs font-medium text-ink-400">Pending sync</p>
        <p className="mt-3 text-3xl font-semibold text-ink-900">{pending.length}</p>
        <p className="mt-2 text-sm text-ink-500">Rows that need operator attention in demo data.</p>
      </Card>
      <Card className="p-5">
        <p className="text-xs font-medium text-ink-400">Last full sync</p>
        <p className="mt-3 text-2xl font-semibold text-ink-900">26 Jun 2026, 11:58</p>
        <Button
          className="mt-4 w-full"
          onClick={() =>
            push({
              kind: "success",
              title: "Mock sync completed",
              message: "All pending rows were simulated locally. No GHN API was called.",
            })
          }
        >
          <Icon name="sync" size={16} />Sync all pending
        </Button>
      </Card>
      <Card className="xl:col-span-3">
        <CardHeader title="Recent sync results" subtitle="Local audit preview" />
        <div className="divide-y divide-line">
          {shipments.slice(0, 6).map((shipment) => (
            <div key={shipment.orderId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-medium text-ink-900">{shipment.orderId}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {shipment.ghnOrderCode} - last synced {shipment.lastSyncedAt}
                </p>
              </div>
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                Mock success
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

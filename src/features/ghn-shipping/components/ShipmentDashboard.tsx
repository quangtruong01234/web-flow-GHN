"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { useShipments } from "@/context/ShipmentContext";
import { ghnStatusDistribution } from "../lib/shipment-status";
import { ShipmentStatCards } from "./ShipmentStatCards";
import { GhnStatusBadge, LocalStatusBadge } from "./ShipmentStatusBadge";

export function ShipmentDashboard() {
  const { shipments } = useShipments();
  const distribution = ghnStatusDistribution(shipments).filter((row) => row.count > 0);
  const max = Math.max(...distribution.map((row) => row.count), 1);

  return (
    <div className="space-y-6">
      <ShipmentStatCards shipments={shipments} />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader
            title="Recent shipments"
            subtitle="Mock GHN shipment activity"
            action={
              <Link href="/shipments">
                <Button size="sm" variant="secondary">View all</Button>
              </Link>
            }
          />
          <div className="divide-y divide-line">
            {shipments.slice(0, 5).map((shipment) => (
              <Link
                key={shipment.orderId}
                href={`/shipments/${shipment.orderId}`}
                className="grid gap-3 px-5 py-4 hover:bg-slate-50 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink-900">{shipment.orderId}</p>
                  <p className="mt-1 truncate text-sm text-ink-500">{shipment.product}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <LocalStatusBadge status={shipment.localStatus} />
                  <GhnStatusBadge status={shipment.ghnStatus} />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Status distribution" subtitle="Read-only GHN status mix" />
          <div className="space-y-4 p-5">
            {distribution.map((row) => (
              <div key={row.status}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-700">{row.meta.label}</span>
                  <span className="text-ink-400">{row.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${(row.count / max) * 100}%`, background: row.meta.dot }}
                  />
                </div>
              </div>
            ))}
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
              Webhook connected indicator is mock-only. No live GHN call is made.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

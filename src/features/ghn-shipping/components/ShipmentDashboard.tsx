"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { useShipmentList } from "../hooks/useShipments";
import { ghnStatusDistribution } from "../lib/shipment-status";
import { cn } from "@/lib/cn";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { ShipmentStatCards } from "./ShipmentStatCards";
import { GhnStatusBadge, LocalStatusBadge } from "./ShipmentStatusBadge";

// Overview reads the most recent page of orders. Counts reflect that window
// (newest 100), which is enough for an operator at-a-glance summary.
const DASHBOARD_LIMIT = 100;
const DISTRIBUTION_SEGMENTS = 20;

export function ShipmentDashboard() {
  const { data, isPending, isError, refetch } = useShipmentList({
    page: 1,
    limit: DASHBOARD_LIMIT,
  });

  if (isPending) {
    return (
      <Card>
        <div className="p-8 text-center text-sm text-ink-500">
          Loading shipment overview...
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <ErrorState
          title="Could not load shipments"
          message="The shipment overview failed to load. Try again in a moment."
          onRetry={() => void refetch()}
        />
      </Card>
    );
  }

  const items = data.items;
  const distribution = ghnStatusDistribution(items).filter((row) => row.count > 0);
  const max = Math.max(...distribution.map((row) => row.count), 1);

  return (
    <div className="space-y-6">
      <ShipmentStatCards items={items} />

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader
            title="Recent shipments"
            subtitle={`${data.total} orders in the logistics queue`}
            action={
              <Link href="/shipments">
                <Button size="sm" variant="secondary">View all</Button>
              </Link>
            }
          />
          {items.length === 0 ? (
            <EmptyState
              icon="package"
              title="No shipments yet"
              message="Orders will appear here once they enter the logistics queue."
            />
          ) : (
            <div className="divide-y divide-line">
              {items.slice(0, 5).map((item) => (
                <Link
                  key={item.orderId}
                  href={`/shipments/${item.orderId}`}
                  className="grid gap-3 px-5 py-4 hover:bg-slate-50 sm:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">#{item.orderId}</p>
                    <p className="mt-1 truncate text-sm text-ink-500">
                      {item.buyerName} → {item.sellerName}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <LocalStatusBadge status={item.localStatus} />
                    <GhnStatusBadge status={item.ghnStatus} raw={item.rawGhnStatus} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Status distribution" subtitle="Backend-owned GHN status mix" />
          <div className="space-y-4 p-5">
            {distribution.length === 0 ? (
              <p className="text-sm text-ink-500">
                No GHN statuses recorded for the current orders yet.
              </p>
            ) : (
              distribution.map((row) => (
                <div key={row.status}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-700">{row.meta.label}</span>
                    <span className="text-ink-400">{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="grid h-2 grid-cols-[repeat(20,minmax(0,1fr))] gap-px overflow-hidden rounded-full">
                      {Array.from({ length: DISTRIBUTION_SEGMENTS }, (_, index) => {
                        const filled =
                          index < Math.ceil((row.count / max) * DISTRIBUTION_SEGMENTS);
                        return (
                          <span
                            key={index}
                            className={cn(
                              "h-2",
                              filled ? row.meta.barClass : "bg-transparent",
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div className="rounded-lg border border-line bg-slate-50 px-3 py-2 text-xs font-medium text-ink-500">
              GHN status is backend-owned. It changes only through the backend —
              a GHN webhook, an operator sync, or the demo endpoint.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

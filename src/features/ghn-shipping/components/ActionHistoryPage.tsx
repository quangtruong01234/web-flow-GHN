"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { useShipmentList } from "../hooks/useShipments";
import { fmtDateTime } from "../lib/shipment-formatters";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { GhnStatusBadge, LocalStatusBadge } from "./ShipmentStatusBadge";

// There is no global shipping-history endpoint — history is per order. This page
// lists recently updated orders with their latest GHN status + last sync; the
// full audit timeline lives on each order's detail page.
const HISTORY_LIMIT = 50;

export function ActionHistoryPage() {
  const { data, isPending, isError, refetch } = useShipmentList({
    page: 1,
    limit: HISTORY_LIMIT,
  });

  return (
    <Card>
      <CardHeader
        title="Recent shipping activity"
        subtitle="Latest GHN status per order — open an order for its full timeline"
      />
      {isPending ? (
        <div className="p-8 text-center text-sm text-ink-500">Loading activity...</div>
      ) : isError ? (
        <ErrorState
          title="Could not load activity"
          message="The recent activity failed to load. Try again in a moment."
          onRetry={() => void refetch()}
        />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon="history"
          title="No shipping activity yet"
          message="Orders will appear here once they enter the logistics queue."
        />
      ) : (
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-ink-400">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Local</th>
                <th className="px-5 py-3">GHN</th>
                <th className="px-5 py-3">Last synced</th>
                <th className="px-5 py-3">Updated</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((item) => (
                <tr key={item.orderId} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink-900">#{item.orderId}</p>
                    <p className="mt-1 text-xs text-ink-400">
                      {item.ghnOrderCode ?? "No GHN code"}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <LocalStatusBadge status={item.localStatus} />
                  </td>
                  <td className="px-5 py-4">
                    <GhnStatusBadge status={item.ghnStatus} raw={item.rawGhnStatus} />
                  </td>
                  <td className="px-5 py-4 text-xs text-ink-500">
                    {fmtDateTime(item.lastSyncedAt)}
                  </td>
                  <td className="px-5 py-4 text-xs text-ink-400">
                    {fmtDateTime(item.updatedAt)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/shipments/${item.orderId}`}>
                      <Button size="sm" variant="secondary">
                        Timeline
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

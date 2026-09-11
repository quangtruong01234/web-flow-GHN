import { Card } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { fmtDateTime, fmtVND } from "../lib/shipment-formatters";
import type { ShipmentListItem } from "../api/types";

/**
 * Counts are computed over the page of orders the dashboard fetched, not the
 * whole queue — there is no per-status count endpoint. When the queue is larger
 * than that window the numbers are a floor, not a total, so the scope is stated
 * instead of letting "Failed deliveries: 3" read as "only 3 orders failed".
 * Follows the analytics rule in risks item 15: a misleading number is worse than
 * an absent one.
 */
export function ShipmentStatCards({
  items,
  total,
}: {
  items: ShipmentListItem[];
  total: number;
}) {
  const truncated = total > items.length;
  const failed = items.filter((item) => item.ghnStatus === "delivery_fail").length;
  const inTransit = items.filter((item) =>
    item.ghnStatus === "picking" || item.ghnStatus === "delivering",
  ).length;
  const ready = items.filter((item) => item.ghnStatus === "ready_to_pick").length;
  // COD not yet delivered (still in the carrier's hands).
  const pendingCod = items.reduce(
    (sum, item) =>
      (item.ghnStatus === "ready_to_pick" ||
        item.ghnStatus === "picking" ||
        item.ghnStatus === "delivering") &&
      item.codAmount
        ? sum + item.codAmount
        : sum,
    0,
  );
  const lastSync = items.reduce<string | null>((latest, item) => {
    if (!item.lastSyncedAt) return latest;
    if (!latest || item.lastSyncedAt > latest) return item.lastSyncedAt;
    return latest;
  }, null);

  // "+" marks a figure the window can only under-report.
  const atLeast = (count: number): string => (truncated ? `${count}+` : String(count));

  const stats: Array<{ label: string; value: string; hint: string; icon: IconName }> = [
    {
      label: "Active shipments",
      value: atLeast(inTransit + ready),
      hint: `${inTransit} in transit, ${ready} waiting`,
      icon: "truck",
    },
    {
      label: "Failed deliveries",
      value: atLeast(failed),
      hint: "Needs operator review",
      icon: "warning",
    },
    {
      label: "COD in transit",
      value: fmtVND(pendingCod),
      hint: truncated ? "Not yet delivered · at least" : "Not yet delivered",
      icon: "wallet",
    },
    {
      label: "Last sync",
      value: lastSync ? fmtDateTime(lastSync) : "Never",
      hint: "Most recent GHN sync",
      icon: "sync",
    },
  ];

  return (
    <div className="space-y-3">
      {truncated ? (
        <p className="rounded-lg border border-line bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          Counted over the {items.length} most recent orders, not all {total} in
          the queue — a figure marked <span className="font-semibold">+</span> can
          only be higher. Filter on Shipments to work the full queue.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-ink-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-ink-900">{stat.value}</p>
                <p className="mt-1 text-xs text-ink-500">{stat.hint}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon name={stat.icon} size={18} />
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { ShipmentListItem } from "../api/types";
import { shipmentListHref } from "../lib/shipment-list-query";
import {
  NEEDS_ATTENTION_GHN_STATUSES,
  needsAttentionCounts,
  needsAttentionMeta,
  type NeedsAttentionStatus,
} from "../lib/shipment-status";

// The list's `ghnStatus` filter is a `shipping_history` subquery: it matches an
// order that has EVER recorded the status, not only its current one. Say so
// wherever a link lands on that filter, or "3 here, 7 there" reads like a bug.
export const EVER_RECORDED_NOTE =
  "The list matches every order that has ever recorded this GHN status, including ones GHN has since moved on.";

/**
 * Dashboard card: how many orders in the fetched window currently sit in each
 * needs-attention status, each linking to the filtered Shipments list. Counts
 * carry `+` when the window is smaller than the queue (risks 25).
 */
export function NeedsAttentionCard({
  items,
  total,
}: {
  items: ShipmentListItem[];
  total: number;
}) {
  const truncated = total > items.length;
  const counts = needsAttentionCounts(items);

  return (
    <Card>
      <CardHeader
        title="Needs attention"
        subtitle={
          truncated
            ? `Current GHN status · newest ${items.length} of ${total} orders`
            : "Current GHN status"
        }
      />
      <div className="grid gap-px border-b border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        {NEEDS_ATTENTION_GHN_STATUSES.map((status) => {
          const meta = needsAttentionMeta(status);
          const count = counts[status];
          return (
            <Link
              key={status}
              href={shipmentListHref({ ghnStatus: status })}
              className="flex items-center justify-between gap-3 bg-white px-5 py-4 hover:bg-slate-50"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-ink-700">
                <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} />
                {meta.label}
              </span>
              <span className="flex items-center gap-1 text-lg font-semibold text-ink-900">
                {truncated ? `${count}+` : count}
                <Icon name="chevronRight" size={15} className="text-ink-400" />
              </span>
            </Link>
          );
        })}
      </div>
      <p className="px-5 py-3 text-xs leading-5 text-ink-500">{EVER_RECORDED_NOTE}</p>
    </Card>
  );
}

/** `/shipments` quick filters: one link per status, one request per click. */
export function NeedsAttentionChips({ active }: { active: string | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-ink-500">Needs attention:</span>
      {NEEDS_ATTENTION_GHN_STATUSES.map((status: NeedsAttentionStatus) => {
        const isActive = active === status;
        return (
          <Link
            key={status}
            href={shipmentListHref({ ghnStatus: status })}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
              isActive
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-line text-ink-700 hover:bg-slate-50",
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", needsAttentionMeta(status).dotClass)}
            />
            {needsAttentionMeta(status).label}
          </Link>
        );
      })}
    </div>
  );
}

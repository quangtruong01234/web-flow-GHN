import { fmtDateTime } from "../lib/shipment-formatters";
import { rawGhnLabel } from "../lib/shipment-status";
import type { ShipmentHistoryRow } from "../api/types";
import { cn } from "@/lib/cn";

const TYPE_LABEL: Record<ShipmentHistoryRow["type"], string> = {
  webhook: "GHN webhook",
  manual_sync: "Manual sync",
  action: "Action",
};

export function ShipmentTimeline({ history }: { history: ShipmentHistoryRow[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-ink-500">
        No shipping history recorded for this order yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((event) => {
        const change =
          event.previousStatus || event.newStatus
            ? `${event.previousStatus ?? "—"} → ${event.newStatus ?? "—"}`
            : null;
        return (
          <div key={event.id} className="flex gap-3">
            <span
              className={cn(
                "mt-1 h-2.5 w-2.5 flex-none rounded-full ring-4",
                event.success
                  ? "bg-green-600 ring-green-100"
                  : "bg-red-600 ring-red-100",
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink-900">
                  {TYPE_LABEL[event.type]} · {event.action}
                </p>
                <span className="text-xs text-ink-400">
                  {fmtDateTime(event.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                {event.ghnStatus ? `GHN: ${rawGhnLabel(event.ghnStatus)}` : "GHN: —"}
                {change ? ` · Local: ${change}` : ""}
                {event.actorId ? ` · by operator #${event.actorId}` : ""}
              </p>
              {event.message ? (
                <p
                  className={cn(
                    "mt-1 text-xs",
                    event.success ? "text-ink-500" : "text-red-600",
                  )}
                >
                  {event.message}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

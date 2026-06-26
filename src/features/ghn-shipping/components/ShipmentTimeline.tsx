import type { HistoryEvent } from "../types";

export function ShipmentTimeline({ history }: { history: HistoryEvent[] }) {
  return (
    <div className="space-y-4">
      {history.map((event, index) => (
        <div key={`${event.time}-${index}`} className="flex gap-3">
          <span className="mt-1 h-2.5 w-2.5 flex-none rounded-full bg-brand-600 ring-4 ring-brand-50" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink-900">{event.action}</p>
              <span className="text-xs text-ink-400">{event.time}</span>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              {event.old} to {event.nw} by {event.actor}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

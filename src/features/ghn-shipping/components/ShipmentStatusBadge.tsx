import { StatusBadge } from "@/components/ui/Badge";
import {
  GHN_UPDATE_STALE_LABEL,
  ghnMeta,
  localMeta,
  rawGhnLabel,
  rawGhnMeta,
  UNKNOWN_GHN_META,
} from "../lib/shipment-status";
import type { GhnStatus, LocalStatus } from "../types";

/**
 * GHN status pill. When the status is unmapped/absent, render the raw GHN string
 * (we never fabricate a known status the backend didn't send) — neutral for an
 * in-transit leg, red for the ones that need an operator (`exception`, `damage`,
 * `lost`), which the backend deliberately leaves without a local status.
 */
export function GhnStatusBadge({
  status,
  raw,
}: {
  status: GhnStatus | null;
  raw?: string | null;
}) {
  if (!status) {
    return (
      <StatusBadge
        meta={rawGhnMeta(raw)}
        label={raw ? rawGhnLabel(raw) : UNKNOWN_GHN_META.label}
      />
    );
  }
  return <StatusBadge meta={ghnMeta(status)} />;
}

export function LocalStatusBadge({ status }: { status: LocalStatus }) {
  return <StatusBadge meta={localMeta(status)} />;
}

/** Hint beside a GHN pill: nothing new has come from GHN in 24h. Never a sync. */
export function GhnUpdateStaleTag() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
      {GHN_UPDATE_STALE_LABEL}
    </span>
  );
}

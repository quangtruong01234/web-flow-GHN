import { StatusBadge } from "@/components/ui/Badge";
import {
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

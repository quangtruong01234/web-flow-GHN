import { StatusBadge } from "@/components/ui/Badge";
import {
  ghnMeta,
  localMeta,
  rawGhnLabel,
  UNKNOWN_GHN_META,
} from "../lib/shipment-status";
import type { GhnStatus, LocalStatus } from "../types";

/**
 * GHN status pill. When the status is unmapped/absent, render a neutral pill
 * with the raw GHN string (we never fabricate a known status the backend didn't send).
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
        meta={UNKNOWN_GHN_META}
        label={raw ? rawGhnLabel(raw) : UNKNOWN_GHN_META.label}
      />
    );
  }
  return <StatusBadge meta={ghnMeta(status)} />;
}

export function LocalStatusBadge({ status }: { status: LocalStatus }) {
  return <StatusBadge meta={localMeta(status)} />;
}

import type { GhnStatusFilter } from "../api/types";
import type { GhnStatus, LocalStatus } from "../types";

export interface StatusMeta {
  badgeClass: string;
  dotClass: string;
  barClass: string;
  label: string;
}

export const GHN_STATUS_META: Record<GhnStatus, StatusMeta> = {
  ready_to_pick: {
    badgeClass: "bg-slate-100 text-slate-600",
    dotClass: "bg-slate-400",
    barClass: "bg-slate-400",
    label: "Ready to pick",
  },
  picking: {
    badgeClass: "bg-amber-100 text-amber-800",
    dotClass: "bg-amber-600",
    barClass: "bg-amber-600",
    label: "Picking",
  },
  delivering: {
    badgeClass: "bg-blue-100 text-blue-800",
    dotClass: "bg-blue-600",
    barClass: "bg-blue-600",
    label: "Delivering",
  },
  delivered: {
    badgeClass: "bg-green-100 text-green-800",
    dotClass: "bg-green-600",
    barClass: "bg-green-600",
    label: "Delivered",
  },
  delivery_fail: {
    badgeClass: "bg-red-100 text-red-800",
    dotClass: "bg-red-600",
    barClass: "bg-red-600",
    label: "Delivery failed",
  },
  waiting_to_return: {
    badgeClass: "bg-orange-100 text-orange-800",
    dotClass: "bg-orange-600",
    barClass: "bg-orange-600",
    label: "Waiting to return",
  },
  returned: {
    badgeClass: "bg-violet-100 text-violet-800",
    dotClass: "bg-violet-600",
    barClass: "bg-violet-600",
    label: "Returned",
  },
  cancelled: {
    badgeClass: "bg-slate-100 text-slate-500",
    dotClass: "bg-slate-400",
    barClass: "bg-slate-400",
    label: "Cancelled",
  },
};

export const LOCAL_STATUS_META: Record<LocalStatus, StatusMeta> = {
  pending: {
    badgeClass: "bg-slate-100 text-slate-500",
    dotClass: "bg-slate-400",
    barClass: "bg-slate-400",
    label: "Pending",
  },
  confirmed: {
    badgeClass: "bg-sky-100 text-sky-800",
    dotClass: "bg-sky-500",
    barClass: "bg-sky-500",
    label: "Confirmed",
  },
  shipping: {
    badgeClass: "bg-brand-50 text-brand-700",
    dotClass: "bg-brand-600",
    barClass: "bg-brand-600",
    label: "Shipping",
  },
  completed: {
    badgeClass: "bg-green-100 text-green-800",
    dotClass: "bg-green-600",
    barClass: "bg-green-600",
    label: "Completed",
  },
  refunding: {
    badgeClass: "bg-orange-100 text-orange-800",
    dotClass: "bg-orange-600",
    barClass: "bg-orange-600",
    label: "Refunding",
  },
  refunded: {
    badgeClass: "bg-violet-100 text-violet-800",
    dotClass: "bg-violet-600",
    barClass: "bg-violet-600",
    label: "Refunded",
  },
  cancelled: {
    badgeClass: "bg-slate-100 text-slate-500",
    dotClass: "bg-slate-400",
    barClass: "bg-slate-400",
    label: "Cancelled",
  },
};

export const GHN_STATUS_ORDER: GhnStatus[] = [
  "ready_to_pick",
  "picking",
  "delivering",
  "delivered",
  "delivery_fail",
  "waiting_to_return",
  "returned",
  "cancelled",
];

export const LOCAL_STATUS_ORDER: LocalStatus[] = [
  "pending",
  "confirmed",
  "shipping",
  "completed",
  "refunding",
  "refunded",
  "cancelled",
];

export function ghnMeta(status: GhnStatus): StatusMeta {
  return GHN_STATUS_META[status];
}

export function localMeta(status: LocalStatus): StatusMeta {
  return LOCAL_STATUS_META[status];
}

/** Neutral pill for GHN statuses we cannot map (or absent GHN code). */
export const UNKNOWN_GHN_META: StatusMeta = {
  badgeClass: "bg-slate-100 text-slate-500",
  dotClass: "bg-slate-300",
  barClass: "bg-slate-300",
  label: "No GHN status",
};

/**
 * GHN statuses the backend recognises but deliberately leaves without a local
 * status because they need a human/compensation decision — mapping them would
 * restock goods that no longer physically exist (GHN-FAIL-01; backend
 * `GHN_STATUSES_WITHOUT_LOCAL_STATUS`). They are intentionally *not* `GhnStatus`
 * values: the console must never invent a status the backend does not send as an
 * order's state. They only need to stop rendering like "No GHN status", so the
 * operator can see there is something to act on.
 */
const ATTENTION_GHN_STATUSES = new Set(["exception", "damage", "lost"]);

export const ATTENTION_GHN_META: StatusMeta = {
  badgeClass: "bg-red-100 text-red-800",
  dotClass: "bg-red-600",
  barClass: "bg-red-600",
  label: "Needs attention",
};

/** Pill styling for a raw GHN status the `GhnStatus` union does not cover. */
export function rawGhnMeta(raw: string | null | undefined): StatusMeta {
  if (!raw) return UNKNOWN_GHN_META;
  return ATTENTION_GHN_STATUSES.has(raw.trim().toLowerCase())
    ? ATTENTION_GHN_META
    : UNKNOWN_GHN_META;
}

/** Human label for a raw GHN status string (e.g. "money_collect_picking"). */
export function rawGhnLabel(raw: string | null | undefined): string {
  if (!raw) return UNKNOWN_GHN_META.label;
  return raw
    .trim()
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function ghnStatusDistribution(
  items: ReadonlyArray<{ ghnStatus: GhnStatus | null }>,
) {
  return GHN_STATUS_ORDER.map((status) => ({
    status,
    count: items.filter((item) => item.ghnStatus === status).length,
    meta: ghnMeta(status),
  }));
}

/**
 * The GHN statuses an operator works as a queue: a failed delivery attempt and
 * the three GHN-FAIL-01 statuses with no local equivalent. Each is a valid
 * `ghnStatus` list filter, so a quick filter is one request — never fan out.
 */
export const NEEDS_ATTENTION_GHN_STATUSES = [
  "delivery_fail",
  "exception",
  "damage",
  "lost",
] as const satisfies ReadonlyArray<GhnStatusFilter>;

export type NeedsAttentionStatus = (typeof NEEDS_ATTENTION_GHN_STATUSES)[number];

/** Label + colour for a needs-attention status (a `GhnStatus` or a raw one). */
export function needsAttentionMeta(status: NeedsAttentionStatus): StatusMeta {
  return status === "delivery_fail"
    ? ghnMeta(status)
    : { ...ATTENTION_GHN_META, label: rawGhnLabel(status) };
}

/**
 * How many orders are *currently* in each needs-attention status. Reads the raw
 * status first — `exception`/`damage`/`lost` are not `GhnStatus` values, so
 * `ghnStatus` is null for them.
 */
export function needsAttentionCounts(
  items: ReadonlyArray<{ ghnStatus: GhnStatus | null; rawGhnStatus: string | null }>,
): Record<NeedsAttentionStatus, number> {
  const counts: Record<NeedsAttentionStatus, number> = {
    delivery_fail: 0,
    exception: 0,
    damage: 0,
    lost: 0,
  };
  for (const item of items) {
    const current = (item.rawGhnStatus ?? item.ghnStatus ?? "").trim().toLowerCase();
    const match = NEEDS_ATTENTION_GHN_STATUSES.find((status) => status === current);
    if (match) counts[match] += 1;
  }
  return counts;
}

/** GHN statuses after which the carrier sends nothing more for the order. */
export const TERMINAL_GHN_STATUSES: ReadonlyArray<GhnStatus> = [
  "delivered",
  "returned",
  "cancelled",
];

/** Local statuses where the order is closed on TryBuy's side. */
const CLOSED_LOCAL_STATUSES: ReadonlyArray<LocalStatus> = ["completed", "cancelled", "refunded"];

export const GHN_UPDATE_STALE_MS = 24 * 60 * 60 * 1000;
export const GHN_UPDATE_STALE_LABEL = "No GHN update in 24h+";

/**
 * True when a still-open order is moving at GHN but nothing has reached the
 * backend for 24h. `lastSyncedAt` is the newest `shipping_history` row —
 * webhook, sync, action or demo — so this means "no GHN update", not "not
 * synced". With no row yet it measures from `updatedAt`, so a waybill created
 * minutes ago is not flagged.
 *
 * Orders closed locally are skipped: in practice most closed orders keep a GHN
 * code with no recent event, and flagging them buried the open ones.
 *
 * `asOfMs` is when the list was fetched, not a live clock: the hint describes
 * the data on screen. A hint only — it must never trigger a sync (GHN-FAIL-NTF-01).
 */
export function isGhnUpdateStale(
  item: {
    ghnOrderCode: string | null;
    ghnStatus: GhnStatus | null;
    localStatus: LocalStatus;
    lastSyncedAt: string | null;
    updatedAt: string;
  },
  asOfMs: number,
): boolean {
  if (!item.ghnOrderCode) return false;
  if (CLOSED_LOCAL_STATUSES.includes(item.localStatus)) return false;
  if (item.ghnStatus !== null && TERMINAL_GHN_STATUSES.includes(item.ghnStatus)) return false;
  const lastMs = Date.parse(item.lastSyncedAt ?? item.updatedAt);
  if (Number.isNaN(lastMs)) return false;
  return asOfMs - lastMs >= GHN_UPDATE_STALE_MS;
}

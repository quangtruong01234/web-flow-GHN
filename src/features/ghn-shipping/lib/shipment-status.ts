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

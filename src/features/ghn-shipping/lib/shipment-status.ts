import type {
  GhnStatus,
  LocalStatus,
  PaymentStatus,
  Shipment,
  ShipmentActionKey,
} from "../types";

export interface StatusMeta {
  bg: string;
  fg: string;
  dot: string;
  label: string;
}

export const GHN_STATUS_META: Record<GhnStatus, StatusMeta> = {
  ready_to_pick: { bg: "#eef2f7", fg: "#475569", dot: "#94a3b8", label: "Ready to pick" },
  picking: { bg: "#fef3c7", fg: "#92400e", dot: "#d97706", label: "Picking" },
  delivering: { bg: "#dbeafe", fg: "#1e40af", dot: "#2563eb", label: "Delivering" },
  delivered: { bg: "#dcfce7", fg: "#166534", dot: "#16a34a", label: "Delivered" },
  delivery_fail: { bg: "#fee2e2", fg: "#991b1b", dot: "#dc2626", label: "Delivery failed" },
  waiting_to_return: { bg: "#ffedd5", fg: "#9a3412", dot: "#ea580c", label: "Waiting to return" },
  returned: { bg: "#ede9fe", fg: "#5b21b6", dot: "#7c3aed", label: "Returned" },
  cancelled: { bg: "#f1f5f9", fg: "#64748b", dot: "#94a3b8", label: "Cancelled" },
};

export const LOCAL_STATUS_META: Record<LocalStatus, StatusMeta> = {
  pending: { bg: "#f1f5f9", fg: "#64748b", dot: "#94a3b8", label: "Pending" },
  confirmed: { bg: "#e0f2fe", fg: "#075985", dot: "#0ea5e9", label: "Confirmed" },
  shipping: { bg: "#eef2ff", fg: "#4338ca", dot: "#4f46e5", label: "Shipping" },
  completed: { bg: "#dcfce7", fg: "#166534", dot: "#16a34a", label: "Completed" },
  refunding: { bg: "#ffedd5", fg: "#9a3412", dot: "#ea580c", label: "Refunding" },
  cancelled: { bg: "#f1f5f9", fg: "#64748b", dot: "#94a3b8", label: "Cancelled" },
};

export const PAYMENT_META: Record<PaymentStatus, StatusMeta> = {
  paid: { bg: "#dcfce7", fg: "#166534", dot: "#16a34a", label: "Paid" },
  unpaid: { bg: "#fef3c7", fg: "#92400e", dot: "#d97706", label: "Unpaid" },
  refunded: { bg: "#ede9fe", fg: "#5b21b6", dot: "#7c3aed", label: "Refunded" },
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

export function actionAvailability(key: ShipmentActionKey, status: GhnStatus) {
  switch (key) {
    case "sync":
      return { available: true };
    case "cancel":
      return ["ready_to_pick", "picking"].includes(status)
        ? { available: true }
        : { available: false, reason: "Cannot cancel after the parcel is picked up or delivered." };
    case "return":
      return ["delivery_fail", "waiting_to_return"].includes(status)
        ? { available: true }
        : { available: false, reason: "Only available after a failed delivery." };
    case "again":
      return status === "delivery_fail"
        ? { available: true }
        : { available: false, reason: "Only available for failed deliveries." };
    case "cod":
      return ["ready_to_pick", "picking", "delivering"].includes(status)
        ? { available: true }
        : { available: false, reason: "COD is locked once the order is delivered or closed." };
    case "info":
      return ["ready_to_pick", "picking"].includes(status)
        ? { available: true }
        : { available: false, reason: "Address cannot be changed after pickup." };
    default:
      return { available: false };
  }
}

export function ghnStatusDistribution(shipments: Shipment[]) {
  return GHN_STATUS_ORDER.map((status) => ({
    status,
    count: shipments.filter((shipment) => shipment.ghnStatus === status).length,
    meta: ghnMeta(status),
  }));
}

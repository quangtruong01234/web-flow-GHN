import type { AnalyticsParams } from "@/features/ghn-shipping/api/analytics";
import type { ShipmentListParams } from "@/features/ghn-shipping/api/types";

export const queryKeys = {
  auth: { me: ["auth", "me"] as const },
  analytics: (params: AnalyticsParams) => ["analytics", params] as const,
  shipments: {
    all: ["shipments"] as const,
    list: (params: ShipmentListParams) =>
      ["shipments", "list", params] as const,
    detail: (orderId: string) => ["shipments", orderId] as const,
    history: (orderId: string) => ["shipments", orderId, "history"] as const,
  },
} as const;

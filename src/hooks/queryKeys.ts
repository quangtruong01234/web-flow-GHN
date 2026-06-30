import type { ShipmentListParams } from "@/features/ghn-shipping/api/types";

export const queryKeys = {
  auth: { me: ["auth", "me"] as const },
  shipments: {
    all: ["shipments"] as const,
    list: (params: ShipmentListParams) =>
      ["shipments", "list", params] as const,
    detail: (orderId: number) => ["shipments", orderId] as const,
    history: (orderId: number) => ["shipments", orderId, "history"] as const,
  },
} as const;

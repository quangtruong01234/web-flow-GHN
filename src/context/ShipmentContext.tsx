"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { mockShipments } from "@/features/ghn-shipping/data/mockShipments";
import type {
  HistoryEvent,
  Receiver,
  Shipment,
  ShipmentActionKey,
} from "@/features/ghn-shipping/types";

interface ShipmentContextValue {
  shipments: Shipment[];
  findShipment: (orderId: string) => Shipment | undefined;
  applyAction: (
    orderId: string,
    action: ShipmentActionKey,
    payload?: Record<string, string>,
  ) => void;
}

const ShipmentContext = createContext<ShipmentContextValue | null>(null);

const ACTION_LABEL: Record<ShipmentActionKey, string> = {
  sync: "Sync GHN status",
  cancel: "Cancel shipment",
  return: "Return to seller",
  again: "Request delivery again",
  cod: "Update COD",
  info: "Update receiver info",
};

function nowLabel() {
  return new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ShipmentProvider({ children }: { children: React.ReactNode }) {
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments);
  const { push } = useToast();

  const findShipment = useCallback(
    (orderId: string) => shipments.find((shipment) => shipment.orderId === orderId),
    [shipments],
  );

  const applyAction = useCallback(
    (orderId: string, action: ShipmentActionKey, payload: Record<string, string> = {}) => {
      setShipments((current) =>
        current.map((shipment) => {
          if (shipment.orderId !== orderId) return shipment;

          const event: HistoryEvent = {
            action: ACTION_LABEL[action],
            old: shipment.ghnStatus,
            nw: shipment.ghnStatus,
            actor: "Trần Thị Mai",
            time: nowLabel(),
            result: "success",
            kind: action,
          };

          if (action === "cod") {
            const amount = Number(payload.codAmount ?? shipment.codAmount);
            return {
              ...shipment,
              codAmount: Number.isFinite(amount) ? amount : shipment.codAmount,
              updatedAt: "Just now",
              history: [event, ...shipment.history],
            };
          }

          if (action === "info") {
            const receiver: Receiver = {
              ...shipment.receiver,
              name: payload.name || shipment.receiver.name,
              phone: payload.phone || shipment.receiver.phone,
              address: payload.address || shipment.receiver.address,
            };
            return {
              ...shipment,
              receiver,
              updatedAt: "Just now",
              history: [event, ...shipment.history],
            };
          }

          return {
            ...shipment,
            lastSyncedAt: action === "sync" ? "Just now" : shipment.lastSyncedAt,
            updatedAt: "Just now",
            history: [event, ...shipment.history],
          };
        }),
      );

      push({
        kind: action === "sync" ? "success" : "info",
        title: action === "sync" ? "Mock sync completed" : "Demo action applied locally",
        message:
          "No backend or GHN system was updated. User-visible order status will later change only after a valid webhook, sync response, or approved demo endpoint.",
      });
    },
    [push],
  );

  const value = useMemo(
    () => ({ shipments, findShipment, applyAction }),
    [shipments, findShipment, applyAction],
  );

  return <ShipmentContext.Provider value={value}>{children}</ShipmentContext.Provider>;
}

export function useShipments(): ShipmentContextValue {
  const ctx = useContext(ShipmentContext);
  if (!ctx) throw new Error("useShipments must be used within ShipmentProvider");
  return ctx;
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { useShipments } from "@/context/ShipmentContext";
import { actionAvailability } from "../lib/shipment-status";
import type { Shipment, ShipmentActionKey } from "../types";
import { ShipmentActionModal } from "./ShipmentActionModal";

const ACTIONS: Array<{ key: ShipmentActionKey; label: string }> = [
  { key: "sync", label: "Sync GHN status" },
  { key: "cancel", label: "Cancel shipment" },
  { key: "return", label: "Return to seller" },
  { key: "again", label: "Request delivery again" },
  { key: "cod", label: "Update COD" },
  { key: "info", label: "Update receiver info" },
];

export function ShipmentActionPanel({ shipment }: { shipment: Shipment }) {
  const { applyAction } = useShipments();
  const [action, setAction] = useState<ShipmentActionKey | null>(null);

  return (
    <Card>
      <CardHeader title="Action panel" subtitle="Mock controls for operator workflow" />
      <div className="space-y-3 p-5">
        {ACTIONS.map((item) => {
          const availability = actionAvailability(item.key, shipment.ghnStatus);
          return (
            <div key={item.key}>
              <Button
                variant={item.key === "cancel" ? "danger" : "secondary"}
                className="w-full justify-start"
                disabled={!availability.available}
                onClick={() => setAction(item.key)}
              >
                <Icon
                  name={
                    item.key === "return"
                      ? "cornerUpLeft"
                      : item.key === "again"
                        ? "rotateLeft"
                        : item.key === "sync"
                          ? "sync"
                          : "bolt"
                  }
                  size={16}
                />
                {item.label}
              </Button>
              {!availability.available && availability.reason ? (
                <p className="mt-1 text-xs text-ink-400">{availability.reason}</p>
              ) : null}
            </div>
          );
        })}
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-ink-500">
          GHN status is read-only. Demo actions can update local UI notes, COD, or
          receiver fields, but they do not represent a real carrier update.
        </p>
      </div>
      <ShipmentActionModal
        action={action}
        shipment={shipment}
        onClose={() => setAction(null)}
        onApply={(payload) => {
          if (!action) return;
          applyAction(shipment.orderId, action, payload);
          setAction(null);
        }}
      />
    </Card>
  );
}

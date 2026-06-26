"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { Shipment, ShipmentActionKey } from "../types";

const TITLES: Record<ShipmentActionKey, string> = {
  sync: "Sync GHN status",
  cancel: "Cancel shipment",
  return: "Return to seller",
  again: "Request delivery again",
  cod: "Update COD",
  info: "Update receiver info",
};

export function ShipmentActionModal({
  action,
  shipment,
  onClose,
  onApply,
}: {
  action: ShipmentActionKey | null;
  shipment: Shipment;
  onClose: () => void;
  onApply: (payload?: Record<string, string>) => void;
}) {
  const [codAmount, setCodAmount] = useState(String(shipment.codAmount));
  const [name, setName] = useState(shipment.receiver.name);
  const [phone, setPhone] = useState(shipment.receiver.phone);
  const [address, setAddress] = useState(shipment.receiver.address);
  const [note, setNote] = useState("");

  useEffect(() => {
    setCodAmount(String(shipment.codAmount));
    setName(shipment.receiver.name);
    setPhone(shipment.receiver.phone);
    setAddress(shipment.receiver.address);
    setNote("");
  }, [action, shipment]);

  const confirm = () => {
    if (action === "cod") onApply({ codAmount });
    else if (action === "info") onApply({ name, phone, address });
    else onApply({ note });
  };

  if (!action) return null;

  return (
    <Modal
      open={Boolean(action)}
      onClose={onClose}
      title={TITLES[action]}
      subtitle="Mock action only. No real GHN or backend update is performed."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant={action === "cancel" ? "danger" : "primary"} onClick={confirm}>
            Apply demo action
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {action === "cod" ? (
          <Field label="COD amount">
            <Input inputMode="numeric" value={codAmount} onChange={(event) => setCodAmount(event.target.value)} />
          </Field>
        ) : action === "info" ? (
          <>
            <Field label="Receiver name"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
            <Field label="Receiver phone"><Input value={phone} onChange={(event) => setPhone(event.target.value)} /></Field>
            <Field label="Receiver address"><Input value={address} onChange={(event) => setAddress(event.target.value)} /></Field>
          </>
        ) : (
          <Field label="Demo note">
            <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional local note" />
          </Field>
        )}
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
          User-visible order status should change later only after the backend receives a
          valid GHN webhook, GHN sync response, or approved demo backend endpoint.
        </p>
      </div>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Field, Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { canSync as roleCanSync, useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { isApiError } from "@/lib/api";
import {
  useShipmentDetail,
  useShipmentHistory,
  useShipmentAction,
  useSetDemoStatus,
  useSyncShipment,
  useUpdateCod,
  useUpdateReceiver,
} from "../hooks/useShipments";
import {
  fmtCod,
  fmtDateTime,
  fmtFee,
  fmtVND,
} from "../lib/shipment-formatters";
import {
  GHN_STATUS_META,
  GHN_STATUS_ORDER,
  rawGhnLabel,
} from "../lib/shipment-status";
import { syncErrorCopy } from "../lib/sync-errors";
import type { ShipmentDetailView, ShipmentManualAction } from "../api/types";
import type { GhnStatus } from "../types";
import { ErrorState } from "./ErrorState";
import { GhnStatusBadge, LocalStatusBadge } from "./ShipmentStatusBadge";
import { ShipmentTimeline } from "./ShipmentTimeline";

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-ink-400">{label}</span>
      <span className="text-right font-medium text-ink-900">{value}</span>
    </div>
  );
}

const PAYMENT_LABEL: Record<string, string> = {
  cod: "Cash on delivery",
  zalopay: "ZaloPay",
  vnpay: "VNPay",
};

// Backend-backed carrier actions. Render only when `availableActions` exposes them.
const LIVE_ACTIONS: Array<{
  key: ShipmentManualAction;
  label: string;
  icon: "bolt" | "cornerUpLeft";
  variant: "danger" | "secondary";
}> = [
  { key: "cancel", label: "Cancel shipment", icon: "bolt", variant: "danger" },
  {
    key: "return",
    label: "Return to seller",
    icon: "cornerUpLeft",
    variant: "secondary",
  },
];

const ACTION_LABEL: Record<ShipmentManualAction, string> = {
  cancel: "Cancel shipment",
  return: "Return to seller",
};

// Demo-only control. Off by default; turn on with NEXT_PUBLIC_GHN_DEMO_MODE=true
// for a local/demo build. It drives the GHN status through the sanctioned
// backend demo endpoint (which itself stays disabled in prod via its own flag),
// so a sandbox order GHN never advances can still walk picking → delivered.
function isDemoModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_GHN_DEMO_MODE === "true";
}

function BackLink() {
  return (
    <Link href="/shipments">
      <Button variant="ghost" size="sm">
        <Icon name="chevronLeft" size={16} />
        Back to shipments
      </Button>
    </Link>
  );
}

export function ShipmentDetail({ orderId }: { orderId: number }) {
  const detail = useShipmentDetail(orderId);
  const history = useShipmentHistory(orderId);

  if (detail.isPending) {
    return (
      <div className="space-y-5">
        <BackLink />
        <Card>
          <div className="p-8 text-center text-sm text-ink-500">
            Loading shipment...
          </div>
        </Card>
      </div>
    );
  }

  if (detail.isError) {
    const notFound = isApiError(detail.error) && detail.error.status === 404;
    return (
      <div className="space-y-5">
        <BackLink />
        <Card>
          <ErrorState
            title={notFound ? "Shipment not found" : "Could not load shipment"}
            message={
              notFound
                ? `No order #${orderId} exists in the logistics queue.`
                : "The shipment failed to load. Try again in a moment."
            }
            onRetry={notFound ? undefined : () => void detail.refetch()}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackLink />
      <Body data={detail.data} historyQuery={history} />
    </div>
  );
}

function Body({
  data,
  historyQuery,
}: {
  data: ShipmentDetailView;
  historyQuery: ReturnType<typeof useShipmentHistory>;
}) {
  const { receiver } = data;
  const address = [receiver.address, receiver.ward, receiver.district, receiver.province]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-ink-400">Order summary</p>
            <h1 className="mt-1 text-2xl font-semibold text-ink-900">#{data.orderId}</h1>
            <p className="mt-1 text-sm text-ink-500">{data.productSummary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LocalStatusBadge status={data.localStatus} />
            <GhnStatusBadge status={data.ghnStatus} raw={data.rawGhnStatus} />
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Receiver" subtitle="Delivery destination" />
              <div className="p-5">
                <FieldRow label="Name" value={receiver.name || "—"} />
                <FieldRow label="Phone" value={receiver.phone || "—"} />
                <FieldRow label="Address" value={address || "—"} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Payment and COD" subtitle="Order payment snapshot" />
              <div className="p-5">
                <FieldRow
                  label="Payment"
                  value={PAYMENT_LABEL[data.paymentMethod] ?? data.paymentMethod}
                />
                <FieldRow label="COD" value={fmtCod(data.codAmount)} />
                <FieldRow label="Shipping fee" value={fmtFee(data.shippingFee)} />
                <FieldRow label="Total" value={fmtVND(data.total)} />
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="GHN shipment detail"
              subtitle="Carrier fields are read-only"
            />
            <div className="p-5">
              {data.ghnOrderCode ? (
                data.ghn ? (
                  <div className="grid gap-x-8 lg:grid-cols-2">
                    <FieldRow label="GHN code" value={data.ghnOrderCode} />
                    <FieldRow
                      label="GHN status"
                      value={
                        data.ghnStatus ? (
                          <GhnStatusBadge status={data.ghnStatus} raw={data.rawGhnStatus} />
                        ) : (
                          rawGhnLabel(data.rawGhnStatus)
                        )
                      }
                    />
                    <FieldRow
                      label="Expected delivery"
                      value={fmtDateTime(data.ghn.expected)}
                    />
                    <FieldRow label="Lead time" value={fmtDateTime(data.ghn.leadtime)} />
                    <FieldRow
                      label="Carrier fee"
                      value={data.ghn.totalFee === null ? "—" : fmtVND(data.ghn.totalFee)}
                    />
                    <FieldRow label="From" value={data.ghn.fromName ?? "—"} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FieldRow label="GHN code" value={data.ghnOrderCode} />
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      {data.ghnDetailError
                        ? `GHN detail unavailable: ${data.ghnDetailError}`
                        : "GHN detail is currently unavailable."}
                    </div>
                  </div>
                )
              ) : (
                <p className="text-sm text-ink-500">
                  This order has no GHN order code yet.
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Items" subtitle="Marketplace order context" />
            <div className="divide-y divide-line">
              {data.items.length === 0 ? (
                <p className="p-5 text-sm text-ink-500">No items recorded.</p>
              ) : (
                data.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-5 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-900">{item.name}</p>
                      {item.skuLabel ? (
                        <p className="mt-0.5 text-xs text-ink-400">{item.skuLabel}</p>
                      ) : null}
                    </div>
                    <div className="flex-none text-right">
                      <p className="text-ink-700">×{item.quantity}</p>
                      <p className="text-xs text-ink-400">{fmtVND(item.unitPrice)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-line p-5">
              <FieldRow label="Seller" value={data.sellerName} />
              <FieldRow label="Buyer" value={data.buyerName} />
              <FieldRow label="Created" value={fmtDateTime(data.createdAt)} />
              <FieldRow label="Last synced" value={fmtDateTime(data.lastSyncedAt)} />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Shipping timeline"
              subtitle="Webhook and sync history"
            />
            <div className="p-5">
              {historyQuery.isPending ? (
                <p className="text-sm text-ink-500">Loading timeline...</p>
              ) : historyQuery.isError ? (
                <ErrorState
                  title="Could not load timeline"
                  message="The shipping history failed to load."
                  onRetry={() => void historyQuery.refetch()}
                />
              ) : (
                <ShipmentTimeline history={historyQuery.data} />
              )}
            </div>
          </Card>
        </div>

        <ShipmentActions data={data} />
      </div>
    </>
  );
}

function ShipmentActions({ data }: { data: ShipmentDetailView }) {
  const { user } = useAuth();
  const { push } = useToast();
  const sync = useSyncShipment();
  const action = useShipmentAction();
  const [codOpen, setCodOpen] = useState(false);
  const [receiverOpen, setReceiverOpen] = useState(false);

  const userMaySync = roleCanSync(user?.role);
  const userMayAct = roleCanSync(user?.role);
  const canSyncOrder = data.canSync; // order has a GHN code
  const liveActions = LIVE_ACTIONS.filter((item) =>
    data.availableActions.includes(item.key),
  );
  const canUpdateCod = data.availableActions.includes("update_cod");
  const canUpdateReceiver = data.availableActions.includes("update_receiver");
  const hasEditActions = canUpdateCod || canUpdateReceiver;

  const onSync = () => {
    sync.mutate(data.orderId, {
      onSuccess: (result) => {
        push({
          kind: "success",
          title: "GHN status synced",
          message: `GHN: ${rawGhnLabel(result.ghnStatus)} · order is now ${result.newStatus}.`,
        });
      },
      onError: (error: unknown) => {
        const copy = syncErrorCopy(error);
        push({ kind: "error", title: copy.title, message: copy.message });
      },
    });
  };

  const onAction = (actionKey: ShipmentManualAction) => {
    action.mutate(
      { orderId: data.orderId, action: actionKey },
      {
        onSuccess: (result) => {
          if (!result.success) {
            push({
              kind: "error",
              title: `${ACTION_LABEL[actionKey]} failed`,
              message:
                result.message ??
                "The backend recorded a failed attempt. The order was not changed.",
            });
            return;
          }
          push({
            kind: "success",
            title: `${ACTION_LABEL[actionKey]} complete`,
            message: `Order #${result.orderId} is now ${result.newStatus}.`,
          });
        },
        onError: (error: unknown) => {
          const message = isApiError(error)
            ? error.message
            : "The action request failed. Try again in a moment.";
          const rejectedByGhn = isApiError(error) && error.status === 500;
          push({
            kind: "error",
            title: rejectedByGhn
              ? "GHN rejected the action"
              : `${ACTION_LABEL[actionKey]} failed`,
            message: rejectedByGhn
              ? `${message} The local order was not changed; the failed attempt is recorded in history.`
              : message,
          });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader title="Action panel" subtitle="Operator workflow" />
      <div className="space-y-3 p-5">
        <Button
          className="w-full justify-start"
          onClick={onSync}
          disabled={!canSyncOrder || !userMaySync || sync.isPending}
        >
          <Icon name="sync" size={16} />
          {sync.isPending ? "Syncing..." : "Sync GHN status"}
        </Button>
        {!canSyncOrder ? (
          <p className="text-xs text-ink-400">
            No GHN order code yet — there is nothing to sync.
          </p>
        ) : !userMaySync ? (
          <p className="text-xs text-ink-400">
            Syncing requires the shipping manager role.
          </p>
        ) : null}

        <div className="space-y-3 border-t border-line pt-3">
          {liveActions.map((item) => {
            const busy =
              action.isPending &&
              action.variables?.orderId === data.orderId &&
              action.variables?.action === item.key;
            return (
              <Button
                key={item.key}
                variant={item.variant}
                className="w-full justify-start"
                disabled={!userMayAct || action.isPending}
                onClick={() => onAction(item.key)}
              >
                <Icon name={item.icon} size={16} />
                {busy ? "Working..." : item.label}
              </Button>
            );
          })}
          {liveActions.length > 0 && !userMayAct ? (
            <p className="text-xs text-ink-400">
              Carrier actions require the shipping manager role.
            </p>
          ) : null}
          {liveActions.length === 0 ? (
            <p className="text-xs text-ink-400">
              No carrier actions are currently available for this shipment.
            </p>
          ) : null}
        </div>

        <div className="space-y-3 border-t border-line pt-3">
          <p className="text-xs font-medium text-ink-400">Waybill edits</p>
          {canUpdateCod ? (
            <Button
              variant="secondary"
              className="w-full justify-start"
              disabled={!userMayAct}
              onClick={() => setCodOpen(true)}
            >
              <Icon name="wallet" size={16} />
              Update COD
            </Button>
          ) : null}
          {canUpdateReceiver ? (
            <Button
              variant="secondary"
              className="w-full justify-start"
              disabled={!userMayAct}
              onClick={() => setReceiverOpen(true)}
            >
              <Icon name="user" size={16} />
              Update receiver info
            </Button>
          ) : null}
          {hasEditActions && !userMayAct ? (
            <p className="text-xs text-ink-400">
              Waybill edits require the shipping manager role.
            </p>
          ) : null}
          {!hasEditActions ? (
            <p className="text-xs text-ink-400">
              COD and receiver edits are only available before the parcel enters
              transit.
            </p>
          ) : null}
        </div>

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-ink-500">
          GHN status is backend-owned — the console never calls GHN directly. Sync,
          cancel, return, waybill edits, and demo status all go through the backend.
          Ward, district, and province are fixed for an existing waybill.
        </p>

        {isDemoModeEnabled() && data.ghnOrderCode ? (
          <DemoStatusControl data={data} userMayAct={userMayAct} />
        ) : null}
      </div>

      {canUpdateCod ? (
        <UpdateCodModal
          open={codOpen}
          onClose={() => setCodOpen(false)}
          data={data}
        />
      ) : null}
      {canUpdateReceiver ? (
        <UpdateReceiverModal
          open={receiverOpen}
          onClose={() => setReceiverOpen(false)}
          data={data}
        />
      ) : null}
    </Card>
  );
}

/**
 * DEMO ONLY (gated by `DEMO_MODE`): a small picker that drives the GHN status
 * through the backend demo endpoint so a sandbox order GHN never advances can
 * still walk `picking → delivering → delivered` for an end-to-end demo. Success
 * reuses the sync view model + invalidation. A `403 "disabled"` (backend flag
 * off) is shown as an info notice, NOT bounced to `/403`.
 */
/**
 * First GHN status that isn't the order's current one, preferring the next step
 * in lifecycle order. Used so the picker never defaults to a no-op transition.
 */
function defaultDemoTarget(current: GhnStatus | null): GhnStatus {
  if (current) {
    const idx = GHN_STATUS_ORDER.indexOf(current);
    const next = GHN_STATUS_ORDER.slice(idx + 1).find((s) => s !== current);
    if (next) return next;
  }
  return GHN_STATUS_ORDER.find((s) => s !== current) ?? "picking";
}

function DemoStatusControl({
  data,
  userMayAct,
}: {
  data: ShipmentDetailView;
  userMayAct: boolean;
}) {
  const { push } = useToast();
  const demo = useSetDemoStatus();
  const [target, setTarget] = useState<GhnStatus>(() =>
    defaultDemoTarget(data.ghnStatus),
  );
  // Never offer the order's current GHN status — it would be a no-op transition.
  const selectableStatuses = GHN_STATUS_ORDER.filter(
    (status) => status !== data.ghnStatus,
  );

  const onApply = () => {
    demo.mutate(
      { orderId: data.orderId, body: { ghnStatus: target } },
      {
        onSuccess: (result) => {
          const moved = result.previousStatus !== result.newStatus;
          push({
            kind: "success",
            title: "Demo status applied",
            message: moved
              ? `GHN: ${rawGhnLabel(result.ghnStatus)} · order is now ${result.newStatus}.`
              : `GHN: ${rawGhnLabel(result.ghnStatus)} · local status unchanged (${result.newStatus}).`,
          });
        },
        onError: (error: unknown) => {
          const disabled =
            isApiError(error) &&
            error.status === 403 &&
            /disabled/i.test(error.message);
          push({
            kind: disabled ? "info" : "error",
            title: disabled ? "Demo mode not enabled" : "Demo status failed",
            message: disabled
              ? "The demo-status endpoint is disabled in this environment. Set GHN_DEMO_ENDPOINTS_ENABLED=true on the backend and restart it."
              : isApiError(error)
                ? error.message
                : "The demo request failed. Try again in a moment.",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
        <Icon name="bolt" size={14} />
        Demo controls
      </div>
      <p className="text-xs leading-5 text-amber-700/90">
        Simulate a GHN status change for end-to-end demos. Routes through the
        backend demo endpoint — GHN is never called.
      </p>
      <Field label="Set GHN status" htmlFor="demo-ghn-status">
        <Select
          id="demo-ghn-status"
          value={target}
          onChange={(e) => setTarget(e.target.value as GhnStatus)}
          disabled={!userMayAct || demo.isPending}
        >
          {selectableStatuses.map((status) => (
            <option key={status} value={status}>
              {GHN_STATUS_META[status].label}
            </option>
          ))}
        </Select>
      </Field>
      <Button
        variant="secondary"
        className="w-full justify-start"
        disabled={!userMayAct || demo.isPending}
        onClick={onApply}
      >
        <Icon name="bolt" size={16} />
        {demo.isPending ? "Applying..." : "Apply demo status"}
      </Button>
      {!userMayAct ? (
        <p className="text-xs text-amber-700/80">
          Demo status requires the shipping manager role.
        </p>
      ) : null}
    </div>
  );
}

function UpdateCodModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: ShipmentDetailView;
}) {
  const { push } = useToast();
  const updateCod = useUpdateCod();
  const [value, setValue] = useState<string>(String(data.codAmount));

  const parsed = Number(value);
  const valid =
    value.trim() !== "" && Number.isInteger(parsed) && parsed >= 0;

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || updateCod.isPending) return;
    updateCod.mutate(
      { orderId: data.orderId, body: { codAmount: parsed } },
      {
        onSuccess: (result) => {
          push({
            kind: "success",
            title: "COD updated",
            message: `Order #${result.orderId} COD is now ${fmtVND(result.newCodAmount)}.`,
          });
          onClose();
        },
        onError: (error: unknown) => handleEditError(error, "COD", push),
      },
    );
  };

  return (
    <Modal
      open={open}
      title="Update COD"
      subtitle="Correct the cash-on-delivery amount on this waybill"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="update-cod-form"
            disabled={!valid || updateCod.isPending}
          >
            {updateCod.isPending ? "Saving..." : "Save COD"}
          </Button>
        </>
      }
    >
      <form id="update-cod-form" onSubmit={onSubmit} className="space-y-3">
        <Field
          label="COD amount (VND)"
          htmlFor="cod-amount"
          hint="Whole number, min 0. Enter 0 to clear COD on this order."
        >
          <Input
            id="cod-amount"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Field>
        <p className="text-xs text-ink-400">
          Current COD: {fmtCod(data.codAmount)}.
        </p>
      </form>
    </Modal>
  );
}

function UpdateReceiverModal({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: ShipmentDetailView;
}) {
  const { push } = useToast();
  const updateReceiver = useUpdateReceiver();
  const [name, setName] = useState(data.receiver.name);
  const [phone, setPhone] = useState(data.receiver.phone);
  const [address, setAddress] = useState(data.receiver.address);

  // Only send fields the operator actually changed; backend rewrites just those.
  const changed: { toName?: string; toPhone?: string; toAddress?: string } = {};
  if (name.trim() !== data.receiver.name.trim()) changed.toName = name.trim();
  if (phone.trim() !== data.receiver.phone.trim()) changed.toPhone = phone.trim();
  if (address.trim() !== data.receiver.address.trim())
    changed.toAddress = address.trim();
  const hasChange = Object.keys(changed).length > 0;

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasChange || updateReceiver.isPending) return;
    updateReceiver.mutate(
      { orderId: data.orderId, body: changed },
      {
        onSuccess: (result) => {
          push({
            kind: "success",
            title: "Receiver updated",
            message: `Updated ${result.updatedFields.join(", ") || "receiver"} on order #${result.orderId}.`,
          });
          onClose();
        },
        onError: (error: unknown) => handleEditError(error, "Receiver", push),
      },
    );
  };

  return (
    <Modal
      open={open}
      title="Update receiver info"
      subtitle="Edit the recipient name, phone, or street only"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="update-receiver-form"
            disabled={!hasChange || updateReceiver.isPending}
          >
            {updateReceiver.isPending ? "Saving..." : "Save receiver"}
          </Button>
        </>
      }
    >
      <form
        id="update-receiver-form"
        onSubmit={onSubmit}
        className="space-y-3"
      >
        <Field label="Receiver name" htmlFor="receiver-name">
          <Input
            id="receiver-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Receiver phone" htmlFor="receiver-phone">
          <Input
            id="receiver-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label="Street address" htmlFor="receiver-address">
          <Input
            id="receiver-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>
        <p className="text-xs text-ink-400">
          Ward, district, and province ({" "}
          {[data.receiver.ward, data.receiver.district, data.receiver.province]
            .filter(Boolean)
            .join(", ") || "—"}
          ) cannot be changed for an existing waybill. Edit at least one field to
          save.
        </p>
      </form>
    </Modal>
  );
}

/** Shared error handling for the COD/receiver edits: 500 = GHN rejected. */
function handleEditError(
  error: unknown,
  what: string,
  push: ReturnType<typeof useToast>["push"],
): void {
  const message = isApiError(error)
    ? error.message
    : "The request failed. Try again in a moment.";
  const rejectedByGhn = isApiError(error) && error.status === 500;
  push({
    kind: "error",
    title: rejectedByGhn ? "GHN rejected the edit" : `${what} update failed`,
    message: rejectedByGhn
      ? `${message} The order was not changed; the failed attempt is recorded in history.`
      : message,
  });
}

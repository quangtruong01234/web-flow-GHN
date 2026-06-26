"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Field, Input, Select } from "@/components/ui/Input";
import { useShipments } from "@/context/ShipmentContext";
import { useToast } from "@/context/ToastContext";
import { fmtCod, fmtFee, fmtVND } from "../lib/shipment-formatters";
import { GHN_STATUS_ORDER, LOCAL_STATUS_ORDER } from "../lib/shipment-status";
import type { GhnStatus, LocalStatus } from "../types";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { GhnStatusBadge, LocalStatusBadge } from "./ShipmentStatusBadge";

type DemoState = "normal" | "loading" | "empty" | "error";

export function ShipmentTable() {
  const { shipments } = useShipments();
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [ghnStatus, setGhnStatus] = useState<"all" | GhnStatus>("all");
  const [localStatus, setLocalStatus] = useState<"all" | LocalStatus>("all");
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [demoState, setDemoState] = useState<DemoState>("normal");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter((shipment) => {
      if (demoState === "empty") return false;
      if (q && !`${shipment.orderId} ${shipment.ghnOrderCode}`.toLowerCase().includes(q)) return false;
      if (ghnStatus !== "all" && shipment.ghnStatus !== ghnStatus) return false;
      if (localStatus !== "all" && shipment.localStatus !== localStatus) return false;
      if (onlyFailed && shipment.ghnStatus !== "delivery_fail") return false;
      return true;
    });
  }, [demoState, ghnStatus, localStatus, onlyFailed, query, shipments]);

  const refresh = () => {
    push({
      kind: "success",
      title: "Mock refresh completed",
      message: "Shipment data was refreshed from local demo state only.",
    });
  };

  return (
    <Card>
      <CardHeader
        title="Shipments"
        subtitle="Search and filter local mock data"
        action={
          <Button size="sm" variant="secondary" onClick={refresh}>
            <Icon name="refresh" size={15} />Refresh
          </Button>
        }
      />

      <div className="space-y-4 border-b border-line p-5">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
          <Field label="Search order or GHN code">
            <div className="relative">
              <Icon name="search" size={16} className="absolute left-3 top-3 text-ink-400" />
              <Input
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="TB-100245 or GHN5A9KQ2H"
              />
            </div>
          </Field>
          <Field label="GHN status">
            <Select value={ghnStatus} onChange={(event) => setGhnStatus(event.target.value as "all" | GhnStatus)}>
              <option value="all">All GHN statuses</option>
              {GHN_STATUS_ORDER.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
          </Field>
          <Field label="Local status">
            <Select value={localStatus} onChange={(event) => setLocalStatus(event.target.value as "all" | LocalStatus)}>
              <option value="all">All local statuses</option>
              {LOCAL_STATUS_ORDER.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
          </Field>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <Field label="Created from"><Input type="date" /></Field>
          <Field label="Created to"><Input type="date" /></Field>
          <label className="flex items-end gap-2 pb-2 text-sm font-medium text-ink-700">
            <input type="checkbox" checked={onlyFailed} onChange={(event) => setOnlyFailed(event.target.checked)} />
            Only failed deliveries
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-400">Demo table state:</span>
          {(["normal", "loading", "empty", "error"] as DemoState[]).map((state) => (
            <Button key={state} size="sm" variant={demoState === state ? "primary" : "secondary"} onClick={() => setDemoState(state)}>
              {state}
            </Button>
          ))}
        </div>
      </div>

      {demoState === "loading" ? (
        <div className="p-8 text-center text-sm text-ink-500">Loading mock shipment rows...</div>
      ) : demoState === "error" ? (
        <div className="p-5">
          <ErrorState title="Demo error state" message="This is a local table error preview. No backend request failed." />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-5">
          <EmptyState title="No shipments found" message="Adjust search, filters, or demo state to show mock rows." />
        </div>
      ) : (
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-ink-400">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Receiver</th>
                <th className="px-5 py-3">Local</th>
                <th className="px-5 py-3">GHN</th>
                <th className="px-5 py-3">COD</th>
                <th className="px-5 py-3">Fee</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((shipment) => (
                <tr key={shipment.orderId} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <Link href={`/shipments/${shipment.orderId}`} className="font-semibold text-brand-700 hover:underline">
                      {shipment.orderId}
                    </Link>
                    <p className="mt-1 text-xs text-ink-400">{shipment.ghnOrderCode}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink-900">{shipment.receiver.name}</p>
                    <p className="mt-1 text-xs text-ink-400">{shipment.receiver.district}</p>
                  </td>
                  <td className="px-5 py-4"><LocalStatusBadge status={shipment.localStatus} /></td>
                  <td className="px-5 py-4"><GhnStatusBadge status={shipment.ghnStatus} /></td>
                  <td className="px-5 py-4 text-ink-700">{fmtCod(shipment.codAmount)}</td>
                  <td className="px-5 py-4 text-ink-700">{fmtFee(shipment.shippingFee)}</td>
                  <td className="px-5 py-4 font-medium text-ink-900">{fmtVND(shipment.total)}</td>
                  <td className="px-5 py-4 text-xs text-ink-400">{shipment.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

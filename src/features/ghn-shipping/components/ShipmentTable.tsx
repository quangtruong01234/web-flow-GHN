"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Field, Input, Select } from "@/components/ui/Input";
import { useShipmentList } from "../hooks/useShipments";
import {
  fmtCodNullable,
  fmtDateTime,
  fmtFeeNullable,
} from "../lib/shipment-formatters";
import type { BackendOrderStatus, ShipmentListParams } from "../api/types";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { GhnStatusBadge, LocalStatusBadge } from "./ShipmentStatusBadge";

const PAGE_SIZE = 20;

// Backend `OrderStatus` values (server filters on these exactly).
const LOCAL_STATUS_OPTIONS: Array<{ value: BackendOrderStatus; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivering", label: "Delivering" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
];

// Canonical GHN status strings (server filters on the recorded raw value).
const GHN_STATUS_OPTIONS = [
  "ready_to_pick",
  "picking",
  "delivering",
  "delivered",
  "delivery_fail",
  "waiting_to_return",
  "returned",
  "cancel",
];

export function ShipmentTable() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | BackendOrderStatus>("all");
  const [ghnStatus, setGhnStatus] = useState<"all" | string>("all");
  const [hasGhnCode, setHasGhnCode] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the free-text search so we don't refetch on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Any filter change resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [search, status, ghnStatus, hasGhnCode, dateFrom, dateTo]);

  const params = useMemo<ShipmentListParams>(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      status: status === "all" ? undefined : status,
      ghnStatus: ghnStatus === "all" ? undefined : ghnStatus,
      hasGhnCode: hasGhnCode ? true : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [page, search, status, ghnStatus, hasGhnCode, dateFrom, dateTo],
  );

  const { data, isPending, isError, isFetching, refetch } = useShipmentList(params);

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <Card>
      <CardHeader
        title="Shipments"
        subtitle={
          data
            ? `${total} order${total === 1 ? "" : "s"} in the logistics queue`
            : "Search and filter GHN orders"
        }
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <Icon name="refresh" size={15} />
            {isFetching ? "Refreshing..." : "Refresh"}
          </Button>
        }
      />

      <div className="space-y-4 border-b border-line p-5">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
          <Field label="Search order ID, GHN code, or address">
            <div className="relative">
              <Icon name="search" size={16} className="absolute left-3 top-3 text-ink-400" />
              <Input
                className="pl-9"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="100245 or GHN5A9KQ2H"
              />
            </div>
          </Field>
          <Field label="Local status">
            <Select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "all" | BackendOrderStatus)
              }
            >
              <option value="all">All local statuses</option>
              {LOCAL_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="GHN status">
            <Select value={ghnStatus} onChange={(event) => setGhnStatus(event.target.value)}>
              <option value="all">All GHN statuses</option>
              {GHN_STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <Field label="Created from">
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </Field>
          <Field label="Created to">
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              checked={hasGhnCode}
              onChange={(event) => setHasGhnCode(event.target.checked)}
            />
            Only with GHN code
          </label>
        </div>
      </div>

      {isPending ? (
        <div className="p-8 text-center text-sm text-ink-500">Loading shipments...</div>
      ) : isError ? (
        <div className="p-5">
          <ErrorState
            title="Could not load shipments"
            message="The shipment list failed to load. Try again in a moment."
            onRetry={() => void refetch()}
          />
        </div>
      ) : items.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="No shipments found"
            message="No orders match the current search and filters."
          />
        </div>
      ) : (
        <>
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-ink-400">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Buyer → Seller</th>
                  <th className="px-5 py-3">Local</th>
                  <th className="px-5 py-3">GHN</th>
                  <th className="px-5 py-3">COD</th>
                  <th className="px-5 py-3">Fee</th>
                  <th className="px-5 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((item) => (
                  <tr key={item.orderId} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link
                        href={`/shipments/${item.orderId}`}
                        className="font-semibold text-brand-700 hover:underline"
                      >
                        #{item.orderId}
                      </Link>
                      <p className="mt-1 text-xs text-ink-400">
                        {item.ghnOrderCode ?? "No GHN code"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink-900">{item.buyerName}</p>
                      <p className="mt-1 text-xs text-ink-400">{item.sellerName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <LocalStatusBadge status={item.localStatus} />
                    </td>
                    <td className="px-5 py-4">
                      <GhnStatusBadge status={item.ghnStatus} raw={item.rawGhnStatus} />
                    </td>
                    <td className="px-5 py-4 text-ink-700">{fmtCodNullable(item.codAmount)}</td>
                    <td className="px-5 py-4 text-ink-700">{fmtFeeNullable(item.shippingFee)}</td>
                    <td className="px-5 py-4 text-xs text-ink-400">
                      {fmtDateTime(item.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
            <p className="text-xs text-ink-400">
              Page {data?.page ?? page} of {totalPages} · {total} total
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <Icon name="chevronLeft" size={15} />
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!data?.hasNext || isFetching}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <Icon name="chevronRight" size={15} />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

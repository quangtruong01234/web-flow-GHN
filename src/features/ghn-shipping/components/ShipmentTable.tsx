"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { Field, Input, Select } from "@/components/ui/Input";
import { useShipmentList } from "../hooks/useShipments";
import { isApiError } from "@/lib/api";
import type { BackendOrderStatus, GhnStatusFilter } from "../api/types";
import {
  buildShipmentListSearch,
  parseShipmentListSearch,
  toShipmentListParams,
  type ShipmentListFilters,
} from "../lib/shipment-list-query";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { EVER_RECORDED_NOTE, NeedsAttentionChips } from "./NeedsAttention";
import { ShipmentRows } from "./ShipmentRows";

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
  { value: "return_requested", label: "Return requested" },
  { value: "refunded", label: "Refunded" },
];

// Canonical GHN status strings (server filters on the recorded raw value with
// `@IsIn(GHN_STATUS_FILTER_VALUES)` — a value outside that set answers 400, so
// the union keeps a typo from compiling).
const GHN_STATUS_OPTIONS: GhnStatusFilter[] = [
  "ready_to_pick",
  "picking",
  "delivering",
  "delivered",
  "delivery_fail",
  "waiting_to_return",
  "returned",
  "cancel",
  "exception",
  "damage",
  "lost",
];

export function ShipmentTable() {
  // `useSearchParams` needs a Suspense boundary or the static build bails out.
  return (
    <Suspense
      fallback={
        <Card>
          <div className="p-8 text-center text-sm text-ink-500">Loading shipments...</div>
        </Card>
      }
    >
      <ShipmentTableContent />
    </Suspense>
  );
}

function ShipmentTableContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the filter state: Back from a detail page and a shared link both
  // reopen the same view. Invalid values in a hand-edited link are dropped.
  const filters = useMemo(() => parseShipmentListSearch(searchParams), [searchParams]);

  // `replace`, not `push`: a filter tweak is not a page the operator wants to
  // step back through. Any filter change returns to the first page.
  const applyFilters = useCallback(
    (next: Partial<ShipmentListFilters>) => {
      const query = buildShipmentListSearch({ ...filters, page: 1, ...next });
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  // The search box keeps its own keystrokes; the URL only gets the debounced value.
  const [searchInput, setSearchInput] = useState(filters.search);
  const lastPushedSearch = useRef(filters.search);

  // Back/forward changed the URL under us — show that search in the box.
  useEffect(() => {
    if (filters.search !== lastPushedSearch.current) {
      lastPushedSearch.current = filters.search;
      setSearchInput(filters.search);
    }
  }, [filters.search]);

  // Debounce the free-text search so we don't refetch on every keystroke.
  useEffect(() => {
    const next = searchInput.trim();
    if (next === filters.search) return;
    const id = setTimeout(() => {
      lastPushedSearch.current = next;
      applyFilters({ search: next });
    }, 350);
    return () => clearTimeout(id);
  }, [searchInput, filters.search, applyFilters]);

  // A cleared filter must be OMITTED, not sent empty: `?status=` is now a 400
  // (GHN-ENUM-01). `undefined` values are dropped by the query builder.
  const params = useMemo(() => toShipmentListParams(filters, PAGE_SIZE), [filters]);

  // A link may carry a valid GHN status outside the common set — list it so the
  // select shows what is actually applied.
  const ghnStatusOptions =
    filters.ghnStatus && !GHN_STATUS_OPTIONS.includes(filters.ghnStatus)
      ? [...GHN_STATUS_OPTIONS, filters.ghnStatus]
      : GHN_STATUS_OPTIONS;

  const { data, dataUpdatedAt, error, isPending, isError, isFetching, refetch } =
    useShipmentList(params);

  // A 400 means the gateway rejected a filter value and names the accepted set —
  // show that message instead of the generic "try again" copy, which would send
  // the operator retrying a request that can never succeed.
  const rejectedFilter = isApiError(error) && error.status === 400 ? error : null;

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
        <div className="space-y-1.5">
          <NeedsAttentionChips active={filters.ghnStatus} />
          {filters.ghnStatus ? (
            <p className="text-xs text-ink-500">{EVER_RECORDED_NOTE}</p>
          ) : null}
        </div>

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
              value={filters.status ?? "all"}
              onChange={(event) =>
                applyFilters({
                  status:
                    event.target.value === "all"
                      ? null
                      : (event.target.value as BackendOrderStatus),
                })
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
            <Select
              value={filters.ghnStatus ?? "all"}
              onChange={(event) =>
                applyFilters({
                  ghnStatus:
                    event.target.value === "all"
                      ? null
                      : (event.target.value as GhnStatusFilter),
                })
              }
            >
              <option value="all">All GHN statuses</option>
              {ghnStatusOptions.map((value) => (
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
              value={filters.dateFrom}
              onChange={(event) => applyFilters({ dateFrom: event.target.value })}
            />
          </Field>
          <Field label="Created to">
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(event) => applyFilters({ dateTo: event.target.value })}
            />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              checked={filters.hasGhnCode}
              onChange={(event) => applyFilters({ hasGhnCode: event.target.checked })}
            />
            Only with GHN code
          </label>
        </div>
      </div>

      {isPending ? (
        <div className="p-8 text-center text-sm text-ink-500">Loading shipments...</div>
      ) : isError ? (
        <div className="p-5">
          {rejectedFilter ? (
            <ErrorState
              title="Filter rejected by the server"
              message={rejectedFilter.message}
            />
          ) : (
            <ErrorState
              title="Could not load shipments"
              message="The shipment list failed to load. Try again in a moment."
              onRetry={() => void refetch()}
            />
          )}
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
          <ShipmentRows items={items} staleAsOf={dataUpdatedAt} />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
            <p className="text-xs text-ink-400">
              Page {data?.page ?? filters.page} of {totalPages} · {total} total
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={filters.page <= 1 || isFetching}
                onClick={() => applyFilters({ page: Math.max(1, filters.page - 1) })}
              >
                <Icon name="chevronLeft" size={15} />
                Previous
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!data?.hasNext || isFetching}
                onClick={() => applyFilters({ page: filters.page + 1 })}
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

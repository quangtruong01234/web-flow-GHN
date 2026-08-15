"use client";

// Business analytics section of the dashboard, backed by
// GET /api/order/admin/analytics (global scope, all sellers). Readable by
// logistics_operator too — do not gate this behind shipping_manager.
// Charts are hand-rolled Tailwind bars (no chart dependency).
//
// GHN-RBAC-01: for a role without revenue visibility the backend omits the four
// monetary fields and `data.revenueVisible` is false. Then we hide the revenue
// KPIs, plot order volume instead of money, and drop the Revenue column — the
// switch is on the field, never on the role.

import { useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type {
  AnalyticsInterval,
  AnalyticsRevenuePoint,
  AnalyticsTopProduct,
} from "../api/analytics";
import { useAnalytics } from "../hooks/useAnalytics";
import { fmtVND } from "../lib/shipment-formatters";
import { ErrorState } from "./ErrorState";

/** Local-time YYYY-MM-DD (the `toISOString` shortcut would shift days in UTC+7). */
function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: isoDate(from), to: isoDate(to) };
}

/** Compact VND for chart/KPI copy: 12.5M VND instead of 12,500,000 VND. */
function fmtVNDCompact(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B VND`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M VND`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K VND`;
  return fmtVND(value);
}

export function AnalyticsPanel() {
  const [from, setFrom] = useState(() => defaultRange().from);
  const [to, setTo] = useState(() => defaultRange().to);
  const [interval, setInterval] = useState<AnalyticsInterval>("day");

  const invalidRange = Boolean(from && to) && from > to;
  const params = useMemo(
    () => ({
      from: from || undefined,
      to: to || undefined,
      interval,
    }),
    [from, to, interval],
  );

  const { data, isPending, isError, refetch, isPlaceholderData } = useAnalytics(params, {
    enabled: !invalidRange,
  });

  const rangeControls = (
    <div className="flex flex-wrap items-end gap-3">
      <Field label="From">
        <Input
          type="date"
          className="h-8 w-40 text-[13px]"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
      </Field>
      <Field label="To">
        <Input
          type="date"
          className="h-8 w-40 text-[13px]"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </Field>
      <div className="flex overflow-hidden rounded-lg border border-line">
        {(["day", "month"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setInterval(option)}
            className={cn(
              "h-8 px-3 text-[13px] font-medium transition-colors",
              interval === option
                ? "bg-brand-600 text-white"
                : "bg-white text-ink-600 hover:bg-slate-50",
            )}
            aria-pressed={interval === option}
          >
            {option === "day" ? "Day" : "Month"}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader
        title="Business analytics"
        subtitle={
          data && !data.revenueVisible
            ? "Global scope (all sellers) — revenue figures are hidden for your role"
            : "Global scope (all sellers) — revenue counts completed orders only"
        }
        action={rangeControls}
      />

      {invalidRange ? (
        <p className="px-5 py-4 text-sm text-red-700">
          The &quot;From&quot; date must not be after the &quot;To&quot; date.
        </p>
      ) : isPending ? (
        <div className="p-8 text-center text-sm text-ink-500">Loading analytics...</div>
      ) : isError ? (
        <ErrorState
          title="Could not load analytics"
          message="The analytics summary failed to load. Try again in a moment."
          onRetry={() => void refetch()}
        />
      ) : (
        <div className={cn("space-y-5 p-5", isPlaceholderData && "opacity-60")}>
          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2",
              data.revenueVisible ? "xl:grid-cols-4" : "xl:grid-cols-2",
            )}
          >
            {data.summary.totalRevenue !== null ? (
              <KpiCard
                label="Revenue (completed)"
                value={fmtVNDCompact(data.summary.totalRevenue)}
                hint={fmtVND(data.summary.totalRevenue)}
              />
            ) : null}
            <KpiCard
              label="Completed orders"
              value={String(data.summary.completedOrders)}
              hint="In the selected window"
            />
            <KpiCard
              label="Total orders"
              value={String(data.summary.totalOrders)}
              hint="All statuses in the window"
            />
            {data.summary.averageOrderValue !== null ? (
              <KpiCard
                label="Avg order value"
                value={fmtVNDCompact(Math.round(data.summary.averageOrderValue))}
                hint="Completed orders only"
              />
            ) : null}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
            <RevenueChart
              points={data.revenueOverTime}
              interval={data.interval}
              metric={data.revenueVisible ? "revenue" : "orders"}
            />
            <StatusDistribution rows={data.statusDistribution} />
          </div>

          <TopProducts products={data.topProducts} showRevenue={data.revenueVisible} />
        </div>
      )}
    </Card>
  );
}

function KpiCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 p-4">
      <p className="text-xs font-medium text-ink-400">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-ink-900">{value}</p>
      <p className="mt-0.5 text-xs text-ink-500">{hint}</p>
    </div>
  );
}

const CHART_HEIGHT_CLASSES = [
  "h-[5%]",
  "h-[10%]",
  "h-[15%]",
  "h-[20%]",
  "h-[25%]",
  "h-[30%]",
  "h-[35%]",
  "h-[40%]",
  "h-[45%]",
  "h-[50%]",
  "h-[55%]",
  "h-[60%]",
  "h-[65%]",
  "h-[70%]",
  "h-[75%]",
  "h-[80%]",
  "h-[85%]",
  "h-[90%]",
  "h-[95%]",
  "h-full",
] as const;

const DISTRIBUTION_WIDTH_CLASSES = [
  "w-[5%]",
  "w-[10%]",
  "w-[15%]",
  "w-[20%]",
  "w-[25%]",
  "w-[30%]",
  "w-[35%]",
  "w-[40%]",
  "w-[45%]",
  "w-[50%]",
  "w-[55%]",
  "w-[60%]",
  "w-[65%]",
  "w-[70%]",
  "w-[75%]",
  "w-[80%]",
  "w-[85%]",
  "w-[90%]",
  "w-[95%]",
  "w-full",
] as const;

function percentBucket(value: number, max: number): number {
  return Math.min(Math.max(Math.ceil((value / max) * 20), 1), 20) - 1;
}

function RevenueChart({
  points,
  interval,
  metric,
}: {
  points: AnalyticsRevenuePoint[];
  interval: AnalyticsInterval;
  /** `orders` plots `orderCount` when the backend omitted revenue for this role. */
  metric: "revenue" | "orders";
}) {
  const showRevenue = metric === "revenue";
  const valueOf = (point: AnalyticsRevenuePoint): number =>
    showRevenue ? (point.revenue ?? 0) : point.orderCount;
  const title = showRevenue ? "Revenue over time" : "Completed orders over time";
  const max = Math.max(...points.map(valueOf), 1);
  return (
    <div className="rounded-lg border border-line p-4">
      <p className="text-[13px] font-semibold text-ink-900">{title}</p>
      <p className="mt-0.5 text-xs text-ink-500">
        Per {interval === "day" ? "day" : "month"}, completed orders
      </p>
      {points.length === 0 ? (
        <p className="mt-6 text-sm text-ink-500">
          No completed orders in the selected window.
        </p>
      ) : (
        <>
          <div
            className="mt-4 flex h-36 items-end gap-px"
            role="img"
            aria-label={`${title} bar chart`}
          >
            {points.map((point) => (
              <div
                key={point.period}
                className={cn(
                  "flex-1 rounded-t-sm bg-brand-600/80 transition-colors hover:bg-brand-600",
                  CHART_HEIGHT_CLASSES[percentBucket(valueOf(point), max)],
                )}
                title={
                  showRevenue
                    ? `${point.period}: ${fmtVND(point.revenue ?? 0)} · ${point.orderCount} orders`
                    : `${point.period}: ${point.orderCount} orders`
                }
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] text-ink-400">
            <span>{points[0].period}</span>
            {points.length > 1 ? <span>{points[points.length - 1].period}</span> : null}
          </div>
        </>
      )}
    </div>
  );
}

function StatusDistribution({
  rows,
}: {
  rows: Array<{ status: string; label: string; barClass: string; count: number }>;
}) {
  const visible = rows.filter((row) => row.count > 0);
  const max = Math.max(...visible.map((row) => row.count), 1);
  return (
    <div className="rounded-lg border border-line p-4">
      <p className="text-[13px] font-semibold text-ink-900">Order status distribution</p>
      <p className="mt-0.5 text-xs text-ink-500">All orders in the window</p>
      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-ink-500">No orders in the selected window.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {visible.map((row) => (
            <div key={row.status}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-ink-700">{row.label}</span>
                <span className="text-ink-400">{row.count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-2 rounded-full",
                    row.barClass,
                    DISTRIBUTION_WIDTH_CLASSES[percentBucket(row.count, max)],
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TopProducts({
  products,
  showRevenue,
}: {
  products: AnalyticsTopProduct[];
  showRevenue: boolean;
}) {
  return (
    <div className="rounded-lg border border-line">
      <div className="border-b border-line px-4 py-3">
        <p className="text-[13px] font-semibold text-ink-900">Top products</p>
        {/*
          The backend ranks this list with `ORDER BY quantitySold DESC` for every
          role (orders service `getAnalytics`), so the caption must not claim a
          revenue ranking when the money column happens to be visible — a row
          worth 238 VND legitimately outranks one worth 12.000 VND. Revenue is an
          extra column here, never the sort key.
        */}
        <p className="mt-0.5 text-xs text-ink-500">
          By quantity sold, completed orders
        </p>
      </div>
      {products.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-500">
          No product sales in the selected window.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-400">
              <th className="px-4 py-2 font-medium">Product</th>
              <th className="px-4 py-2 text-right font-medium">Qty sold</th>
              {showRevenue ? (
                <th className="px-4 py-2 text-right font-medium">Revenue</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {/*
              IDLEAK-02: `productId` is `null` for every product the backend
              cannot resolve, so it cannot key the row on its own — two deleted
              products would collide. The list is a fixed ranking with no
              reorder or insert, so the index is a safe fallback.
            */}
            {products.map((product, index) => (
              <tr key={product.productId ?? `unresolved-${index}`}>
                <td className="max-w-0 truncate px-4 py-2.5 font-medium text-ink-900">
                  {product.name}
                </td>
                <td className="px-4 py-2.5 text-right text-ink-700">
                  {product.quantitySold}
                </td>
                {showRevenue ? (
                  <td className="px-4 py-2.5 text-right text-ink-700">
                    {/* GHN-RBAC-01: an absent figure is a dash, never a zero. */}
                    {product.revenue === null ? "—" : fmtVND(product.revenue)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

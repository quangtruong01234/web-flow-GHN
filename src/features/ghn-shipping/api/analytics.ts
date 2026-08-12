// Shipping analytics endpoint (`GET /api/order/admin/analytics`). Global scope
// (all sellers), gated by `shipping read:any` — the same gate as the shipment
// list, so read-only `logistics_operator` CAN read it. Do not gate the
// dashboard charts behind `shipping_manager`.
//
// Contract notes (backend handoff 2026-07-01): `revenueOverTime` and
// `summary.totalRevenue`/`completedOrders`/`averageOrderValue` count COMPLETED
// orders only; `statusDistribution` + `summary.totalOrders` count ALL orders in
// the window. `revenue` is goods GMV in integer VND, excluding shipping fee and
// voucher discount. `period` is `YYYY-MM-DD` (interval=day) or `YYYY-MM`
// (interval=month), ascending.
//
// GHN-RBAC-01 (backend handoff 2026-08-12): a role without `order read:any` and
// without `shipping update:any` — i.e. `logistics_operator` — still gets 200,
// but the four monetary fields are ABSENT (not zero): `summary.totalRevenue`,
// `summary.averageOrderValue`, `revenueOverTime[].revenue`,
// `topProducts[].revenue`. The view model turns them into `null` and exposes
// `revenueVisible` so the UI hides the money blocks and plots volume instead.
// Branch on the field, never on the role.

import { request } from "@/lib/api";

export type AnalyticsInterval = "day" | "month";

/** Query params for the analytics endpoint. All optional (backend defaults: last 30 days, day, top 5). */
export interface AnalyticsParams {
  /** ISO date (YYYY-MM-DD); backend snaps to start-of-day. */
  from?: string;
  /** ISO date (YYYY-MM-DD); backend snaps to end-of-day, inclusive. */
  to?: string;
  interval?: AnalyticsInterval;
  /** 1..50 */
  topN?: number;
}

/** Backend order-status keys of `statusDistribution` (all orders in window). */
export const ANALYTICS_STATUS_KEYS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivering",
  "completed",
  "canceled",
  "return_requested",
  "refunded",
] as const;

export type AnalyticsStatusKey = (typeof ANALYTICS_STATUS_KEYS)[number];

// ---------------------------------------------------------------------------
// Backend payload (inner `data` shape)
// ---------------------------------------------------------------------------

export interface BackendAnalyticsResponse {
  scope: "global";
  from: string;
  to: string;
  interval: AnalyticsInterval;
  summary: {
    /** Absent for roles without revenue visibility (GHN-RBAC-01). */
    totalRevenue?: number;
    completedOrders: number;
    totalOrders: number;
    /** Absent for roles without revenue visibility (GHN-RBAC-01). */
    averageOrderValue?: number;
  };
  revenueOverTime: Array<{
    period: string;
    /** Absent for roles without revenue visibility (GHN-RBAC-01). */
    revenue?: number;
    orderCount: number;
  }>;
  statusDistribution: Record<AnalyticsStatusKey, number>;
  topProducts: Array<{
    productId: number;
    productName: string;
    quantitySold: number;
    /** Absent for roles without revenue visibility (GHN-RBAC-01). */
    revenue?: number;
  }>;
}

// ---------------------------------------------------------------------------
// FE view model
// ---------------------------------------------------------------------------

export interface AnalyticsRevenuePoint {
  period: string;
  /** `null` when the backend omitted revenue for this role. */
  revenue: number | null;
  orderCount: number;
}

export interface AnalyticsStatusRow {
  status: AnalyticsStatusKey;
  label: string;
  barClass: string;
  count: number;
}

export interface AnalyticsTopProduct {
  productId: number;
  name: string;
  quantitySold: number;
  /** `null` when the backend omitted revenue for this role. */
  revenue: number | null;
}

export interface AnalyticsView {
  from: string;
  to: string;
  interval: AnalyticsInterval;
  summary: {
    /** `null` when the backend omitted revenue for this role. */
    totalRevenue: number | null;
    completedOrders: number;
    totalOrders: number;
    /** `null` when the backend omitted revenue for this role. */
    averageOrderValue: number | null;
  };
  /**
   * `false` when the backend omitted the monetary fields for this role — hide
   * the revenue KPIs/columns and plot order volume instead.
   */
  revenueVisible: boolean;
  revenueOverTime: AnalyticsRevenuePoint[];
  /** Ordered rows for every known status key (missing keys default to 0). */
  statusDistribution: AnalyticsStatusRow[];
  topProducts: AnalyticsTopProduct[];
}

/** Display meta per analytics status key (colors follow LOCAL_STATUS_META conventions). */
const ANALYTICS_STATUS_META: Record<
  AnalyticsStatusKey,
  { label: string; barClass: string }
> = {
  pending: { label: "Pending", barClass: "bg-slate-400" },
  confirmed: { label: "Confirmed", barClass: "bg-sky-500" },
  processing: { label: "Processing", barClass: "bg-amber-600" },
  shipped: { label: "Shipped", barClass: "bg-brand-600" },
  delivering: { label: "Delivering", barClass: "bg-blue-600" },
  completed: { label: "Completed", barClass: "bg-green-600" },
  canceled: { label: "Cancelled", barClass: "bg-slate-400" },
  return_requested: { label: "Return requested", barClass: "bg-orange-600" },
  refunded: { label: "Refunded", barClass: "bg-violet-600" },
};

export function toAnalyticsView(res: BackendAnalyticsResponse): AnalyticsView {
  return {
    from: res.from,
    to: res.to,
    interval: res.interval,
    summary: {
      totalRevenue: res.summary.totalRevenue ?? null,
      completedOrders: res.summary.completedOrders,
      totalOrders: res.summary.totalOrders,
      averageOrderValue: res.summary.averageOrderValue ?? null,
    },
    revenueVisible: res.summary.totalRevenue !== undefined,
    revenueOverTime: (res.revenueOverTime ?? []).map((point) => ({
      period: point.period,
      revenue: point.revenue ?? null,
      orderCount: point.orderCount,
    })),
    statusDistribution: ANALYTICS_STATUS_KEYS.map((status) => ({
      status,
      label: ANALYTICS_STATUS_META[status].label,
      barClass: ANALYTICS_STATUS_META[status].barClass,
      count: res.statusDistribution?.[status] ?? 0,
    })),
    topProducts: (res.topProducts ?? []).map((product) => ({
      productId: product.productId,
      name: product.productName,
      quantitySold: product.quantitySold,
      revenue: product.revenue ?? null,
    })),
  };
}

export const analyticsApi = {
  async get(
    params: AnalyticsParams = {},
    signal?: AbortSignal,
  ): Promise<AnalyticsView> {
    const res = await request<BackendAnalyticsResponse>(
      "/order/admin/analytics",
      {
        query: {
          from: params.from,
          to: params.to,
          interval: params.interval,
          topN: params.topN,
        },
        signal,
      },
    );
    return toAnalyticsView(res);
  },
};

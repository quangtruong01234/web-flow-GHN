// Backend (gateway) DTO types and FE-facing view types for the GHN admin
// endpoints. Contracts verified against the gateway source (read-only):
//   GET  /api/order/admin/ghn/orders
//   GET  /api/order/admin/ghn/orders/:id
//   GET  /api/order/admin/ghn/orders/:id/history
//   POST /api/order/admin/ghn/orders/:id/sync
//   POST /api/order/admin/ghn/orders/:id/cancel
//   POST /api/order/admin/ghn/orders/:id/return
//
// The gateway wraps every payload in the `{ data: T }` envelope unwrapped by
// `request<T>` in `@/lib/api`, so the types below describe the *inner* shape.
//
// IMPORTANT (product rule): GHN status is BACKEND-OWNED. These types carry GHN
// state the backend reported; the frontend never calls GHN and never fabricates a
// status. Status may still be advanced through the backend (sync / action /
// demo-status endpoint), which returns the new state here. See `.ai/context/domain.md`.

import type { GhnStatus, LocalStatus } from "../types";

// ---------------------------------------------------------------------------
// Backend payloads (exact gateway shapes)
// ---------------------------------------------------------------------------

/** Backend local order status enum (`OrderStatus`). Distinct from `LocalStatus`. */
export type BackendOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivering"
  | "completed"
  | "canceled";

/** Backend payment method enum. */
export type BackendPaymentMethod = "zalopay" | "vnpay" | "cod";

/** Buyer/seller summary the gateway joins onto list and detail responses. */
export interface BackendUserSummary {
  id: number;
  username: string;
  email: string;
  name: string | null;
  avatar?: string | null;
}

/** One row of `GET /admin/ghn/orders`. */
export interface BackendGhnListItem {
  orderId: number;
  userId: number;
  sellerId: number;
  orderStatus: BackendOrderStatus | null;
  ghnOrderCode: string | null;
  shippingFee: number | null;
  codAmount: number | null;
  paymentMethod: BackendPaymentMethod;
  lastGhnStatus: string | null;
  lastSyncedAt: string | null;
  updatedAt: string;
  availableActions: string[];
  buyer: BackendUserSummary | null;
  seller: BackendUserSummary | null;
}

/** Paginated envelope returned by the list endpoint (inner `data`). */
export interface BackendPaginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}

/** Single order item embedded in the detail response. */
export interface BackendOrderItem {
  id: number;
  orderId: number;
  productId: number;
  sellerId: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  /** TypeORM decimal — may arrive as a string. */
  price: number | string;
  weight: number | null;
  skuId: number | null;
  skuTierIdx: string | null;
  skuLabel: string | null;
}

/** GHN carrier detail (read-only; null when there is no GHN code). */
export interface BackendGhnDetail {
  orderCode: string;
  status: string | null;
  codAmount: number | null;
  totalFee: number | null;
  expectedDeliveryTime: string | null;
  leadtime: string | null;
  toName: string | null;
  toPhone: string | null;
  toAddress: string | null;
  fromName: string | null;
  fromPhone: string | null;
  raw: Record<string, unknown>;
}

/** Body of `GET /admin/ghn/orders/:id`. */
export interface BackendGhnDetailResponse {
  localOrder: {
    orderId: number;
    userId: number;
    sellerId: number;
    orderStatus: BackendOrderStatus | null;
    ghnOrderCode: string | null;
    shippingAddress: string;
    shippingFee: number | null;
    codAmount: number | null;
    paymentMethod: BackendPaymentMethod;
    total: number;
    items: BackendOrderItem[];
    createdAt: string;
    updatedAt: string;
  };
  ghnDetail: BackendGhnDetail | null;
  ghnDetailError: string | null;
  lastGhnStatus: string | null;
  lastSyncedAt: string | null;
  availableActions: string[];
  buyer: BackendUserSummary | null;
  seller: BackendUserSummary | null;
}

/** One row of `GET /admin/ghn/orders/:id/history`. */
export interface BackendShippingHistory {
  id: number;
  orderId: number;
  type: "webhook" | "manual_sync" | "action";
  actorId: number | null;
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  ghnStatus: string | null;
  success: boolean;
  message: string | null;
  payloadSummary: Record<string, string | number | boolean | null> | null;
  createdAt: string;
}

/** Body of `POST /admin/ghn/orders/:id/sync`. */
export interface BackendSyncResult {
  orderId: number;
  previousStatus: BackendOrderStatus | null;
  newStatus: BackendOrderStatus | null;
  ghnStatus: string;
  syncedAt: string;
}

export type ShipmentManualAction = "cancel" | "return";

/** Body of `POST /admin/ghn/orders/:id/{cancel|return}`. */
export interface BackendActionResult {
  orderId: number;
  action: ShipmentManualAction;
  ghnOrderCode: string;
  previousStatus: BackendOrderStatus | null;
  newStatus: BackendOrderStatus | null;
  success: boolean;
  message: string | null;
  actionedAt: string;
}

/** Request body of `POST /admin/ghn/orders/:id/update-cod`. */
export interface UpdateCodInput {
  /** Integer ≥ 0; `0` clears COD. */
  codAmount: number;
}

/**
 * Request body of `POST /admin/ghn/orders/:id/demo-status` (DEMO ONLY). Drives
 * the GHN-side status for end-to-end demos on a sandbox order GHN never
 * advances. The backend simulates the carrier (no real GHN call), maps the
 * status through the same path as a real sync, and returns the sync shape
 * (`BackendSyncResult` → `ShipmentSyncView`). Gated behind the backend env flag
 * `GHN_DEMO_ENDPOINTS_ENABLED`; disabled → `403`. See `.ai/context/domain.md`:
 * this is the sanctioned "approved demo backend endpoint" path.
 */
export interface SetDemoStatusInput {
  ghnStatus: GhnStatus;
}

/**
 * Request body of `POST /admin/ghn/orders/:id/update-receiver`. At least one
 * field must be present (backend rejects an all-empty body with `400`). Only the
 * name/phone/street head is editable — ward/district/province are fixed for an
 * existing waybill.
 */
export interface UpdateReceiverInput {
  toName?: string;
  toPhone?: string;
  toAddress?: string;
}

/** Body of `POST /admin/ghn/orders/:id/update-cod` (success → `201`). */
export interface BackendUpdateCodResult {
  orderId: number;
  action: "update_cod";
  ghnOrderCode: string;
  previousCodAmount: number;
  newCodAmount: number;
  success: boolean;
  message: string | null;
  actionedAt: string;
}

/** Body of `POST /admin/ghn/orders/:id/update-receiver` (success → `201`). */
export interface BackendUpdateReceiverResult {
  orderId: number;
  action: "update_receiver";
  ghnOrderCode: string;
  /** Pipe-delimited `name|phone|addr|ward|district|province` after the edit. */
  shippingAddress: string;
  updatedFields: string[];
  success: boolean;
  message: string | null;
  actionedAt: string;
}

// ---------------------------------------------------------------------------
// Request params
// ---------------------------------------------------------------------------

/** Query params accepted by the list endpoint. */
export interface ShipmentListParams {
  page?: number;
  limit?: number;
  /** Local order status filter (backend `OrderStatus` value). */
  status?: BackendOrderStatus;
  /** Raw GHN status filter. */
  ghnStatus?: string;
  hasGhnCode?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ---------------------------------------------------------------------------
// FE-facing view models (adapted from the backend shapes)
// ---------------------------------------------------------------------------

/** A list row after adaptation, ready for the table. */
export interface ShipmentListItem {
  orderId: number;
  ghnOrderCode: string | null;
  buyerName: string;
  sellerName: string;
  localStatus: LocalStatus;
  /** Mapped GHN status, or null when unknown / no GHN code. */
  ghnStatus: GhnStatus | null;
  /** Original GHN status string, for display when unmapped. */
  rawGhnStatus: string | null;
  codAmount: number | null;
  shippingFee: number | null;
  paymentMethod: BackendPaymentMethod;
  lastSyncedAt: string | null;
  updatedAt: string;
  /** True when the order has a GHN code and may be synced. */
  canSync: boolean;
  availableActions: string[];
}

export interface ShipmentListView {
  items: ShipmentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
}

/** Parsed receiver, best-effort from GHN detail + shipping address. */
export interface ShipmentReceiverView {
  name: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  province: string;
}

export interface ShipmentDetailItemView {
  id: number;
  name: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  skuLabel: string | null;
}

export interface ShipmentDetailView {
  orderId: number;
  ghnOrderCode: string | null;
  localStatus: LocalStatus;
  ghnStatus: GhnStatus | null;
  rawGhnStatus: string | null;
  buyerName: string;
  buyerEmail: string | null;
  sellerName: string;
  receiver: ShipmentReceiverView;
  paymentMethod: BackendPaymentMethod;
  codAmount: number;
  shippingFee: number;
  total: number;
  items: ShipmentDetailItemView[];
  productSummary: string;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;
  /** GHN carrier detail, present only when GHN returned it. */
  ghn: {
    expected: string | null;
    leadtime: string | null;
    totalFee: number | null;
    fromName: string | null;
    fromPhone: string | null;
  } | null;
  /** Error string when the GHN detail fetch failed (code present but call failed). */
  ghnDetailError: string | null;
  canSync: boolean;
  availableActions: string[];
}

/** A history timeline row after adaptation. */
export interface ShipmentHistoryRow {
  id: number;
  type: BackendShippingHistory["type"];
  action: string;
  previousStatus: string | null;
  newStatus: string | null;
  ghnStatus: string | null;
  success: boolean;
  message: string | null;
  actorId: number | null;
  createdAt: string;
}

export interface ShipmentSyncView {
  orderId: number;
  previousStatus: LocalStatus;
  newStatus: LocalStatus;
  ghnStatus: string;
  syncedAt: string;
}

export interface ShipmentActionView {
  orderId: number;
  action: ShipmentManualAction;
  ghnOrderCode: string;
  previousStatus: LocalStatus;
  newStatus: LocalStatus;
  success: boolean;
  message: string | null;
  actionedAt: string;
}

export interface ShipmentCodUpdateView {
  orderId: number;
  ghnOrderCode: string;
  previousCodAmount: number;
  newCodAmount: number;
  success: boolean;
  message: string | null;
  actionedAt: string;
}

export interface ShipmentReceiverUpdateView {
  orderId: number;
  ghnOrderCode: string;
  shippingAddress: string;
  updatedFields: string[];
  success: boolean;
  message: string | null;
  actionedAt: string;
}

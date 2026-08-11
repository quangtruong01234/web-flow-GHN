// Typed test fixture factories shared by Jest unit tests (src/**/*.test.*) and
// Playwright specs (e2e/*.spec.ts). Each builder returns the canonical order
// #101 / "GHN101" fixture and merges shallow overrides, so tests state only
// what they care about. Type-only imports keep this module free of runtime app
// code (Playwright imports it outside the Next.js/Jest module setup).
//
// Test-only module: never import it from application code.

import type { AuthUser } from "@/context/AuthContext";
import type { BackendMeUser, BackendRoleName } from "@/lib/auth-api";
import type {
  BackendActionResult,
  BackendGhnDetail,
  BackendGhnDetailResponse,
  BackendGhnListItem,
  BackendOrderItem,
  BackendPaginated,
  BackendShippingHistory,
  BackendSyncResult,
  BackendUpdateCodResult,
  BackendUpdateReceiverResult,
  BackendUserSummary,
  ShipmentDetailView,
  ShipmentHistoryRow,
  ShipmentListItem,
  ShipmentListView,
  ShipmentSyncView,
} from "../api/types";

export const ORDER_PUBLIC_ID = "ord_AbCdEf1234567890";
export const BUYER_PUBLIC_ID = "usr_0000000000000007";
export const SELLER_PUBLIC_ID = "usr_0000000000000009";
export const PRODUCT_PUBLIC_ID = "prod_0000000000000011";

// ---------------------------------------------------------------------------
// Auth users
// ---------------------------------------------------------------------------

const AUTH_USER_DEFAULTS: Record<
  "shipping_manager" | "logistics_operator",
  AuthUser
> = {
  shipping_manager: {
    id: "usr_0000000000000002",
    username: "shipmgr_test",
    name: "Shipping Manager",
    email: "shipmgr@example.com",
    role: "shipping_manager",
    title: "Shipping Manager",
  },
  logistics_operator: {
    id: "usr_0000000000000003",
    username: "logistics_test",
    name: "Logistics Operator",
    email: "logistics@example.com",
    role: "logistics_operator",
    title: "Logistics Operator",
  },
};

/** FE-side `AuthUser` (what `useAuth()` exposes) for the given console role. */
export function authUser(
  role: "shipping_manager" | "logistics_operator" = "shipping_manager",
  overrides: Partial<AuthUser> = {},
): AuthUser {
  return { ...AUTH_USER_DEFAULTS[role], ...overrides };
}

/** Backend `/me` / login user payload with the role object eager-loaded. */
export function backendMeUser(
  role: BackendRoleName = "shipping_manager",
  overrides: Partial<BackendMeUser> = {},
): BackendMeUser {
  const base = AUTH_USER_DEFAULTS[
    role === "logistics_operator" ? "logistics_operator" : "shipping_manager"
  ];
  return {
    id: base.id,
    username: role === "shipping_manager" || role === "logistics_operator"
      ? base.username
      : role,
    email: base.email,
    name: base.name,
    avatar: null,
    isActive: true,
    role: {
      id: role === "logistics_operator" ? 3 : 2,
      name: role,
      slug: role,
    },
    createdAt: "2026-06-27T00:00:00.000Z",
    updatedAt: "2026-06-27T00:00:00.000Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Backend gateway shapes (order #101 / GHN101)
// ---------------------------------------------------------------------------

export function backendBuyer(
  overrides: Partial<BackendUserSummary> = {},
): BackendUserSummary {
  return {
    id: BUYER_PUBLIC_ID,
    username: "buyer1",
    email: "buyer@example.com",
    name: "Buyer One",
    ...overrides,
  };
}

export function backendSeller(
  overrides: Partial<BackendUserSummary> = {},
): BackendUserSummary {
  return {
    id: SELLER_PUBLIC_ID,
    username: "seller1",
    email: "seller@example.com",
    name: "Seller One",
    ...overrides,
  };
}

export function backendOrderItem(
  overrides: Partial<BackendOrderItem> = {},
): BackendOrderItem {
  return {
    id: 1,
    productId: PRODUCT_PUBLIC_ID,
    sellerId: SELLER_PUBLIC_ID,
    productName: "Coffee Beans",
    productImage: null,
    quantity: 2,
    price: 125000,
    weight: null,
    skuId: null,
    skuTierIdx: null,
    skuLabel: "500g",
    ...overrides,
  };
}

export function backendGhnDetail(
  overrides: Partial<BackendGhnDetail> = {},
): BackendGhnDetail {
  return {
    orderCode: "GHN101",
    status: "delivering",
    codAmount: 250000,
    totalFee: 30000,
    expectedDeliveryTime: "2026-06-28T09:00:00.000Z",
    leadtime: "2026-06-28T10:00:00.000Z",
    toName: "Receiver One",
    toPhone: "0900000000",
    toAddress: "12 Nguyen Trai",
    fromName: "TryBuy Warehouse",
    fromPhone: "0900111222",
    raw: {},
    ...overrides,
  };
}

export function backendLocalOrder(
  overrides: Partial<BackendGhnDetailResponse["localOrder"]> = {},
): BackendGhnDetailResponse["localOrder"] {
  return {
    orderId: ORDER_PUBLIC_ID,
    userId: BUYER_PUBLIC_ID,
    sellerId: SELLER_PUBLIC_ID,
    orderStatus: "delivering",
    ghnOrderCode: "GHN101",
    shippingAddress:
      "Receiver One|0900000000|12 Nguyen Trai|Ward 1|District 1|HCMC",
    shippingFee: 30000,
    codAmount: 250000,
    paymentMethod: "cod",
    total: 280000,
    items: [backendOrderItem()],
    createdAt: "2026-06-27T08:00:00.000Z",
    updatedAt: "2026-06-27T09:00:00.000Z",
    ...overrides,
  };
}

export function backendDetailResponse(
  overrides: Partial<BackendGhnDetailResponse> = {},
): BackendGhnDetailResponse {
  return {
    localOrder: backendLocalOrder(),
    ghnDetail: backendGhnDetail(),
    ghnDetailError: null,
    lastGhnStatus: "delivering",
    lastSyncedAt: "2026-06-27T09:30:00.000Z",
    availableActions: ["sync", "cancel", "return", "update_cod", "update_receiver"],
    buyer: backendBuyer(),
    seller: backendSeller(),
    ...overrides,
  };
}

export function backendListItem(
  overrides: Partial<BackendGhnListItem> = {},
): BackendGhnListItem {
  return {
    orderId: ORDER_PUBLIC_ID,
    userId: BUYER_PUBLIC_ID,
    sellerId: SELLER_PUBLIC_ID,
    orderStatus: "delivering",
    ghnOrderCode: "GHN101",
    shippingFee: 30000,
    codAmount: 250000,
    paymentMethod: "cod",
    lastGhnStatus: "delivering",
    lastSyncedAt: "2026-06-27T09:30:00.000Z",
    updatedAt: "2026-06-27T09:00:00.000Z",
    availableActions: ["sync", "cancel", "return", "update_cod", "update_receiver"],
    buyer: backendBuyer(),
    seller: backendSeller(),
    ...overrides,
  };
}

export function backendPaginatedList(
  overrides: Partial<BackendPaginated<BackendGhnListItem>> = {},
): BackendPaginated<BackendGhnListItem> {
  return {
    data: [backendListItem()],
    total: 1,
    page: 1,
    limit: 50,
    totalPages: 1,
    hasNext: false,
    ...overrides,
  };
}

export function backendHistoryRow(
  overrides: Partial<BackendShippingHistory> = {},
): BackendShippingHistory {
  return {
    id: "1",
    orderId: ORDER_PUBLIC_ID,
    type: "manual_sync",
    actorId: 2,
    action: "sync",
    previousStatus: "shipped",
    newStatus: "delivering",
    ghnStatus: "delivering",
    success: true,
    message: "Synced from GHN",
    payloadSummary: null,
    createdAt: "2026-06-27T09:30:00.000Z",
    ...overrides,
  };
}

export function backendSyncResult(
  overrides: Partial<BackendSyncResult> = {},
): BackendSyncResult {
  return {
    orderId: ORDER_PUBLIC_ID,
    previousStatus: "delivering",
    newStatus: "delivering",
    ghnStatus: "delivering",
    syncedAt: "2026-06-27T10:00:00.000Z",
    ...overrides,
  };
}

export function backendActionResult(
  overrides: Partial<BackendActionResult> = {},
): BackendActionResult {
  return {
    orderId: ORDER_PUBLIC_ID,
    action: "cancel",
    ghnOrderCode: "GHN101",
    previousStatus: "delivering",
    newStatus: "canceled",
    success: true,
    message: "Action recorded",
    actionedAt: "2026-06-27T10:01:00.000Z",
    ...overrides,
  };
}

export function backendCodUpdateResult(
  overrides: Partial<BackendUpdateCodResult> = {},
): BackendUpdateCodResult {
  return {
    orderId: ORDER_PUBLIC_ID,
    action: "update_cod",
    ghnOrderCode: "GHN101",
    previousCodAmount: 250000,
    newCodAmount: 0,
    success: true,
    message: "COD updated",
    actionedAt: "2026-06-27T10:01:00.000Z",
    ...overrides,
  };
}

export function backendReceiverUpdateResult(
  overrides: Partial<BackendUpdateReceiverResult> = {},
): BackendUpdateReceiverResult {
  return {
    orderId: ORDER_PUBLIC_ID,
    action: "update_receiver",
    ghnOrderCode: "GHN101",
    shippingAddress:
      "Receiver Two|0900000000|12 Nguyen Trai|Ward 1|District 1|HCMC",
    updatedFields: ["toName"],
    success: true,
    message: "Receiver updated",
    actionedAt: "2026-06-27T10:02:00.000Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// FE view models (post-adapter shapes)
// ---------------------------------------------------------------------------

export function shipmentListItem(
  overrides: Partial<ShipmentListItem> = {},
): ShipmentListItem {
  return {
    orderId: ORDER_PUBLIC_ID,
    ghnOrderCode: "GHN101",
    buyerName: "Buyer One",
    sellerName: "Seller One",
    localStatus: "shipping",
    ghnStatus: "delivering",
    rawGhnStatus: "delivering",
    codAmount: 250000,
    shippingFee: 30000,
    paymentMethod: "cod",
    lastSyncedAt: "2026-06-27T09:30:00.000Z",
    updatedAt: "2026-06-27T09:45:00.000Z",
    canSync: true,
    availableActions: ["read", "history", "sync"],
    ...overrides,
  };
}

export function shipmentListView(
  overrides: Partial<ShipmentListView> = {},
): ShipmentListView {
  return {
    items: [shipmentListItem()],
    total: 1,
    page: 1,
    limit: 50,
    totalPages: 1,
    hasNext: false,
    ...overrides,
  };
}

export function shipmentDetailView(
  overrides: Partial<ShipmentDetailView> = {},
): ShipmentDetailView {
  return {
    orderId: ORDER_PUBLIC_ID,
    ghnOrderCode: "GHN101",
    localStatus: "shipping",
    ghnStatus: "delivering",
    rawGhnStatus: "delivering",
    buyerName: "Buyer One",
    buyerEmail: "buyer@example.com",
    sellerName: "Seller One",
    receiver: {
      name: "Receiver One",
      phone: "0900000000",
      address: "12 Nguyen Trai",
      ward: "Ward 1",
      district: "District 1",
      province: "HCMC",
    },
    paymentMethod: "cod",
    codAmount: 250000,
    shippingFee: 30000,
    total: 280000,
    items: [
      {
        id: 1,
        productId: PRODUCT_PUBLIC_ID,
        name: "Coffee Beans",
        image: null,
        quantity: 2,
        unitPrice: 125000,
        skuLabel: "500g",
      },
    ],
    productSummary: "Coffee Beans x2",
    createdAt: "2026-06-27T08:00:00.000Z",
    updatedAt: "2026-06-27T09:00:00.000Z",
    lastSyncedAt: "2026-06-27T09:30:00.000Z",
    ghn: {
      expected: "2026-06-28T09:00:00.000Z",
      leadtime: "2026-06-28T10:00:00.000Z",
      totalFee: 30000,
      fromName: "TryBuy Warehouse",
      fromPhone: "0900111222",
    },
    ghnDetailError: null,
    canSync: true,
    availableActions: ["sync", "cancel", "return"],
    ...overrides,
  };
}

export function shipmentHistoryRow(
  overrides: Partial<ShipmentHistoryRow> = {},
): ShipmentHistoryRow {
  return {
    id: "1",
    type: "manual_sync",
    action: "sync",
    previousStatus: "processing",
    newStatus: "delivering",
    ghnStatus: "delivering",
    success: true,
    message: "Synced from GHN",
    actorId: 7,
    createdAt: "2026-06-27T09:30:00.000Z",
    ...overrides,
  };
}

export function shipmentSyncView(
  overrides: Partial<ShipmentSyncView> = {},
): ShipmentSyncView {
  return {
    orderId: ORDER_PUBLIC_ID,
    previousStatus: "shipping",
    newStatus: "shipping",
    ghnStatus: "delivering",
    syncedAt: "2026-06-27T10:00:00.000Z",
    ...overrides,
  };
}

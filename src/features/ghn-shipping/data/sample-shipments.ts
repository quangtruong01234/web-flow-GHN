// Static sample data for the public, read-only `/demo` screen.
//
// Why this exists: the gateway runs on a cost-capped schedule, so outside that
// window every console screen is an error state and a reviewer sees nothing.
// `/demo` renders the same components against these rows instead.
//
// Three rules keep this clear of the backend-owned-status rule in
// `.ai/context/domain.md`:
//
//  1. It never enters the React Query cache and no hook reads it, so a real
//     screen can never show a fabricated status.
//  2. `/demo` disables every action; nothing here can be synced or actioned.
//  3. The screen labels itself as sample data, so the numbers are never read as
//     a live queue.
//
// This is NOT the test fixture module (`../testing/fixtures.ts`), which is
// test-only and must not be imported from application code. Keep them separate:
// changing a fixture to make a demo look better would silently rewrite test
// expectations.

import type { ShipmentHistoryRow, ShipmentListItem } from "../api/types";

/** Frozen so the screen reads the same on every visit, regardless of the date. */
const SAMPLE_DAY = "2026-09-18";

function at(time: string): string {
  return `${SAMPLE_DAY}T${time}+07:00`;
}

/**
 * A deliberately mixed page: one order in each interesting state, including the
 * `delivery_fail` case that keeps its local status (GHN-FAIL-01) and an order
 * with no GHN code at all.
 */
export const SAMPLE_SHIPMENTS: ShipmentListItem[] = [
  {
    orderId: "ord_8fc41d2a",
    ghnOrderCode: "GHN5A9KQ2H",
    buyerName: "Trần Minh Anh",
    sellerName: "Hanoi Craft Studio",
    localStatus: "shipping",
    ghnStatus: "delivering",
    rawGhnStatus: "delivering",
    codAmount: 480000,
    shippingFee: 32000,
    paymentMethod: "cod",
    lastSyncedAt: at("11:42:00"),
    updatedAt: at("11:42:00"),
    canSync: true,
    availableActions: ["sync", "cancel", "update_cod", "update_receiver"],
  },
  {
    orderId: "ord_2b70e915",
    ghnOrderCode: "GHN7TP3LMX",
    buyerName: "Nguyễn Thu Hà",
    sellerName: "Saigon Leather Co.",
    localStatus: "shipping",
    // GHN reports the failed attempt; the local status deliberately stays
    // `shipping` because GHN retries before moving to the return family.
    ghnStatus: "delivery_fail",
    rawGhnStatus: "delivery_fail",
    codAmount: 1250000,
    shippingFee: 45000,
    paymentMethod: "cod",
    lastSyncedAt: at("10:05:00"),
    updatedAt: at("10:05:00"),
    canSync: true,
    availableActions: ["sync", "return", "update_receiver"],
  },
  {
    orderId: "ord_c1904f68",
    ghnOrderCode: "GHN2KD8WQR",
    buyerName: "Lê Quốc Bảo",
    sellerName: "Da Nang Ceramics",
    localStatus: "completed",
    ghnStatus: "delivered",
    rawGhnStatus: "delivered",
    codAmount: 0,
    shippingFee: 28000,
    paymentMethod: "zalopay",
    lastSyncedAt: at("09:20:00"),
    updatedAt: at("09:20:00"),
    canSync: true,
    availableActions: ["sync"],
  },
  {
    orderId: "ord_5da33c07",
    ghnOrderCode: "GHN9XV1JZB",
    buyerName: "Phạm Khánh Linh",
    sellerName: "Hue Tea House",
    localStatus: "confirmed",
    ghnStatus: "ready_to_pick",
    rawGhnStatus: "ready_to_pick",
    codAmount: 320000,
    shippingFee: 25000,
    paymentMethod: "cod",
    lastSyncedAt: at("08:15:00"),
    updatedAt: at("08:15:00"),
    canSync: true,
    availableActions: ["sync", "cancel", "update_cod", "update_receiver"],
  },
  {
    orderId: "ord_744a0e39",
    ghnOrderCode: "GHN4MB6YTC",
    buyerName: "Đỗ Hoàng Nam",
    sellerName: "Hanoi Craft Studio",
    localStatus: "refunding",
    ghnStatus: "waiting_to_return",
    rawGhnStatus: "waiting_to_return",
    codAmount: 690000,
    shippingFee: 38000,
    paymentMethod: "cod",
    lastSyncedAt: at("07:48:00"),
    updatedAt: at("07:48:00"),
    canSync: true,
    availableActions: ["sync"],
  },
  {
    orderId: "ord_0e5b82d4",
    // No waybill yet: nothing to sync, no carrier action available.
    ghnOrderCode: null,
    buyerName: "Vũ Thanh Tâm",
    sellerName: "Can Tho Spice Market",
    localStatus: "pending",
    ghnStatus: null,
    rawGhnStatus: null,
    codAmount: 155000,
    shippingFee: null,
    paymentMethod: "vnpay",
    lastSyncedAt: null,
    updatedAt: at("07:02:00"),
    canSync: false,
    availableActions: [],
  },
];

/**
 * Stated separately from `SAMPLE_SHIPMENTS.length` so the sample exercises the
 * truncated-window banner in `ShipmentStatCards` — the real dashboard counts
 * only the page it fetched, and the demo should show that honestly.
 */
export const SAMPLE_TOTAL = 34;

/** Shipping history per sample order, newest first, as the gateway returns it. */
export const SAMPLE_HISTORY: Record<string, ShipmentHistoryRow[]> = {
  ord_8fc41d2a: [
    {
      id: "9012",
      type: "manual_sync",
      action: "sync_status",
      previousStatus: "confirmed",
      newStatus: "shipping",
      ghnStatus: "delivering",
      success: true,
      message: "Status synced from GHN.",
      actorId: "usr_31c7a908",
      createdAt: at("11:42:00"),
    },
    {
      id: "9007",
      type: "webhook",
      action: "status_update",
      previousStatus: "confirmed",
      newStatus: "confirmed",
      ghnStatus: "picking",
      success: true,
      message: null,
      actorId: null,
      createdAt: at("09:31:00"),
    },
    {
      id: "8990",
      type: "action",
      action: "update_receiver",
      previousStatus: null,
      newStatus: null,
      ghnStatus: "ready_to_pick",
      success: true,
      message: "Updated toPhone, toAddress.",
      actorId: "usr_31c7a908",
      createdAt: at("08:04:00"),
    },
  ],
  ord_2b70e915: [
    {
      id: "8975",
      type: "manual_sync",
      action: "sync_status",
      previousStatus: "shipping",
      newStatus: "shipping",
      ghnStatus: "delivery_fail",
      success: true,
      // Mirrors the real wording for a GHN status with no local equivalent.
      message: "GHN status acknowledged; no local equivalent.",
      actorId: "usr_31c7a908",
      createdAt: at("10:05:00"),
    },
    {
      id: "8961",
      type: "webhook",
      action: "status_update",
      previousStatus: "confirmed",
      newStatus: "shipping",
      ghnStatus: "delivering",
      success: true,
      message: null,
      actorId: null,
      createdAt: at("08:52:00"),
    },
  ],
  ord_c1904f68: [
    {
      id: "8940",
      type: "webhook",
      action: "status_update",
      previousStatus: "shipping",
      newStatus: "completed",
      ghnStatus: "delivered",
      success: true,
      message: null,
      actorId: null,
      createdAt: at("09:20:00"),
    },
  ],
  ord_5da33c07: [
    {
      id: "8928",
      type: "action",
      action: "update_cod",
      previousStatus: null,
      newStatus: null,
      ghnStatus: "ready_to_pick",
      success: false,
      message: "GHN rejected the COD change: order already picked up.",
      actorId: "usr_9a40bd12",
      createdAt: at("08:15:00"),
    },
  ],
  ord_744a0e39: [
    {
      id: "8903",
      type: "action",
      action: "return",
      previousStatus: "shipping",
      newStatus: "refunding",
      ghnStatus: "waiting_to_return",
      success: true,
      message: "Return requested at the carrier.",
      actorId: "usr_9a40bd12",
      createdAt: at("07:48:00"),
    },
  ],
  ord_0e5b82d4: [],
};

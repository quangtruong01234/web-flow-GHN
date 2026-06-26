// Domain types for the GHN logistics console.
//
// IMPORTANT (product rule): GHN status is READ-ONLY in this UI. The frontend must
// never call GHN directly and must never present a manual `delivered`/`completed`
// mutation as real. User-visible order status should change later only after the
// backend receives a valid GHN webhook, GHN sync response, or an approved demo
// backend endpoint. Everything here is mock/demo data for Phase-1 UI only.

/** GHN-side shipment status (external system; read-only here). */
export type GhnStatus =
  | "ready_to_pick"
  | "picking"
  | "delivering"
  | "delivered"
  | "delivery_fail"
  | "waiting_to_return"
  | "returned"
  | "cancelled";

/** Local TryBuy order status (mapped from GHN status by the backend, later). */
export type LocalStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "completed"
  | "refunding"
  | "cancelled";

export type PaymentStatus = "paid" | "unpaid" | "refunded";

export interface Receiver {
  name: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  province: string;
}

export interface PaymentInfo {
  method: string;
  status: PaymentStatus;
}

export interface GhnDetail {
  expected: string;
  pickShift: string;
  weight: string;
  service: string;
  failReason: string;
  returnReason: string;
}

export type HistoryResult = "success" | "failed";
export type HistoryKind =
  | "create"
  | "ghn"
  | "webhook"
  | "sync"
  | "fail"
  | "return"
  | "cancel"
  | "cod"
  | "info"
  | "again";

export interface HistoryEvent {
  action: string;
  /** previous status */
  old: string;
  /** new status */
  nw: string;
  actor: string;
  time: string;
  result: HistoryResult;
  kind: HistoryKind;
}

export interface Shipment {
  orderId: string;
  ghnOrderCode: string;
  buyer: string;
  seller: string;
  product: string;
  localStatus: LocalStatus;
  ghnStatus: GhnStatus;
  codAmount: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string;
  receiver: Receiver;
  payment: PaymentInfo;
  ghn: GhnDetail;
  history: HistoryEvent[];
}

/** Mock action keys exposed by the shipment action panel/modals. */
export type ShipmentActionKey =
  | "sync"
  | "cancel"
  | "return"
  | "again"
  | "cod"
  | "info";

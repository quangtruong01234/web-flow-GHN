// Domain types for the GHN logistics console.
//
// IMPORTANT (product rule): GHN status is BACKEND-OWNED. The frontend must never
// call GHN directly (carrier secrets stay backend-only) and must never fabricate a
// status the backend did not return — but it MAY drive a status change through the
// backend, like a webhook. User-visible order status changes only after the backend
// records a valid GHN webhook, GHN sync response, supported GHN action, or the
// approved demo-status endpoint (the webhook stand-in for this no-shipper project).

/** GHN-side shipment status (external system; backend-owned, never fabricated client-side). */
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

# Domain - GHN Shipping Semantics

Source of truth for domain types: `src/features/ghn-shipping/types.ts`. Gateway response
view models live under `src/features/ghn-shipping/api/`.

## The one rule that overrides everything

**GHN status is backend-owned.** The frontend must never call GHN directly (carrier
token/secrets stay backend-only) and must never invent or fake a status the backend did not
return. It *may*, however, drive a status change **through the backend** — exactly like a
GHN webhook does. "Read-only" here means the client has no GHN side-channel and never
fabricates status locally; it does **not** mean the console cannot advance status.

User-visible order status changes only when the backend records one of these authoritative
events:

- a valid GHN webhook,
- a GHN sync response,
- a supported GHN action response,
- or the approved demo-status endpoint — a first-class status source. In this
  no-real-shipper, skill-building project it intentionally stands in for the GHN webhook,
  so the console can drive the full `picking → delivering → delivered` lifecycle.

Shipment list/detail/history, manual sync, cancel, return, update COD, update receiver
info, and demo-status are wired to the backend gateway. Delivery-again is intentionally not
available because GHN drives redelivery internally.

## Two status systems - keep them distinct

- `GhnStatus` - the external GHN-side shipment status; backend-owned (set by the carrier,
  or by the demo endpoint when simulating — the client never fabricates it):
  `ready_to_pick`, `picking`, `delivering`, `delivered`, `delivery_fail`,
  `waiting_to_return`, `returned`, `cancelled`.
- `LocalStatus` - TryBuy's own order status, mapped by the backend:
  `pending`, `confirmed`, `shipping`, `completed`, `refunding`, `cancelled`.

Do not collapse these into one field, and do not derive `LocalStatus` from `GhnStatus` on
the client as if it were authoritative.

## Core entities

- Gateway list/detail/history/sync/action view models live in
  `src/features/ghn-shipping/api/types.ts`.

## Helpers

- `features/ghn-shipping/lib/shipment-status.ts` - status labels/colors/grouping.
- `features/ghn-shipping/lib/shipment-formatters.ts` - display formatting.

Reuse these; do not re-implement status labels or money/date formatting inline.

## Money & COD

`codAmount`, `shippingFee`, and `total` are numbers. Format through shipment formatters for
display; never inline `toLocaleString`.

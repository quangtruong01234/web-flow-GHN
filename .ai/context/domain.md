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
  `pending`, `confirmed`, `shipping`, `completed`, `refunding`, `refunded`,
  `cancelled`. The backend `OrderStatus` enum has nine values; `return_requested` maps to
  `refunding` and `refunded` maps to `refunded`.

Do not collapse these into one field, and do not derive `LocalStatus` from `GhnStatus` on
the client as if it were authoritative.

**Some GHN statuses have no local status, by design (GHN-FAIL-01).** The backend keeps ten
of them — `delivery_fail`, `exception`, `damage`, `lost`, and the COD/`storing` legs among
them — deliberately unmapped: `delivery_fail` is a failed *attempt* that GHN retries before
moving to the return family, and canceling on the first miss would release stock for a parcel
still out for redelivery. The order simply keeps its current `LocalStatus`. This is not a gap
to fill in on the client. `exception` / `damage` / `lost` do need an operator, so they render
as a **red GHN pill** through `rawGhnMeta()` — colour only; they are not `GhnStatus` values.
Their history rows read "acknowledged; no local equivalent", but the older "Unhandled GHN
status" wording survives on rows written before 2026-08-16 — never string-match either.

## Sync is not a read-only action (GHN-FAIL-NTF-01)

Since 2026-09-11 the backend notifies the **buyer** the first time an order records a
`delivery_fail` (`type: "order_delivery_attempt_failed"`). Three paths trigger it and two of
them are console buttons: `POST .../sync` and `POST .../demo-status`. Nothing in either
response says whether a notification fired — it is best-effort and out of band — and the
dedupe is per order over the whole `shipping_history`, so a second press is silently correct,
not a lost message. Rows written before 2026-09-11 count, so an order that already failed
once will never fire retroactively; test on an order whose history is clean.

Two rules follow:

- **Never add bulk sync, auto-sync on mount, a `refetchInterval`, or any other loop over the
  sync endpoint.** Every syncable order that GHN has moved to `delivery_fail` would message
  its buyer the moment the loop ran. The console syncs one order per explicit click, and the
  `/sync` page and the detail action panel both say so next to the button.
- **"Demo" stops at GHN.** The demo endpoint simulates the *carrier call*, not the
  consequences — a demo `delivery_fail` writes a real status and sends a real notification.
  The demo picker warns when that target is selected.

If the console ever needs to show whether a buyer was notified, there is no field for it —
open a `backend-handoff.md` request rather than inferring it from history text.

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

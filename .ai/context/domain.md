# Domain — GHN Shipping Semantics

Source of truth for types: `src/features/ghn-shipping/types.ts`.

## The one rule that overrides everything

**GHN status is READ-ONLY in this UI.** The frontend must never call GHN directly and
must never present a manual `delivered` / `completed` mutation as real.

User-visible order status may change later **only** after the backend receives one of:
- a valid GHN **webhook**,
- a GHN **sync** response, or
- an approved **demo backend endpoint**.

Everything currently in the app is **mock/demo data for Phase-1 UI only**. Action buttons
(sync, cancel, return, again, cod, info) are UI affordances over mock data — they must not
be wired to pretend a real GHN state change happened.

## Two status systems — keep them distinct

- **`GhnStatus`** — the external GHN-side shipment status (read-only here):
  `ready_to_pick · picking · delivering · delivered · delivery_fail · waiting_to_return · returned · cancelled`
- **`LocalStatus`** — TryBuy's own order status, mapped from GHN by the backend (later):
  `pending · confirmed · shipping · completed · refunding · cancelled`

Do not collapse these into one field, and do not derive `LocalStatus` from `GhnStatus` on
the client as if it were authoritative — that mapping is the backend's job.

## Core entities

- `Shipment` — order + GHN code + buyer/seller + both statuses + COD/fee/total + timestamps + `receiver` + `payment` + `ghn` detail + `history[]`.
- `HistoryEvent` — `{ action, old, nw, actor, time, result, kind }`; `kind` ∈ create/ghn/webhook/sync/fail/return/cancel/cod/info/again.
- `ShipmentActionKey` — `sync | cancel | return | again | cod | info` (the action panel/modal keys).

## Helpers

- `features/ghn-shipping/lib/shipment-status.ts` — status labels/colors/grouping.
- `features/ghn-shipping/lib/shipment-formatters.ts` — display formatting.

Reuse these; don't re-implement status→label or money/date formatting inline.

## Money & COD

`codAmount`, `shippingFee`, `total` are numbers. Format via the shipment formatters for
display — never inline `toLocaleString`.

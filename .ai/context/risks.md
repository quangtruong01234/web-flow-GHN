# Known Risks & Gaps

Living list of current risks, gaps, and recently resolved items. Update this when a risk is
resolved or a new one appears.

> Also check `../.agent-local/frontend-handoff-ghn.md` (backend → GHN console inbox,
> machine-local at the `MCR/` root — never commit it): **Open** entries there are
> backend-shipped changes awaiting console integration and count as open backlog
> alongside this file.

Format per item: **Risk -> Impact -> Current status -> Suggested fix -> Owner/area.**

## 1. Mock auth stored in `sessionStorage` - RESOLVED (2026-06-28)

- **Risk:** Historical mock provider wrote demo identity state to `sessionStorage`.
- **Impact:** Resolved. The real session is an HttpOnly cookie and the browser stores no
  user identity, role hint, JWT, or session token.
- **Current status:** `AuthContext` uses `login` / `me` / `logout`; `/me` hydrates reloads.
- **Owner/area:** Frontend auth - done.

## 2. Login field mismatch - RESOLVED (2026-06-28)

- **Risk:** Historical mock login used email while the backend requires `username`.
- **Impact:** Resolved. `GhnLoginCard` collects username and `authApi.login` sends
  `{ username, password }`.
- **Current status:** Gateway auth is wired.
- **Owner/area:** Frontend auth - done.

## 3. `GET /api/user/me` did not return `role` - RESOLVED (2026-06-28)

- **Risk:** Historical `/me` response omitted role, so route guarding could not rehydrate
  correctly after reload.
- **Impact:** Resolved. Backend now returns role with the same shape as login.
- **Current status:** FE treats `/me` as authoritative and removed browser role caching.
- **Owner/area:** Backend + frontend auth - done.

## 4. Logistics roles did not exist in backend RBAC - RESOLVED (2026-06-28)

- **Risk:** Historical backend only had generic roles for shipping grants.
- **Impact:** Resolved. Backend has `logistics_operator` and `shipping_manager` roles and
  test accounts for this console.
- **Current status:** FE gates protected routes with `ALLOWED_ROLES`; carrier actions are
  gated by backend `availableActions` alone (see item 14).
- **Owner/area:** Backend RBAC + frontend auth - done.

## 5. `shipper` role must not be created

- **Risk:** Temptation to add a `shipper` role for GHN drivers.
- **Impact:** GHN shippers are external actors on GHN's own app; they never log into
  TryBuy.
- **Current status:** Explicitly excluded.
- **Suggested fix:** Use `logistics_operator` / `shipping_manager` only.
- **Owner/area:** Backend RBAC + frontend auth.

## 6. GHN -> local status mapping is incomplete

- **Risk:** Backend status mapping may not cover every GHN status used by the console/demo,
  such as `ready_to_pick`, `delivery_fail`, `waiting_to_return`, `returned`, `cancelled`.
- **Impact:** Buyer-visible local order status may not reflect all GHN states end-to-end.
- **Current status:** Known backend gap; not a frontend wiring blocker.
- **Suggested fix:** Extend backend `mapGhnStatus` to cover remaining GHN statuses.
- **Owner/area:** Backend orders service. See `.ai/context/domain.md`.

## 7. CORS / GHN app origin - RESOLVED (2026-06-28)

- **Risk:** Historical credentialed requests from `http://localhost:3013` could be blocked
  if the gateway CORS list omitted this app.
- **Impact:** Resolved for the current local flow. The app also defaults to same-origin
  `/api` rewrites, keeping cookies first-party during Next dev.
- **Current status:** Auth and GHN gateway calls are wired against the dev origin/proxy.
- **Owner/area:** Backend env / frontend dev proxy - done.

## 8. Port 3002 conflict

- **Risk:** `3002` is used by backend inventory services.
- **Impact:** Using 3002 for this app conflicts when the full backend runs.
- **Current status:** Avoided. This app runs on **3013**.
- **Suggested fix:** Keep dev port 3013. Never hardcode 3002; never kill a process to free a
  port.
- **Owner/area:** Frontend dev config.

## 9. Shipment list/detail/history/sync/action mock paths - RESOLVED (2026-06-28)

- **Risk:** Historical screens and action panels read mock data from `mockShipments` +
  `ShipmentContext`.
- **Impact:** Resolved for list/detail/history/manual sync/cancel/return.
- **Current status:** Those screens now use gateway endpoints through `shipmentsApi` +
  `useShipments` Query hooks. The legacy mock context, data, action panel, and modal were
  removed.
- **Owner/area:** Frontend shipment wiring - done.

## 10. Remaining GHN action endpoints beyond sync/cancel/return - RESOLVED (2026-06-30)

- **Risk:** Historical gateway routes did not expose update-COD/update-receiver actions or
  a demo-status endpoint for this app.
- **Impact:** Resolved. COD/receiver edits and demo-status now go through backend gateway
  mutations; no GHN direct call exists in the frontend.
- **Current status:** Cancel, return, update COD, update receiver info, and demo-status are
  wired. Delivery-again remains intentionally unavailable because GHN drives redelivery
  internally.
- **Owner/area:** Backend gateway + frontend actions - done.

## 11. `support.js` must never be imported

- **Risk:** `TryBuy Shipping Dashboard/support.js` is Claude Design preview runtime, not
  app source.
- **Impact:** Importing/executing it would pull non-application preview code into the app.
- **Current status:** Excluded by guidance; visual reference only.
- **Suggested fix:** Re-implement interactions as real React components; never import the
  `.dc.html` or `support.js`.
- **Owner/area:** Frontend.

## 12. Demo-status is environment-gated

- **Risk:** The frontend demo controls can be enabled while the backend
  `GHN_DEMO_ENDPOINTS_ENABLED` flag is off.
- **Impact:** Demo-status requests return `403` even for a valid `shipping_manager`.
- **Current status:** The frontend hides the control unless `NEXT_PUBLIC_GHN_DEMO_MODE=true`
  and surfaces backend disabled `403` as "demo mode not enabled" instead of redirecting to
  `/403`.
- **Suggested fix:** Keep frontend and backend demo flags paired in local/demo
  environments; leave both off in production.
- **Owner/area:** Frontend env + backend env.

## 13. GHN console exposed numeric database ids - RESOLVED (2026-07-17)

- **Risk:** GHN console auth and shipment contracts historically assumed numeric user,
  order, and product database keys.
- **Impact:** Resolved. URLs, query keys, gateway calls, mutations, response adapters, and
  test fixtures now preserve opaque `usr_...`, `ord_...`, and `prod_...` ids.
- **Current status:** Malformed shipment route ids are rejected locally; legacy deleted
  products remain supported through `productId: string | null` without erasing valid
  checkout-time product snapshots. Runtime-verified against the live gateway on
  2026-07-17 (list/detail/history as `logistics_test`): wire ids match the declared
  contracts. A backend gap surfaced (`GET /admin/ghn/orders/:id/history` leaked the
  numeric order PK in `orderId`), was recorded in `backend-handoff.md`, fixed by the
  backend the same day, and re-verified live: history rows now return the `ord_...`
  public id.
- **Suggested fix:** Keep public ids opaque and never parse, numerically sort, or compare
  them with internal database keys.
- **Owner/area:** Frontend auth + shipment contracts - done.

## 14. Client-side role checks duplicated backend action gating - RESOLVED (2026-08-12)

- **Risk:** The console gated carrier actions on `canSync(role)` *in addition to* the
  gateway's `availableActions` array, so a role the gateway had authorised still saw
  disabled buttons and read-only notices.
- **Impact:** Resolved. `availableActions` is now the single source of truth on
  `/shipments/:id` and `/sync`; the gateway already filters it by permission **and** by
  order state, so a second client-side check could only be wrong.
- **Current status:** No carrier action reads the role. `canSync()` survives only for the
  demo-status control, which has no `availableActions` entry. Runtime-verified on
  2026-08-12: `logistics_operator` receives `["read","history"]` and gets the read-only
  panel; `shipping_manager` receives exactly the actions the order's state allows and the
  panel renders exactly those.
- **Suggested fix:** When a new action appears, add it to the array mapping - never add a
  role branch beside it.
- **Owner/area:** Frontend shipment actions - done.

## 15. Analytics revenue must be hidden, not zeroed, for `logistics_operator` - RESOLVED (2026-08-12)

- **Risk:** `GET /api/order/admin/analytics` answers 200 for `logistics_operator` but
  **omits** `summary.totalRevenue`, `summary.averageOrderValue`,
  `revenueOverTime[].revenue`, and `topProducts[].revenue`. Coercing an absent field to `0`
  would render "earned nothing" as fact.
- **Impact:** Resolved. `toAnalyticsView` maps the absent fields to `null` and exposes
  `revenueVisible`; `AnalyticsPanel` hides the revenue KPIs, plots `orderCount` instead of
  `revenue`, and ranks top products by quantity sold.
- **Current status:** The branch is on the field, never on the role, so it stays correct if
  the backend moves the grant. Covered by `api/analytics.test.ts` and
  `components/AnalyticsPanel.test.tsx` (including a "never print a zero" assertion).
- **Suggested fix:** Any future money field follows the same rule - nullable in the view
  model, hidden when null.
- **Owner/area:** Frontend analytics - done.

## 16. GHN filter enums now 400 instead of an empty 200 - RESOLVED (2026-08-12)

- **Risk:** `?status=` / `?ghnStatus=` with a bogus **or empty** value is a `400` naming the
  accepted set. A cleared filter sent as an empty string breaks the list.
- **Impact:** Resolved. The query builder omits a cleared key, the GHN-status dropdown is
  generated from the 23 accepted values, and a `400` renders verbatim with no Retry button
  (the same request can never succeed).
- **Current status:** The two vocabularies are kept apart: GHN accepts both `cancel` and
  `cancelled`, while the local status is `canceled`. Each value goes to its own param with
  no normalisation.
- **Suggested fix:** Never map a console-local label onto either param; add new values to
  `GHN_STATUS_FILTER_VALUES` only after the backend accepts them.
- **Owner/area:** Frontend shipment list - done.

## 17. GHN failures split across 400 (refusal) and 503 (outage) - RESOLVED (2026-08-12)

- **Risk:** A GHN refusal is a `400` whose message is `"GHN <action> error: <reason>"` and
  retrying cannot help; an outage/timeout/open circuit is a `503` where retrying is the
  right advice. Collapsing both into one banner tells the operator the wrong thing.
- **Impact:** Resolved. `lib/mutation-errors.ts` branches on `statusCode` and surfaces the
  GHN reason verbatim; `400` gets "retrying will not help", `503` gets retry-later copy.
- **Current status:** A local-guard `400` (e.g. "action not allowed for status") keeps its
  own copy and is also shown verbatim. The envelope's `error` field still reads
  `"HttpException"` for microservice-propagated errors, so nothing branches on it.
- **Suggested fix:** Keep branching on `statusCode`; do not pattern-match `error`.
- **Owner/area:** Frontend mutation error states - done.

## 18. `ghnDetail.raw` is a backend allow-list

- **Risk:** `raw` passes through a backend allow-list (~43 keys). Anything outside it -
  `shop_id`, `client_id`, warehouse ids, IPs, `transaction_id` - is `undefined`, and GHN
  adds keys without notice.
- **Impact:** None today: the console reads no key out of `raw` (grep-verified 2026-08-12);
  every rendered scalar comes from `ghnDetail`'s top level.
- **Current status:** Documented on the `raw` field in `api/types.ts`.
- **Suggested fix:** Do not start reading `raw.<key>`. If a GHN field is genuinely needed,
  ask the backend to allow-list it rather than parsing a substitute.
- **Owner/area:** Frontend shipment detail.

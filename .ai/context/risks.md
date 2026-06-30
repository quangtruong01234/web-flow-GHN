# Known Risks & Gaps

Living list of current risks, gaps, and recently resolved items. Update this when a risk is
resolved or a new one appears.

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
- **Current status:** FE gates protected routes with `ALLOWED_ROLES`; sync is restricted by
  role and backend `availableActions`.
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

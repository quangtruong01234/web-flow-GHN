# End-to-End Flows

Auth, shipment list/detail/history, manual sync, cancel, return, update COD, update
receiver info, and demo-status are gateway-backed.

Cross-references: `.ai/context/auth.md`, `.ai/context/data-fetching.md`,
`.ai/context/domain.md`, `.ai/context/risks.md`.

## 1. Login / auth flow

- **Purpose:** Authenticate a logistics user and gate the app behind a valid session +
  allowed role.
- **Actors:** `logistics_operator`, `shipping_manager`.
- **Steps:**
  1. Unauthenticated user hits a protected route -> `AuthGate` redirects to
     `/login?next=<path>`.
  2. `LoginPage` / `GhnLoginCard` collects `username` + password.
  3. `useAuth().login(...)` calls `POST /api/user/login`; the gateway sets the HttpOnly
     cookie and returns the user.
  4. `AuthGate` waits for `ready`; no user -> `/login`; role outside `ALLOWED_ROLES` ->
     `/403`; allowed role -> render protected children.
  5. Reload hydration comes from `GET /api/user/me`, including role.
  6. Logout calls `POST /api/user/logout`, clears local auth state, and returns to `/login`.
- **Important files:** `src/context/AuthContext.tsx`,
  `src/features/ghn-shipping/components/{AuthGate,RootRedirect,LoginPage,GhnLoginCard,ForbiddenPage}.tsx`,
  `src/app/(app)/layout.tsx`, `src/app/page.tsx`, `src/app/login/page.tsx`,
  `src/app/403/page.tsx`.
- **Known gaps:** None for current FE auth wiring.

## 2. GHN shipping admin / console flow

- **Purpose:** Let a logistics user browse shipments and open a shipment's full detail.
- **Actors:** Authenticated logistics user.
- **Steps:**
  1. App shell (`GhnAdminShell` = `GhnSidebar` + `GhnTopbar`) wraps protected routes.
  2. `/dashboard` fetches gateway shipment data and renders stat cards + status distribution.
  3. `/shipments` fetches paginated gateway data with search/status filters; rows link to
     `/shipments/[orderId]`.
  4. `/shipments/[orderId]` fetches detail + history and renders receiver/payment/GHN
     detail, timeline, sync control, available carrier actions, waybill edits, and
     demo-status controls when demo mode is enabled.
  5. `/history` renders gateway-backed history/list data.
  6. `/settings` is a read-only webhook/settings view.
- **Important files:** `src/features/ghn-shipping/api/{shipments,adapters,types}.ts`,
  `src/features/ghn-shipping/hooks/useShipments.ts`,
  `src/features/ghn-shipping/components/{ShipmentDashboard,ShipmentStatCards,ShipmentTable,ShipmentDetail,ShipmentTimeline,ActionHistoryPage,GhnSettingsPage}.tsx`.
- **API dependencies:** `GET /api/order/admin/ghn/orders`,
  `GET /api/order/admin/ghn/orders/:id`,
  `GET /api/order/admin/ghn/orders/:id/history`.
- **Known gaps:** Demo-status is hidden unless `NEXT_PUBLIC_GHN_DEMO_MODE=true` and the
  backend has `GHN_DEMO_ENDPOINTS_ENABLED=true`.

## 3. Shipment sync / action flow

- **Purpose:** Sync GHN status and trigger backend-backed cancel/return actions, waybill
  edits, and demo status changes.
- **Actors:** Authenticated logistics user; `shipping_manager` may sync.
- **Steps:**
  1. Manual sync uses `useSyncShipment()` and calls
     `POST /api/order/admin/ghn/orders/:id/sync`.
  2. On success it invalidates affected detail/history/list Query keys.
  3. Sync visibility/availability is gated by role and backend `availableActions`.
  4. Cancel, return, update COD, and update receiver render only when backend
     `availableActions` includes the action and the user has the `shipping_manager` role.
  5. Cancel/return call `POST /api/order/admin/ghn/orders/:id/{cancel|return}`; waybill
     edits call `update-cod` / `update-receiver`; demo mode calls `demo-status`. Each
     mutation invalidates detail/history/list Query keys after success.
  6. A GHN rejection (`500`) is surfaced as "local order was not changed"; the backend still
     records the failed attempt in history.
  7. Sync `404` is shown as a non-retryable GHN waybill lookup failure; sync `503` is shown
     as a retryable GHN availability failure.
  8. Canonical status changes only through backend webhook, sync response, supported action
     response, or approved demo endpoint.
- **Important files:** `src/features/ghn-shipping/hooks/useShipments.ts`,
  `src/features/ghn-shipping/components/{ShipmentDetail,GhnSyncPage}.tsx`,
  `src/context/ToastContext.tsx`.
- **Known gaps:** delivery-again is not shop-callable and must not be built.

## 4. Role / operator flow

- **Purpose:** Restrict the console to allowed logistics roles.
- **Steps:** `AuthGate` checks `user.role` against `ALLOWED_ROLES`. A disallowed role goes
  to `/403`.
- **Sync rule:** `logistics_operator` is read-only for sync; `shipping_manager` can sync
  eligible shipments.
- **Known gaps:** None for current role gating; demo-status additionally requires the
  frontend and backend demo flags.

## 5. Error / empty / loading states

- **Loading:** auth uses `ready`; shipment screens use Query pending states.
- **Empty:** `EmptyState` is shown where a list/section has no data.
- **Error:** `ErrorState` presents fetch failures and retry actions.
- **Transient feedback:** `ToastHost` + `ToastContext` show sync/action feedback.
- **Routing:** 401 -> `/login`; 403 -> `/403`.

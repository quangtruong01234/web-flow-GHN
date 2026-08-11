# Data Fetching & API Boundary

## Boundary

- All backend access goes through the **TryBuy Gateway only**.
- The frontend must **never** call GHN directly.
- GHN API key/token, shop ID, webhook secret, and other carrier secrets are backend-only.
- Backend repo is reference-only unless the task explicitly says backend:
  `C:\Users\Quang Truong\Desktop\MCR\api`.

## Current state

Auth, GHN read screens, shipping history, manual sync, manual actions, waybill edits, and
demo status are wired through the gateway:

| Method + path                                  | Frontend use                              |
| ---------------------------------------------- | ----------------------------------------- |
| `POST /api/user/login`                         | `authApi.login`                           |
| `GET /api/user/me`                             | `authApi.me`, reload hydration            |
| `POST /api/user/logout`                        | `authApi.logout`                          |
| `GET /api/order/admin/ghn/orders`              | shipment list/dashboard/history overview  |
| `GET /api/order/admin/ghn/orders/:id`          | shipment detail                           |
| `GET /api/order/admin/ghn/orders/:id/history`  | shipment timeline/history                 |
| `POST /api/order/admin/ghn/orders/:id/sync`    | manual GHN sync                           |
| `POST /api/order/admin/ghn/orders/:id/cancel`  | manual GHN cancel                         |
| `POST /api/order/admin/ghn/orders/:id/return`  | manual GHN return                         |
| `POST /api/order/admin/ghn/orders/:id/update-cod` | update COD before transit              |
| `POST /api/order/admin/ghn/orders/:id/update-receiver` | update receiver name/phone/street |
| `POST /api/order/admin/ghn/orders/:id/demo-status` | demo-only status driver                |

The `admin` segment in GHN paths is the current gateway prefix, not the production frontend
role name.

Delivery-again is intentionally not available. Demo-status is environment-gated: frontend
UI is hidden unless `NEXT_PUBLIC_GHN_DEMO_MODE=true`; the backend route still returns
`403` when `GHN_DEMO_ENDPOINTS_ENABLED` is off.

## API client

`src/lib/api.ts` is the single place that calls `fetch`.

- Default base URL is same-origin `/api`, forwarded by `next.config.mjs` rewrites to the
  gateway so cookies stay first-party during local Next dev.
- `NEXT_PUBLIC_API_URL` can override the base URL with an absolute gateway URL when needed.
- Every request uses `credentials: "include"`.
- JSON request bodies set `Content-Type: application/json`.
- 204 / empty body returns `undefined`.
- 2xx success envelopes are unwrapped from `{ data: T }`.
- Non-OK responses throw `ApiError` with `status`, `message`, and optional backend
  `error` code.

## Auth contracts

`POST /api/user/login` request body:

```json
{ "username": "logistics_test", "password": "..." }
```

`POST /api/user/login` and `GET /api/user/me` return a user with a role object:

```json
{
  "id": "usr_AbCdEf1234567890",
  "username": "logistics_test",
  "email": "logistics@example.com",
  "name": "Logistics Test",
  "avatar": null,
  "isActive": true,
  "role": {
    "id": 4,
    "name": "logistics_operator",
    "slug": "logistics-operator-001"
  },
  "createdAt": "2026-06-27T00:00:00.000Z",
  "updatedAt": "2026-06-27T00:00:00.000Z"
}
```

`role` is reshaped by the gateway to exactly `{ id, name, slug }`; the raw `rol_*` columns
(and the `rol_grants` matrix that leaked with them) are gone. Role *names* are unchanged, so
`ALLOWED_ROLES` / `isAllowedRole` keep working — but read `role.name`, never `role.rol_name`,
which silently falls back to `"user"` and sends every operator to `/403`.

`/me` is authoritative for reload hydration. Do not cache a fallback role in browser
storage.

`POST /api/user/logout` response `data`:

```json
{ "message": "Logged out successfully" }
```

## TanStack Query v5

Server state must use TanStack Query, not `useState` + `useEffect` and not Context/Zustand.

- Query client is created by `src/lib/queryClient.ts` and mounted in `src/app/providers.tsx`.
- Query keys are centralized in `src/hooks/queryKeys.ts`.
- Shipment hooks live in `src/features/ghn-shipping/hooks/useShipments.ts`.
- Shipment API calls/adapters live in `src/features/ghn-shipping/api/`.
- Mutations use `isPending`, not `isLoading`.
- Invalidate related detail/history/list keys after sync, action, waybill edit, or
  demo-status mutation.

Gateway shipment detail/history/sync/action calls use the opaque `ord_` public id returned
by the list endpoint. Keep route params, query keys, API methods, and mutation variables
typed as `string`; never parse or numerically sort the id. The gateway accepts only
`^ord_[A-Za-z0-9]{16}$` on GHN order routes.

Auth users and GHN order buyer/seller references use opaque `usr_` public ids. Detail
items expose `productId: "prod_<16 alnum>" | null`; keep the nullable form for legacy
orders and use the value directly without numeric parsing. The nested order item no longer
exposes its numeric `orderId` foreign key.

## Error handling

- 401 means unauthenticated and should drive the user back to `/login`.
- 403 means authenticated but unauthorized and should drive the user to `/403`.
- Demo-status `403` with a disabled message means the environment has not enabled demo
  endpoints; show an inline/toast notice instead of treating it as role failure.
- Sync `404` from GHN detail means the waybill is not resolvable and should be surfaced as
  non-retryable. Sync `503` means GHN is temporarily unavailable and can be retried later.
- Shipment screens should expose loading/error/empty states from Query results.

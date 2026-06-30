# Auth, Session & Roles

## Model

- Session is an **HttpOnly cookie** issued by the backend gateway.
- All authenticated requests send `credentials: "include"` through `src/lib/api.ts`.
- The browser never sees or stores a raw token.
- Never put a real JWT/session token, user identity cache, or role hint in
  `localStorage` or `sessionStorage`.

## Current state

`src/context/AuthContext.tsx` is wired to the real gateway cookie flow:

- `POST /api/user/login` sets the HttpOnly cookie and returns the user.
- `GET /api/user/me` hydrates `user` on load and is authoritative on reload.
- `POST /api/user/logout` clears the cookie/session.
- `ready` is false while `/me` hydration is pending.
- No auth identity or role fallback is written to browser storage.

The login form uses **username**, not email.

## Roles

```ts
export const ALLOWED_ROLES = ["logistics_operator", "shipping_manager"];
```

- Target GHN console roles are `logistics_operator` and `shipping_manager`.
- The backend has shipping-role accounts for this console.
- `shipping_manager` may run manual sync. `logistics_operator` is read-only for sync.
- Generic `admin` may still appear in legacy gateway path prefixes or temporary
  compatibility checks, but it must not be treated as the production GHN role.
- Do **not** create a `shipper` role. GHN shippers are external actors using GHN's own app.

## Route guarding

- Protected pages live under the `src/app/(app)` route group.
- `src/app/(app)/layout.tsx` wraps children in `<AuthGate>`.
- Guard flow:
  - not authenticated -> redirect to `/login`;
  - authenticated but role not in `ALLOWED_ROLES` -> `/403`;
  - wait for `ready` before deciding.
- Read auth via `useAuth()` only. Do not read storage or call `/me` directly inside page
  components.

## Components

- `LoginPage` / `GhnLoginCard` - `/login`.
- `AuthGate` - protected-area gate.
- `ForbiddenPage` - `/403`.
- `RootRedirect` - sends an authenticated user from `/` to `/dashboard`.

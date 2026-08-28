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
- Carrier actions (sync, cancel, return, update COD, update receiver) are gated by the
  gateway's `availableActions` array, never by a client-side role check: the gateway
  already filters the array by permission **and** by order state (GHN-ACT-01). In
  practice `logistics_operator` gets `["read", "history"]`; `shipping_manager` gets the
  actions the order's state allows.
- The demo-status control is the one exception — it has no `availableActions` entry, so it
  keeps the `canSync()` role check in `@/context/AuthContext`.
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
- The redirect lives in an effect, so it never guards anything on its own: `AuthGate` holds
  the "Checking your session..." state for `!ready || !user || !isAllowedRole(user.role)`.
  A disallowed role is a non-null `user`, and without the third clause the shell paints —
  and its React Query hooks fetch — for the frame before `/403` lands (risks item 22).
- Read auth via `useAuth()` only. Do not read storage or call `/me` directly inside page
  components.

## Session expiry mid-session

`/me` runs once on mount, but the cookie is issued with a 5h `Max-Age`, so it usually
expires while the console is open. A gateway `401` is therefore the only signal:

- The query and mutation caches (`src/lib/queryClient.ts`) publish it through
  `src/lib/session-expiry.ts` — a small in-memory pub/sub, needed because `Providers`
  builds the query client *above* `AuthProvider`, so the caches cannot call `useAuth()`.
- `AuthProvider` subscribes and clears `user`; the existing `AuthGate` effect redirects to
  `/login?next=<path>`, which `GhnLoginCard` honours on success.
- Only `401` does this. A `403` is the gateway refusing this role or action — sending it to
  `/login` would loop the operator straight back in.
- Only the caches publish. `authApi.login`/`me` bypass React Query, so a wrong password can
  never be mistaken for an expiry.
- Nothing is persisted: the signal is in-memory, in line with the storage rule above.

## Components

- `LoginPage` / `GhnLoginCard` - `/login`.
- `AuthGate` - protected-area gate.
- `ForbiddenPage` - `/403`.
- `RootRedirect` - sends an authenticated user from `/` to `/dashboard`.

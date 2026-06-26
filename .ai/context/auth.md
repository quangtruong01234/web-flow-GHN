# Auth, Session & Roles

## Model

- Session is an **HttpOnly cookie** issued by the backend gateway. The browser never
  sees or stores the raw token.
- All authenticated requests send `credentials: "include"` (see `.ai/context/data-fetching.md`).
- **Never** put a real JWT/session token in `localStorage` or `sessionStorage`.

## Current state (Phase 1 — mock)

`src/context/AuthContext.tsx` is a **mock** provider:
- It stores a demo `AuthUser` in `sessionStorage` under `ghn.mock.auth` purely to survive reloads during UI development. This is mock UI state, **not** a real credential — acceptable only while there is no backend auth.
- Exposes `useAuth()` → `{ user, ready, login, logout }`.
- Mock user: **Trần Thị Mai**, role `logistics_operator`, title "Logistics Operator".

**Prompt 3 migration:** replace the mock with the real cookie flow:
- `POST /api/user/login` → sets the HttpOnly cookie, returns the user.
- `GET /api/user/me` → hydrates `user` on load (drive `ready` off this call).
- `POST /api/user/logout` → clears the cookie/session.
- After migration, stop writing user identity to `sessionStorage`.

## Roles

```ts
type MockRole = "logistics_operator" | "shipping_manager";
export const ALLOWED_ROLES = ["logistics_operator", "shipping_manager"];
```

- Target GHN roles are **`logistics_operator`** and **`shipping_manager`** only.
- Generic `admin` belongs to the **main TryBuy admin web** (users, shops, products, moderation, reports, system settings) — **do not** treat it as the long-term GHN role.
- Do **not** create a `shipper` role — GHN shippers are external actors using GHN's own system/app.

## Role gap (important, current)

The backend `logistics_operator` / `shipping_manager` roles + grants are **not implemented yet**.
Until they land:

- The UI mock uses `logistics_operator`.
- Real API testing may **temporarily** use an `admin` account, because only `admin` currently
  holds the shipping grants (the GHN endpoints live under an `admin` path prefix).
- Do **not** hardcode `admin` as the production GHN role anywhere in app code.
- Surface/document this gap when a task depends on the real roles existing.

Adding these roles + grants + a test account is step 2 of the task order in `.ai/project.md`.

## Route guarding

- Protected pages live under the `src/app/(app)` route group.
- `src/app/(app)/layout.tsx` wraps children in `<AuthGate>` (`features/ghn-shipping/components/AuthGate.tsx`).
- Guard flow:
  - Not authenticated → redirect to `/login`.
  - Authenticated but role not in `ALLOWED_ROLES` → `/403` (`ForbiddenPage`).
  - Wait for `ready` before deciding, to avoid a flash/redirect during hydration.
- Read auth via `useAuth()` only — never read storage or call `/me` directly inside a page component.

## Components

- `LoginPage` / `GhnLoginCard` — the `/login` screen.
- `AuthGate` — the protected-area gate.
- `ForbiddenPage` — `/403`.
- `RootRedirect` — sends an authenticated user from `/` to the dashboard.

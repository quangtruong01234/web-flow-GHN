# GHN Logistics Web — Next.js Admin Plan (Prompt 1: Context Handoff)

> **Status:** Planning only. No app scaffolded, no deps installed, no backend/frontend
> changed. This document is the single source of truth for Prompt 2 (UI) and Prompt 3 (login API).
>
> **Generated:** 2026-06-27
> **Target folder:** `C:\Users\Quang Truong\Desktop\MCR\web-flow-GHN`
> **Output of this prompt:** this file only.

---

## 0. TL;DR

- `web-flow-GHN` currently contains **only the Claude Design export** — there is **no Next.js app, no `package.json`**. The Next app must be **created later** (Prompt 2), not now.
- Design files **were found** and are usable as a **visual reference only**.
  `support.js` is generated preview runtime and **must never be imported** into the real app.
- Use dedicated logistics roles **`logistics_operator` / `shipping_manager`** — **not `admin`**, **not `shipper`**.
  These roles **do not exist in the backend yet** → documented backend gap (see §3).
- Backend already has a **rich GHN admin surface** (list / detail / history / sync) plus a **GHN webhook** and **GHN→local status mapping**. The GHN API key already lives backend-only.
- **Port 3002 is taken by Inventory** (`INVENTORY_TCP_PORT`, TCP + local HTTP). **Recommended dev port: `3013`** (fallback `5174`). Do not hardcode 3002.
- Order of work: **UI first (mock)** → **login API only** → **GHN/order APIs later**.

---

## 1. Current Folder Assessment

### `C:\Users\Quang Truong\Desktop\MCR\web-flow-GHN`
```
web-flow-GHN/
├─ TryBuy Shipping Dashboard/        ← Claude Design export (reference only)
└─ handoff/                          ← created by this prompt
   └─ ghn-next-admin-plan.md         ← this file
```
- **No `package.json`.**
- **Not a Next.js app** (no `next.config.*`, no `app/`, no `node_modules`).
- Contains **only the Claude Design export** + this new `handoff/` folder.

### `TryBuy Shipping Dashboard/` (the Claude Design export)
```
TryBuy Shipping Dashboard/
├─ GHN Shipping Control Panel.dc.html   (~107 KB)  ← main design file (visual reference)
├─ support.js                           (~56 KB)   ← preview runtime — DO NOT IMPORT
└─ .thumbnail                           (~1.4 KB)  ← preview thumbnail, ignore
```
- **Main design file:** `GHN Shipping Control Panel.dc.html`.
- **`support.js`** is Claude Design generated runtime/preview code. It is **not** application source. **Do not import or copy it into the Next app.** Re-implement interactions as real React/Next components.
- No `assets/` folder, no images bundled separately — design is self-contained in the `.dc.html`.
- **Design content observed** (drives the UI scope): a sidebar shell (`TryBuy Shipping Admin`), user identity `Trần Thị Mai` / `Logistics Operator`, `Sync GHN status` / `Synced` states, a status-distribution chart, a shipments table with tracking/COD/weight columns, a shipment detail with **timeline**, action controls (**Cancel**, **Replay/Sync**, **Update receiver info**, **Update COD amount**, **Return reason**), and a settings view with **Webhook URL / Webhook connection**. GHN status tokens present in the design: `ready_to_pick`, `picking`, `delivering`, `delivered`, `delivery_fail`, `waiting_to_return`, `returned`, `cancelled`.

**Conclusion:** the design export is a valid visual/reference source and can be converted into maintainable Next components in Prompt 2.

---

## 2. Existing Frontend Patterns — `C:\Users\Quang Truong\Desktop\MCR\frontend`

> The existing TryBuy web is **Vite + React 19**, *not* Next. The new GHN app is a **separate Next.js app**.
> Reuse the *conventions and helpers* below, but the runtime/router differs.

| Concern | Existing frontend (`trust-circle-ui`) | Reuse decision for Next GHN app |
|---|---|---|
| Build | Vite 7, `type: module` | New app = Next.js (separate). Don't copy Vite config. |
| Language | TypeScript (strict), React 19 | **Reuse** — TS + React 19. |
| Router | `react-router-dom` 7 (+ `@tanstack/react-router` also installed) in `src/router.tsx` | New app uses **Next App Router** instead. |
| Data fetching | `@tanstack/react-query` v5 (`src/lib/queryClient.ts`) | **Reuse pattern** in later API phases. |
| API client | `src/api/index.ts` — single `request<T>()` wrapper over `fetch`, `credentials: 'include'`, base = `import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'`, unwraps `{ data: T }`, 401 → redirect-to-login handler | **Reuse the shape** (typed module, `credentials: 'include'`, `{data}` unwrap, central 401 handling). Env var becomes `NEXT_PUBLIC_API_URL`. |
| Auth/session | `AuthContext` + `useAuth` hook, hydrates via `api.auth.me()` (`GET /user/me`, cookie-based), no token in JS | **Reuse pattern** — HttpOnly cookie, hydrate from `/user/me`, never store JWT in JS. |
| Styling | Tailwind 3 (`tailwind.config.js`, `postcss.config.js`), CSS variables, `baseColor: neutral` | **Reuse** Tailwind 3 + CSS-variable theming. |
| Component lib | shadcn/ui (`components.json`), Radix primitives, `class-variance-authority` | **Optional** — see §4 (avoid full shadcn install for Phase 1; hand-roll small primitives). |
| Icons | `lucide-react` (`iconLibrary: "lucide"`) | **Reuse** — `lucide-react`. |
| Style util | `cn()` in `src/lib/utils.ts` (`clsx` + `tailwind-merge`) | **Reuse** — copy a `cn()` helper. |
| Forms/validation | `react-hook-form` + `zod` + `@hookform/resolvers` | **Reuse** when forms appear (action modals, settings). |
| Aliases | `@/` → `src/*` (shadcn aliases `@/components`, `@/lib`, `@/hooks`) | **Reuse** `@/*` alias convention. |
| Folder convention | `src/features/<domain>/...`, `src/lib`, `src/context`, `src/hooks`, `src/types` | **Reuse** the `features/` convention (see §6). |

**Things to carry over verbatim (as patterns, re-typed for Next):** `cn()`, the `request<T>()` fetch wrapper shape (`credentials: 'include'`, `{data}` unwrap, typed `ApiError`), the AuthContext/`me()` hydration model, lucide icons, Tailwind + CSS variables, `react-query` for server state.

---

## 3. Backend Findings — `C:\Users\Quang Truong\Desktop\MCR\api`

NestJS microservices behind an HTTP **gateway**. Gateway is the only HTTP surface.

### Gateway / base URL / CORS / cookies
- **Gateway HTTP port:** `GATEWAY_PORT || 3000`. Global path prefix `/api` (frontend base is `http://localhost:3000/api`).
- **CORS:** `origin = (FRONTEND_URL || "http://localhost:5173").split(",")`, **`credentials: true`**. `cookie-parser` enabled.
  → **Gap/action:** the new GHN app's dev origin (e.g. `http://localhost:3013`) **must be added to `FRONTEND_URL`** (comma-separated) or browser requests with credentials will be blocked. *(Backend env change, not code — do in Prompt 3 setup, not now.)*

### Auth endpoints (confirmed) — `apps/gateway/src/user/user.controller.ts`
| Purpose | Method & path | Notes |
|---|---|---|
| Login | `POST /api/user/login` | `@Public`. Sets **HttpOnly** cookie `access_token` (`sameSite: lax`, `secure` in prod, `maxAge` 5h, `path:/`). Returns user with `password` stripped. |
| Logout | `POST /api/user/logout` | `@Public`. `res.clearCookie('access_token')`. |
| Current user | `GET /api/user/me` | `JwtAuthGuard`. Returns current profile. |

- **Cookie/credentials requirement:** auth is **HttpOnly cookie** `access_token`. Frontend must send `credentials: 'include'` / `withCredentials`. **Do not** store JWT in localStorage.

### RBAC / roles — `apps/user/src/rbac/grants.ts` (`accesscontrol`)
- Roles that exist today: **`admin`, `shop`, `user`** (resource/action grants).
- The GHN admin endpoints are gated on resource **`shipping`** with `read:any` / `update:any`.
- **Only `admin` currently has `shipping` grants** (`shipping read:any`, `shipping update:any`).
- **`logistics_operator` and `shipping_manager` DO NOT EXIST.** ❗
- **`shipper` does not exist and must not be created** — GHN shippers are external actors on GHN's own app; they never log into TryBuy.
- `@Roles("admin")` / `@CheckPermission("shipping", ...)` decorators are the gating mechanism (`apps/gateway/src/common/decorators` + `guards/role-auth.guard.ts`, `jwt-auth.guard.ts`).

> **Backend gap (must be filled before production):** add `logistics_operator` and `shipping_manager` roles with the recommended permission set below, granting `shipping read:any` (operator) and `shipping read:any` + `shipping update:any` (manager), instead of reusing `admin`. **Do not silently use `admin` as the production access role.** Until then, Phase-1 auth is **mock** (no real role dependency).

**Recommended logistics permission model (to add later, backend):**
`shipment.read`, `shipment.sync`, `shipment.demo_status_update`, `shipment.create_ghn`, `shipment.cancel`, `shipment.return`, `shipment.redelivery`, `shipment.update_cod`, `shipment.update_receiver`, `shipment.history.read`, `shipment.settings.read`, `shipment.settings.update`.
(Backend may model these as `shipping`-resource actions; the names above are the logical permission surface the UI assumes.)

### GHN / order endpoints found (already implemented) — `apps/gateway/src/order/order.controller.ts`
| Purpose | Method & path | Guard / permission |
|---|---|---|
| List GHN/logistics orders | `GET /api/order/admin/ghn/orders` | `JwtAuthGuard` + `shipping read:any` |
| GHN order detail (local + GHN) | `GET /api/order/admin/ghn/orders/:id` | `shipping read:any` |
| GHN shipping history/timeline | `GET /api/order/admin/ghn/orders/:id/history` | `shipping read:any` |
| Sync local status from GHN | `POST /api/order/admin/ghn/orders/:id/sync` | `shipping update:any` |
| Generic admin order list | `GET /api/order/admin/orders` | `order read:any` |

- **GHN webhook:** `POST /api/ghn/webhook` (`apps/gateway/src/ghn/ghn-webhook.controller.ts`) — `@Public`, token-validated via `x-ghn-webhook-token` header or `?token=` (constant-time compare against `GHN_WEBHOOK_SECRET`). Accepts PascalCase (`OrderCode`/`Status`) or snake_case (`order_code`/`status`). Forwards to orders service → `handleGhnWebhook`.
- **GHN service** (`apps/orders/src/ghn/ghn.service.ts`): `createShippingOrder`, `previewShippingFee`, `cancelShippingOrder`, `getOrderDetail`. **GHN credentials are backend-only** via env `GHN_API_TOKEN`, `GHN_SHOP_ID`, `GHN_API_URL` — never exposed to frontend. ✅

### Order / shipping status fields
- **Local order status enum** (`apps/orders/src/entity/order.entity.ts` `OrderStatus`): `pending`, `confirmed`, `processing`, `shipped`, `delivering`, `completed`, `canceled`.
- **Order GHN/shipping fields:** `ghnOrderCode`, `codAmount`, `shippingFee`, `shippingAddress`, `status`. There is **no `ghnStatus` column on the order** — GHN status history lives in a separate **`shipping-history.entity.ts`** table; `lastGhnStatus` is derived from the latest history row.
- **GHN→local status mapping** (`orders.service.ts` `mapGhnStatus`): `picking`/`picked` → `shipped`; `delivering` → `delivering`; `delivered` → `completed`; **everything else → `null` (unhandled, no transition).**
  → **Gap:** demo statuses `ready_to_pick`, `delivery_fail`, `waiting_to_return`, `returned`, `cancelled` are **not yet mapped** to local order status. Needed for full end-to-end demo.

### Ports (`libs/constant/port-tcp.constant.ts`)
```
ORDERS_TCP   3001    INVENTORY_TCP 3002 (TCP + local HTTP)   USER_TCP 3003
REWARD_TCP   3004    PAYMENT_TCP   3005    PRODUCT_TCP 3006   PAYMENTS_HTTP 3007
SOCIAL_TCP   3008    NOTIFICATION  3009    CHAT_WS 3011        CHAT_SERVICE 3012
Gateway HTTP 3000    Vite frontend dev 5173
```
**Port `3002` = `INVENTORY_TCP_PORT` — confirmed conflict** when full backend (nodeB) is running.

### Missing backend pieces for the end-to-end demo (gaps)
1. `logistics_operator` / `shipping_manager` roles + their `shipping` grants (today only `admin`).
2. **Demo GHN status endpoint** (controlled, backend-only) to push demo statuses — **does not exist** (no demo/simulate route found).
3. **Status mapping coverage** for `ready_to_pick`, `delivery_fail`, `waiting_to_return`, `returned`, `cancelled` (only picking/delivering/delivered mapped).
4. GHN action endpoints beyond sync (create-GHN/cancel/return/redelivery/update-COD/update-receiver) — `GhnService` has methods (`createShippingOrder`, `cancelShippingOrder`, `previewShippingFee`), but **no gateway HTTP routes** expose create/cancel/return/COD/receiver to the logistics web yet.
5. New GHN app origin must be added to `FRONTEND_URL` for CORS-with-credentials.

---

## 4. Recommended Next.js App Setup

| Decision | Recommendation |
|---|---|
| Where | Create the Next app **inside a subfolder** of `web-flow-GHN` (keep the design export and `handoff/` as siblings), **not** at the repo root scattered over the design files. |
| Folder name | `web/` (i.e. `web-flow-GHN/web/`). Simple, unambiguous, leaves room for design/handoff siblings. |
| Framework | **Next.js (App Router)** — `app/` directory. |
| Language | **TypeScript** (strict). |
| Styling | **Tailwind CSS** (v3, matching existing frontend) + CSS variables. |
| Lint | **ESLint** (Next default config). |
| `src/` dir | **Yes** — `src/` so it matches the existing `features/` convention. |
| Component lib | **Avoid full `shadcn/ui` install in Phase 1.** Hand-roll a few small primitives (Button, Badge, Dialog/Modal, Input) to keep the convert-from-design step clean. Revisit shadcn later if the surface grows. |
| Icons | **`lucide-react`** (same as existing frontend). |
| State/data | Local React state + mock data in Phase 1. Add `@tanstack/react-query` in the API phases. |
| **Dev port** | **`3013`** (above the highest backend port 3012; avoids the 3002 Inventory conflict and the 5173 Vite frontend). Fallback: **`5174`**. Configure via `next dev -p 3013`. |
| Env var | `NEXT_PUBLIC_API_URL=http://localhost:3000/api` (used only from Prompt 3 onward). |

> **Port note:** Do **not** hardcode `3002` as final. It is `INVENTORY_TCP_PORT` and will conflict when full backend nodeB runs. If the user later insists on 3002, document that it conflicts with Inventory (TCP + local HTTP) and only works when Inventory is not running. **Never kill a process to free a port.**

---

## 5. Proposed App Routes (App Router)

```
src/app/
├─ login/page.tsx              → /login         (mock logistics login)
├─ dashboard/page.tsx          → /dashboard     (KPIs, status distribution)
├─ shipments/
│  ├─ page.tsx                 → /shipments     (table, filters, search)
│  └─ [orderId]/page.tsx       → /shipments/:orderId  (detail + timeline + actions)
├─ sync/page.tsx               → /sync          (manual GHN sync console)
├─ history/page.tsx            → /history       (action/shipping history log)
├─ settings/page.tsx           → /settings      (webhook URL/connection, demo controls — read-only in P1)
├─ 403/page.tsx                → /403           (forbidden / missing logistics role)
├─ not-found.tsx               → 404            (App Router not-found)
├─ layout.tsx                  → app shell (sidebar + topbar) wrapping authed routes
└─ page.tsx                    → redirect "/" → "/dashboard" (or "/login" if unauthed)
```
- Use a **route group** for the authed shell, e.g. `src/app/(app)/...` so `/login`, `/403`, `404` render outside the sidebar shell. (Decide during implementation; the route URLs above are fixed.)

---

## 6. Proposed Feature File Structure

```
src/
├─ app/                         ← routes only (thin; delegate to features)
├─ features/
│  └─ ghn-shipping/
│     ├─ components/
│     │  ├─ GhnAdminShell.tsx          (sidebar + topbar layout)
│     │  ├─ GhnSidebar.tsx
│     │  ├─ GhnTopbar.tsx
│     │  ├─ GhnLoginCard.tsx
│     │  ├─ ShipmentStatusBadge.tsx
│     │  ├─ ShipmentStatCards.tsx
│     │  ├─ ShipmentDashboard.tsx
│     │  ├─ ShipmentTable.tsx
│     │  ├─ ShipmentDetail.tsx
│     │  ├─ ShipmentActionPanel.tsx
│     │  ├─ ShipmentActionModal.tsx
│     │  ├─ ShipmentTimeline.tsx
│     │  ├─ GhnSyncPage.tsx
│     │  ├─ ActionHistoryPage.tsx
│     │  ├─ GhnSettingsPage.tsx
│     │  ├─ EmptyState.tsx
│     │  ├─ ErrorState.tsx
│     │  └─ ToastHost.tsx
│     ├─ data/
│     │  └─ mockShipments.ts
│     ├─ lib/
│     │  ├─ shipment-formatters.ts      (currency/date/COD formatting)
│     │  └─ shipment-status.ts          (status → label/color/allowed actions)
│     └─ types.ts
├─ components/ui/               ← small hand-rolled primitives (Button, Badge, Dialog, Input)
├─ context/
│  └─ AuthContext.tsx           (mock auth in P1; cookie-backed in P3)
├─ lib/
│  └─ utils.ts                  (cn())
└─ types/                       (shared types, if any beyond feature types.ts)
```
Convention mirrors the existing frontend's `src/features/<domain>/` layout so the two apps feel consistent. Routes in `app/` stay thin and import feature components.

---

## 7. UI Implementation Scope — **Prompt 2**

Build **UI only**, fully mock, no network:
- **Convert** `GHN Shipping Control Panel.dc.html` into maintainable React/Next components (per §6). **Do not import `support.js`** — re-implement all interactivity in React.
- **Mock data** in `data/mockShipments.ts` (shipments with order id, GHN code, status, COD, receiver, weight, timeline events).
- **Mock logistics auth**: signed-in user `Trần Thị Mai`, role `logistics_operator`, title `Logistics Operator`. No real API.
- **Screens:** `/login`, `/dashboard` (stat cards + status distribution), `/shipments` (table + filters + search), `/shipments/[orderId]` (detail + timeline + action panel), `/sync`, `/history`, `/settings`, `/403`, 404.
- **Interactions:** action **modals** (Cancel, Return reason, Update COD, Update receiver, Create/Sync), **toasts** via `ToastHost`, filters & search on the table, **demo state transitions** driven purely by local state (GHN status tokens: `ready_to_pick`, `picking`, `delivering`, `delivered`, `delivery_fail`, `waiting_to_return`, `returned`, `cancelled`).
- **No real API calls. No GHN calls. No cookie logic yet.**
- **Production-like guardrail even in mock:** the action panel must **not** let the user flip a shipment to `delivered`/`completed` as a free-form local mutation framed as "real". Treat status changes as *demo-only* visual state and label them as such — the canonical status will later come from backend sync/webhook/demo endpoint.

---

## 8. Login API Scope — **Prompt 3**

Connect **authentication only**:
- Wire `POST /api/user/login` and `POST /api/user/logout`; hydrate session via `GET /api/user/me`.
- Use the **HttpOnly cookie** flow: all requests send `credentials: 'include'` (fetch) / `withCredentials`. **Do not** read/write the JWT in JS or localStorage.
- Set `NEXT_PUBLIC_API_URL=http://localhost:3000/api`. Ensure the dev origin (`http://localhost:3013`) is added to backend `FRONTEND_URL` for CORS-with-credentials (backend env, coordinate separately).
- **Do not** connect GHN/order APIs yet — **shipment data stays mock** after login.
- **Role gap handling:** if `logistics_operator` / `shipping_manager` do not exist on the returned user, **show `/403` and document the gap** — **do not silently fall back to `admin`** in production code. (A clearly-labelled dev-only override may be used locally, never as the production path.)

---

## 9. Later Backend / API Phases (plan only)

In rough dependency order:
1. **Read-only shipments API** → bind `/shipments` to `GET /order/admin/ghn/orders`.
2. **Shipment detail API** → `GET /order/admin/ghn/orders/:id`.
3. **Action history API** → `GET /order/admin/ghn/orders/:id/history`.
4. **Create GHN shipment API** → expose a gateway route over `GhnService.createShippingOrder` (new route needed).
5. **Sync GHN status API** → `POST /order/admin/ghn/orders/:id/sync` (already exists).
6. **Demo GHN status endpoint** → new backend, controlled/demo-only, to push `ready_to_pick … returned/cancelled` (does not exist yet).
7. **GHN webhook hardening** → review `GHN_WEBHOOK_SECRET` handling, idempotency, signature; webhook already exists at `POST /ghn/webhook`.
8. **Status mapping** → extend `mapGhnStatus` to cover `ready_to_pick`, `delivery_fail`, `waiting_to_return`, `returned`, `cancelled` → local `OrderStatus`.
9. **Buyer-visible order tracking** → ensure the local status produced by sync/webhook/demo surfaces in the main TryBuy web order view.
10. **Cancel / Return / Redelivery / Update-COD / Update-receiver APIs** → new gateway routes over GHN service; gate on `shipping update:any` (logistics roles).
11. **Notification/update event** (optional) → push order-status updates to buyer (existing notification service can be reused).

**End-to-end demo target:** buyer orders in main web → order appears in GHN web → operator creates/syncs/updates GHN demo status → backend maps GHN→local status (webhook/sync/demo endpoint) → buyer sees updated status in main web.

---

## 10. Risks / Gaps

- **Port 3002 conflict:** `3002` is `INVENTORY_TCP_PORT` (TCP + local HTTP). Using it for the Next app conflicts when full backend nodeB runs. **Use `3013` (fallback `5174`).** Never hardcode 3002; never kill a port/process.
- **Missing logistics roles:** `logistics_operator` / `shipping_manager` do **not** exist in backend RBAC; only `admin` has `shipping` grants today. Backend must add them.
- **`admin` is not the desired access role** for this app — do not wire production access to `admin`. Mock auth in P1, real logistics roles later; show `/403` if absent.
- **`shipper` role is not needed** and must not be created — GHN shippers are external (GHN's own app), they never log into TryBuy.
- **Frontend must not call GHN directly** — all GHN traffic goes through the backend gateway.
- **GHN API key stays backend-only** (`GHN_API_TOKEN`/`GHN_SHOP_ID` env in `apps/orders`). Never ship it to the browser.
- **`delivered`/completed must come from backend** sync / webhook / approved demo endpoint — **not** a manual frontend state mutation presented as real.
- **Status mapping incomplete** — backend `mapGhnStatus` only covers picking/delivering/delivered; demo statuses (`ready_to_pick`, `delivery_fail`, `waiting_to_return`, `returned`, `cancelled`) are unmapped, so the buyer UI won't reflect them until backend maps `ghnStatus → orderStatus`.
- **`support.js` must not be imported** — it is Claude Design preview runtime, not app source.
- **Confirm route names from source** — all API paths in this doc were read from backend source on 2026-06-27; re-confirm before wiring (controllers can change).
- **CORS:** new app origin must be added to backend `FRONTEND_URL` (credentials are required).

---

## 11. Recommended Next Prompt (copy-ready, do not implement now)

> **Prompt 2 — implement Next GHN UI with mock data**
>
> In `C:\Users\Quang Truong\Desktop\MCR\web-flow-GHN`, create a new **Next.js (App Router) + TypeScript + Tailwind + ESLint** app in subfolder **`web/`**, dev port **3013**. Build **UI only, fully mock — no API, no GHN, no cookies.**
> - Convert `TryBuy Shipping Dashboard/GHN Shipping Control Panel.dc.html` into maintainable React components under `src/features/ghn-shipping/` (structure per §6 of `handoff/ghn-next-admin-plan.md`). **Do not import `support.js`.**
> - Mock logistics auth: `Trần Thị Mai`, role `logistics_operator`, title `Logistics Operator`.
> - Routes: `/login`, `/dashboard`, `/shipments`, `/shipments/[orderId]`, `/sync`, `/history`, `/settings`, `/403`, 404.
> - Implement: stat cards + status distribution, shipments table with filters/search, shipment detail + timeline + action panel, action modals (Cancel, Return reason, Update COD, Update receiver, Create/Sync), toasts, demo status transitions (`ready_to_pick … returned/cancelled`) as **demo-only local state**.
> - Use lucide-react icons, a `cn()` util, and small hand-rolled UI primitives (no full shadcn install yet).
> - Guardrail: never present `delivered`/`completed` as a real status change — label demo transitions as demo-only; canonical status will come from backend later.
> - **Do not** install/connect any API, do not modify backend or the existing frontend.

---

## 12. Prompt 2 cleanup/context update

- Prompt 2 was completed as a root-level Next.js app in `C:\Users\Quang Truong\Desktop\MCR\web-flow-GHN`.
- The interrupted partial scaffold in `web/` was deleted after root dependency validation passed.
- Root `node_modules` was normalized from a junction to `web\node_modules` into a real root dependency folder by running `npm.cmd install` from the app root.
- Root `package.json` and `package-lock.json` are present and own the app dependencies.
- Frontend reference context was added at `handoff/frontend-reference.md`.
- Project agent instructions were added at `AGENTS.md`.
- Future Prompt 3 work must read `AGENTS.md` and `handoff/frontend-reference.md` first.
- Prompt 3 scope remains login/logout/me only. Do not connect shipment, order, GHN sync, or GHN history APIs yet.

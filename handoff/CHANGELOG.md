# GHN Console — CHANGELOG (done tasks)

Log of completed tasks for this console, newest first. When a backend item from
`../.agent-local/frontend-handoff-ghn.md` is integrated, add an entry here and move the
handoff entry to **Done** there. Historical planning context lives in
`handoff/snapshot.md`; open risks/gaps live in `.ai/context/risks.md`.

Format per entry: `### YYYY-MM-DD — <title>` + what shipped (FE scope first, backend
context if relevant).

---

### 2026-08-11 — Refunded/return-requested orders no longer render as "Pending"

- `BackendOrderStatus` was missing two of the backend's nine `OrderStatus` values,
  `return_requested` and `refunded`. `mapOrderStatusToLocal()` therefore hit its
  `default` branch and returned `"pending"`, so a refunded order showed a **"Pending"**
  badge on `/dashboard`, `/shipments` and `/shipments/:id`. Found on prod during a
  storefront-agent sweep of `web-flow-ghn.vercel.app` (an order with
  `orderStatus: "refunded"` listed as Pending).
- Added both values to `BackendOrderStatus`, added a `refunded` `LocalStatus` with its
  own badge meta (violet, label "Refunded"), and mapped `return_requested → refunding`,
  `refunded → refunded`.
- The "Local status" filter dropdown was missing the same two options even though the
  gateway accepts `?status=return_requested` / `?status=refunded` — both added.
- Regression test pins the two branches (`adapters.test.ts`). Verified: `tsc --noEmit`
  clean, ESLint clean, Jest 12 suites / 59 tests green, `next build` OK.
- Two things checked and deliberately **not** changed, recorded in
  `../.agent-local/frontend-handoff-ghn.md`: the created-from/created-to date filters do
  fire (the earlier "no request" reading was a test-tool artifact — it set `input.value`
  without React's `onChange`), and `/403` for role `admin` is intentional per
  `ALLOWED_ROLES`.

### 2026-08-11 — Gateway role reshape integrated (prod `/403` fix)

- `BackendRole` is now `{ id, name, slug }` and `AuthContext` reads `role.name`. The
  gateway stopped returning the raw `rol_*` row on 2026-08-06, so the old
  `role.rol_name` read resolved every account to `"user"` — on prod, `logistic1` and
  `shipping1` signed in successfully and were then bounced to `/403` by
  `GhnLoginCard` / `AuthGate`. Verified against prod: login returns
  `role: { id: 4, name: "logistics_operator", … }`.
- `.ai/context/data-fetching.md` carried the stale `rol_*` sample payload; corrected so
  the documented contract matches the wire.
- Integrates the "BREAKING — login/`me` `role` is now `{id,name,slug}`" handoff entry.

### 2026-07-17 — PUBID opaque identifiers integrated

- GHN order ids now remain opaque `ord_...` strings through list/detail routes, query
  keys, gateway reads, sync/actions, COD/receiver edits, and demo-status mutations.
  Malformed route ids are rejected before gateway work.
- Auth and embedded/top-level order user references now use nullable opaque `usr_...`
  strings. Detail product references use `prod_... | null`, retain legacy null support,
  and no longer model the removed numeric item `orderId` foreign key.
- Jest fixtures and mocked Playwright flows now exercise the public-id contracts. Closes
  the PUBID-01, PUBID-02, PUBID-05, PUBID-07, deleted-product regression, and superseded
  SEC-L1 numeric-id handoffs.

### 2026-07-10 — Typed test fixture factories + e2e infra fixes

- New `src/features/ghn-shipping/testing/fixtures.ts`: typed fixture builders with
  `Partial<T>` overrides over canonical order #101 / GHN101 defaults (backend response
  shapes + view models + auth users). Type-only imports so Playwright specs can import
  it without pulling runtime app code. Consumed by all 6 component/adapter Jest suites
  and both e2e specs; the duplicated inline fixture objects were deleted.
- Fixed a Playwright strict-mode collision in `e2e/role-matrix.spec.ts`: the detail
  heading assertion now uses `exact: true` because both the top-bar `Shipment #101` and
  the page heading `#101` match the loose name.
- `scripts/run-e2e.ps1` no longer leaks the dev server: `Start-Job`/`Stop-Job` left the
  child node process alive on Windows (the orphan that blocked the 2026-07-06 run);
  the script now uses `Start-Process` + `taskkill /PID <pid> /T /F`.
- `playwright.config.ts` `baseURL` is overridable via `E2E_BASE_URL` so the suite can
  run against a server on another port when 3013 is occupied.
- Closes handoff improvement #4. lint + tsc + jest (52/52) + build green;
  e2e 10/10 green against a fresh dev server. No app runtime code changed.

### 2026-07-06 — Mocked E2E role matrix for logistics_operator

- New `e2e/role-matrix.spec.ts` (4 Playwright specs, mocked gateway with a
  `logistics_operator` session): shipment list → detail read path stays accessible;
  sync, cancel/return, and COD/receiver edit buttons are disabled on detail with the
  "requires the shipping manager role" hint copy; demo controls render read-only
  (picker + apply disabled); `/sync` page shows read-only copy with per-row Sync
  disabled. Mocked POST routes return `403` so a wrongly-enabled control fails loudly.
- Closes handoff improvement #2 (existing mocked E2E only covered `shipping_manager`).
  Runtime-verified against the real gateway as `logistics_test` on `/dashboard`,
  `/shipments/107`, and `/sync`. lint + tsc + jest (52) + build + e2e (10/10) green.

### 2026-07-05 — Hardening batch: boundaries, verify script, error copy, headers

- Error/loading boundaries: `(app)/error.tsx` (reuses `ErrorState`, logs message+digest
  only), `(app)/loading.tsx`, `global-error.tsx` (self-contained, re-imports globals.css);
  stale "mock data" copy in `not-found.tsx` fixed.
- `npm run verify` (lint → typecheck → test → build, sequential — never `tsc` parallel
  with `next build`) + `verify:e2e`; documented in `.ai/context/testing.md`.
- Mutation error copy centralized in `lib/mutation-errors.ts` (`syncErrorCopy`,
  `actionErrorCopy`, `editErrorCopy`, `demoErrorCopy`) + unit tests; replaces
  `sync-errors.ts` and the inline status-code branching in `ShipmentDetail`.
- Security headers in `next.config.mjs` (nosniff, frame DENY, referrer policy,
  permissions policy; CSP deferred). `MutationCache.onError` diagnostics for network
  faults + `>=500` (no request bodies). `globals.css` body on `bg-canvas`/`text-ink-900`
  tokens; scrollbar hex documented as exception. Demo-mode QA checklist added to
  `.ai/context/testing.md`.

### 2026-07-05 — Business analytics dashboard wired to gateway

- FE: `/dashboard` now renders an `AnalyticsPanel` (below the operational overview)
  backed by `GET /api/order/admin/analytics` — KPI cards over `summary`, hand-rolled
  Tailwind bar chart over `revenueOverTime`, status distribution bars (all 9 backend
  order-status keys, zero-defaulted), top-products table, and a date-range +
  `day|month` interval toggle mapped to the query params. Invalid `from > to` is
  guarded client-side (message shown, no request fired).
- New: `api/analytics.ts` (backend types + `toAnalyticsView` + `analyticsApi`),
  `hooks/useAnalytics.ts`, `queryKeys.analytics`, adapter tests. Readable by
  `logistics_operator` (same `shipping read:any` gate as the list) — not gated behind
  `shipping_manager`. Backend handoff Open entry (2026-07-01) moved to Done.

### 2026-07-05 — Handoff docs restructure

- Merged `handoff/ghn-next-admin-plan.md` + `handoff/frontend-reference.md` into
  `handoff/snapshot.md` (historical snapshot).
- Added this `handoff/CHANGELOG.md` as the done-task log.
- Updated references in `.ai/project.md` and `AGENTS.md`.

### 2026-06-30 — Demo-status integration + demo-aware detail status

- FE: `useSetDemoStatus` hook/API + demo-only status control in the shipment detail
  action panel, hidden unless `NEXT_PUBLIC_GHN_DEMO_MODE=true`; backend-disabled `403`
  is surfaced as "demo not enabled in this environment", not treated as an authz failure.
- FE: detail GHN status keeps using `ghnDetail.status` first — no client-side
  `lastGhnStatus` workaround needed (backend now returns the demo-driven status in
  `ghnDetail.status` when demo mode is on).
- FE: sync `404` vs `503` now show distinct operator-facing copy, with tests.

### 2026-06-29 — Demo-status endpoint (backend)

- Backend shipped `POST /api/order/admin/ghn/orders/:id/demo-status`
  (`shipping update:any`, gated by `GHN_DEMO_ENDPOINTS_ENABLED`). Same response shape as
  sync; writes a `shipping_history` row so the timeline shows it. Enables the full
  `picking → delivering → delivered` demo lifecycle without real GHN movement.

### 2026-06-28 — Manual GHN actions: cancel, return, update COD, update receiver

- FE: `availableActions`-driven buttons in `ShipmentDetail.tsx` (gated to
  `shipping_manager`/admin) with modal forms; COD form (integer ≥ 0, `0` clears);
  receiver form prefills name/phone/street, submits only changed fields,
  ward/district/province read-only. Success → toast + invalidate detail/history/list.
  GHN-reject `500` handled distinctly from `400` (order unchanged; failed attempt
  recorded in history). New api/hooks/adapters + tests.
- Backend: cancel/return/update-cod/update-receiver gateway routes; GHN `cancel`/`return*`
  statuses now map to local `canceled`; sync errors return `404`/`503` with GHN message
  instead of opaque `502`; `lastGhnStatus`/`lastSyncedAt` fixed (were always null).
- Delivery-again intentionally not built — GHN drives redelivery internally.

### 2026-06-28 — Shipments wired to gateway (list / detail / history / manual sync)

- FE: list/detail/history/sync moved off mock data to gateway endpoints via
  `shipmentsApi` + `useShipments` TanStack Query hooks; legacy mock context/data/action
  panel/modal removed. `canceled` treated as terminal in status mapping and timeline.

### 2026-06-28 — Real auth session (login / me / logout)

- FE: HttpOnly-cookie session with `credentials: "include"` — `POST /api/user/login`,
  `GET /api/user/me`, `POST /api/user/logout`. `/me` is authoritative on reload; the
  browser stores no JWT/role hint (`localStorage` role cache removed). Route guards gate
  on `logistics_operator` / `shipping_manager`; 401 → `/login`, wrong role → `/403`;
  sync/actions restricted to `shipping_manager`/admin + backend `availableActions`.

### 2026-06-27 — Backend foundation + app scaffold

- Backend: GHN admin Phase 1 API (list/detail/history/sync), shipping roles
  `logistics_operator` / `shipping_manager` + test accounts, `/me` returns `role`,
  gateway CORS allows `http://localhost:3013`.
- FE: Next.js 15 App Router app scaffolded at the repo root (dev port 3013), UI converted
  from the Claude Design export with mock data (Prompt 2), per the plan now archived in
  `handoff/snapshot.md`.

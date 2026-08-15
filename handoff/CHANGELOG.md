# GHN Console — CHANGELOG (done tasks)

Log of completed tasks for this console, newest first. When a backend item from
`../.agent-local/frontend-handoff-ghn.md` is integrated, add an entry here and move the
handoff entry to **Done** there. Historical planning context lives in
`handoff/snapshot.md`; open risks/gaps live in `.ai/context/risks.md`.

Format per entry: `### YYYY-MM-DD — <title>` + what shipped (FE scope first, backend
context if relevant).

---

### 2026-08-16 — GHN-FAIL-01: `delivery_fail` has no local status **on purpose**

The sweep filed the unmapped `delivery_fail` as a suspected backend gap
(`../.agent-local/backend-handoff.md`). The backend answered with decision **(b) — intended,
not a gap** — and the answer was verified in `api/` source rather than taken on its label.
Closes risks item **6** (moved to §Resolved, number kept).

- **Why it is not a gap.** `mapGhnStatus` (`orders.service.ts:2699`) still returns `null` for
  `delivery_fail`, now against a named constant `GHN_STATUSES_WITHOUT_LOCAL_STATUS`
  (`libs/constant/shipping.constant.ts`) listing ten statuses with a per-status reason.
  `delivery_fail` is a failed *attempt*: GHN retries before moving to the return family
  (which already maps to `canceled`), so canceling on the first miss would release stock for a
  parcel still out for redelivery → oversell. `exception` / `damage` / `lost` need a human
  decision, and restocking goods that no longer physically exist is worse than waiting. The
  order simply keeps its current local status.
- **Contract unchanged; release class A.** Only the `shipping_history.message` wording moved:
  recognised-but-unmapped statuses now read `... acknowledged; no local equivalent, order stays
  <status>`, while genuinely unknown ones keep `Unhandled GHN status "<x>"`. Forward-only —
  rows written before 2026-08-16 keep the old wording, so **never string-match "Unhandled"** to
  infer anything on the client.
- **Two console-side gaps the answer exposed** (backend asked for no FE work; these are ours):
  - `money_collect_picking` was missing from `GHN_STATUS_ALIASES` while its sibling
    `money_collect_delivering` was present, so the COD-collection leg at pickup fell through to
    a grey "unmapped" pill instead of **Picking**. Added in `api/adapters.ts`.
  - `exception` / `damage` / `lost` rendered in the *same* neutral grey pill as "No GHN
    status" — indistinguishable from an order with no waybill yet, which is exactly backwards
    for the three statuses that need an operator. New `ATTENTION_GHN_META` / `rawGhnMeta()` in
    `lib/shipment-status.ts`, wired into `GhnStatusBadge`, reds them. They are deliberately
    **not** added to the `GhnStatus` union — the console must never present a status the
    backend does not send as an order's state; only the colour changes.
- **Tests:** three new cases — `rawGhnMeta` flags the three attention statuses (case- and
  whitespace-insensitive) and stays neutral for an in-transit leg / `null` / `undefined`;
  `mapGhnStatus("money_collect_picking")` → `picking`.
- **Verified:** lint clean, `tsc --noEmit` 0, `next build` 0, Jest **92/92 in 13 suites**. The
  red pill is covered by unit tests and a clean build only — it was **not** browser-verified,
  because `DEMO_GHN_STATUSES` exposes just the 8 canonical statuses and cannot drive an order
  into `exception` / `damage` / `lost`.

---

### 2026-08-16 — "Top products" caption claimed a ranking the backend does not produce

Backlog sweep follow-up: audited both backlog sources, closed everything already fixed, and
fixed the one real bug the audit turned up. Risks item **20**.

- **The caption was wrong, not the data.** `AnalyticsPanel > TopProducts` captioned the list
  "By revenue, completed orders" whenever the Revenue column was visible. The orders service
  builds that list with `.orderBy("quantitySold", "DESC")` for every role
  (`api/apps/orders/src/orders.service.ts`), so revenue is an extra column, never the sort
  key. The live dev gateway proves it: a row worth 238 VND (qty 2) outranks two rows worth
  12.000 VND (qty 1). The caption is now "By quantity sold, completed orders" in both roles,
  with a comment recording why it must not follow the money column.
- **A missing per-row revenue is a dash.** `product.revenue === null` renders `—` instead of
  falling through `fmtVND` to `0 VND`, matching the GHN-RBAC-01 rule that an absent figure is
  never a zero (risks item 15).
- **Tests:** two new cases in `components/AnalyticsPanel.test.tsx` — the caption reads "By
  quantity sold" and never "By revenue" in both the revenue-visible and revenue-hidden roles;
  a `null` revenue renders `—` and never `0 VND`.
- **Backlog compaction.** `.ai/context/risks.md` rewritten: six genuinely open items (5, 6, 8,
  11, 12, 18) kept verbatim, thirteen resolved ones compacted to one line each keeping only
  the rule they encode. **Item numbers are stable and must never be renumbered** —
  `.ai/project.md` cites 14 and 19. The six remaining **Open** entries in
  `../.agent-local/frontend-handoff-ghn.md` were re-verified against current code (not their
  labels) and all moved to **Done**; that inbox is now empty.
- **Gotcha documented.** `.ai/context/testing.md`: `next build` clobbers a running `next dev`
  (shared `.next`), leaving the browser with chunk `404`s and a page frozen mid-render. It
  looks exactly like an app bug — it is not. Restarting this app's own dev server is the one
  sanctioned exception to risks item 8's "never kill a process to free a port".
- **Verification (2026-08-16):** `npm.cmd run lint` clean, `npx.cmd tsc --noEmit` exit 0,
  `npm.cmd run build` exit 0 (11 routes), Jest **90/90 in 13 suites** (was 88).
  Runtime-verified as `shipmgr_test` on `http://localhost:3013/dashboard`: the caption reads
  "By quantity sold, completed orders" with the Revenue column intact, and the console is
  clean.

### 2026-08-16 — IDLEAK-02: analytics `topProducts[].productId` is an opaque public id

Integrated the last release-blocking entry in `../.agent-local/frontend-handoff-ghn.md`.
`GET /api/order/admin/analytics` now returns `topProducts[].productId` as `prod_…` or
`null` (product deleted, or the product service is down — the whole list comes back `null`
rather than 500) instead of the numeric PK. This unblocks the backend push
(`release-gate.md`, IDLEAK-02 `web-flow-GHN` cell → ✅; that was the last `⏳` on the entry).

- **Wire type accepts both, view model normalises.** `BackendAnalyticsResponse` declares
  `productId: string | number | null` so a console deployed ahead of the backend still reads
  the legacy numeric id; `normalizeProductId` stringifies it and keeps an unresolved product
  as `null` rather than the string `"null"`. Same shape as the `actorId` handling from
  GHN-HIST-01. `AnalyticsTopProduct.productId` is `string | null`.
- **The React key no longer collides.** `TopProducts` keyed its rows on `productId` alone;
  with several deleted products in the window every one of those keys was `null`, so React
  warned and reconciled the wrong rows. Rows now fall back to the list index
  (`product.productId ?? \`unresolved-${index}\``) — the ranking is fixed, with no reorder or
  insert, so the index is stable. This is what made the item class C.
- **Tests:** `api/analytics.test.ts` covers all three wire shapes (opaque id passthrough,
  two `null` rows staying `null`, legacy numeric id stringified) and its fixture now carries
  a `prod_…` id; `components/AnalyticsPanel.test.tsx` renders three top products of which two
  have `productId: null` and asserts every name appears with no `console.error`.
- **Verification (2026-08-16):** `npm.cmd run lint` clean, `npx.cmd tsc --noEmit` exit 0,
  `npm.cmd run build` exit 0, Jest **88/88 in 13 suites** (was 84). Runtime-verified against
  the live dev gateway as `shipmgr_test` on `http://localhost:3013/dashboard`: the endpoint
  already serves the new contract (`["prod_ffc7fc2281d211f1", null, null,
  "prod_ffc7fb1381d211f1"]`), and all four rows render — including both `null`-id products —
  with no React key warning and an empty console.

### 2026-08-12 — BATCH-0812: backend action/RBAC/enum/error contracts integrated

Integrated the five release-blocking items from `../.agent-local/frontend-handoff-ghn.md`
plus the RESIL-01 error contract, which only became reachable once GHN-ACT-01 restored the
buttons. This unblocks the backend push (`release-gate.md`, `web-flow-GHN` cell → ✅).

- **GHN-ACT-01 — `availableActions` is the only gate.** Removed the client-side role check
  that sat on top of the array in `ShipmentDetail` and `GhnSyncPage`. The gateway already
  filters the array by permission **and** by order state, so the second check could only
  disagree with the server. `logistics_operator` now gets a genuine read-only panel because
  the array says `["read","history"]`, not because the console recognises the role;
  `shipping_manager` gets exactly the buttons the order's state allows. `canSync()` survives
  for the demo-status control only — it has no entry in the array.
- **GHN-RBAC-01 — revenue hidden, never zeroed.** `toAnalyticsView` exposes `revenueVisible`
  and maps the four omitted money fields to `null`; `AnalyticsPanel` hides the revenue KPIs
  and the Revenue column, plots `orderCount` ("Completed orders over time") instead of
  `revenue`, and ranks top products by quantity sold. Branches on the field, never the role.
- **GHN-HIST-01 — opaque actor ids.** `history[].actorId` is typed `string | number | null`
  because audit rows written before the deploy keep numeric ids forever; the adapter
  normalises to a string and blank/missing to `null`. The timeline renders
  `· by operator <id>` with no `#` prefix, and nothing parses ids out of `message`.
- **GHN-ENUM-01 — cleared filters are omitted.** A cleared filter key is dropped from the
  query instead of sent empty (`?status=` is now a 400), the GHN-status dropdown comes from
  the 23 accepted values, and a filter `400` renders verbatim with no Retry button. `status`
  and `ghnStatus` keep separate vocabularies — GHN accepts `cancel` and `cancelled`, the
  local status is `canceled`, and nothing normalises across them.
- **GHN-RAW-01 — documentation only.** Nothing in the console reads a key out of
  `ghnDetail.raw` (grep-verified); the rendered scalars all come from `ghnDetail`'s top
  level. Recorded the allow-list on the field in `api/types.ts` so nobody starts.
- **RESIL-01 — 400 refusal vs 503 outage.** `lib/mutation-errors.ts` branches on
  `statusCode`: a `400` prefixed `GHN <action> error:` becomes "GHN rejected the action"
  with the GHN reason verbatim plus "retrying will not help"; a `503` becomes "GHN
  temporarily unavailable" with retry-later copy. A local-guard `400` keeps its own title
  and is still shown verbatim. Nothing branches on the envelope's `error` field, which
  still reads `"HttpException"`.
- **Tests:** 27 new Jest cases (59 → 84 total; two stale role-gating tests replaced) across
  `api/analytics.test.ts`, `api/adapters.test.ts`,
  `lib/mutation-errors.test.ts`, `components/ShipmentTable.test.tsx`,
  `components/ShipmentDetail.test.tsx`, `components/GhnSyncPage.test.tsx`, and a new
  `components/AnalyticsPanel.test.tsx`. `e2e/role-matrix.spec.ts` now expresses the
  read-only role through the mocked `availableActions` array and asserts unadvertised
  actions are **absent**, not disabled.
- **Verified:** ESLint clean, `npx.cmd tsc --noEmit` exit 0, `next build` exit 0, Jest
  **84/84** in 13 suites, Playwright **10/10**. Runtime-checked against the live gateway as
  both roles: operator list rows return `["read","history"]` and `/sync` shows the empty
  state; manager gets `["read","history","sync"]` on a canceled order and the six actions on
  pending/processing, rendered exactly as advertised (no "Return to seller" at `pending`).
  Analytics as the operator returns 200 with no `revenue` key anywhere and the dashboard
  hides money. `?ghnStatus=bogus_state`, `?ghnStatus=`, `?status=` → 400 naming the accepted
  set; `?ghnStatus=cancel`, `?ghnStatus=cancelled`, `?status=canceled` → 200. Cancel on an
  already-canceled order → local-guard 400, surfaced verbatim; sync on an unknown id → 404.
  The `GHN <action> error:` 400 branch cannot be forced without a real GHN refusal, so it is
  covered by unit tests only.

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

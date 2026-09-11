# GHN Console — CHANGELOG (done tasks)

Log of completed tasks for this console, newest first. When a backend item from
`../.agent-local/frontend-handoff-ghn.md` is integrated, add an entry here and move the
handoff entry to **Done** there. Historical planning context lives in
`handoff/snapshot.md`; open risks/gaps live in `.ai/context/risks.md`.

Format per entry: `### YYYY-MM-DD — <title>` + what shipped (FE scope first, backend
context if relevant).

---

### 2026-09-11 — Confirm step for destructive actions, honest KPI scope, real `/settings`

Self-audit of the console against the live dev gateway (170 orders, `shipmgr_test`), not
against the docs. Three findings, all FE-only, no backend contract involved. Opens risks
items **24**, **25**, **26**.

- **Cancel and return had no confirm step** (risks 24). Both are one-way at the carrier, and
  both fired on one click — while "Update COD" and "Update receiver info", which are
  reversible, had always opened a modal. The destructive pair now route through the same
  `Modal`: it names the consequence ("GHN stops the waybill…", "…the leg cannot be reversed
  from this console"), repeats the order and GHN code, and shows the receiver + COD so the
  operator can see *which* parcel they are killing. The confirm button reuses the action
  label and the `danger` variant for cancel. Nothing is sent until it is pressed.
- **Dashboard KPIs counted a page and read as totals** (risks 25). `ShipmentStatCards` sums
  the ~100 orders the list query returned; the queue held 170, so "Failed deliveries: 3" was
  a floor presented as a total — and that card is a work queue, so under-reporting it is the
  costly direction. There is no per-status count endpoint and adding one is a backend ask, so
  the scope is *stated* rather than guessed: counts render as `3+`, an amber banner reads
  "Counted over the 100 most recent orders, not all 170 in the queue", the COD hint becomes
  "Not yet delivered · at least", and the status-distribution caption reads "newest 100 of
  170". Same rule as risks 15 — a misleading number is worse than an absent one.
- **`/settings` was entirely mock, and one control was a trap** (risks 26). It rendered a fake
  GHN token and shop id, a "Save settings" button that toasted "saved" while writing nothing,
  and an **"Auto sync failed deliveries"** switch defaulted on and wired to nothing. Under
  GHN-FAIL-NTF-01 (risks 23) implementing that label is exactly the loop that would message
  every buyer whose parcel already failed, so the toggle was deleted rather than wired. The
  page now shows what is true — the gateway base URL, whether `NEXT_PUBLIC_GHN_DEMO_MODE` is
  on, and "Backend-only — never sent here" for every carrier secret — plus the no-auto-sync
  policy in prose.
- **Two smaller fixes.** The topbar's green "Webhook listening (mock)" pill claimed a health
  signal the console cannot observe (webhook delivery is backend-side) and sat beside real
  gateway data; it is replaced by an amber **Demo mode** pill, which is a fact the console
  owns and worth flagging because demo controls write real statuses. And `ToastHost` returned
  `null` while empty, so the `aria-live` region and its text were inserted in the same commit
  — routinely missed by screen readers. The container is now always mounted and carries the
  live region; sync and action results are announced nowhere else.
- **Tests:** 9 new Jest cases — 3 in `ShipmentDetail.test.tsx` (no carrier call before
  confirm, backing out via "Keep as is", return confirmed separately), plus new
  `ShipmentStatCards.test.tsx`, `GhnSettingsPage.test.tsx`, `ToastHost.test.tsx`. The four
  existing destructive-action tests now click through a `clickAndConfirm` helper scoped with
  `within(dialog)`, since the dialog repeats the action label. **112 tests / 17 suites**
  (was 103 / 14). Lint, `tsc --noEmit`, and `next build` clean.
- **Runtime-verified** against the dev gateway as `shipping_manager`: the confirm dialog opens
  on a real `delivery_fail` order and **no** `POST .../cancel` appears in the network log after
  backing out; the dashboard shows `2+` / `3+` with the 100-of-170 banner; `/settings` and the
  demo pill render as described. Sync and Apply-demo-status were deliberately not pressed —
  either can notify a real buyer (risks 23).

---

### 2026-09-11 — Sync and demo-status now say they can notify the buyer

Integrates handoff item **GHN-FAIL-NTF-01** (backend, 2026-09-11) and opens risks item **23**
as mitigated. The backend labelled it "no FE code change needed" — true of the contract, and
the entry still described a risk the console owns. FE-only; copy, tests, guidance.

- **What the backend changed.** The first `delivery_fail` an order records now pushes an
  in-app notification to the **buyer** (`type: "order_delivery_attempt_failed"`). Three paths
  trigger it and two are console buttons: `POST .../sync` and `POST .../demo-status`. Both
  responses are byte-identical to before — the send is best-effort and out of band, so nothing
  reports whether it fired. Dedupe is per order across the whole `shipping_history`, and rows
  written before 2026-09-11 count.
- **The audit came first.** Grep-verified that the dangerous shape does not exist:
  `src/lib/queryClient.ts:46-48` sets `staleTime` 60s and `refetchOnWindowFocus: false` with
  **no** `refetchInterval`, there is no bulk control, and sync fires one order per explicit
  click (`GhnSyncPage.tsx:34`, `ShipmentDetail.tsx:332`). Nothing was broken; what was missing
  was any reason for the *next* change not to break it.
- **The sharper finding.** The demo picker offers `delivery_fail` (`GHN_STATUS_ORDER`
  includes it), so a "demo" action writes a real status and sends a real buyer a real
  notification. Only the carrier call is simulated. The handoff entry implied this; it did not
  say it.
- **The fix.** State the consequence where the operator can act on it: an amber note on the
  `/sync` card, a note under "Sync GHN status" rendered **only when a sync action is actually
  offered** (a disabled button warns about nothing), and a warning in the demo block that
  appears when the selected target is `delivery_fail`. Recorded as a rule in
  `.ai/context/domain.md` — never add bulk sync, auto-sync on mount, or a `refetchInterval`
  over the sync endpoint.
- **Tests:** 4 new Jest cases (one in `GhnSyncPage.test.tsx` asserting the warning *and* the
  absence of a "Sync all" control; three in `ShipmentDetail.test.tsx` covering the sync note,
  its absence when `canSync` is false, and the demo warning appearing only after
  `delivery_fail` is selected). **103 Jest tests / 14 suites** (was 99/14); lint + build +
  `tsc --noEmit` clean.
- **Runtime-verified** against the live dev gateway as `shipmgr_test` — all three warnings
  rendered, on `/sync` and on both a `delivery_fail` and a `ready_to_pick` shipment.
  **Sync and Apply were deliberately not pressed**: either could send a real notification to a
  real buyer. The dev list currently holds three orders already at `delivery_fail`, so a
  "Sync all" button would have messaged three buyers in one click.

### 2026-08-29 — `AuthGate` no longer paints protected content for a disallowed role

Closes risks item **22** (moved to §Resolved, number kept) — the second finding of the
2026-08-28 sweep audit. FE-only; one condition and its tests.

- **The gap.** The `/403` redirect lives in an effect, so it decides nothing about the frame
  React has already scheduled. `AuthGate` held its "Checking your session..." state only for
  `!ready || !user`, and a disallowed role is a perfectly non-null `user` — so the console
  shell rendered once, and every page hook under it (`useShipmentList`, `useAnalytics`, …)
  fired a real gateway request before the redirect landed.
- **Why it mattered beyond a flash.** For `shop`/`user` the gateway answers 403 and nothing
  leaks. But it *does* grant generic `admin` read access to `/api/order/admin/ghn/*` — so an
  `admin` briefly saw real shipment rows on the console that is meant to bounce them (that
  bounce is intended; handoff note 2026-08-11). `admin` is explicitly not a GHN console role.
- **The fix.** The render path now holds the same condition the effect acts on:
  `!ready || !user || !isAllowedRole(user.role)`. The general rule, recorded in `auth.md`: a
  redirect decided in an effect never guards anything by itself.
- **Tests:** new `AuthGate.test.tsx` case (protected child absent both before and after the
  `/403` redirect for `shop`, checking state still shown) and a new Playwright test in
  `e2e/role-matrix.spec.ts` that mocks `/me` as `admin` and asserts `/403` **plus an empty
  list of intercepted `/api` reads** — the assertion that would have caught this. 99 Jest
  tests / 14 suites, 12 Playwright specs; lint + build + `tsc --noEmit` clean.
- **Runtime-verified** against the live dev gateway: signed in as `testadmin` (role `admin`)
  at `http://localhost:3013` → landed on `/403` ("Access restricted"), and DevTools recorded
  only `/api/user/me`, `/api/user/login` and the `/403` RSC fetch. No `/api/order/admin/*`
  request at all.

### 2026-08-28 — A gateway 401 now returns the operator to login

Sweep fix for risks item **21** (moved to §Resolved, number kept). Both prescribed backlog
sources were empty — `../.agent-local/frontend-handoff-ghn.md` **Open** has no entries and
`release-gate.md` marks this repo `n/a` — so the sweep audited instead and fixed the top
finding. FE-only; no backend change and no contract change.

- **The gap.** `AuthProvider` calls `/me` exactly once on mount, so a cookie that expires
  during a shift (it is issued `Max-Age=18000`, 5h) was invisible to the guard, and the
  React Query caches never inspected `ApiError.status`. Every screen fell to `ErrorState`'s
  generic "We could not load this data. Try again in a moment." behind a Retry button that
  could only 401 again — and `retry: 1` doubled each one. That contradicts the documented
  rule in `core.md` and `auth.md`: "401 -> redirect to `/login`".
- **Why a pub/sub.** `Providers` builds the query client *above* `AuthProvider`, so the
  caches cannot reach `useAuth()`. New `src/lib/session-expiry.ts` is a ~25-line in-memory
  `Set` of listeners — no new dependency, and nothing is persisted, so the "no identity or
  role hint in browser storage" rule still holds. `queryClient.ts` publishes on a 401 from
  either cache; `AuthProvider` subscribes and clears `user`; the existing `AuthGate` effect
  does the redirect and already appends `?next=<path>`, which `GhnLoginCard` already
  honours — so the login round trip lands the operator back on the screen they lost.
- **Two boundaries worth keeping.** A `403` is the gateway refusing this role or action, not
  an expired session — reporting it would bounce the operator to `/login` and straight back.
  And only the caches publish: `authApi.login`/`me` bypass React Query, so a wrong password
  can never look like an expiry. 4xx also stop retrying — the backend's verdict on that exact
  request does not change on a second try (5xx still retries once).
- **Tests:** new `src/lib/queryClient.test.ts` (5 cases: 401 on a query and on a mutation
  both report; 403 does not; 4xx not retried; 5xx retried once), one new `AuthGate.test.tsx`
  case (expiry mid-session → `/login?next=%2Fshipments`, protected child unmounts), and new
  `e2e/session-expiry.spec.ts` (mocked gateway flips to 401 on a list refetch). 98 Jest tests
  / 14 suites, 11 Playwright specs; lint + build + `tsc --noEmit` clean.
- **Runtime-verified** against the live dev gateway as `shipmgr_test`: loaded `/shipments`
  (167 real orders), cleared the cookie out-of-band via `POST /api/user/logout`, typed in the
  search box to force a refetch → landed on `/login?next=%2Fshipments`; signing back in
  returned to `/shipments`.
- **Left open:** risks item **22** — `AuthGate` renders `children` for one paint before
  redirecting a disallowed role, and the gateway grants generic `admin` read access to
  `/api/order/admin/ghn/*`. Recorded for the next sweep.

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

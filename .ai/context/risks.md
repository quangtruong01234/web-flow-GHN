# Known Risks & Gaps

Living list of current risks and gaps. Item numbers are **stable** — other docs cite them
(`.ai/project.md` cites 6, 14 and 19), so never renumber. Resolved items are compacted into
the closing section: one line each, kept only for the rule they encode.

> Also check `../.agent-local/frontend-handoff-ghn.md` (backend → GHN console inbox,
> machine-local at the `MCR/` root — never commit it): **Open** entries there are
> backend-shipped changes awaiting console integration and count as open backlog
> alongside this file.

Format per item: **Risk -> Impact -> Current status -> Suggested fix -> Owner/area.**

## Open

## 5. `shipper` role must not be created

- **Risk:** Temptation to add a `shipper` role for GHN drivers.
- **Impact:** GHN shippers are external actors on GHN's own app; they never log into
  TryBuy.
- **Current status:** Explicitly excluded.
- **Suggested fix:** Use `logistics_operator` / `shipping_manager` only.
- **Owner/area:** Backend RBAC + frontend auth.

## 8. Port 3002 conflict

- **Risk:** `3002` is used by backend inventory services.
- **Impact:** Using 3002 for this app conflicts when the full backend runs.
- **Current status:** Avoided. This app runs on **3013**.
- **Suggested fix:** Keep dev port 3013. Never hardcode 3002; never kill a process to free a
  port. (Restarting *this app's own* dev server after `next build` wiped its `.next` is the
  one exception - see `.ai/context/testing.md`.)
- **Owner/area:** Frontend dev config.

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

## 18. `ghnDetail.raw` is a backend allow-list

- **Risk:** `raw` passes through a backend allow-list (~43 keys). Anything outside it -
  `shop_id`, `client_id`, warehouse ids, IPs, `transaction_id` - is `undefined`, and GHN
  adds keys without notice.
- **Impact:** None today: the console reads no key out of `raw` (grep-verified 2026-08-12);
  every rendered scalar comes from `ghnDetail`'s top level.
- **Current status:** Documented on the `raw` field in `api/types.ts`.
- **Suggested fix:** Do not start reading `raw.<key>`. If a GHN field is genuinely needed,
  ask the backend to allow-list it rather than parsing a substitute.
- **Owner/area:** Frontend shipment detail.

## 23. Sync and demo-status have a buyer-visible side effect

- **Risk:** GHN-FAIL-NTF-01 (2026-09-11) — the first `delivery_fail` an order records pushes an
  in-app notification to the **buyer**. Two of the three trigger paths are console buttons:
  `POST .../sync` and `POST .../demo-status`. The console therefore owns a customer-facing
  side effect it cannot see: the responses are byte-identical to before and carry no "sent"
  flag.
- **Impact:** A bulk "sync all", an auto-sync on mount, or a `refetchInterval` would message
  every buyer whose parcel GHN has already failed to deliver — in one click, from a screen
  that reads like a refresh. A demo `delivery_fail` reaches a real buyer too; only the carrier
  call is simulated.
- **Current status:** Mitigated 2026-09-11. Audited: no polling anywhere
  (`lib/queryClient.ts:46-48` — `staleTime` 60s, `refetchOnWindowFocus: false`, no
  `refetchInterval`), no bulk control, sync fires one order per explicit click
  (`GhnSyncPage.tsx:34`, `ShipmentDetail.tsx:332`). The consequence is now stated at each
  button — `GhnSyncPage.tsx` sync card, the note under "Sync GHN status", and a warning in the
  demo block when the selected target is `delivery_fail` — and pinned by four Jest tests.
- **Suggested fix:** Keep sync one-per-click. Do not add bulk/auto/interval sync. If a
  "notified the buyer?" indicator is ever wanted, request a field via `backend-handoff.md`;
  never infer it from history wording (see item 6).
- **Owner/area:** Frontend sync + demo controls.

## 27. `/history` is not an audit log

- **Risk:** The nav reads "Action History", but there is no global shipping-history endpoint —
  history is per order (`GET .../orders/:id/history`). The page lists the 50 most recently
  updated orders with their latest GHN status and last sync.
- **Impact:** It cannot answer "who cancelled this yesterday" or "what did this operator do".
  The per-order timeline can; the list cannot, and the label invites the harder question.
- **Current status:** Stated where it matters — the card reads "Recent shipping activity ·
  Latest GHN status per order — open an order for its full timeline", and the limitation is
  recorded at `ActionHistoryPage.tsx:12`. Not misleading in the page itself.
- **Suggested fix:** If an operator-scoped or cross-order audit view is ever wanted, request a
  real endpoint through `../.agent-local/backend-handoff.md`. Do **not** synthesise one by
  fanning out per-order history requests across the list — that is N requests per page view,
  and the list has no actor field to filter on.
- **Owner/area:** Frontend `/history` + backend order service.

## Resolved

Compacted 2026-08-16. Each line keeps the **rule** the item left behind; the full history
is in `handoff/CHANGELOG.md` under the matching date.

1. **Mock auth in `sessionStorage`** - RESOLVED 2026-06-28. The session is an HttpOnly
   cookie; never store identity, role hint, or token in the browser.
2. **Login field mismatch** - RESOLVED 2026-06-28. Auth is `{ username, password }`, not
   email.
3. **`/me` did not return `role`** - RESOLVED 2026-06-28. `/me` is authoritative on reload;
   do not cache the role client-side.
4. **Logistics roles missing in backend RBAC** - RESOLVED 2026-06-28. `logistics_operator`
   and `shipping_manager` exist; routes gate on `ALLOWED_ROLES`, carrier actions do not
   (see 14).
6. **GHN -> local status mapping looked incomplete** - RESOLVED 2026-08-16 (GHN-FAIL-01).
   Backend confirmed it is intended, not a gap: ten GHN statuses deliberately have **no** local
   equivalent, because mapping them would be wrong. `delivery_fail` is a failed *attempt* - GHN
   retries before moving to the return family - so canceling on the first miss would release
   stock for a parcel still out for redelivery; `exception`/`damage`/`lost` need a human
   decision, and restocking goods that no longer exist is worse than waiting. The order simply
   keeps its current local status. Never derive a local status on the client to "fill in" one of
   these; surface them from the **GHN badge** instead (`rawGhnMeta` reds the three that need an
   operator). History rows for these now read "acknowledged; no local equivalent" - the old
   "Unhandled GHN status" wording survives only on rows written before 2026-08-16 and on
   genuinely unknown statuses, so never match that string to infer anything.
7. **CORS / GHN app origin** - RESOLVED 2026-06-28. Dev calls go through the same-origin
   `/api` rewrite so cookies stay first-party; prod names the Vercel origin explicitly and
   the cookie is `SameSite=None; Secure` (backend handoff 2026-08-10). Vercel *preview*
   URLs are still CORS-rejected by design - test on the production URL.
9. **Mock shipment data paths** - RESOLVED 2026-06-28. List/detail/history/sync/actions all
   go through the gateway; the mock context and fixtures were deleted.
10. **Missing action endpoints** - RESOLVED 2026-06-30. Cancel, return, update COD, update
    receiver, demo-status are wired. Delivery-again stays unavailable - GHN drives
    redelivery internally.
13. **Numeric database ids leaked into the console** - RESOLVED 2026-07-17. Public ids
    (`usr_`, `ord_`, `prod_`) are opaque: never parse, numerically sort, or compare them
    with internal keys. Shipment routes validate `^ord_[A-Za-z0-9]{16}$` locally.
14. **Client-side role checks duplicated backend action gating** - RESOLVED 2026-08-12.
    `availableActions` is the single source of truth for carrier actions (the gateway
    filters it by permission **and** order state). When a new action appears, add it to the
    array mapping - never add a role branch beside it. `canSync()` survives only for the
    demo-status control, which has no entry in the array.
15. **Analytics revenue must be hidden, not zeroed** - RESOLVED 2026-08-12. Money fields are
    *absent* for `logistics_operator`, so the view model maps them to `null` and the UI
    hides them. Branch on the field, never on the role; a `0` would read as "earned
    nothing". Applies to every future money field (see 20).
16. **GHN filter enums now 400 instead of an empty 200** - RESOLVED 2026-08-12. Omit a
    cleared filter key instead of sending `""`. The two vocabularies stay apart: GHN accepts
    `cancel` and `cancelled`, the local status is `canceled`; never normalise across them.
17. **GHN failures split across 400 and 503** - RESOLVED 2026-08-12. Branch on `statusCode`
    (400 = refusal, retrying will not help; 503 = outage, retry later) and surface GHN's
    message verbatim. Never pattern-match the envelope's `error` field.
19. **Analytics `topProducts[].productId` keyed React rows** - RESOLVED 2026-08-16
    (IDLEAK-02). The id is opaque and nullable, so it can never key a list row on its own -
    `AnalyticsPanel` falls back to the row index. The wire type stays
    `string | number | null` so a console deployed ahead of the backend still reads the
    legacy numeric id. Runtime-verified against the dev gateway with two `null` rows.
20. **"Top products" claimed a revenue ranking** - RESOLVED 2026-08-16. The backend sorts
    that list `ORDER BY quantitySold DESC` for every role, so the caption is always "By
    quantity sold"; revenue is an extra column, never the sort key. A missing per-row
    revenue renders as `—`, following 15.
21. **A 401 mid-session stranded the console on a generic error** - RESOLVED 2026-08-28. The
    cookie carries a 5h `Max-Age` and `/me` runs only on mount, so an expiry can surface
    *only* through a data request. Any gateway `401` now publishes through
    `lib/session-expiry.ts`; `AuthProvider` drops `user` and the existing `AuthGate` redirect
    carries the path as `?next=`. Two rules follow: a `401` is the only status that means
    "session gone" — a `403` is a role/action refusal and must never bounce to `/login`, or
    the operator loops — and the signal is published from the query/mutation caches only, so
    a wrong password on `authApi.login` (which bypasses React Query) can never masquerade as
    an expiry. 4xx are no longer retried: the backend's verdict on that exact request will
    not change. The signal is in-memory; nothing about the session is persisted (see 1).
22. **`AuthGate` painted protected content while redirecting a disallowed role** - RESOLVED
    2026-08-29. A disallowed role is still a non-null `user`, so gating the spinner on
    `!ready || !user` let the shell render — and its React Query hooks fetch — in the frame
    before `router.replace("/403")` landed. The gateway grants generic `admin` read access to
    `/api/order/admin/ghn/*`, so that frame showed real shipment data to the one role this
    console exists to bounce. The gate now also holds on `!isAllowedRole(user.role)`. Rule: a
    redirect decided in an effect never guards anything by itself — the render path must hold
    the same condition, or one paint escapes.
24. **Cancel and return fired on a single click** - RESOLVED 2026-09-11. Both are one-way at
    the carrier (cancel kills the waybill, return sends the parcel back to the seller) and
    both sat one stray click away, while the two *reversible* waybill edits beside them had
    always had a modal. They now route through a confirm dialog stating the consequence,
    the receiver, and the COD. Rule: irreversibility, not the shape of the input, decides
    whether an action gets a confirm step — a button that only needs a click is the one to
    check.
25. **Dashboard KPIs read as totals but count one page** - RESOLVED 2026-09-11. The cards
    count the ~100 orders the list query returned, not the queue (170 live at the time), so
    "Failed deliveries: 3" invited "only 3 failed" when 3 was a floor. There is no
    per-status count endpoint, so the scope is stated instead of guessed: counts carry a
    `+` and a banner names the window, and the status-distribution caption reads "newest N
    of M". Follows 15 — under-reporting silently is the same fault as zeroing.
26. **`/settings` shipped mock controls, including an auto-sync toggle** - RESOLVED
    2026-09-11. The page rendered a fake GHN token/shop id, a "Save settings" button that
    toasted "saved" while saving nothing, and an "Auto sync failed deliveries" switch
    defaulted **on** and wired to nothing. Under 23 that label describes the one loop the
    console must never have, so the toggle was deleted rather than implemented and the page
    now states the policy. Rule: never render a control for a capability the console does
    not have — a placeholder with a plausible label is a specification someone will
    eventually satisfy.

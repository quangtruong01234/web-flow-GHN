# TryBuy GHN Logistics Web - Shared Agent Guidance

Canonical guidance for every AI agent working in this repository.

**TryBuy GHN Console** is a standalone **Next.js 15 (App Router) + React 19 + TypeScript**
web app for GHN logistics operations. Light logistics-console theme. Package manager:
**npm**. Dev port: **3013**.

This is **not** the main TryBuy customer/social-commerce frontend, and **not** the main
TryBuy admin dashboard. It is a dedicated GHN/logistics operations console where logistics
users view GHN orders, view local order + GHN shipment detail, view shipping history/timeline,
manually sync GHN status through the backend, and handle supported GHN actions
(sync, cancel, return, update COD, update receiver info, and demo-status when enabled).

## Mandatory bootstrap

Before repository work, read these files completely:

1. `.ai/project.md` (this file)
2. `.ai/context/core.md`
3. `.ai/context/domain.md`

Treat every rule in those files as active project guidance.

## Current state

- Implemented routes: `/`, `/login`, `/dashboard`, `/shipments`, `/shipments/[orderId]`,
  `/sync`, `/history`, `/settings`, `/403`, not-found.
- Auth is wired to the gateway with the **HttpOnly cookie flow** and
  `credentials: "include"`: `POST /api/user/login`, `GET /api/user/me`,
  `POST /api/user/logout`.
- Shipment list/detail/history and manual sync are wired to the gateway GHN endpoints
  through TanStack Query and the local API client.
- Auth and GHN shipment contracts use backend-issued opaque public ids (`usr_...`,
  `ord_...`, and nullable `prod_...`) without numeric parsing.
- Backend `logistics_operator` / `shipping_manager` roles, grants, and test accounts exist
  for this console.
- Manual GHN cancel, return, update COD, update receiver info, and demo-status are wired
  to backend gateway routes and driven by `availableActions` / demo-mode gating.
  Delivery-again is intentionally not available.
- **Carrier actions are gated by `availableActions` alone** — the gateway filters that array
  by permission *and* by order state, so the console adds no role check beside it. The
  demo-status control is the one exception (no entry in the array). See risks.md item 14.
- Backend contract batch **BATCH-0812** is integrated: GHN-ACT-01, GHN-RAW-01, GHN-HIST-01,
  GHN-RBAC-01, GHN-ENUM-01 and the RESIL-01 400/503 error split. Analytics money fields are
  nullable and hidden (never zeroed) when the backend omits them; cleared list filters are
  omitted from the query; `history[].actorId` accepts legacy numeric ids. See
  `handoff/CHANGELOG.md` 2026-08-12.
- The business analytics dashboard (`GET /api/order/admin/analytics`) is wired on
  `/dashboard` (`AnalyticsPanel`): summary KPIs, revenue over time, status distribution,
  top products. Readable by `logistics_operator` — do not gate it behind
  `shipping_manager`.
- Backend contract **IDLEAK-02** is integrated: analytics `topProducts[].productId` is an
  opaque `prod_...` id, `null` when the product does not resolve, and still accepted as a
  legacy number on the wire. It must never key a list row on its own — `AnalyticsPanel`
  falls back to the row index. See `handoff/CHANGELOG.md` 2026-08-16 and risks.md item 19.
- Backend decision **GHN-FAIL-01**: ten GHN statuses (`delivery_fail`, `exception`, `damage`,
  `lost`, …) deliberately have **no** local status — the order keeps its current one. Never
  derive a local status on the client to fill the gap, and never string-match the history
  message `Unhandled GHN status` (forward-only wording change). `exception`/`damage`/`lost`
  surface as a red GHN pill via `rawGhnMeta()`. See `handoff/CHANGELOG.md` 2026-08-16 and
  risks.md item 6.
- A gateway `401` ends the session client-side: the query/mutation caches publish through
  `lib/session-expiry.ts`, `AuthProvider` drops `user`, and `AuthGate` redirects to
  `/login?next=<path>`. A `403` must never do this — it is a role/action refusal, and
  bouncing to login would loop. See `handoff/CHANGELOG.md` 2026-08-28 and risks.md item 21.
- `AuthGate` holds its checking state for `!ready || !user || !isAllowedRole(user.role)`.
  The `/403` redirect lives in an effect, so the render path must repeat the condition or a
  disallowed role paints the shell — and fires its gateway reads — for one frame. See
  `handoff/CHANGELOG.md` 2026-08-29 and risks.md item 22.
- Backend decision **GHN-FAIL-NTF-01**: sync is no longer a read-only action. The first
  `delivery_fail` an order records notifies the **buyer**, and two of the three trigger paths
  are console buttons (`POST .../sync`, `POST .../demo-status`). Both responses are unchanged
  and carry no "sent" flag. **Never add bulk sync, auto-sync on mount, or a `refetchInterval`**
  over the sync endpoint, and remember a demo `delivery_fail` notifies a real buyer — only the
  carrier call is simulated. See `handoff/CHANGELOG.md` 2026-09-11 and risks.md item 23.
- Cancel and return are irreversible at the carrier, so both go through a confirm dialog
  before anything is sent; the reversible waybill edits keep their own modals. Dashboard KPI
  cards count the fetched page, not the queue — when `total` is larger they render `N+` and
  a banner names the window. `/settings` holds no inputs: it states the gateway base URL, the
  demo flag, "backend-only" for every carrier secret, and the no-auto-sync policy. See
  `handoff/CHANGELOG.md` 2026-09-11 and risks.md items 24-26.
- Validation baseline: `npm.cmd run lint`, `npm.cmd run build`, `npx.cmd tsc --noEmit`,
  `npm.cmd test` (Jest, 112 tests / 17 suites), `npx.cmd playwright test` (12 specs).

## Next task order

1. **Done** - connect login/logout/me:
   - `POST /api/user/login`
   - `POST /api/user/logout`
   - `GET /api/user/me`
2. **Done** - backend `logistics_operator` / `shipping_manager` roles, grants, and test accounts.
3. **Done** - connect read-only shipment list / detail / history APIs.
4. **Done** - connect the manual GHN sync endpoint.
5. **Done** - manual GHN actions:
   - **Done**: cancel + return + update COD + update receiver info.
   - **Not available**: delivery-again (GHN drives redelivery internally).
6. **Done** - demo-status endpoint for end-to-end demo status control:
   - FE hook/API/control is wired.
   - UI is hidden unless `NEXT_PUBLIC_GHN_DEMO_MODE=true`.
   - Backend still requires `GHN_DEMO_ENDPOINTS_ENABLED=true`; disabled environments return
     `403` and should be shown as "demo not enabled", not treated as authz failure.

## Context Map - read the relevant file when the task touches it

| When your task involves...                                              | Read                           |
| ----------------------------------------------------------------------- | ------------------------------ |
| Folder layout, App Router routes, where to put a new file               | `.ai/context/structure.md`     |
| Tailwind classes, design tokens, `cn()`, light theme, layout/UI bugs    | `.ai/context/styling.md`       |
| Login, logout, auth state, roles, route guards, 401/403 handling        | `.ai/context/auth.md`          |
| Calling the backend, fetch wrapper, API gateway boundary, env vars      | `.ai/context/data-fetching.md` |
| Components, forms, naming conventions, TypeScript rules, `NEXT_PUBLIC_*` | `.ai/context/conventions.md`   |
| Shipment/GHN status semantics, what is backend-owned, what is mock      | `.ai/context/domain.md`        |
| Verifying a change, manual QA checklist, no-new-test-runner rule        | `.ai/context/testing.md`       |
| End-to-end flows (login, console, sync, roles, error/empty/loading)     | `.ai/context/flows.md`         |
| Known risks / gaps / not-yet-wired pieces                               | `.ai/context/risks.md`         |
| Commit workflow / `$commit`                                             | `.ai/context/git-workflow.md`  |
| Weekly backlog sweep / `$sweep` (fix top backlog item, audit, propose)  | `.ai/workflows/sweep.md`       |

## References (read-only)

- `handoff/snapshot.md` - merged historical snapshot: the original implementation plan
  for this app + patterns to reuse from the main TryBuy frontend. Read it before adding
  API, auth, routing, styling, or shared utility patterns.
- `handoff/CHANGELOG.md` - log of done tasks for this console (newest first).
- `handoff/design-reference.md` - design context, if present.
- `TryBuy Shipping Dashboard/GHN Shipping Control Panel.dc.html` - Claude Design source,
  visual reference only.
  - `TryBuy Shipping Dashboard/support.js` is generated preview runtime. Never import or
    execute it.
- Main TryBuy frontend, pattern source - **do not modify**:
  `C:\Users\Quang Truong\Desktop\MCR\frontend`
- Backend repo - **do not modify unless the task explicitly says backend**:
  `C:\Users\Quang Truong\Desktop\MCR\api`
- Do **not** use or recreate a `web/` subfolder. The app lives at the repo root.

## Maintenance

Update shared guidance only in `.ai/`. Do not duplicate it into `AGENTS.md` or `.claude/`.

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
- Backend `logistics_operator` / `shipping_manager` roles, grants, and test accounts exist
  for this console.
- Manual GHN cancel, return, update COD, update receiver info, and demo-status are wired
  to backend gateway routes and driven by `availableActions` / demo-mode gating.
  Delivery-again is intentionally not available.
- Validation baseline: `npm.cmd run lint`, `npm.cmd run build`, `npx.cmd tsc --noEmit`.

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

## References (read-only)

- `handoff/ghn-next-admin-plan.md` - implementation plan for this app.
- `handoff/frontend-reference.md` - patterns to reuse from the main TryBuy frontend.
  Read it before adding API, auth, routing, styling, or shared utility patterns.
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

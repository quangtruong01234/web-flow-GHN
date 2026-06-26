# TryBuy GHN Logistics Web — Shared Agent Guidance

Canonical guidance for every AI agent working in this repository.

**TryBuy GHN Console** — a standalone **Next.js 15 (App Router) + React 19 + TypeScript**
web app for GHN logistics operations. Light logistics-console theme. Package manager: **npm**.
Dev port: **3013**.

This is **not** the main TryBuy customer/social-commerce frontend, and **not** the main
TryBuy admin dashboard. It is a dedicated GHN/logistics operations console where logistics
users view GHN orders, view local order + GHN shipment detail, view shipping history/timeline,
manually sync GHN status through the backend, and (later) handle GHN actions
(cancel, return, delivery again, update COD, update receiver info).

## Mandatory bootstrap

Before repository work, read these files completely:

1. `.ai/project.md` (this file)
2. `.ai/context/core.md`
3. `.ai/context/domain.md`

Treat every rule in those files as active project guidance.

## Current state

- **Prompt 2** implemented the UI with **mock data only** — no backend/API calls yet.
- Implemented routes: `/`, `/login`, `/dashboard`, `/shipments`, `/shipments/[orderId]`, `/sync`, `/history`, `/settings`, `/403`, not-found.
- Validation green: `npm.cmd run lint`, `npm.cmd run build`, `npx.cmd tsc --noEmit`.
- **Backend Phase 1 + 1.1 are done** — the GHN endpoints already exist on the gateway (see `.ai/context/data-fetching.md`). Connecting them is sequenced below, not blocked by missing backend.
- Auth uses the **HttpOnly cookie flow** with `credentials: "include"` — no JWT in browser storage.

## Next task order (follow this sequence)

1. **Prompt 3** — connect **login/logout/me only**:
   - `POST /api/user/login` · `POST /api/user/logout` · `GET /api/user/me`
   - Do **not** connect shipment list/detail/sync/history APIs in this step.
2. Add backend `logistics_operator` / `shipping_manager` role + grants + a test account (backend task — see the role gap in `.ai/context/auth.md`).
3. Connect **read-only** shipment list / detail / history APIs.
4. Connect the **sync** endpoint.
5. Implement GHN actions: cancel, return, delivery again, update COD, update receiver/order info, plus the action enable/disable matrix.
6. Add a demo-status endpoint if needed for end-to-end demo status control.

## Context Map — read the relevant file when the task touches it

> These are NOT auto-loaded (to save context). Read the file when your task matches.

| When your task involves...                                              | Read                          |
| ----------------------------------------------------------------------- | ----------------------------- |
| Folder layout, App Router routes, where to put a new file               | `.ai/context/structure.md`    |
| Tailwind classes, design tokens, `cn()`, light theme, layout/UI bugs    | `.ai/context/styling.md`      |
| Login, logout, auth state, roles, route guards, 401/403 handling        | `.ai/context/auth.md`         |
| Calling the backend, fetch wrapper, API gateway boundary, env vars      | `.ai/context/data-fetching.md`|
| Components, forms, TypeScript rules, `NEXT_PUBLIC_*` env                 | `.ai/context/conventions.md`  |
| Shipment/GHN status semantics, what is read-only, what is mock          | `.ai/context/domain.md`       |

## References (read-only)

- `handoff/ghn-next-admin-plan.md` — the implementation plan for this app (read first).
- `handoff/frontend-reference.md` — patterns to reuse from the main TryBuy frontend.
  Read it before adding API, auth, routing, styling, or shared utility patterns.
- `handoff/design-reference.md` — design context, if present.
- `TryBuy Shipping Dashboard/GHN Shipping Control Panel.dc.html` — Claude Design source, **visual reference only**.
  - `TryBuy Shipping Dashboard/support.js` is generated preview runtime — **never import or execute it**.
- Main TryBuy frontend, pattern source — **do not modify**: `C:\Users\Quang Truong\Desktop\MCR\frontend`
- Backend repo — **do not modify unless the task explicitly says backend**: `C:\Users\Quang Truong\Desktop\MCR\api`
- Do **not** use or recreate a `web/` subfolder — the app lives at the repo root; the old `web/` was deleted.

## Maintenance

Update shared guidance only in `.ai/`. Do not duplicate it into `AGENTS.md` or `.claude/`.

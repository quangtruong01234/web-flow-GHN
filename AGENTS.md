# TryBuy GHN Logistics Web — Agent Guidance

Shared agent guidance lives in `.ai/`, the canonical, tool-neutral source for every AI
agent (Codex, Claude Code, and others) working in this repo.

## Mandatory bootstrap

Before repository work, read these files completely:

1. `.ai/project.md`
2. `.ai/context/core.md`
3. `.ai/context/domain.md`

Treat every rule in those files as active project guidance.

## Context routing

Load the matching source before acting:

- Folder layout, App Router routes, where to put a new file → `.ai/context/structure.md`
- Tailwind classes, design tokens, `cn()`, light theme → `.ai/context/styling.md`
- Login, logout, auth state, roles, route guards → `.ai/context/auth.md`
- Backend calls, API gateway boundary, env vars → `.ai/context/data-fetching.md`
- Components, TypeScript, `NEXT_PUBLIC_*` env → `.ai/context/conventions.md`
- GHN shipment/status semantics (read-only), mock vs. real → `.ai/context/domain.md`

## At a glance

- Standalone **Next.js 15 (App Router) + React 19 + TypeScript** GHN logistics console; source at the repo root.
- Dev port **3013** (use `npm.cmd run dev` on Windows if `npm.ps1` is blocked). Never use port `3002`.
- Backend access through the **TryBuy Gateway only** (`http://localhost:3000/api`); never call GHN directly; carrier secrets stay backend-only. Backend repo `C:\Users\Quang Truong\Desktop\MCR\api` — do not modify unless the task says backend.
- Backend Phase 1 + 1.1 are **done**: GHN list/detail/sync/history endpoints exist under `/api/order/admin/ghn/...` (available, connect in sequence — see `.ai/context/data-fetching.md`).
- Roles: `logistics_operator`, `shipping_manager` (no generic `admin`, no `shipper`). Those roles aren't in the backend yet — API testing may temporarily use `admin`; never hardcode `admin` as the production role (`.ai/context/auth.md`).
- Current phase: UI mock-data only; Prompt 3 connects auth (`/user/login|logout|me`) only — no shipment/GHN APIs yet.
- App lives at the repo root — do not recreate a `web/` subfolder. Validate with `npm.cmd run lint`, `npm.cmd run build`, `npx.cmd tsc --noEmit`.
- `TryBuy Shipping Dashboard/` is a visual reference export (`support.js` must never be imported/executed); see `handoff/frontend-reference.md` and `handoff/ghn-next-admin-plan.md`.

## Maintenance

Update shared guidance only in `.ai/`. Keep tool-specific config in `.claude/`. Do not
duplicate shared rules into this file beyond the routing pointers above.

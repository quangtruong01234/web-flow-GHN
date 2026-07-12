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
- GHN shipment/status semantics (backend-owned), mock vs. real → `.ai/context/domain.md`
- Verifying a change, manual QA checklist, no-new-test-runner rule → `.ai/context/testing.md`
- End-to-end flows (login, console, sync, roles, error/empty/loading) → `.ai/context/flows.md`
- Known risks / gaps / not-yet-wired pieces → `.ai/context/risks.md`
- Commit workflow / `$commit` → `.ai/context/git-workflow.md`

## Repo skills

- `$commit`: create scoped local commits. Read `.ai/context/git-workflow.md` first, group
  files by scope, commit locally only, and never push.
- `$sweep`: weekly backlog sweep. Read `.ai/workflows/sweep.md` first, then fix the top
  open item(s) from `.ai/context/risks.md` + `../.agent-local/frontend-handoff-ghn.md`
  end-to-end (`$sweep`, `$sweep 3`), audit-only (`$sweep audit`), or propose features
  (`$sweep propose`).

## At a glance

- Standalone **Next.js 15 (App Router) + React 19 + TypeScript** GHN logistics console; source at the repo root.
- Dev port **3013** (use `npm.cmd run dev` on Windows if `npm.ps1` is blocked). Never use port `3002`.
- Backend access through the **TryBuy Gateway only** (`http://localhost:3000/api`); never call GHN directly; carrier secrets stay backend-only. Backend repo `C:\Users\Quang Truong\Desktop\MCR\api` — do not modify unless the task says backend.
- Auth (login/me/logout, HttpOnly cookie), shipment list/detail/history, manual sync, cancel/return/update-COD/update-receiver, and demo-status are **wired to the gateway** (`/api/order/admin/ghn/...` — see `.ai/context/data-fetching.md`). Delivery-again is intentionally not available.
- Roles: `logistics_operator`, `shipping_manager` exist in the backend with test accounts (no generic `admin` as the production role, no `shipper` — `.ai/context/auth.md`).
- App lives at the repo root — do not recreate a `web/` subfolder. Validate with `npm.cmd run lint`, `npm.cmd run build`, `npx.cmd tsc --noEmit`.
- `TryBuy Shipping Dashboard/` is a visual reference export (`support.js` must never be imported/executed); see `handoff/snapshot.md`. Done tasks are logged in `handoff/CHANGELOG.md`.

## Maintenance

Update shared guidance only in `.ai/`. Keep tool-specific config in `.claude/`. Do not
duplicate shared rules into this file beyond the routing pointers above.

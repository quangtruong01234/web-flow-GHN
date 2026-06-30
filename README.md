# TryBuy GHN Logistics Web

A standalone **Next.js 15 (App Router) + React 19 + TypeScript** web app — the **TryBuy
GHN Console** for logistics operations. Logistics users view GHN orders, view local order
+ GHN shipment detail, view shipping history/timeline, manually sync GHN status through the
backend, and handle supported GHN actions. Cancel, return, update COD, and update receiver
info are wired; demo-status is available for local/demo builds when both frontend and
backend demo flags are enabled.

Light logistics-console theme. This is **not** the main TryBuy customer frontend and **not**
the main TryBuy admin dashboard.

> **Status:** Auth, shipment list/detail/history, manual sync, cancel, return, update COD,
> update receiver info, and demo-status are wired through the TryBuy gateway. See
> `.ai/project.md` for the current task order.

## Requirements

- Node.js (with npm). Dev server runs on **port 3013**.

> On Windows, if `npm.ps1` is blocked by PowerShell policy, use the `.cmd` variants shown
> below (`npm.cmd` / `npx.cmd`).

## Install

```bash
npm install        # or: npm.cmd install
```

## Run (development)

```bash
npm run dev        # or: npm.cmd run dev   → http://localhost:3013
```

## Build & start (production)

```bash
npm run build      # or: npm.cmd run build
npm run start      # or: npm.cmd run start → serves on port 3013
```

## Verify

```bash
npm run lint                  # next lint
npm run typecheck             # tsc --noEmit
npm test                      # jest unit tests
npm run e2e                   # Playwright smoke tests
# equivalently:
npx tsc --noEmit              # or: npx.cmd tsc --noEmit
```

Details and a manual QA checklist live in `.ai/context/testing.md`.

## Environment

- Copy `.env.example` to `.env.local` and fill it in. Only `NEXT_PUBLIC_*` vars are exposed
  to the browser.
- `NEXT_PUBLIC_API_URL` points at the TryBuy gateway (`http://localhost:3000/api`) — the
  only backend this app may call.
- **Never commit `.env*` files** (they are git-ignored; only `.env.example` is tracked).
  GHN token / shop id / webhook secret must stay backend-only and must never appear here.

## AI coding context

This repo carries first-class guidance for AI coding agents. **Read it before changing
code:**

- **`AGENTS.md`** — entry point / routing for any AI agent (Codex, Claude Code, others).
- **`.claude/CLAUDE.md`** — Claude Code adapter (imports the always-loaded rules).
- **`.ai/`** — the canonical, tool-neutral guidance:
  - `.ai/project.md` — overview, current phase, task order, and the Context Map.
  - `.ai/context/core.md` — always-loaded hard rules (incl. Git & commits, verification).
  - `.ai/context/{structure,styling,auth,data-fetching,conventions,domain,testing,flows,risks}.md`
    — loaded by task area.

Shared rules live in `.ai/` only; `AGENTS.md` and `.claude/CLAUDE.md` are thin adapters
that route to it.

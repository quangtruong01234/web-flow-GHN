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

## CI/CD

CI runs on GitHub Actions (`.github/workflows/ci.yml`) for every push to `main` and every
PR into `main`:

| Job | What it runs |
| --- | ------------ |
| `verify` | `lint` → `typecheck` → `test` (Jest) → `build`, sequential |
| `e2e` | Playwright against a self-started dev server (specs mock the gateway, so no backend is needed); uploads the HTML report as an artifact |
| `deploy` | Vercel — **only after `verify` and `e2e` pass**. `main` → production, PR → preview URL commented on the PR |

Deploy target is **Vercel** (Hobby/free): it is the Next.js first-party platform, so
`rewrites()`, SSR, and route handlers work with no adapter. `vercel.json` pins the function
region to `sin1` (Singapore) and turns Vercel's own Git auto-deploy off so the gated
Actions workflow is the single deploy path.

### One-time Vercel setup

Without these secrets CI still runs in full — the `deploy` job just skips.

```bash
npx vercel login
npx vercel link          # creates .vercel/project.json (git-ignored)
```

Then add three GitHub repo secrets (Settings → Secrets and variables → Actions):

| Secret | Where to get it |
| ------ | --------------- |
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens — scope **All Projects** |
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` |

> The token scope matters. A token scoped to a single project cannot read the project
> settings `vercel pull` needs, and the deploy job fails with the misleading
> `Could not retrieve Project Settings. To link your Project, remove the '.vercel'
> directory and deploy again` — which points at a local directory that has nothing to do
> with it.

### Deployed environment variables

Set these in the Vercel project (Settings → Environment Variables), **not** in git:

| Var | Value | Exposed to browser? |
| --- | ----- | ------------------- |
| `NEXT_PUBLIC_API_URL` | `/api` | yes |
| `API_PROXY_TARGET` | public origin of the TryBuy gateway | no |
| `NEXT_PUBLIC_GHN_DEMO_MODE` | omit in production; `true` only on a demo deploy | yes |

> **All of these must be non-sensitive.** CI builds with `vercel pull` + `vercel build`,
> and a variable marked *Sensitive* downloads as the literal string `[SENSITIVE]` — the
> real value only exists when Vercel builds on its own infrastructure. A sensitive
> `NEXT_PUBLIC_API_URL` gets inlined into the client bundle as `[SENSITIVE]`; a sensitive
> `API_PROXY_TARGET` produces a broken rewrite destination. Recent Vercel CLI versions
> default to sensitive, so add them explicitly:
>
> ```bash
> vercel env add API_PROXY_TARGET production --no-sensitive --value "https://gateway.example.com"
> ```
>
> Verify with `vercel pull --environment=preview` and read `.vercel/.env.preview.local`;
> the real value must be there. None of these are secrets — `NEXT_PUBLIC_*` ship to the
> browser anyway, and `API_PROXY_TARGET` is just a public hostname.

> **The deployed app needs a publicly reachable gateway.** `API_PROXY_TARGET` defaults to
> `http://localhost:3000`, which does not exist on Vercel — until the gateway has a public
> URL, a deployed build renders but every `/api/*` call fails. GHN token / shop id /
> webhook secret stay backend-only and must never be added here.

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

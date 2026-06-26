# Core Rules — Always Loaded

These are the non-negotiable rules. Violating any of these breaks the build or the
conventions. Full patterns live in the other `context/` files — read them when your
task touches that area.

## AI Agent Behavior

- **Never ask the user to paste logs, run commands, or check things manually** — read files and run commands yourself.
- **Never stop after one failed command** — try the alternative immediately (e.g. `npm.cmd` if `npm.ps1` is blocked on Windows).
- **Gather evidence first, then fix** — don't describe a problem and wait.
- **Minimal diff** — change only what's needed. No drive-by refactors outside `src/features/ghn-shipping` and the shared `src/` primitives the task touches.
- **Search before creating** — no duplicate components/hooks/utils. Check `src/components/ui/` and the feature folder first.
- **Always inspect the current source before editing.** Prefer a **minimal diff**; do not refactor unrelated files.
- **Do not modify the backend** (`C:\Users\Quang Truong\Desktop\MCR\api`) or the main frontend (`C:\Users\Quang Truong\Desktop\MCR\frontend`) unless the task explicitly says so.
- **After every change (Windows-safe commands, run from the repo root):**
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `npx.cmd tsc --noEmit`
  - Never mark done with lint or TS errors. (Use `npm.cmd`/`npx.cmd` when `npm.ps1` is blocked by PowerShell policy.)

## Stack (versions matter)

Next.js **15** (App Router) · React **19** · TypeScript strict · Tailwind **v3**.
No `react-router-dom`, no Vite, no TanStack Query (yet). Do not import any of them.

- Path alias: `@/*` → `./src/*`.
- The app lives at the **repo root**. Do not use or recreate a `web/` subfolder (the old `web/` was deleted).
- Dev URL is `http://localhost:3013` (`npm.cmd run dev`). Never use port `3002`; `3000` is the backend gateway, not this app.

## App Router — hard rules

- Routes live under `src/app`. Route files stay **thin** — delegate to feature components in `src/features/ghn-shipping/components`.
- Protected pages live under the `src/app/(app)` route group, guarded by `AuthGate`.
- Navigate with `next/link` `<Link>` and `next/navigation` `useRouter()` — never `window.location`.
- Add `"use client"` only to components that need state/effects/context. Keep server components the default where possible.
- Details + folder map → `.ai/context/structure.md`.

## API & data boundary — hard rules

- All backend access goes through the **TryBuy Gateway only**: `http://localhost:3000/api`.
- The frontend must **never** call GHN directly.
- GHN API token, shop ID, webhook secret, and other carrier secrets stay **backend-only** — never expose them to the browser.
- Current phase connects **auth endpoints only** (`/user/login`, `/user/logout`, `/user/me`). Do **not** connect shipment/order/GHN APIs yet.
- Details → `.ai/context/data-fetching.md`.

## Auth — hard rules

- HttpOnly cookie session + `credentials: "include"`. **Never** store a real JWT/token in `localStorage`/`sessionStorage`.
- Read auth state via `useAuth()` from `@/context/AuthContext` — never read storage directly in components.
- Target roles are `logistics_operator` and `shipping_manager`. Do **not** use generic `admin` long-term, and do **not** create a `shipper` role.
- 401 → redirect to `/login`. Unauthorized role → `/403`.
- Details → `.ai/context/auth.md`.

## Styling — hard rules

- Tailwind utility classes only. No inline `style={{}}`, no `.module.css` (only `globals.css`).
- Use the design tokens from `tailwind.config.ts` (`brand-*`, `ink-*`, `line`, `canvas`, `shadow-card`) — no raw hex, no random palette colors.
- Conditional classes via `cn()` from `@/lib/cn` — not template-literal string concatenation.
- This app is a **light** logistics console — do not port the main frontend's dark marketplace theme.
- Details → `.ai/context/styling.md`.

## TypeScript — hard rules

- Strict mode. No `any`. No `!` non-null assertion. No `@ts-ignore`.
- `catch (error: unknown)` then narrow.
- Explicit return types on non-trivial exported functions.
- Domain types live in `src/features/ghn-shipping/types.ts` — reuse, don't redeclare.

## Domain — the one rule that matters most

GHN status is **READ-ONLY** in this UI. Never present a manual `delivered`/`completed`
mutation as real. See `.ai/context/domain.md` before touching any status logic.

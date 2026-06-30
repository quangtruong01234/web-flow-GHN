# Core Rules - Always Loaded

These are the non-negotiable rules. Violating any of these breaks the build or the
conventions. Full patterns live in the other `context/` files - read them when your task
touches that area.

## AI Agent Behavior

- Never ask the user to paste logs, run commands, or check things manually. Read files and
  run commands yourself.
- Never stop after one failed command. Try the alternative immediately, such as
  `npm.cmd` if `npm.ps1` is blocked on Windows.
- Gather evidence first, then fix.
- Keep diffs minimal. Change only what is needed.
- Search before creating. No duplicate components/hooks/utils.
- Always inspect the current source before editing.
- Do not modify the backend (`C:\Users\Quang Truong\Desktop\MCR\api`) or the main frontend
  (`C:\Users\Quang Truong\Desktop\MCR\frontend`) unless the task explicitly says so.
- After every change, run from the repo root:
  - `npm.cmd run lint`
  - `npm.cmd run build`
  - `npx.cmd tsc --noEmit`
- Never mark done with lint, build, or TypeScript errors. Verification details live in
  `.ai/context/testing.md`.

## Git & commits

- Never commit unless the user explicitly requests it.
- Never push unless the user explicitly requests it.
- Never force-push under any circumstances.
- Never amend or rewrite Git history unless the user explicitly requests it.
- Never create or switch branches unless the user explicitly requests it.
- Always summarize changed files at the end so the user can review before deciding to commit.

## Stack

Next.js **15** (App Router), React **19**, TypeScript strict, Tailwind **v3**.
Installed libs: **@tanstack/react-query** v5, **zustand** v5 (only when justified),
**clsx** + **tailwind-merge** via `cn()`, and **lucide-react**.

- No `react-router-dom`, no Vite.
- No new dependency without asking.
- Path alias: `@/*` -> `./src/*`.
- The app lives at the repo root. Do not use or recreate a `web/` subfolder.
- Dev URL is `http://localhost:3013` (`npm.cmd run dev`).
- Never use port `3002`; `3000` is the backend gateway.

## App Router

- Routes live under `src/app`. Route files stay thin and delegate to feature components in
  `src/features/ghn-shipping/components`.
- Protected pages live under the `src/app/(app)` route group, guarded by `AuthGate`.
- Navigate with `next/link` `<Link>` and `next/navigation` `useRouter()`. Never use
  `window.location`.
- Add `"use client"` only to components that need state/effects/context.
- Details: `.ai/context/structure.md`.

## API & data boundary

- All backend access goes through the **TryBuy Gateway only**.
- The frontend must **never** call GHN directly.
- GHN API token, shop ID, webhook secret, and other carrier secrets stay backend-only.
- Auth, shipment list/detail/history, manual sync, cancel, return, update COD, update
  receiver info, and demo-status are wired through the gateway.
- Delivery-again must not be built; GHN drives redelivery internally. Demo-status must stay
  hidden unless `NEXT_PUBLIC_GHN_DEMO_MODE=true`, and a backend `403` disabled response
  should be surfaced as "demo not enabled in this environment".
- Details: `.ai/context/data-fetching.md`.

## Auth

- HttpOnly cookie session + `credentials: "include"`.
- Never store a real JWT/session token in `localStorage` or `sessionStorage`.
- Read auth state via `useAuth()` from `@/context/AuthContext`.
- Target roles are `logistics_operator` and `shipping_manager`.
- Do not use generic `admin` as the production GHN role, and do not create a `shipper` role.
- 401 -> redirect to `/login`. Unauthorized role -> `/403`.
- Details: `.ai/context/auth.md`.

## Styling

- Tailwind utility classes only.
- No inline `style={{}}`, no `.module.css` except global CSS.
- Use design tokens from `tailwind.config.ts` (`brand-*`, `ink-*`, `line`, `canvas`,
  `shadow-card`). No raw hex/random palettes.
- Conditional classes via `cn()` from `@/lib/cn`.
- This app is a light logistics console.
- Do not hand-roll accessibility-critical complex UI. Ask before adding shadcn/ui.
- Details: `.ai/context/styling.md`.

## TypeScript

- Strict mode. No `any`. No `!` non-null assertion. No `@ts-ignore`.
- Use `catch (error: unknown)` then narrow.
- Explicit return types on non-trivial exported functions.
- Domain types live in `src/features/ghn-shipping/types.ts`; reuse them.

## Domain

GHN status is **backend-owned**: it changes only when the backend records an authoritative
event (a GHN webhook, a sync response, a supported action response, or the approved
demo-status endpoint). The frontend never calls GHN directly (carrier token/secrets stay
backend-only) and never invents a status the backend did not return — but it *may* drive a
status change through the backend, exactly like a webhook does. The demo-status endpoint is
a first-class status source standing in for the webhook in this no-real-shipper project. See
`.ai/context/domain.md` before touching status logic.

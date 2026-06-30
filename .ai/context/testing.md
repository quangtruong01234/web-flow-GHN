# Testing & Verification

Read this before claiming work is done.

## Current runners

- Scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `e2e`,
  `e2e:ui`.
- Jest + Testing Library run unit tests at `src/**/*.test.{ts,tsx}` via `npm.cmd test`.
- Playwright runs E2E specs in `e2e/` via `npm.cmd run e2e`.
- Playwright config auto-starts the dev server on port 3013.

Verification = **lint + build + typecheck + Jest** on every change, plus Playwright E2E for
flow changes, plus manual QA when a gateway is available.

## Hard rule - use installed runners

Use Jest and Playwright. Do not add another test runner or testing dependency without
asking.

## Test accounts

When a test needs a logged-in session against the real gateway, use the shared accounts in
`C:\Users\Quang Truong\Desktop\MCR\.agent-local\test-accounts.md` (machine-local, outside
both git repos). Never invent credentials and never hardcode passwords in committed test
files.

| Account          | Role                 | Use for                                                                |
| ---------------- | -------------------- | ---------------------------------------------------------------------- |
| `logistics_test` | `logistics_operator` | read-only screens; sync must be hidden, disabled, or 403               |
| `shipmgr_test`   | `shipping_manager`   | read + manual sync for eligible shipments                              |
| `testadmin`      | `admin`              | temporary legacy compatibility only; never the production GHN role      |

Passwords live in the accounts file. Pass them through env vars such as `E2E_USERNAME` and
`E2E_PASSWORD` from git-ignored local env. A `logistics_operator` hitting sync must get
403 if the request is attempted.

## Standard verification checklist

Run from the repo root:

```bash
npm.cmd run lint
npm.cmd run build
npx.cmd tsc --noEmit
npm.cmd test
```

Never mark work done with lint, build, TypeScript, or Jest errors.

## Manual QA checklist

Auth, shipment list/detail/history, manual sync, manual actions, waybill edits, and demo
status are gateway-backed. Start the backend gateway and this app
(`npm.cmd run dev` -> `http://localhost:3013`), then check:

| Route                  | What to verify                                                                 |
| ---------------------- | ------------------------------------------------------------------------------ |
| `/login`               | Login form renders; `logistics_test` and `shipmgr_test` authenticate.          |
| `/`                    | Authenticated user redirects to `/dashboard`; unauthenticated user to `/login`. |
| `/dashboard`           | Stat cards + status distribution render from gateway shipment data.            |
| `/shipments`           | Gateway table renders; search/status filters work; rows link to detail.        |
| `/shipments/[orderId]` | Detail + timeline render; sync/cancel/return/COD/receiver availability matches role/`availableActions`; demo controls appear only when enabled. |
| `/sync`                | `shipmgr_test` can sync eligible rows; `logistics_test` cannot.                |
| `/history`             | Shipping history list renders from gateway-backed data.                        |
| `/settings`            | Read-only settings/webhook info renders.                                       |
| `/403`                 | Forbidden page renders for a disallowed role.                                  |
| unknown path           | Not-found page renders.                                                        |
| Logout                 | Clears session and returns to `/login`.                                        |

Reminder: GHN status is backend-owned — the frontend never calls GHN directly and never
fabricates status, but it may drive status through the backend. Manual sync/cancel/return
COD/receiver edits, and the demo-status endpoint are real backend requests. Delivery-again
must not be built.

## What to check after UI changes

- Run the standard verification checklist.
- Click through every route the change can reach.
- Confirm styling uses tokens + `cn()`.
- Check empty/loading/error states.
- Verify `<Link>` / `useRouter()` navigation and thin route files.

## What to check after API / data-fetching changes

- All backend calls go through the gateway base URL or same-origin `/api` proxy.
- No direct GHN calls and no carrier secrets in browser code.
- `credentials: "include"` is set on every request.
- No JWT/session/user identity is written to browser storage.
- Server state goes through TanStack Query and query keys come from `queryKeys`.
- 401 -> `/login`; 403 -> `/403`.
- Request/response shapes match `.ai/context/data-fetching.md`.

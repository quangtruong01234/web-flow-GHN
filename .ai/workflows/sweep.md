# /sweep — Weekly Backlog Sweep (GHN Console)

Run the recurring audit → record → fix loop in one shot, without re-explaining
the workflow each time. Ported from the backend `/sweep`, adapted for this repo.

## How to invoke

```
/sweep            # fix the single highest-priority open item from the backlog
/sweep 3          # fix up to 3 open items in one autonomous batch
/sweep <id>       # fix a specific item (risk number from risks.md, or a handoff entry title)
/sweep audit      # audit-only: find NEW gaps/risks, record to risks.md, DO NOT fix
/sweep propose    # propose next features, append to "Next task order" in project.md, DO NOT implement
```

---

## Backlog sources (read both, in this order)

1. `.ai/context/risks.md` — every item not marked RESOLVED, and any item whose
   Owner/area includes frontend.
2. `../.agent-local/frontend-handoff-ghn.md` — **Open** entries (backend shipped,
   console integration pending). Machine-local, outside the repo — never commit it.

Skip items whose Owner/area is backend-only (e.g. `mapGhnStatus` coverage) — they
are not fixable here; in fix mode just verify the console still degrades gracefully.

## Mode: fix (default, `/sweep`, `/sweep N`, `/sweep <id>`)

1. Read both backlog sources and collect all open, frontend-actionable items.
2. Pick the top item by impact (broken flow > role/authz gap > degraded UX >
   cleanup). Handoff **Open** integration items rank above same-tier cleanups —
   they close a cross-repo thread. If the user passed an id, pick that one.
   - An item already carrying an `⏳ IN PROGRESS` marker from an earlier session
     outranks everything — resume it at the recorded step instead of restarting
     (its partial code is still in the working tree; `npx.cmd tsc --noEmit`
     exposes what is unfinished).
   - Before touching code, mark the picked item in its backlog source: append
     `⏳ IN PROGRESS — <current step>` to the item's **Current status** line in
     `risks.md` (or to the handoff entry if it only exists there). Update the
     step note as you move (implement → test → runtime-verify) and remove the
     marker when the item closes in "Close the loop".
3. Load the matching `.ai/context/` files per the Context Map in `.ai/project.md`
   before touching code (auth/roles → `auth.md`, gateway calls → `data-fetching.md`,
   status semantics → `domain.md`, flows → `flows.md`, …).
4. Implement with minimal diff. Hard boundaries: backend access through the
   TryBuy Gateway only (`/api/...`) — never call GHN directly; carrier secrets
   stay backend-only; roles are `logistics_operator` / `shipping_manager` only
   (never create `shipper`); demo-status UI stays behind
   `NEXT_PUBLIC_GHN_DEMO_MODE`, and a backend demo `403` renders as
   "demo not enabled", not an authz failure.
5. **Every fix/logic change ships a Jest test** colocated at
   `src/**/*.test.{ts,tsx}`; flow-level changes get/extend a Playwright spec in
   `e2e/`. Never add another test runner (`.ai/context/testing.md`).
6. Validate — all must pass, zero errors (Windows-safe commands):
   `npm.cmd run lint` · `npm.cmd run build` · `npx.cmd tsc --noEmit` ·
   `npm.cmd test` (+ `npm.cmd run e2e` when a flow changed).
7. Runtime-verify against the real gateway when it is up: log in with the right
   role from `../.agent-local/test-accounts.md` (`logistics_test` for read-only
   gating, `shipmgr_test` for sync/actions) and walk the affected flow on
   `http://localhost:3013`. If the gateway is not running, report that runtime
   verification is pending instead of skipping silently.
8. Close the loop:
   - Remove the item's `⏳ IN PROGRESS` marker.
   - Update the item in `risks.md` — mark `RESOLVED (<date>)` and refresh its
     **Current status**, keeping the existing
     Risk → Impact → Current status → Suggested fix → Owner/area format.
   - If the item came from `frontend-handoff-ghn.md`, move that entry to **Done**.
   - If a backend gap surfaced (missing data / wrong response / wrong request
     contract), append it to `../.agent-local/backend-handoff.md` per its
     template, titled as a **GHN console** item so the backend agent routes the
     reply to `frontend-handoff-ghn.md`.
   - Tick the matching line in "Next task order" / "Current state" in
     `.ai/project.md` if one exists.
9. If `/sweep N`: repeat from step 2 until N items are done or a blocker is hit.
   Report progress per item; never leave the repo mid-item.
10. Final report: per item — what changed, files touched, test + runtime results,
    risks/handoff/project.md updates made.

## Mode: audit (`/sweep audit`)

1. Scope: default = full app. `/sweep audit <area>` (e.g. `auth`, `shipments`,
   `sync`, `styling`) narrows it.
2. Hunt for NEW issues only — dedupe against `risks.md` before recording:
   - **Auth/role gating holes:** routes or actions reachable by the wrong role;
     UI that shows an action `availableActions` / role would forbid; 401/403
     handled inconsistently vs. `.ai/context/auth.md`.
   - **Gateway boundary violations:** direct GHN calls, secrets or non-public
     values in `NEXT_PUBLIC_*`, hardcoded URLs bypassing the API client.
   - **Status/domain gaps:** GHN statuses rendered without label/color mapping,
     demo-vs-real divergence (`.ai/context/domain.md`).
   - **Flow gaps:** missing error/empty/loading states per `.ai/context/flows.md`.
   - **Convention drift:** styling token violations (light theme, `cn()`),
     TypeScript rule violations, untested logic-bearing modules.
3. Read-only — do not fix anything in this mode.
4. Record each finding as a new numbered item in `risks.md` using its format
   (**Risk → Impact → Current status → Suggested fix → Owner/area**), with
   `file:line` in the Risk or Current status line.
5. Report: table of new findings + a "fix next" recommendation.

## Mode: propose (`/sweep propose`)

1. Read `.ai/project.md` (Current state, Next task order), `risks.md`, and
   `../.agent-local/frontend-handoff-ghn.md` to understand what already shipped
   and what backend capabilities the console does not surface yet.
2. Propose 3–5 net-new features ranked by value/effort, each with: one-line
   scope, affected routes, backend dependency yes/no (if yes, note it would need
   a `backend-handoff.md` request), test impact (Jest / Playwright).
3. Do not implement. After the user picks, append the chosen items to
   "Next task order" in `.ai/project.md`.

---

## Rules that always apply

- Never mark an item done with lint/build/typecheck/test errors or a failed
  runtime check.
- For large items (many files/flows, or a contract/migration change), prefer
  `/sweep` (one item) over `/sweep N` — big batches bloat the conversation and
  force more context compactions mid-item.
- Minimal diff; no drive-by refactors of untouched code.
- No new dependencies or test runners without asking.
- Batch mode stops early on: ambiguous contract change, anything requiring a new
  dependency, or anything needing a user decision — report and continue with the
  next independent item.
- Handoff files (`frontend-handoff-ghn.md`, `backend-handoff.md`,
  `test-accounts.md`) live at the `MCR/` workspace root, outside the repo —
  never commit them, never hardcode credentials from them.

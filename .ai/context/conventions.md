# Conventions — Components, TypeScript, Env

## Component rules

- Functional components only. Props typed with an explicit `interface`.
- Do not use `React.FC` — plain function declaration with typed props.
- Children typed as `React.ReactNode`.
- `"use client"` only where state/effects/context/event handlers are needed. Default to
  server components for static/route-shell code.
- Keep business/formatting logic in `features/ghn-shipping/lib/` helpers, not inline in JSX.

```tsx
interface ShipmentRowProps {
  shipment: Shipment;
  onSelect: (orderId: string) => void;
}

export function ShipmentRow({ shipment, onSelect }: ShipmentRowProps) { ... }
```

## Naming

Names describe purpose. **File** naming (PascalCase components, kebab/camel helpers) lives
in `.ai/context/structure.md`; this section covers **identifiers** (variables, functions,
props, payloads).

### Casing

- `camelCase` for variables and functions.
- `PascalCase` for React components and TypeScript types/interfaces.
- `UPPER_SNAKE_CASE` **only** for module-level constants (e.g. `ALLOWED_ROLES`, `STORAGE_KEY`).

### Meaningful names

- Use names that describe the value's purpose.
- Avoid vague names (`a`, `b`, `data`, `result`, `temp`, `value`, `obj`, `arr`, `list`)
  unless the scope is tiny and the meaning is obvious.

### Booleans

- Must start with `is`, `has`, `can`, `should`, `will`, or `needs` (e.g. `isPending`,
  `hasGhnCode`, `canSync`, `needsReturn`).

### Collections & maps

- Arrays use **plural** names: `orders`, `shipments`, `selectedItems`.
- Map/record objects include the key relationship: `orderById`, `statusLabelMap`,
  `permissionsByRole`.

### Functions & handlers

- Functions start with a verb: `fetchOrders`, `createShipment`, `calculateShippingFee`,
  `formatCurrency`.
- Event handlers inside components use `handleX`: `handleSubmit`, `handleStatusChange`.
- Callback props use `onX`: `onSubmit`, `onStatusChange`. (Matches the existing
  `onSelect` prop convention above.)

### API payloads & units

- Name request/response objects clearly: `loginPayload`, `loginResponse`,
  `createShipmentPayload`.
- Include units when relevant: `timeoutMs`, `priceVnd`, `weightGram`, `retryCount`.

### Domain terms (use consistently)

Prefer `shipment`, `order`, `trackingCode`, `ghnStatus`, `logisticsOperator`,
`shippingFee`. Keep `GhnStatus` / `LocalStatus` distinct (see `.ai/context/domain.md`) and
reuse the domain types from `src/features/ghn-shipping/types.ts` rather than coining
synonyms.

## TypeScript

- Strict mode — `npm run typecheck` (`tsc --noEmit`) must pass.
- No `any` (use `unknown` + narrowing), no `!` non-null assertion, no `@ts-ignore`.
- Explicit return types on non-trivial exported functions.
- Domain types live in `src/features/ghn-shipping/types.ts` — import from there, don't redeclare `Shipment`, `GhnStatus`, etc.
- `catch (error: unknown)` then narrow.

## State management — pick the right tool

| Kind of state                          | Use                                                                 |
| -------------------------------------- | ------------------------------------------------------------------- |
| **Server state** (orders, shipments, me) | **TanStack Query** — see `.ai/context/data-fetching.md`. Never `useState`+`useEffect` to fetch. |
| **Local UI state** (modal open, tab, input) | `useState` / `useReducer`.                                       |
| **Global client state** (cross-cutting)  | React Context (`AuthContext`, `ToastContext`), wired in `src/app/layout.tsx`. Memoize the value with `useMemo`. |
| **Complex/shared client state**          | **Zustand** — only when a trigger below is genuinely met.           |

### Zustand — only when justified

Zustand is installed, but **prefer Context for cross-cutting state**. Reach for a store
only when one of these is true (mirrors the main frontend's rule):

| Trigger                                                        | Example in this app                                        |
| ------------------------------------------------------------- | --------------------------------------------------------- |
| Measured Context re-render performance problem                | A provider changing constantly re-renders the whole shell |
| State must persist across multiple routes of one flow         | A multi-step GHN action wizard                             |
| State must be read/written outside the React tree             | A non-hook helper needs current selection/session         |
| Complex shared filter/sort state across ≥3 feature areas      | Shipments + history + dashboard share one filter model    |

**Not a trigger:** adding 1–2 fields to an existing Context, avoiding 2 levels of prop
drilling, or "Context looks verbose". Do **not** add Redux or Jotai in any case.

- Store file: `src/store/<name>.store.ts` — not in `context/` or `hooks/`.
- Keep server state in TanStack Query, not in a Zustand store.

## Forms

- Simple forms (login, settings): `useState` + the `Input` primitive is fine.
- No form library is installed. Do not add `react-hook-form`/`zod` without asking.

## Environment variables

- Next.js conventions: client-exposed vars are prefixed **`NEXT_PUBLIC_*`** and read via `process.env.NEXT_PUBLIC_*`.
- There is **no** `import.meta.env` here (that is Vite — the main frontend). Do not copy it.
- Server-only secrets (GHN token, shop ID, webhook secret) must never get a `NEXT_PUBLIC_` prefix — they stay backend-only and must not reach this app at all.
- Document any new public var in `.env.example`.

## Icons — lucide-react

- Use `lucide-react` for all icons: `import { Truck } from "lucide-react"`.
- Always pass `size` as a **number** (`size={18}`), never a string.
- Icon-only buttons / flex rows: add `shrink-0` to the icon so it doesn't distort.
- Don't add another icon library.

## Misc

- No `console.log` in committed code (`console.error` for genuine errors is OK).
- Use the formatters in `features/ghn-shipping/lib/shipment-formatters.ts` for display
  (dates, money, statuses) — don't inline `toLocaleString` / ad-hoc formatting.
- Installed deps you may use freely: `@tanstack/react-query`, `zustand`, `clsx`, `tailwind-merge`, `lucide-react`. **Any other new dependency needs approval first** (e.g. `react-hook-form`/`zod` are not installed — ask before adding).

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

## TypeScript

- Strict mode — `npm run typecheck` (`tsc --noEmit`) must pass.
- No `any` (use `unknown` + narrowing), no `!` non-null assertion, no `@ts-ignore`.
- Explicit return types on non-trivial exported functions.
- Domain types live in `src/features/ghn-shipping/types.ts` — import from there, don't redeclare `Shipment`, `GhnStatus`, etc.
- `catch (error: unknown)` then narrow.

## State management

- **Global client state** → React Context (`AuthContext`, `ShipmentContext`, `ToastContext`), wired in `src/app/layout.tsx`. Memoize context values (`useMemo`).
- **Local UI state** → `useState` / `useReducer`.
- No Redux/Zustand/Jotai. No TanStack Query yet — see `.ai/context/data-fetching.md`.

## Forms

- Simple forms (login, settings): `useState` + the `Input` primitive is fine.
- No form library is installed. Do not add `react-hook-form`/`zod` without asking.

## Environment variables

- Next.js conventions: client-exposed vars are prefixed **`NEXT_PUBLIC_*`** and read via `process.env.NEXT_PUBLIC_*`.
- There is **no** `import.meta.env` here (that is Vite — the main frontend). Do not copy it.
- Server-only secrets (GHN token, shop ID, webhook secret) must never get a `NEXT_PUBLIC_` prefix — they stay backend-only and must not reach this app at all.
- Document any new public var in `.env.example`.

## Misc

- No `console.log` in committed code (`console.error` for genuine errors is OK).
- Use the formatters in `features/ghn-shipping/lib/shipment-formatters.ts` for display
  (dates, money, statuses) — don't inline `toLocaleString` / ad-hoc formatting.
- No new dependencies without asking.

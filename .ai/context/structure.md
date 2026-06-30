# Structure & Routing

## File Naming

- Components: PascalCase — `ShipmentTable.tsx`, `GhnSidebar.tsx`.
- Route files: Next.js App Router convention — `page.tsx`, `layout.tsx`, `not-found.tsx`.
- Helpers/utils: kebab or camel — `shipment-status.ts`, `shipment-formatters.ts`.
- Domain types: a single `src/features/ghn-shipping/types.ts` barrel.

## Folder Structure

```
src/
├── app/                            # Next.js App Router (thin route files only)
│   ├── layout.tsx                  # Root: providers + ToastHost
│   ├── page.tsx                    # Landing / root redirect
│   ├── globals.css                 # The ONLY stylesheet
│   ├── login/page.tsx              # Public login route
│   ├── 403/page.tsx                # Forbidden (wrong role)
│   ├── not-found.tsx
│   └── (app)/                      # Protected route group — wrapped by AuthGate
│       ├── layout.tsx              # <AuthGate>{children}</AuthGate>
│       ├── dashboard/page.tsx
│       ├── shipments/page.tsx
│       ├── shipments/[orderId]/page.tsx
│       ├── sync/page.tsx
│       ├── history/page.tsx
│       └── settings/page.tsx
├── components/
│   └── ui/                         # Generic primitives: Badge, Button, Card, Icon, Input, Modal
├── context/                        # Client providers: AuthContext, ToastContext
├── features/
│   └── ghn-shipping/               # The GHN domain boundary — keep GHN code here
│       ├── components/             # Feature screens & widgets (GhnAdminShell, ShipmentTable, ...)
│       ├── lib/                    # shipment-status.ts, shipment-formatters.ts
│       └── types.ts               # Domain types barrel
└── lib/
    └── cn.ts                       # Minimal className combiner
```

## Where to put new code

- New protected route → `src/app/(app)/<name>/page.tsx` (thin) + a component in `features/ghn-shipping/components/`.
- New GHN screen/widget → `src/features/ghn-shipping/components/`.
- New pure helper for shipments → `src/features/ghn-shipping/lib/`.
- New generic primitive (used beyond GHN) → `src/components/ui/`.
- New global provider → `src/context/` (and wire it in `src/app/layout.tsx`).
- New cross-cutting util → `src/lib/`.

> Before creating anything, search the matching folder for an existing equivalent.

## Routing — Next.js App Router

| Path                        | Auth      | Renders                          |
| --------------------------- | --------- | -------------------------------- |
| `/login`                    | public    | `LoginPage` / `GhnLoginCard`     |
| `/` (`(app)` group)         | protected | dashboard via `RootRedirect`     |
| `/dashboard`                | protected | `ShipmentDashboard`              |
| `/shipments`                | protected | `ShipmentTable`                  |
| `/shipments/[orderId]`      | protected | `ShipmentDetail`                 |
| `/sync`                     | protected | `GhnSyncPage`                    |
| `/history`                  | protected | `ActionHistoryPage`              |
| `/settings`                 | protected | `GhnSettingsPage`                |
| `/403`                      | public    | `ForbiddenPage`                  |

Rules:
- Everything under `(app)` is guarded by `AuthGate` (`src/app/(app)/layout.tsx`).
- Navigate via `<Link>` (`next/link`) / `useRouter()` (`next/navigation`) — never `window.location`.
- Route params come from the App Router segment (`[orderId]`) — read via the `params` prop / `useParams()`, never parse the URL by hand.
- Keep route files thin: imports + render of a feature component. No business logic in `page.tsx`.

# Data Fetching & API Boundary

## The boundary (hard rules)

- All backend access goes through the **TryBuy Gateway only**: `http://localhost:3000/api`.
- The frontend must **never** call GHN directly.
- GHN API key/token, shop ID, webhook secret, and other carrier secrets are **backend-only**.
  Never reference or expose them in browser-reachable code.
- Backend repo (reference only, **do not modify** unless the task explicitly says backend):
  `C:\Users\Quang Truong\Desktop\MCR\api`.

## Backend status — Phase 1 + 1.1 DONE

The GHN endpoints already exist on the gateway and passed runtime checks. They are
**available but not yet wired into this app** — connect them in the order in `.ai/project.md`,
not all at once.

### Available protected endpoints

| Method + path                                    | Returns                              |
| ------------------------------------------------ | ------------------------------------ |
| `GET  /api/order/admin/ghn/orders`               | GHN order list                       |
| `GET  /api/order/admin/ghn/orders/:id`           | local order + GHN shipment detail    |
| `POST /api/order/admin/ghn/orders/:id/sync`      | manual GHN status sync               |
| `GET  /api/order/admin/ghn/orders/:id/history`   | shipping history / timeline          |

> The `admin` segment in these paths is the **current backend grant prefix**, not the
> long-term role name — see the role gap in `.ai/context/auth.md`.

### Verified backend behavior (rely on these)

- Unauthenticated list → **401**.
- Shop account list → **403**.
- Admin list / detail / history → **200**.
- Sync with missing GHN code → **400**.
- A completed sync writes a shipping-history entry.
- `delivered` maps the buyer-visible `Order.status` to `completed` (backend-side mapping).

## Current phase

- **Phase 1 (Prompt 2):** UI reads from `src/features/ghn-shipping/data/mockShipments.ts`
  and `ShipmentContext`. No network.
- **Prompt 3:** connect **auth endpoints only** — `POST /api/user/login`,
  `POST /api/user/logout`, `GET /api/user/me`. Do **not** connect the shipment endpoints
  above in this step; leave those screens on mock data.
- Read-only shipment list/detail/history connect in a later step, then sync, then GHN actions.

## API client shape (when it lands in Prompt 3)

Adapt the main frontend's typed `request<T>()` wrapper (see `handoff/frontend-reference.md`),
translated to Next conventions:

- Base URL from `process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"`.
- Every request: `credentials: "include"`, default JSON `Content-Type`.
- Non-OK responses throw a typed `ApiError`; **401 → redirect to `/login`**, **403 → `/403`**.
- 204 / empty body → return `undefined`.
- Unwrap `{ data: T }` envelopes.

Put the client in `src/lib/` (e.g. `src/lib/api.ts`). Keep it the single place that calls `fetch`.

## TanStack Query v5 — server state (installed)

`@tanstack/react-query` v5 is installed. It is the **only** way to fetch/cache server
state once APIs are connected. Patterns mirror the main frontend.

**Provider (wire once, in a client component before first use — e.g. Prompt 3):**

```ts
// src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1, refetchOnWindowFocus: false },
  },
});
```

Wrap the app in `<QueryClientProvider client={queryClient}>` via a `"use client"`
provider mounted in `src/app/layout.tsx` (alongside the existing context providers).

**Query keys — centralize, never inline `['shipments']`:**

```ts
// src/hooks/queryKeys.ts
export const queryKeys = {
  auth: { me: ["auth", "me"] as const },
  shipments: {
    all: ["shipments"] as const,
    list: (params: ShipmentParams) => ["shipments", "list", params] as const,
    detail: (orderId: string) => ["shipments", orderId] as const,
    history: (orderId: string) => ["shipments", orderId, "history"] as const,
  },
};
```

> Note: `Shipment.orderId` is a **string** here (not a numeric id like the main frontend's products) — keep query keys typed as `string`.

**useQuery / useMutation:**

```ts
export function useShipment(orderId: string) {
  return useQuery({
    queryKey: queryKeys.shipments.detail(orderId),
    queryFn: () => api.shipments.getById(orderId),
    enabled: Boolean(orderId),         // guard empty param
  });
}

export function useSyncShipment() {
  return useMutation({
    mutationFn: (orderId: string) => api.shipments.sync(orderId),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.shipments.history(orderId) });
    },
  });
}
```

**Hard rules:**

- ❌ NO `useState` + `useEffect` to fetch server data. ❌ NO `fetch()` in components — use the `api` client.
- Mutations use **`isPending`**, not `isLoading` (v5).
- Always use the `queryKeys.*` factory; invalidate related keys in `onSuccess`.
- Server state lives in Query, never in a Zustand store or Context.
- This is the standard for when APIs connect (read-only list/detail/history → sync). In the **current mock phase**, screens still read mock data — don't wire Query to shipment endpoints until that step.

## Notes

- Prefer fetching in server components where possible once APIs are connected; auth `/me`
  hydration runs client-side via `AuthContext` + a `me` query.

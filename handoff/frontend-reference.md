# Frontend Reference Patterns

Reference app: `C:\Users\Quang Truong\Desktop\MCR\frontend`

This is the existing main TryBuy frontend. It is read-only for GHN web tasks. Use it as a pattern source, not as code to modify.

## Stack

- Package name: `trust-circle-ui`
- Framework/build: Vite 7 with React 19 and TypeScript.
- Router: `react-router-dom` 7 via `src/router.tsx`.
- Server state: `@tanstack/react-query` 5.
- Styling: Tailwind CSS 3 with CSS variables in `src/index.css`.
- UI primitives: shadcn/Radix-style components under `src/components/ui`.
- Icons: `lucide-react`.
- Forms/validation: `react-hook-form`, `zod`, `@hookform/resolvers`.

## Routing Pattern

- `src/main.tsx` mounts `<App />`.
- `src/App.tsx` wraps the router in `QueryClientProvider` and `AuthProvider`.
- `src/router.tsx` uses `createBrowserRouter`, lazy-loaded pages, and protected route wrappers.
- Main app routes are wrapped by `ProtectedRoute` and `AppShell`.

For the GHN Next app, keep using Next App Router rather than copying React Router, but preserve the same separation: thin route files, feature components, and auth guards around protected areas.

## API Wrapper Pattern

Reference file: `src/api/index.ts`

The main frontend uses a single typed `request<T>()` wrapper around `fetch`:

- Base URL: `import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"`.
- Requests use `credentials: "include"`.
- Default JSON `Content-Type` header.
- Non-OK responses throw a typed `ApiError`.
- 401 handling redirects through a registered unauthorized handler.
- Empty 204 responses return `undefined`.
- Responses wrapped as `{ data: T }` are unwrapped.
- Query strings are built with a shared `toQuery()` helper.

For GHN Prompt 3, adapt this shape for Next with `NEXT_PUBLIC_API_URL`, but connect only auth endpoints (`/user/login`, `/user/logout`, `/user/me`). Do not connect shipment APIs in Prompt 3.

## Auth/Session Pattern

Reference files:

- `src/context/AuthContext.tsx`
- `src/hooks/useAuth.ts`
- `src/components/auth/ProtectedRoute.tsx`

The main frontend stores session in React Query, not in browser token storage:

- `api.auth.me()` hydrates current user.
- `api.auth.login()` returns a user; `loginSuccess()` writes it to the `auth.me` query cache.
- `api.auth.logout()` clears the query cache on settlement.
- JWT/session is expected to be HttpOnly cookie based.
- Protected routes redirect to `/login` if `me` is missing or errors.
- Role checks go through `roleSatisfies()`.

For GHN, keep the HttpOnly cookie model and `credentials: "include"`. Do not store real tokens in JS storage.

## Query Client Pattern

Reference file: `src/lib/queryClient.ts`

- Central `QueryClient`.
- Query and mutation caches route API errors through a registered handler.
- Default query options: short stale time, retry once, no refetch on window focus.
- Query keys are centralized in `src/hooks/queryKeys.ts`.

Use this pattern when GHN starts connecting server state after Prompt 3.

## Styling Pattern

Reference files:

- `tailwind.config.js`
- `src/index.css`
- `components.json`

The main frontend uses Tailwind with design tokens exposed as CSS variables. It has dark TryBuy marketplace styling, shadcn-compatible primitives, and lucide icons.

The GHN app intentionally uses a light logistics-console style from the Claude Design export. Reuse conventions such as Tailwind tokens, utility composition, feature folders, and accessible primitives, but do not copy the main frontend's dark visual theme wholesale into GHN.

## Utility Pattern

Reference file: `src/lib/utils.ts`

The main frontend `cn()` utility is:

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

The GHN app currently has a small local `cn()` without extra dependencies. If future work adds `clsx` and `tailwind-merge`, align GHN's utility with this pattern.

## Folder Conventions

- `src/features/<domain>/...` for domain screens, hooks, schemas, and helpers.
- `src/components/ui` for generic primitives.
- `src/components/shared` for reusable app-level components.
- `src/context` for providers.
- `src/hooks` for reusable hooks and query keys.
- `src/lib` for small utilities and shared clients.
- `src/types` for API/domain DTO types.

The GHN app should keep `src/features/ghn-shipping` as the GHN domain boundary and avoid broad unrelated refactors.

## What To Reuse

- Central fetch wrapper shape.
- HttpOnly cookie auth/session flow.
- React Query patterns for server state after auth is connected.
- `cn()` pattern if dependencies are available.
- Tailwind/CSS-token conventions.
- `lucide-react` icon convention if icons are added as a dependency.
- Feature folder organization.

## What Not To Copy Directly

- Do not copy Vite or React Router setup into the Next app.
- Do not modify the existing frontend repo.
- Do not copy broad marketplace/admin UI into the dedicated GHN logistics app.
- Do not connect GHN/order/shipment APIs during Prompt 3.
- Do not expose GHN token, shop ID, or webhook secret to the browser.

# Styling — Tailwind, Tokens, `cn()`

This app is a **light logistics console**, styled after the Claude Design export in
`TryBuy Shipping Dashboard/`. Do **not** port the main frontend's dark marketplace theme.

## Hard rules

- Tailwind utility classes only. No inline `style={{}}`.
- No `.css` / `.module.css` files — `src/app/globals.css` is the **only** stylesheet.
- No hardcoded hex (`[#4f46e5]`) and no arbitrary palette guesses — use the tokens below.
- Conditional classes via `cn()` from `@/lib/cn` — never build class strings with template literals + ternaries inline.

## Design tokens (`tailwind.config.ts`)

| Token            | Value / use                                              |
| ---------------- | -------------------------------------------------------- |
| `brand-50/100`   | indigo tints — subtle backgrounds                        |
| `brand-500`      | `#6366f1` — hover/active accents                         |
| `brand-600`      | `#4f46e5` — primary action color                         |
| `brand-700`      | `#4338ca` — pressed/darker primary                       |
| `ink-900`        | `#0f172a` — primary text                                 |
| `ink-700/600/500`| secondary text, descending emphasis                      |
| `ink-400`        | `#98a2b3` — muted/placeholder                            |
| `line`           | `#e7e9ee` — borders / dividers                           |
| `canvas`         | `#f1f3f6` — page background                              |
| `shadow-card`    | the standard card elevation — use `shadow-card`          |

Use `text-ink-*` for text, `border-line` for borders, `bg-canvas` for page backgrounds,
`bg-brand-600 text-white` for primary buttons, and `shadow-card` for cards.

## `cn()` helper (`src/lib/cn.ts`)

Built on **clsx** (conditional classes) + **tailwind-merge** (conflict resolution),
matching the main frontend:

```ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

```tsx
// ✅ conditional + safe override (tailwind-merge keeps the last conflicting utility)
<div className={cn("rounded-lg border border-line p-4", active && "border-brand-600", className)} />

// ❌ never hand-build conditional class strings with template literals
<div className={`rounded-lg p-4 ${active ? "border-brand-600" : ""}`} />
```

- Always pass the consumer's `className` prop through `cn()` last so callers can override.
- Use `clsx`/`twMerge` only via `cn()` — don't import them directly in components.

## Icons — lucide-react

- `import { Truck } from "lucide-react"`. `size` is a **number** (`size={18}`), never a string.
- Add `shrink-0` to icons inside buttons / flex rows so they don't distort.
- Don't introduce another icon set.

## Reuse before creating

Before writing new UI, check `src/components/ui/` (Badge, Button, Card, Icon, Input, Modal)
and existing `features/ghn-shipping/components/`. Match existing spacing, radius, and
token usage. If a pattern repeats in 2+ places, extract it rather than copy-paste.

## Complex / accessibility-critical UI — ask to install shadcn first

The current `src/components/ui/` are simple hand-rolled primitives — fine for basic
buttons, inputs, cards, badges, and a basic modal. **Do not hand-roll** the patterns
below (getting focus trapping, keyboard nav, and ARIA right is error-prone). When a task
needs any of these, **stop and ask the user to install shadcn/ui** (it brings the Radix
primitives), then build on it — do not silently `npm install` it yourself:

- Dialog with proper accessibility (focus trap, `Esc`, scroll lock, ARIA)
- Dropdown menu
- Complex Select / Combobox
- Calendar / date picker
- Command palette
- Form validation UI
- Advanced data table (sorting/filtering/pagination/virtualization)

shadcn is **not installed yet**. Setup is `npx shadcn@latest init` then
`npx shadcn@latest add <component>` — but only after the user approves (it's a new
dependency + config). Until then, keep using the existing primitives for simple cases.

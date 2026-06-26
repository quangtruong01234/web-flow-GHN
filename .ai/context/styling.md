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

Currently a minimal dependency-free join:

```ts
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
```

- Use it for all conditional classes: `cn("rounded-lg border border-line", active && "border-brand-600")`.
- It does **not** do Tailwind conflict resolution (no `tailwind-merge`). Don't rely on
  "last class wins" across conflicting utilities — write non-conflicting classes, or
  compute the single intended value.
- If future work adds `clsx` + `tailwind-merge`, align `cn()` with the main frontend's version (see `handoff/frontend-reference.md`).

## Reuse before creating

Before writing new UI, check `src/components/ui/` (Badge, Button, Card, Icon, Input, Modal)
and existing `features/ghn-shipping/components/`. Match existing spacing, radius, and
token usage. If a pattern repeats in 2+ places, extract it rather than copy-paste.

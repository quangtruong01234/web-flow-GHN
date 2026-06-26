/**
 * Minimal className combiner. We intentionally avoid pulling in clsx/tailwind-merge
 * for this UI-only phase — a tiny join keeps the dependency surface small.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

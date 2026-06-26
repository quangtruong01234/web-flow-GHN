import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names with conditional support (clsx) and Tailwind conflict
 * resolution (tailwind-merge) — matches the main TryBuy frontend's `cn()`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

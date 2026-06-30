import type { StatusMeta } from "@/features/ghn-shipping/lib/shipment-status";
import { cn } from "@/lib/cn";

interface StatusBadgeProps {
  meta: StatusMeta;
  /** Override the label text (defaults to meta.label). */
  label?: string;
}

/** Pill badge driven by status metadata classes from the design palette. */
export function StatusBadge({ meta, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold",
        meta.badgeClass,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 flex-none rounded-full", meta.dotClass)}
      />
      {label ?? meta.label}
    </span>
  );
}

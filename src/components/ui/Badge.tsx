import type { StatusMeta } from "@/features/ghn-shipping/lib/shipment-status";

interface StatusBadgeProps {
  meta: StatusMeta;
  /** Override the label text (defaults to meta.label). */
  label?: string;
}

/**
 * Pill badge driven by status metadata. Colors come from the design palette and
 * are applied inline so arbitrary hex values survive Tailwind's purge.
 */
export function StatusBadge({ meta, label }: StatusBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold"
      style={{ background: meta.bg, color: meta.fg }}
    >
      <span
        className="h-1.5 w-1.5 flex-none rounded-full"
        style={{ background: meta.dot }}
      />
      {label ?? meta.label}
    </span>
  );
}

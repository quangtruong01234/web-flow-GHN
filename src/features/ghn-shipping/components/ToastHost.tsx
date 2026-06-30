"use client";

import { useToast, type ToastKind } from "@/context/ToastContext";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const ICON: Record<ToastKind, IconName> = {
  success: "check",
  error: "error",
  info: "info",
};

const ACCENT_CLASS: Record<ToastKind, string> = {
  success: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
  info: "bg-brand-50 text-brand-700",
};

/** Renders the active toast stack in a fixed bottom-right corner. */
export function ToastHost() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 rounded-lg border border-line bg-white p-3 shadow-card"
          role="status"
        >
          <span
            className={cn(
              "mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full",
              ACCENT_CLASS[t.kind],
            )}
          >
            <Icon name={ICON[t.kind]} size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink-900">{t.title}</p>
            {t.message ? <p className="mt-0.5 text-xs text-ink-500">{t.message}</p> : null}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="rounded p-0.5 text-ink-400 hover:bg-slate-100 hover:text-ink-700"
            aria-label="Dismiss"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

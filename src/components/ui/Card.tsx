import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-line bg-white shadow-card", className)}
      {...rest}
    />
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
      <div>
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

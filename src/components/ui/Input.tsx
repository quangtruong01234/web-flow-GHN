"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const baseField =
  "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseField, className)} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(baseField, "pr-8", className)} {...rest}>
      {children}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="text-[13px] font-medium text-ink-700">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-ink-400">{hint}</span> : null}
    </label>
  );
}

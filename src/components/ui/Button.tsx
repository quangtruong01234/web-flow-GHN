"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 border border-transparent",
  secondary: "bg-white text-ink-700 border border-line hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700 border border-transparent",
  ghost: "bg-transparent text-ink-600 border border-transparent hover:bg-slate-100",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}

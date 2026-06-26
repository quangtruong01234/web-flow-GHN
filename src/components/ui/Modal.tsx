"use client";

import { useEffect } from "react";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** Lightweight modal: backdrop + centered card, Escape-to-close, scroll lock. */
export function Modal({ open, title, subtitle, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-ink-900/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-line bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-ink-900">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-ink-400 hover:bg-slate-100 hover:text-ink-700"
            aria-label="Close"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

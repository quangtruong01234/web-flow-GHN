"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Icon } from "@/components/ui/Icon";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1]?.[0] ?? "";
  const first = parts[0]?.[0] ?? "";
  return (first + last).toUpperCase();
}

export function GhnTopbar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const demoMode = process.env.NEXT_PUBLIC_GHN_DEMO_MODE === "true";

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-white/90 px-5 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-ink-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/*
         * Was a green "Webhook listening (mock)" pill — a health indicator the
         * console cannot actually observe (webhook delivery is backend-side), sat
         * next to real gateway data. Replaced with a flag the console does own:
         * demo mode, which is worth flagging because its controls write real
         * statuses and can notify real buyers.
         */}
        {demoMode ? (
          <span className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11.5px] font-semibold text-amber-700 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Demo mode
          </span>
        ) : null}

        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[12px] font-semibold text-brand-700">
            {user ? initials(user.name) : "?"}
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-[13px] font-semibold text-ink-900">{user?.name}</p>
            <p className="text-[11px] text-ink-400">{user?.title}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-ink-600 hover:bg-slate-50 hover:text-ink-900"
        >
          <Icon name="logout" size={16} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  );
}

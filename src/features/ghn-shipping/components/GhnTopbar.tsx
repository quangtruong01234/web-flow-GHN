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

  const onLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-white/90 px-5 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold text-ink-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11.5px] font-semibold text-green-700 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Webhook listening (mock)
        </span>

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

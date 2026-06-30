"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/shipments", label: "Shipments", icon: "package" },
  { href: "/sync", label: "GHN Sync", icon: "sync" },
  { href: "/history", label: "Action History", icon: "history" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function GhnSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-60 flex-none flex-col border-r border-line bg-white md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-line px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Icon name="truck" size={18} />
        </span>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-ink-900">TryBuy GHN</p>
          <p className="text-[11px] text-ink-400">Shipping Admin</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-600 hover:bg-slate-50 hover:text-ink-900",
              )}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-4 py-3">
        <p className="text-[11px] leading-relaxed text-ink-400">
          Gateway-backed GHN logistics console.
        </p>
      </div>
    </aside>
  );
}

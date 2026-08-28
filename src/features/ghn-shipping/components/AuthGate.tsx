"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAllowedRole, useAuth } from "@/context/AuthContext";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isAllowedRole(user.role)) router.replace("/403");
  }, [pathname, ready, router, user]);

  // A disallowed role is still a non-null `user`, so gating on `!user` alone let
  // the console shell paint — and its React Query hooks fire real gateway reads —
  // in the frame before the effect's `/403` redirect landed. The gateway grants
  // generic `admin` read access to `/api/order/admin/ghn/*`, so that frame showed
  // real shipment data to exactly the role this console means to bounce.
  if (!ready || !user || !isAllowedRole(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-ink-500">
        Checking your session...
      </div>
    );
  }

  return <>{children}</>;
}

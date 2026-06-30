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

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-ink-500">
        Checking your session...
      </div>
    );
  }

  return <>{children}</>;
}

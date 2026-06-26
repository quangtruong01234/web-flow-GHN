"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ALLOWED_ROLES, useAuth } from "@/context/AuthContext";

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
    if (!ALLOWED_ROLES.includes(user.role)) router.replace("/403");
  }, [pathname, ready, router, user]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-ink-500">
        Loading mock session...
      </div>
    );
  }

  return <>{children}</>;
}

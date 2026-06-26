"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export function RootRedirect() {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [ready, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-ink-500">
      Opening GHN console...
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { GhnLoginCard } from "./GhnLoginCard";

export function LoginPage() {
  const { ready, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, router, user]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <GhnLoginCard />
        <p className="mt-4 text-center text-xs text-ink-400">
          Authorized logistics operators and shipping managers only.
        </p>
      </div>
    </main>
  );
}

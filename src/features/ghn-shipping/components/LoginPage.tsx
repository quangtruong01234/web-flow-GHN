"use client";

import Link from "next/link";
import { Suspense } from "react";
import { GhnLoginCard } from "./GhnLoginCard";

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <GhnLoginCard />
        </Suspense>
        {/* Always offered, not only when the probe says offline: a visitor
            without credentials has nowhere else to go from this screen. The
            card below the form already states who may sign in, so this is the
            only line under it. */}
        <p className="mt-4 text-center text-xs text-ink-500">
          No account?{" "}
          <Link href="/demo" className="font-semibold text-brand-700 hover:underline">
            Browse the read-only sample console
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

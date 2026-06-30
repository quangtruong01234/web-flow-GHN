"use client";

import { Suspense } from "react";
import { GhnLoginCard } from "./GhnLoginCard";

export function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <GhnLoginCard />
        </Suspense>
        <p className="mt-4 text-center text-xs text-ink-400">
          Authorized logistics operators and shipping managers only.
        </p>
      </div>
    </main>
  );
}

"use client";

// Last-resort boundary: replaces the root layout when it crashes, so it must
// render its own <html>/<body> and re-import global CSS. Kept dependency-light
// (no app components) because the crash may originate in shared providers.

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ghn-console] global error:", error.message, error.digest ?? "");
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
          <div className="w-full max-w-md rounded-xl border border-line bg-white p-7 text-center shadow-card">
            <h1 className="text-xl font-semibold text-ink-900">
              The console failed to load
            </h1>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              An unexpected error broke the whole app shell. Retry, or reload the
              page if it persists.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

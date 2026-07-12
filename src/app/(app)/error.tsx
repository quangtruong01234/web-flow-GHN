"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/features/ghn-shipping/components/ErrorState";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Unexpected render failure — log message + digest only, never request data.
    console.error("[ghn-console] route error:", error.message, error.digest ?? "");
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <Card className="w-full max-w-md">
        <ErrorState
          title="Something went wrong"
          message="This page hit an unexpected error. Retry, or go back and try again."
          onRetry={reset}
        />
      </Card>
    </main>
  );
}

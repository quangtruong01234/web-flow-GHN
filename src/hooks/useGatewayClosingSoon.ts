"use client";

import { useEffect, useState } from "react";
import { minutesUntilGatewayClose } from "@/lib/gateway-schedule";

const TICK_MS = 30_000;

/**
 * Minutes until the gateway's scheduled stop while inside the warning window,
 * otherwise `null`.
 *
 * Client clock only: a local timer, no request. It must never become a poll on
 * a GHN route — `POST .../sync` notifies a buyer (GHN-FAIL-NTF-01).
 *
 * Starts at `null` and reads the clock after mount, so the server render and
 * the first client render agree (no hydration mismatch).
 */
export function useGatewayClosingSoon(): number | null {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setMinutesLeft(minutesUntilGatewayClose(new Date()));
    update();
    const id = setInterval(update, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return minutesLeft;
}

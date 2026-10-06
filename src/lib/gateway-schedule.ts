/**
 * The gateway's cost-capped daily window (README "Live demo", risks 27):
 * 14:00–19:00 ICT. ICT is a fixed UTC+7 with no daylight saving, so the window
 * is computed from UTC time — the operator's own time zone never enters it.
 */
const ICT_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const GATEWAY_CLOSE_ICT_MS = 19 * 60 * 60 * 1000;

/** How long before the scheduled stop the console starts warning. */
export const CLOSING_SOON_WINDOW_MS = 15 * 60 * 1000;

/**
 * Whole minutes (rounded up) until the gateway's scheduled 19:00 ICT stop, or
 * `null` outside the warning window [18:45, 19:00) ICT.
 */
export function minutesUntilGatewayClose(now: Date): number | null {
  const ictTimeOfDay = (((now.getTime() + ICT_OFFSET_MS) % DAY_MS) + DAY_MS) % DAY_MS;
  const remaining = GATEWAY_CLOSE_ICT_MS - ictTimeOfDay;
  if (remaining <= 0 || remaining > CLOSING_SOON_WINDOW_MS) return null;
  return Math.ceil(remaining / 60_000);
}

import type { Metadata } from "next";
import { SampleConsole } from "@/features/ghn-shipping/components/SampleConsole";

// Public on purpose: it sits OUTSIDE the `(app)` route group, so `AuthGate`
// never runs on it. That is the whole point — when the gateway is down nobody
// can sign in, and a guarded page would only bounce a visitor to `/login`.
// Nothing sensitive is exposed: the page renders static sample rows and issues
// no gateway request.

export const metadata: Metadata = {
  title: "Sample console · TryBuy GHN",
  description: "Read-only walkthrough of the GHN console using sample data.",
};

export default function DemoPage() {
  return <SampleConsole />;
}

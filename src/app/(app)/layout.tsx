import { AuthGate } from "@/features/ghn-shipping/components/AuthGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}

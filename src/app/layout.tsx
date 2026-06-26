import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ShipmentProvider } from "@/context/ShipmentContext";
import { ToastProvider } from "@/context/ToastContext";
import { ToastHost } from "@/features/ghn-shipping/components/ToastHost";

export const metadata: Metadata = {
  title: "TryBuy GHN Console",
  description: "Mock GHN logistics operations console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <ShipmentProvider>
              {children}
              <ToastHost />
            </ShipmentProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

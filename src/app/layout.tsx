import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { BackendStatusBanner } from "@/features/ghn-shipping/components/BackendStatusBanner";
import { ToastHost } from "@/features/ghn-shipping/components/ToastHost";

export const metadata: Metadata = {
  title: "TryBuy GHN Console",
  description: "GHN logistics operations console",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <BackendStatusBanner />
          {children}
          <ToastHost />
        </Providers>
      </body>
    </html>
  );
}

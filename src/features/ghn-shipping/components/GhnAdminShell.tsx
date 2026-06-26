"use client";

import { GhnSidebar } from "./GhnSidebar";
import { GhnTopbar } from "./GhnTopbar";

/** Authenticated layout: sticky sidebar + sticky topbar + scrolling content. */
export function GhnAdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <GhnSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <GhnTopbar title={title} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-6">{children}</main>
      </div>
    </div>
  );
}

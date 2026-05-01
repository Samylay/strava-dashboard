import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { SyncButton } from "@/components/sync-button";
import { getSyncState } from "@/lib/queries";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Strava Dashboard",
  description: "Personal Strava analytics",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  let lastSync: string | null = null;
  try {
    const state = getSyncState();
    if (state.last_sync_at) {
      lastSync = format(new Date(Number(state.last_sync_at) * 1000), "MMM d, HH:mm");
    }
  } catch {
    // DB not initialized yet
  }

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-fg antialiased">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="h-14 border-b border-bg-border flex items-center justify-between px-6 bg-bg-card/40">
              <div className="text-sm text-fg-muted">Personal training analytics</div>
              <SyncButton lastSync={lastSync} />
            </header>
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}

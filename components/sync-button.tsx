"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

export function SyncButton({ lastSync }: { lastSync: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function onClick() {
    setMsg(null);
    const res = await fetch("/api/sync", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (json.ok) {
      setMsg(`Synced ${json.count ?? 0} new`);
    } else {
      setMsg(json.error ?? "Sync failed");
    }
    startTransition(() => router.refresh());
    setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-fg-muted">{msg}</span>}
      {lastSync && !msg && (
        <span className="text-xs text-fg-subtle">last sync: {lastSync}</span>
      )}
      <button
        onClick={onClick}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-bg-border bg-bg-card px-3 py-1.5 text-sm",
          "hover:bg-bg-subtle hover:border-strava/50 disabled:opacity-50"
        )}
      >
        <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
        Sync
      </button>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PERIOD_OPTIONS } from "@/lib/periods";
import { sportEmoji } from "@/lib/format";
import { cn } from "@/lib/cn";

function setParam(params: URLSearchParams, k: string, v: string | null) {
  const next = new URLSearchParams(params);
  if (v == null || v === "") next.delete(k);
  else next.set(k, v);
  return next.toString();
}

export function PeriodPicker({ paramKey = "period" }: { paramKey?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get(paramKey) ?? "year";

  return (
    <div className="flex items-center gap-1 rounded-md border border-bg-border bg-bg-card p-1">
      {PERIOD_OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => router.push(`${pathname}?${setParam(params, paramKey, o.value)}`)}
          className={cn(
            "rounded px-2.5 py-1 text-xs transition-colors",
            current === o.value
              ? "bg-strava/15 text-strava"
              : "text-fg-muted hover:bg-bg-subtle hover:text-fg"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SportFilter({ sports }: { sports: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("sport") ?? "all";

  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-bg-border bg-bg-card p-1">
      <button
        onClick={() => router.push(`${pathname}?${setParam(params, "sport", null)}`)}
        className={cn(
          "shrink-0 rounded px-2.5 py-1 text-xs",
          current === "all" ? "bg-strava/15 text-strava" : "text-fg-muted hover:bg-bg-subtle hover:text-fg"
        )}
      >
        All sports
      </button>
      {sports.map((s) => (
        <button
          key={s}
          onClick={() => router.push(`${pathname}?${setParam(params, "sport", s)}`)}
          className={cn(
            "shrink-0 rounded px-2.5 py-1 text-xs",
            current === s ? "bg-strava/15 text-strava" : "text-fg-muted hover:bg-bg-subtle hover:text-fg"
          )}
        >
          <span className="mr-1">{sportEmoji(s)}</span>
          {s}
        </button>
      ))}
    </div>
  );
}

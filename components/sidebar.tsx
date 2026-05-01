"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  Trophy,
  Target,
  TrendingUp,
  PieChart,
  BarChart3,
  GitCompareArrows,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/timeline", label: "Timeline", icon: CalendarDays },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/sports", label: "Sports", icon: PieChart },
  { href: "/distributions", label: "Distributions", icon: BarChart3 },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/records", label: "Records", icon: Trophy },
  { href: "/goals", label: "Goals", icon: Target },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-bg-border bg-bg-card flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-bg-border">
        <Activity className="h-5 w-5 text-strava" />
        <span className="font-semibold tracking-tight">Strava</span>
        <span className="ml-auto text-xs text-fg-subtle">v0.1</span>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/" && pathname?.startsWith(it.href));
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-strava/10 text-strava"
                  : "text-fg-muted hover:text-fg hover:bg-bg-subtle"
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 text-xs text-fg-subtle border-t border-bg-border">
        Personal dashboard
      </div>
    </aside>
  );
}

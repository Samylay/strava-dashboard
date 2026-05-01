import { cn } from "@/lib/cn";
import * as React from "react";

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-bg-border bg-bg-card p-5 shadow-sm",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2 className={cn("text-sm font-medium text-fg-muted mb-3", className)}>
      {children}
    </h2>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-fg-subtle">{label}</div>
      <div
        className={cn(
          "mt-1 text-2xl font-semibold tracking-tight tabular-nums",
          accent && "text-strava"
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-fg-muted">{hint}</div>}
    </Card>
  );
}

export function EmptyState({
  title,
  body,
  cta,
}: {
  title: string;
  body?: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-bg-border bg-bg-card/50 p-12 text-center">
      <div className="text-lg font-semibold">{title}</div>
      {body && <div className="mt-2 max-w-md text-sm text-fg-muted">{body}</div>}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

export function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function Pill({
  children,
  active,
  className,
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs",
        active
          ? "border-strava bg-strava/10 text-strava"
          : "border-bg-border bg-bg-subtle text-fg-muted",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-card">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-fg-subtle border-b border-bg-border",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("px-4 py-2 border-b border-bg-border/50", className)}>{children}</td>
  );
}

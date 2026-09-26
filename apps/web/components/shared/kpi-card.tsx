import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiTrend {
  /** Percent change vs the comparison period. Pass null when there is no baseline. */
  percent: number | null;
  label?: string;
  /** Set when a rise is bad (e.g. withdrawals), so the colour flips. */
  invert?: boolean;
}

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  className?: string;
  iconClassName?: string;
  /** Optional period-over-period delta shown beside the value. */
  trend?: KpiTrend;
}

function TrendPill({ percent, label, invert }: KpiTrend) {
  // No baseline to compare against — a "+100%" here would be fiction.
  if (percent === null || !Number.isFinite(percent)) {
    return (
      <span className="text-[10px] font-medium text-muted-foreground">
        {label ?? "no prior data"}
      </span>
    );
  }

  const flat = Math.abs(percent) < 0.05;
  const good = invert ? percent < 0 : percent > 0;
  const Icon = percent >= 0 ? TrendingUpIcon : TrendingDownIcon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
        flat
          ? "bg-muted text-muted-foreground"
          : good
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      )}
      title={label}
    >
      {!flat && <Icon className="size-3" />}
      {percent > 0 ? "+" : ""}
      {percent.toFixed(1)}%
    </span>
  );
}

export function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  loading,
  className,
  iconClassName,
  trend,
}: KpiCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
              {title}
            </p>
            {loading ? (
              <div className="mt-1.5 h-7 w-24 rounded-md bg-muted animate-pulse" />
            ) : (
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-foreground truncate">
                  {value}
                </span>
                {trend && <TrendPill {...trend} />}
              </div>
            )}
            {sub && !loading && (
              <div className="mt-0.5 text-xs text-muted-foreground truncate">{sub}</div>
            )}
          </div>
          <div className={cn("shrink-0 p-2.5 rounded-lg bg-primary/10 text-primary", iconClassName)}>
            <Icon className="size-4" />
          </div>
        </div>
        {/* subtle accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
      </CardContent>
    </Card>
  );
}

import { TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Change in net revenue vs the previous period; "no prior data" when null. */
export function GrowthBadge({ percent }: { percent: number | null }) {
  if (percent === null) {
    return <span className="text-xs text-muted-foreground">no prior data</span>;
  }
  const flat = Math.abs(percent) < 0.05;
  const Icon = percent >= 0 ? TrendingUpIcon : TrendingDownIcon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        flat
          ? "bg-muted text-muted-foreground"
          : percent > 0
            ? "bg-ok-soft text-ok"
            : "bg-bad-soft text-bad",
      )}
    >
      {!flat && <Icon className="size-3" />}
      {percent > 0 ? "+" : ""}
      {percent.toFixed(1)}%
    </span>
  );
}

import * as React from "react";
import { AlertCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Label, control, hint and error in the Aperture arrangement: a 13px semibold
 * label, a 12px secondary hint underneath, and errors that carry an icon and
 * text (never colour alone).
 */
export function Field({
  label,
  hint,
  error,
  warning,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  /** Something to know, not a blocker. */
  warning?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-bad">
          <AlertCircleIcon className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : warning ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-warn">
          <AlertCircleIcon className="size-3.5 shrink-0" />
          {warning}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

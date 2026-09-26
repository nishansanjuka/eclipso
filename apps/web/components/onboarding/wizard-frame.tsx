"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { CheckIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export const STEPS = [
  { key: "business", label: "Business", minutes: 8 },
  { key: "stores", label: "Stores and tax", minutes: 6 },
  { key: "products", label: "Products", minutes: 4 },
  { key: "team", label: "Your team", minutes: 1 },
] as const;

/**
 * The onboarding chrome: brand, the four-step tracker and "save and finish
 * later". Every step's content sits in the same 720px column so the pages feel
 * like one flow.
 */
export function WizardFrame({
  organisation,
  step,
  onStep,
  children,
}: {
  organisation: string | null;
  step: number;
  /** Jump back to an earlier, completed step. */
  onStep: (index: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-surface px-6 py-4 sm:px-12">
        <div className="flex items-center gap-4">
          <Logo />
          {organisation && (
            <span className="hidden text-sm text-muted-foreground sm:block">
              Setting up {organisation}
            </span>
          )}
        </div>
        <ol
          className="flex items-center gap-2 sm:gap-4"
          aria-label="Setup steps"
        >
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s.key} className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!done}
                  onClick={() => onStep(i)}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 text-[13px] font-semibold",
                    current ? "text-foreground" : "text-muted-foreground",
                    done && "cursor-pointer hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 items-center justify-center rounded-full text-xs font-bold",
                      done && "bg-ok-soft text-ok",
                      current && "bg-primary text-primary-foreground",
                      !done && !current && "bg-sunken text-text-3",
                    )}
                  >
                    {done ? <CheckIcon className="size-3.5" /> : i + 1}
                  </span>
                  <span className="hidden md:inline">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/" />}
          >
            Save and finish later
          </Button>
          <ThemeToggle />
          <UserButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 px-6 py-10">
        {children}
      </main>
    </div>
  );
}

export function StepHeading({
  index,
  title,
  text,
}: {
  index: number;
  title: string;
  text: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-bold tracking-wide text-accent-text uppercase">
        Step {index + 1} of {STEPS.length}
      </p>
      <h1 className="text-[28px] leading-[34px] font-extrabold tracking-tight">
        {title}
      </h1>
      <p className="text-[15px] leading-[22px] text-muted-foreground">{text}</p>
    </div>
  );
}

export function StepFooter({
  index,
  onBack,
  primary,
  primaryLabel,
  busy,
  disabled,
  secondary,
}: {
  index: number;
  onBack?: () => void;
  primary: () => void;
  primaryLabel: string;
  busy?: boolean;
  disabled?: boolean;
  secondary?: React.ReactNode;
}) {
  const left = STEPS.slice(index).reduce((n, s) => n + s.minutes, 0) / 2;
  return (
    <footer className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
      <p className="text-[13px] text-muted-foreground">
        Step {index + 1} of {STEPS.length} · about{" "}
        {Math.max(1, Math.round(left))}{" "}
        {Math.round(left) <= 1 ? "minute" : "minutes"} left
      </p>
      <div className="flex items-center gap-2">
        {secondary}
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={busy}>
            Back
          </Button>
        )}
        <Button onClick={primary} disabled={busy || disabled}>
          {busy ? "Saving…" : primaryLabel}
        </Button>
      </div>
    </footer>
  );
}

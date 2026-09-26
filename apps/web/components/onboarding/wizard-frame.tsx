"use client";

import { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { CheckIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const STEPS = [
  { key: "business", label: "Business", minutes: 8 },
  { key: "stores", label: "Stores and tax", minutes: 6 },
  { key: "products", label: "Products", minutes: 4 },
  { key: "team", label: "Your team", minutes: 1 },
] as const;

/** Where each step's Back / Continue bar renders: pinned under the content. */
const FooterSlot = createContext<HTMLElement | null>(null);

/**
 * The onboarding chrome: a dark rail on the left carries the brand, the
 * organisation being set up and the vertical step tracker; the step's own
 * content sits on the right with its actions pinned to the bottom edge. On a
 * narrow screen the rail folds into a compact top bar.
 */
export function WizardFrame({
  organisation,
  step,
  onStep,
  wide,
  children,
}: {
  organisation: string | null;
  step: number;
  /** Jump back to an earlier, completed step. */
  onStep: (index: number) => void;
  /** Give the step room for two columns. */
  wide?: boolean;
  children: React.ReactNode;
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  return (
    <div className="flex min-h-svh flex-col bg-background lg:flex-row">
      {/* Compact bar for small screens */}
      <header className="flex items-center justify-between gap-3 border-b bg-surface px-4 py-3 lg:hidden">
        <Logo />
        <p className="text-[13px] font-semibold text-muted-foreground">
          Step {step + 1} of {STEPS.length} · {STEPS[step].label}
        </p>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <UserButton />
        </div>
      </header>

      <aside className="dark hidden w-[340px] shrink-0 flex-col gap-10 bg-background p-8 text-foreground lg:sticky lg:top-0 lg:flex lg:h-svh">
        <Logo />

        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-semibold text-accent-text">
            Setting up
          </p>
          <h2 className="text-2xl leading-8 font-extrabold tracking-tight text-balance">
            {organisation ?? "Your business"}
          </h2>
        </div>

        <ol aria-label="Setup steps" className="flex flex-col">
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={s.key} className="relative flex gap-4 pb-8 last:pb-0">
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-8 bottom-0 left-[13px] w-0.5",
                      done ? "bg-ok" : "bg-border",
                    )}
                  />
                )}
                <button
                  type="button"
                  disabled={!done}
                  onClick={() => onStep(i)}
                  aria-current={current ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-4 text-left text-[15px] font-bold",
                    current ? "text-foreground" : "text-muted-foreground",
                    done && "cursor-pointer hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                      done && "bg-ok text-background",
                      current && "bg-primary text-primary-foreground",
                      !done && !current && "border-2 border-input text-text-3",
                    )}
                  >
                    {done ? <CheckIcon className="size-4" /> : i + 1}
                  </span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>

        <div className="mt-auto flex flex-col gap-4">
          <p className="text-[13px] leading-5 text-muted-foreground">
            Everything here can be changed later in Settings. Nothing is locked
            in.
          </p>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/" />}
            className="self-start"
          >
            Save and finish later
          </Button>
          <div className="flex items-center gap-2 border-t pt-4">
            <UserButton />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main
          className={cn(
            "mx-auto flex w-full flex-1 flex-col gap-6 px-6 py-10 lg:px-14 lg:py-12",
            wide ? "max-w-[1040px]" : "max-w-[720px]",
          )}
        >
          <FooterSlot.Provider value={slot}>{children}</FooterSlot.Provider>
        </main>
        <div
          ref={setSlot}
          className="sticky bottom-0 z-10 border-t bg-surface px-6 py-4 lg:px-14"
        />
      </div>
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
      <p className="text-[13px] font-semibold text-accent-text">
        Step {index + 1} of {STEPS.length}
      </p>
      <h1 className="text-[28px] leading-[34px] font-extrabold tracking-tight text-balance">
        {title}
      </h1>
      <p className="max-w-[62ch] text-[15px] leading-[22px] text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

/** Rendered into the pinned bar under the content, not inline. */
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
  const slot = useContext(FooterSlot);
  if (!slot) return null;

  const minutes = Math.max(
    1,
    Math.round(STEPS.slice(index).reduce((n, s) => n + s.minutes, 0) / 2),
  );

  return createPortal(
    <div className="mx-auto flex w-full max-w-[1040px] flex-wrap items-center justify-between gap-3">
      <p className="text-[13px] text-muted-foreground">
        Step {index + 1} of {STEPS.length} · about {minutes}{" "}
        {minutes === 1 ? "minute" : "minutes"} left
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
    </div>,
    slot,
  );
}

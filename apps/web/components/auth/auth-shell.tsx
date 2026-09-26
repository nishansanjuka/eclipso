import type { LucideIcon } from "lucide-react";
import { CheckIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export interface AuthFeature {
  icon: LucideIcon;
  title: string;
  text: string;
}

/**
 * Sign up, sign in and invitation screens share one frame: a dark brand panel
 * (the cashier-terminal values of the theme) on the left, the form on the right.
 */
export function AuthShell({
  headline,
  intro,
  features,
  note,
  children,
}: {
  headline: string;
  intro: string;
  features: AuthFeature[];
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh bg-background">
      <aside className="dark hidden w-[520px] shrink-0 flex-col gap-8 bg-background p-12 text-foreground lg:flex">
        <Logo className="text-foreground" />
        <div className="flex flex-col gap-3">
          <h2 className="text-[32px] leading-10 font-extrabold tracking-tight text-balance">
            {headline}
          </h2>
          <p className="text-[15px] leading-[22px] text-muted-foreground">
            {intro}
          </p>
        </div>
        <ul className="flex flex-col gap-5">
          {features.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] bg-accent-soft text-accent-text">
                <Icon className="size-[18px]" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-bold">{title}</span>
                <span className="text-[13px] leading-[19px] text-muted-foreground">
                  {text}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {note && (
          <p className="mt-auto flex items-center gap-2.5 text-[13px] text-text-3">
            <CheckIcon className="size-4 text-ok" />
            {note}
          </p>
        )}
      </aside>
      <main className="flex min-w-0 flex-1 items-center justify-center p-6 sm:p-10">
        <div className="flex w-full max-w-[440px] flex-col gap-5">
          <Logo className="lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}

export function AuthHeading({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1 className="text-[28px] leading-[34px] font-extrabold tracking-tight">
        {title}
      </h1>
      {text && (
        <p className="text-sm leading-[21px] text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

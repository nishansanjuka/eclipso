import Link from "next/link";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  PlusIcon,
  StoreIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAccess } from "@/lib/actions/access";
import { orgUrl, tenancyConfig } from "@/lib/tenancy/host";

/**
 * The app host's home: where everyone lands after signing in. One organisation
 * (and setup finished) goes straight to its workspace; several show the
 * picker; none starts onboarding.
 */
export default async function PickerPage({
  searchParams,
}: {
  searchParams: Promise<{ "no-access"?: string }>;
}) {
  const { "no-access": noAccess } = await searchParams;
  const access = (await getAccess())?.data;
  const businesses = access?.businesses ?? [];

  if (businesses.length === 0) redirect("/onboarding");

  const { rootDomain } = tenancyConfig();
  const [only] = businesses;
  if (businesses.length === 1 && only.onboardingCompletedAt && !noAccess) {
    redirect(orgUrl(only.slug));
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-surface px-6 py-4 sm:px-12">
        <Logo />
        <UserButton />
      </header>
      <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-6 px-6 py-12">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-display font-extrabold tracking-tight">
            Choose an organisation
          </h1>
          <p className="text-lede text-muted-foreground">
            Each organisation has its own address. Pick the one you want to work
            in.
          </p>
        </div>

        {noAccess && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-[10px] bg-bad-soft p-3 text-sm font-semibold text-bad"
          >
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            You do not have access to {noAccess}
            {rootDomain ? `.${rootDomain}` : ""}. Ask the person who invited you
            for a new invitation.
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {businesses.map((b) => (
            <li key={b.orgId}>
              <Link
                href={
                  b.onboardingCompletedAt || b.roleKey !== "owner"
                    ? orgUrl(b.slug)
                    : "/onboarding"
                }
                className="flex items-center gap-4 rounded-2xl border bg-surface p-4 text-foreground transition-colors hover:border-primary"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
                  <StoreIcon className="size-5" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-base font-bold">{b.name}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {b.slug}.{rootDomain || "…"}
                  </span>
                </span>
                {b.roleKey && <Badge variant="secondary">{b.roleKey}</Badge>}
                {!b.onboardingCompletedAt && b.roleKey === "owner" && (
                  <Badge variant="warn">Finish setup</Badge>
                )}
                <ArrowRightIcon className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>

        <div>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/onboarding?new=1" />}
          >
            <PlusIcon />
            Create a new business
          </Button>
        </div>
      </main>
    </div>
  );
}

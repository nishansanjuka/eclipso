import { ShieldXIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/**
 * Shown instead of the workspace when the API refuses every request with
 * `MEMBERSHIP_BANNED` (see apps/api AccessService.resolve). A custom,
 * per-business ban — the user's Clerk account is untouched and works fine on
 * every other workspace they belong to.
 */
export function BannedScreen() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <Logo />
      <div className="flex size-14 items-center justify-center rounded-full bg-bad-soft text-bad">
        <ShieldXIcon className="size-7" />
      </div>
      <div className="flex max-w-md flex-col gap-1.5">
        <h1 className="text-xl font-extrabold tracking-tight">
          You&apos;ve been removed from this workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          An owner or admin has banned you from this business. If you think
          this is a mistake, contact them directly — this only affects this
          one workspace.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/" />}>
        Go back
      </Button>
    </div>
  );
}

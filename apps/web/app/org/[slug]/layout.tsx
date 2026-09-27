import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { redirect } from "next/navigation";
import { BannedScreen } from "@/components/team/banned-screen";
import { getAccess } from "@/lib/actions/access";
import { PERMISSIONS } from "@/lib/access/permissions";
import { ACCESS_QUERY_KEY } from "@/lib/query-options/access";
import { appUrl } from "@/lib/tenancy/host";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Resolve who the user is in THIS workspace once, for the whole tree, so the
  // sidebar and every page know `can()` on first paint (no gated-UI flash).
  const result = await getAccess();
  // A ban is business-specific: the account is fine everywhere else, so this
  // is a dedicated screen, not the generic "no access" redirect below.
  if (result?.serverError?.code === "MEMBERSHIP_BANNED") {
    return <BannedScreen />;
  }
  const access = result?.data;
  const business = access?.businesses.find((b) => b.slug === slug);

  // Not a member of the workspace named by the address: back to the picker.
  if (!access || !business || !access.activeBusinessId) {
    redirect(appUrl(`/?no-access=${encodeURIComponent(slug)}`));
  }
  // The owner has not finished setting up yet: pick up where they left off.
  if (
    !business.onboardingCompletedAt &&
    access.permissions.includes(PERMISSIONS.BUSINESS_MANAGE)
  ) {
    redirect(appUrl("/onboarding"));
  }

  const queryClient = new QueryClient();
  queryClient.setQueryData(ACCESS_QUERY_KEY, access);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-vertical:h-4 data-vertical:self-auto"
              />
              <DynamicBreadcrumb />
            </div>
            <div className="ml-auto flex items-center gap-2 pr-4">
              <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-micro font-medium text-muted-foreground sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
              <ThemeToggle />
            </div>
          </header>
          <CommandPalette />
          <main className="flex flex-1 flex-col">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}

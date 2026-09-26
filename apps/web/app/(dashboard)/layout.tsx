import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from "@tanstack/react-query";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";
import { EnsureActiveBusiness } from "@/components/providers/ensure-active-business";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { accessQueryOptions } from "@/lib/query-options/access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prefetch the access surface once for the whole dashboard so the sidebar and
  // every page resolve `can()` on first paint (no gated-UI flash).
  const queryClient = new QueryClient();
  await Promise.allSettled([queryClient.prefetchQuery(accessQueryOptions)]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EnsureActiveBusiness />
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
              <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
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

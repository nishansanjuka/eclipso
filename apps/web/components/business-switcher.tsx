"use client";

import {
  CheckIcon,
  ChevronsUpDownIcon,
  PlusIcon,
  StoreIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccess } from "@/hooks/use-access";
import { appUrl, orgUrl } from "@/lib/tenancy/host";

/**
 * Workspaces are addresses (`<slug>.<domain>`), so switching is navigation to
 * the other workspace, not a state change. Everyone (owners and co-workers)
 * with more than one organisation gets the same dropdown.
 */
export function BusinessSwitcher() {
  const { isMobile } = useSidebar();
  const { businesses, activeBusiness, isLoading } = useAccess();
  const multiple = businesses.length > 1;

  const header = (
    <>
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <StoreIcon className="size-4" />
      </div>
      {isLoading ? (
        <Skeleton className="h-6 w-28" />
      ) : (
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-bold">
            {activeBusiness?.name ?? "No business"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {activeBusiness?.roleKey ?? "Select a business"}
          </span>
        </div>
      )}
    </>
  );

  if (!multiple) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" className="cursor-default">
            {header}
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-muted" />
            }
          >
            {header}
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-64 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Your organisations</DropdownMenuLabel>
              {businesses.map((b) => (
                <DropdownMenuItem
                  key={b.orgId}
                  onClick={() => {
                    if (b.slug !== activeBusiness?.slug) {
                      window.location.assign(orgUrl(b.slug));
                    }
                  }}
                >
                  <span className="flex-1 truncate">{b.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {b.slug}
                  </span>
                  {b.slug === activeBusiness?.slug && (
                    <CheckIcon className="size-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                window.location.assign(appUrl("/onboarding?new=1"))
              }
            >
              <PlusIcon />
              Create another business
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

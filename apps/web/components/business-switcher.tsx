"use client";

import { CheckIcon, ChevronsUpDownIcon, StoreIcon } from "lucide-react";
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
import {
  CreateBusinessDialog,
  CreateBusinessMenuItem,
} from "@/components/business/create-business-dialog";
import { useAccess } from "@/hooks/use-access";
import { cn } from "@/lib/utils";
import { orgUrl } from "@/lib/tenancy/host";

function BusinessLogo({
  imageUrl,
  name,
}: {
  imageUrl: string | null | undefined;
  name: string | undefined;
}) {
  return (
    <div
      className={cn(
        "flex aspect-square size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg",
        imageUrl ? "bg-transparent" : "bg-primary text-primary-foreground",
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name ?? ""} className="size-full object-cover" />
      ) : (
        <StoreIcon className="size-4" />
      )}
    </div>
  );
}

/**
 * Workspaces are addresses (`<slug>.<domain>`), so switching is navigation to
 * the other workspace, not a state change. Always opens as a dropdown — even
 * with one business — so "create another business" is always reachable here.
 */
export function BusinessSwitcher() {
  const { isMobile } = useSidebar();
  const { businesses, activeBusiness, isLoading } = useAccess();

  const header = (
    <>
      <BusinessLogo imageUrl={activeBusiness?.imageUrl} name={activeBusiness?.name} />
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
            {businesses.length > 0 && (
              <>
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
                      <BusinessLogo imageUrl={b.imageUrl} name={b.name} />
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
              </>
            )}
            <CreateBusinessMenuItem />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <CreateBusinessDialog />
    </SidebarMenu>
  );
}

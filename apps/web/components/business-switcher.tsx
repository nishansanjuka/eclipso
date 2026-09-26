"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronsUpDownIcon, StoreIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { setActiveBusiness } from "@/lib/actions/access";

export function BusinessSwitcher() {
  const { isMobile } = useSidebar();
  const { businesses, activeBusiness, isLoading } = useAccess();
  const queryClient = useQueryClient();
  const router = useRouter();

  async function select(orgId: string) {
    if (orgId === activeBusiness?.orgId) return;
    await setActiveBusiness({ orgId });
    // Everything cached belongs to the previous business.
    await queryClient.invalidateQueries();
    router.refresh();
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
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <StoreIcon className="size-4" />
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeBusiness?.name ?? "No business"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeBusiness?.roleKey ?? "Select a business"}
                </span>
              </div>
            )}
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Businesses</DropdownMenuLabel>
              {businesses.map((b) => (
                <DropdownMenuItem key={b.orgId} onClick={() => select(b.orgId)}>
                  <span className="flex-1 truncate">{b.name}</span>
                  {b.orgId === activeBusiness?.orgId && (
                    <CheckIcon className="size-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

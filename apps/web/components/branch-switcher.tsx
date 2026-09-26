"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CheckIcon, ChevronsUpDownIcon, MapPinIcon } from "lucide-react";
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
import { useAccess } from "@/hooks/use-access";
import { setActiveBranch } from "@/lib/actions/access";

/**
 * Picks the branch you are working in (sales, stock, orders happen there).
 * Hidden for single-branch businesses, where there is nothing to choose.
 */
export function BranchSwitcher() {
  const { isMobile } = useSidebar();
  const { branches, activeBranch } = useAccess();
  const queryClient = useQueryClient();
  const router = useRouter();

  const choices = branches.filter((b) => b.isActive);
  if (choices.length < 2) return null;

  async function select(branchId: string) {
    if (branchId === activeBranch?.id) return;
    await setActiveBranch({ branchId });
    // Stock and sales views belong to the previous branch.
    await queryClient.invalidateQueries();
    router.refresh();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="sm" className="aria-expanded:bg-muted" />
            }
          >
            <MapPinIcon />
            <span className="flex-1 truncate">
              {activeBranch?.name ?? "Select a branch"}
            </span>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Working branch</DropdownMenuLabel>
              {choices.map((b) => (
                <DropdownMenuItem key={b.id} onClick={() => select(b.id)}>
                  <span className="flex-1 truncate">{b.name}</span>
                  {b.id === activeBranch?.id && (
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

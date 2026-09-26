"use client";

import * as React from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  BoxesIcon,
  BuildingIcon,
  ClipboardListIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  PercentIcon,
  ReceiptIcon,
  RotateCcwIcon,
  SettingsIcon,
  ShieldIcon,
  ShoppingCartIcon,
  TagIcon,
  TagsIcon,
  TruckIcon,
  UsersIcon,
  WarehouseIcon,
  BarChart3Icon,
  ScrollTextIcon,
  MapPinIcon,
  BadgePercentIcon,
} from "lucide-react";
import { BranchSwitcher } from "@/components/branch-switcher";
import { BusinessSwitcher } from "@/components/business-switcher";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAccess } from "@/hooks/use-access";
import {
  NAV_GROUP_LABELS,
  NAV_ROUTES,
  type NavGroupKey,
} from "@/lib/access/navigation";

const ICONS: Record<string, React.ReactNode> = {
  "/": <LayoutDashboardIcon />,
  "/sales": <ShoppingCartIcon />,
  "/returns": <RotateCcwIcon />,
  "/customers": <UsersIcon />,
  "/invoices": <ReceiptIcon />,
  "/products": <BoxesIcon />,
  "/categories": <TagsIcon />,
  "/brands": <TagIcon />,
  "/taxes": <PercentIcon />,
  "/discounts": <BadgePercentIcon />,
  "/inventory": <WarehouseIcon />,
  "/orders": <ClipboardListIcon />,
  "/suppliers": <TruckIcon />,
  "/reports": <BarChart3Icon />,
  "/branches": <MapPinIcon />,
  "/team": <BuildingIcon />,
  "/roles": <ShieldIcon />,
  "/audit-logs": <ScrollTextIcon />,
  "/settings": <SettingsIcon />,
};

const GROUP_ORDER: NavGroupKey[] = ["sell", "catalog", "stock", "business"];

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const { can } = useAccess();

  // Same rule the route guard uses: hide what the member could not open.
  const visible = NAV_ROUTES.filter((r) => can(r.permissions)).map((r) => ({
    ...r,
    icon: ICONS[r.url] ?? <FileTextIcon />,
  }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <BusinessSwitcher />
        <BranchSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visible.filter((r) => r.group === "home")} />
        {GROUP_ORDER.map((group) => {
          const items = visible.filter((r) => r.group === group);
          return items.length > 0 ? (
            <NavMain
              key={group}
              items={items}
              label={NAV_GROUP_LABELS[group]}
            />
          ) : null;
        })}
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 px-1 py-2">
          <UserButton />
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              {`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
                user?.primaryEmailAddress?.emailAddress ||
                "Account"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              Manage your account
            </span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

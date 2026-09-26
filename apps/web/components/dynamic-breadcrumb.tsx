"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NAV_ROUTES } from "@/lib/access/navigation";

const labelMap: Record<string, string> = Object.fromEntries(
  NAV_ROUTES.filter((r) => r.url !== "/").map((r) => [
    r.url.slice(1),
    r.title,
  ]),
);

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const items = segments
    .map((segment, index) => ({
      segment,
      href: "/" + segments.slice(0, index + 1).join("/"),
    }))
    .filter((item) => {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          item.segment,
        );
      return !isUuid;
    });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => {
          const label =
            labelMap[item.segment] ||
            item.segment.charAt(0).toUpperCase() + item.segment.slice(1);
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={item.href}>
              <BreadcrumbItem
                className={
                  index === 0 && items.length > 1
                    ? "hidden md:block"
                    : undefined
                }
              >
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={item.href} />}>
                    {label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

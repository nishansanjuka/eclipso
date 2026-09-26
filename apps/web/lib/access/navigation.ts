import { PERMISSIONS as P, type Permission } from "./permissions";

export type NavGroupKey = "sell" | "catalog" | "stock" | "business";

export interface NavRoute {
  title: string;
  /** Path under the dashboard; "/" is the dashboard home. */
  url: string;
  group: NavGroupKey | "home";
  /** Holding ANY of these grants the route. Empty = any signed-in member. */
  permissions: Permission[];
  description: string;
}

/**
 * Single source of truth for dashboard routes: the sidebar, the command
 * palette, the breadcrumb and the placeholder pages all read from here, so
 * they cannot drift apart.
 */
export const NAV_ROUTES: NavRoute[] = [
  {
    title: "Dashboard",
    url: "/",
    group: "home",
    permissions: [],
    description: "Overview of your business.",
  },
  {
    title: "Sales",
    url: "/sales",
    group: "sell",
    permissions: [P.SALE_READ, P.SALE_CREATE],
    description: "Checkout, sales history and voids.",
  },
  {
    title: "Returns",
    url: "/returns",
    group: "sell",
    permissions: [P.RETURN_READ, P.RETURN_CREATE],
    description: "Process and review customer returns.",
  },
  {
    title: "Customers",
    url: "/customers",
    group: "sell",
    permissions: [P.CUSTOMER_READ, P.CUSTOMER_MANAGE],
    description: "Customer records.",
  },
  {
    title: "Invoices",
    url: "/invoices",
    group: "sell",
    permissions: [P.INVOICE_READ, P.INVOICE_MANAGE],
    description: "Invoices and receipts.",
  },
  {
    title: "Products",
    url: "/products",
    group: "catalog",
    permissions: [P.PRODUCT_READ],
    description: "Products and pricing.",
  },
  {
    title: "Categories",
    url: "/categories",
    group: "catalog",
    permissions: [P.CATEGORY_READ, P.CATEGORY_MANAGE],
    description: "Product categories.",
  },
  {
    title: "Brands",
    url: "/brands",
    group: "catalog",
    permissions: [P.BRAND_READ, P.BRAND_MANAGE],
    description: "Product brands.",
  },
  {
    title: "Taxes",
    url: "/taxes",
    group: "catalog",
    permissions: [P.TAX_READ, P.TAX_MANAGE],
    description: "Tax rates.",
  },
  {
    title: "Discounts",
    url: "/discounts",
    group: "catalog",
    permissions: [P.DISCOUNT_READ, P.DISCOUNT_MANAGE],
    description: "Discount rules.",
  },
  {
    title: "Inventory",
    url: "/inventory",
    group: "stock",
    permissions: [P.INVENTORY_READ, P.INVENTORY_ADJUST],
    description: "Stock levels and adjustments.",
  },
  {
    title: "Purchase Orders",
    url: "/orders",
    group: "stock",
    permissions: [P.ORDER_READ, P.ORDER_CREATE, P.ORDER_UPDATE],
    description: "Orders placed with suppliers.",
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    group: "stock",
    permissions: [P.SUPPLIER_READ, P.SUPPLIER_MANAGE],
    description: "Supplier records.",
  },
  {
    title: "Reports",
    url: "/reports",
    group: "business",
    permissions: [P.REPORT_READ],
    description: "Sales and stock reports.",
  },
  {
    title: "Team",
    url: "/team",
    group: "business",
    permissions: [P.MEMBER_READ, P.MEMBER_MANAGE],
    description: "Members of this business.",
  },
  {
    title: "Roles",
    url: "/roles",
    group: "business",
    permissions: [P.ROLE_READ, P.ROLE_MANAGE],
    description: "Roles and permissions.",
  },
  {
    title: "Audit Logs",
    url: "/audit-logs",
    group: "business",
    permissions: [P.AUDIT_READ],
    description: "Who changed what, and when.",
  },
  {
    title: "Settings",
    url: "/settings",
    group: "business",
    permissions: [P.BUSINESS_MANAGE],
    description: "Business settings.",
  },
];

export const NAV_GROUP_LABELS: Record<NavGroupKey, string> = {
  sell: "Sell",
  catalog: "Catalog",
  stock: "Stock & Suppliers",
  business: "Business",
};

export function findRoute(segment: string) {
  return NAV_ROUTES.find((r) => r.url === `/${segment}`);
}

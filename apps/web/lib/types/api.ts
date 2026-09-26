/**
 * Response shapes of apps/api used by the UI. Hand-written until the generated
 * client (packages/api-client-ts) is regenerated for the new endpoints.
 */

export interface Branch {
  id: string;
  businessId: string;
  code: string;
  name: string;
  address: string | null;
  kind: "store" | "warehouse";
  registerCount: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Money is a decimal string ("12.34"); never do arithmetic on it in floats. */
export interface Metrics {
  salesCount: number;
  units: number;
  grossSales: string;
  discounts: string;
  tax: string;
  revenue: string;
  refunds: string;
  returnedUnits: number;
  netRevenue: string;
  averageSale: string;
}

export interface BranchSalesSummary {
  branchId: string;
  name: string;
  code: string;
  isActive: boolean;
  current: Metrics;
  previous: Metrics;
  /** Change in net revenue vs the previous period; null with no prior data. */
  growthPercent: number | null;
}

export interface SalesSummary {
  range: { from: string; to: string };
  previousRange: { from: string; to: string };
  branches: BranchSalesSummary[];
  total: {
    current: Metrics;
    previous: Metrics;
    growthPercent: number | null;
  };
}

export type SeriesInterval = "day" | "week" | "month";

export interface SeriesPoint {
  bucket: string;
  salesCount: number;
  revenue: string;
  refunds: string;
  netRevenue: string;
}

export interface SalesSeries {
  interval: SeriesInterval;
  range: { from: string; to: string };
  series: {
    branchId: string;
    name: string;
    code: string;
    points: SeriesPoint[];
  }[];
  total: SeriesPoint[];
}

export interface StockSummary {
  branches: {
    branchId: string;
    name: string;
    code: string;
    isActive: boolean;
    productsInStock: number;
    units: number;
    stockValue: string;
  }[];
  total: { units: number; stockValue: string };
}

export interface LowStock {
  threshold: number;
  items: {
    branchId: string;
    branchName: string;
    productId: string;
    name: string;
    sku: string;
    qty: number;
  }[];
}

export interface BusinessProfile {
  orgId: string;
  slug: string;
  name: string;
  businessType: "retail" | "service" | "manufacturing";
  registeredName: string | null;
  registrationNumber: string | null;
  phone: string | null;
  country: string;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  vatRegistered: boolean;
  vatNumber: string | null;
  currency: string;
  rounding: "none" | "nearest_1" | "nearest_5";
  onboardingCompletedAt: string | null;
}

export interface Role {
  id: string;
  businessId: string | null;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
}

export interface Member {
  userId: string;
  name: string;
  roleId: string | null;
  roleKey: string | null;
  roleName: string | null;
  joinedAt: string;
  /** Empty = works in every branch. */
  branchIds: string[];
}

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface Invitation {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  branchIds: string[];
  status: InvitationStatus;
  invitedByName: string | null;
  expiresAt: string;
  lastSentAt: string | null;
  sendCount: number;
  createdAt: string;
}

export type InvitationResult =
  | {
      email: string;
      ok: true;
      id: string;
      /** Fallback if the email could not be sent. */
      inviteUrl: string;
      emailSent: boolean;
      emailError?: string;
    }
  | { email: string; ok: false; error: string };

export interface InvitationLookup {
  status: InvitationStatus;
  email: string;
  organizationName: string;
  organizationSlug: string;
  roleName: string;
  branchNames: string[];
  invitedByName: string | null;
  sentAt: string;
  expiresAt: string;
}

export interface ImportResult {
  created: number;
  total: number;
  skipped: { row: number; sku: string | null; reason: string }[];
}

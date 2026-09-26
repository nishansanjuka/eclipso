import { create } from "zustand";
import type { Branch, BusinessProfile, Role } from "@/lib/types/api";

interface OnboardingState {
  step: number;
  /** Set once the business has been created (end of step 1). */
  orgId: string | null;
  slug: string | null;
  business: BusinessProfile | null;
  branches: Branch[];
  roles: Role[];

  setStep: (step: number) => void;
  hydrate: (data: {
    orgId: string;
    business: BusinessProfile;
    branches: Branch[];
    roles: Role[];
  }) => void;
  setCreated: (orgId: string, slug: string) => void;
  setBusiness: (business: BusinessProfile) => void;
  setBranches: (branches: Branch[]) => void;
}

/** What the four onboarding steps share; each step keeps its own form state. */
export const useOnboarding = create<OnboardingState>((set) => ({
  step: 0,
  orgId: null,
  slug: null,
  business: null,
  branches: [],
  roles: [],

  setStep: (step) => set({ step }),
  hydrate: ({ orgId, business, branches, roles }) =>
    set({ orgId, slug: business.slug, business, branches, roles }),
  setCreated: (orgId, slug) => set({ orgId, slug }),
  setBusiness: (business) => set({ business, slug: business.slug }),
  setBranches: (branches) => set({ branches }),
}));

import {
  OnboardingWizard,
  type OnboardingInitial,
} from "@/components/onboarding/onboarding-wizard";
import { getAccess } from "@/lib/actions/access";
import { getOnboardingState } from "@/lib/actions/onboarding";

/**
 * Resumes an unfinished setup if the user owns one; `?new=1` starts a fresh
 * business instead (how an existing owner adds another one).
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: startNew } = await searchParams;

  let initial: OnboardingInitial | null = null;
  if (!startNew) {
    const access = (await getAccess())?.data;
    const unfinished = access?.businesses.find(
      (b) => !b.onboardingCompletedAt && b.roleKey === "owner",
    );
    if (unfinished) {
      const state = (await getOnboardingState({ orgId: unfinished.orgId }))
        ?.data;
      if (state) initial = { orgId: unfinished.orgId, ...state };
    }
  }

  return <OnboardingWizard initial={initial} />;
}

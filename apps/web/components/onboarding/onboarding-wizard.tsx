"use client";

import { useEffect, useRef } from "react";
import { useOnboarding } from "@/stores/onboarding";
import type { Branch, BusinessProfile, Role } from "@/lib/types/api";
import { StepBusiness } from "./step-business";
import { StepProducts } from "./step-products";
import { StepStores } from "./step-stores";
import { StepTeam } from "./step-team";
import { WizardFrame } from "./wizard-frame";

export interface OnboardingInitial {
  orgId: string;
  business: BusinessProfile;
  branches: Branch[];
  roles: Role[];
}

/**
 * The four-step setup for a new business owner. The business exists from the
 * end of step 1, so "Save and finish later" loses nothing: coming back resumes
 * with everything entered so far.
 */
export function OnboardingWizard({
  initial,
}: {
  initial: OnboardingInitial | null;
}) {
  const { step, setStep, business, hydrate } = useOnboarding();

  // Seed the store once, from what the server already knows about this owner.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (initial) {
      hydrate(initial);
      setStep(1);
    }
  }, [initial, hydrate, setStep]);

  const back = () => setStep(Math.max(0, step - 1));
  const next = () => setStep(Math.min(3, step + 1));

  return (
    <WizardFrame
      organisation={business?.name ?? null}
      step={step}
      onStep={setStep}
      wide={step === 1}
    >
      {step === 0 && (
        <StepBusiness key={business?.orgId ?? "new"} onNext={next} />
      )}
      {step === 1 && (
        <StepStores key={business?.orgId} onNext={next} onBack={back} />
      )}
      {step === 2 && <StepProducts onNext={next} onBack={back} />}
      {step === 3 && <StepTeam onBack={back} />}
    </WizardFrame>
  );
}

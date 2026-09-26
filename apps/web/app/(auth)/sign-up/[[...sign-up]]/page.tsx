import { SignUp } from "@clerk/nextjs";
import { BoxesIcon, PercentIcon, StoreIcon, UsersIcon } from "lucide-react";
import { AuthHeading, AuthShell } from "@/components/auth/auth-shell";
import { clerkFormElements } from "@/components/auth/clerk-elements";

export default function SignUpPage() {
  return (
    <AuthShell
      headline="Set your shop up in about ten minutes."
      intro="Aperture runs the till and the stock room on the same data, so the numbers on the owner dashboard are the numbers at the counter."
      features={[
        {
          icon: StoreIcon,
          title: "Your business and stores",
          text: "Name, address and how many registers each shop runs.",
        },
        {
          icon: PercentIcon,
          title: "Tax the way you are registered",
          text: "VAT registered or not, set once for the whole business.",
        },
        {
          icon: BoxesIcon,
          title: "Your products",
          text: "Import a CSV from your old system, or start from a template.",
        },
        {
          icon: UsersIcon,
          title: "Your people",
          text: "Invite managers and cashiers, each with their own access.",
        },
      ]}
      note="Free for 14 days. No card needed to start."
    >
      <AuthHeading
        title="Create your business account"
        text="You will be the owner of this account. You can hand that over later."
      />
      <SignUp
        appearance={{ elements: clerkFormElements }}
        fallbackRedirectUrl="/onboarding"
        signInUrl="/sign-in"
      />
    </AuthShell>
  );
}

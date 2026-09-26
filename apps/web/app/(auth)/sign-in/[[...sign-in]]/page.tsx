import { SignIn } from "@clerk/nextjs";
import { BarChart3Icon, ClipboardListIcon, SparklesIcon } from "lucide-react";
import { AuthHeading, AuthShell } from "@/components/auth/auth-shell";
import { clerkFormElements } from "@/components/auth/clerk-elements";

export default function SignInPage() {
  return (
    <AuthShell
      headline="Welcome back."
      intro="Everything the tills did today is already here: sales, stock movements, shift figures and the exceptions that need you."
      features={[
        {
          icon: BarChart3Icon,
          title: "Today, at a glance",
          text: "Sales, baskets and margin against the same day last week.",
        },
        {
          icon: ClipboardListIcon,
          title: "What needs a decision",
          text: "Cash variances, stock outs and discounts still running.",
        },
        {
          icon: SparklesIcon,
          title: "Answers, not just charts",
          text: "Ask why a number moved and get the working out.",
        },
      ]}
      note="Tills keep selling even when this site is down."
    >
      <AuthHeading
        title="Sign in to Aperture"
        text="Owners, managers and co-workers all sign in here."
      />
      <SignIn
        appearance={{ elements: clerkFormElements }}
        fallbackRedirectUrl="/"
        signUpUrl="/sign-up"
      />
    </AuthShell>
  );
}

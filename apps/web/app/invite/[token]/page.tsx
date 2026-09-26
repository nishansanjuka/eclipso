import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  LockIcon,
  ReceiptIcon,
  StoreIcon,
  UserIcon,
} from "lucide-react";
import { AuthHeading, AuthShell } from "@/components/auth/auth-shell";
import { clerkFormElements } from "@/components/auth/clerk-elements";
import { AcceptInvitation } from "@/components/team/accept-invitation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { lookupInvitation } from "@/lib/actions/team";
import { orgUrl } from "@/lib/tenancy/host";

const features = [
  {
    icon: UserIcon,
    title: "Your own account",
    text: "Your password is yours. Nobody shares a login at the counter.",
  },
  {
    icon: ReceiptIcon,
    title: "Your shift figures",
    text: "See what you sold and how your drawer counted at close.",
  },
  {
    icon: LockIcon,
    title: "Limited on purpose",
    text: "Your account only reaches what your role allows.",
  },
];

function Notice({
  icon,
  title,
  text,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-surface p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-warn-soft text-warn">
          {icon}
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-bold">{title}</h2>
          <p className="text-[13px] leading-5 text-muted-foreground">{text}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await lookupInvitation(token);
  const { userId } = await auth();
  const back = `/invite/${token}`;

  const shell = (children: React.ReactNode, headline?: string) => (
    <AuthShell
      headline={headline ?? "You have been invited to the till."}
      intro="Aperture is the system your shop uses to sell, count stock and close the day."
      features={features}
      note="This link works once and expires 7 days after it was sent."
    >
      {children}
    </AuthShell>
  );

  if (!invitation) {
    return shell(
      <Notice
        icon={<AlertCircleIcon className="size-5" />}
        title="This invitation link is not valid"
        text="It may have been mistyped or replaced by a newer one. Ask the person who invited you to send it again."
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/sign-in" />}
        >
          Sign in instead
        </Button>
      </Notice>,
    );
  }

  const org = invitation.organizationName;

  if (invitation.status === "expired" || invitation.status === "revoked") {
    const expired = invitation.status === "expired";
    return shell(
      <Notice
        icon={<ClockIcon className="size-5" />}
        title={
          expired
            ? "This invitation has expired"
            : "This invitation was withdrawn"
        }
        text={
          expired
            ? `Invitations last 7 days. ${invitation.invitedByName ?? "The person who invited you"} can send a new one from Invitations in the back office, and this link stops working the moment they do.`
            : `${invitation.invitedByName ?? "The person who invited you"} withdrew this invitation. Ask them to send a new one if it was a mistake.`
        }
      >
        <p className="text-[13px] text-muted-foreground">
          Already joined?{" "}
          <Link href="/sign-in" className="font-bold">
            Sign in instead
          </Link>
        </p>
      </Notice>,
    );
  }

  if (invitation.status === "accepted") {
    return shell(
      <Notice
        icon={<CheckCircle2Icon className="size-5" />}
        title="This invitation was already used"
        text={`Sign in to open ${org}.`}
      >
        <Button
          nativeButton={false}
          render={<Link href={orgUrl(invitation.organizationSlug)} />}
        >
          Open {org}
        </Button>
      </Notice>,
    );
  }

  return shell(
    <>
      <AuthHeading
        title={`Join ${org}`}
        text={`${invitation.email} was invited to this account. ${
          userId ? "Confirm to finish." : "Create your account to finish."
        }`}
      />

      <div className="flex items-center gap-3 rounded-2xl border bg-surface p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent-text">
          <StoreIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{org}</p>
          <p className="truncate text-[13px] text-muted-foreground">
            Invited by {invitation.invitedByName ?? "a colleague"}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Badge variant="secondary">{invitation.roleName}</Badge>
          <Badge variant="secondary">
            {invitation.branchNames.length > 0
              ? invitation.branchNames.join(", ")
              : "All stores"}
          </Badge>
        </div>
      </div>

      {userId ? (
        <AcceptInvitation token={token} organisation={org} />
      ) : (
        <>
          <SignUp
            appearance={{ elements: clerkFormElements }}
            // The page is /invite/<token>, not a catch-all route, so Clerk keeps its
            // sign-up steps in the URL hash instead of extra path segments.
            routing="hash"
            initialValues={{ emailAddress: invitation.email }}
            forceRedirectUrl={back}
            signInForceRedirectUrl={back}
            signInUrl={`/sign-in?redirect_url=${encodeURIComponent(back)}`}
          />
          <p className="text-center text-[13px] text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(back)}`}
              className="font-bold"
            >
              Sign in instead
            </Link>
          </p>
        </>
      )}
    </>,
    `Join ${org}.`,
  );
}

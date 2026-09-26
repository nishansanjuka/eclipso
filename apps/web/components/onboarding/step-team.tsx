"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  CheckCircle2Icon,
  CopyIcon,
  InfoIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleActionResponse } from "@/lib/action-client";
import { saveBusiness, sendInvitations } from "@/lib/actions/onboarding";
import type { InvitationResult } from "@/lib/types/api";
import { orgUrl } from "@/lib/tenancy/host";
import { useOnboarding } from "@/stores/onboarding";
import { StepFooter, StepHeading } from "./wizard-frame";

const ALL = "__all__";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Row {
  email: string;
  roleId: string;
  storeId: string;
}

export function StepTeam({ onBack }: { onBack: () => void }) {
  const { orgId, slug, roles, branches } = useOnboarding();
  const { signOut } = useClerk();

  /**
   * Off to the workspace. Optionally sign out first (development Clerk
   * instances keep a session per host, so the workspace address needs its own
   * sign in; set NEXT_PUBLIC_SIGN_OUT_AFTER_ONBOARDING=true).
   */
  const goToWorkspace = async (address: string) => {
    if (process.env.NEXT_PUBLIC_SIGN_OUT_AFTER_ONBOARDING === "true") {
      await signOut({ redirectUrl: address });
      return;
    }
    window.location.assign(address);
  };
  const invitable = roles.filter((r) => r.key !== "owner");
  const stores = branches.filter((b) => b.isActive && b.kind === "store");

  const [rows, setRows] = useState<Row[]>([]);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(
    (invitable.find((r) => r.key === "member") ?? invitable[0])?.id ?? "",
  );
  const [storeId, setStoreId] = useState(ALL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<InvitationResult[] | null>(null);

  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? "";
  const storeName = (id: string) =>
    id === ALL ? "All stores" : (branches.find((b) => b.id === id)?.name ?? "");

  function add() {
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value)) return setError("Enter a valid email address.");
    if (rows.some((r) => r.email === value)) {
      return setError("That person is already on the list.");
    }
    if (!roleId) return setError("Pick a role.");
    setError(null);
    setRows([...rows, { email: value, roleId, storeId }]);
    setEmail("");
  }

  async function finish(send: boolean) {
    if (!orgId || !slug) return;
    setBusy(true);
    try {
      if (send && rows.length > 0) {
        const response = handleActionResponse(
          await sendInvitations({
            orgId,
            invitations: rows.map((r) => ({
              email: r.email,
              roleId: r.roleId,
              branchIds: r.storeId === ALL ? undefined : [r.storeId],
            })),
          }),
        );
        if (!response.success) throw new Error(response.error.message);
        setResults(response.data.results);

        const failed = response.data.results.some((r) => !r.ok);
        const notEmailed = response.data.results.some(
          (r) => r.ok && !r.emailSent,
        );
        if (failed || notEmailed) {
          toast.warning(
            "Some invitations need your attention before you continue.",
          );
          return;
        }
      }
      const done = handleActionResponse(
        await saveBusiness({ orgId, onboardingCompleted: true }),
      );
      if (!done.success) throw new Error(done.error.message);
      await goToWorkspace(orgUrl(slug));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not finish");
    } finally {
      setBusy(false);
    }
  }

  const finishNow = async () => {
    // Everything already sent: just complete setup.
    if (!orgId || !slug) return;
    setBusy(true);
    try {
      const done = handleActionResponse(
        await saveBusiness({ orgId, onboardingCompleted: true }),
      );
      if (!done.success) throw new Error(done.error.message);
      await goToWorkspace(orgUrl(slug));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not finish");
      setBusy(false);
    }
  };

  return (
    <>
      <StepHeading
        index={3}
        title="Invite the people who work with you"
        text="You can skip this and run the shop on your own account today. Invites can go out any time."
      />

      {results ? (
        <ul className="flex flex-col gap-2">
          {results.map((r) => (
            <li
              key={r.email}
              className="flex flex-wrap items-center gap-3 rounded-2xl border bg-surface p-3.5"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {r.email}
              </span>
              {!r.ok ? (
                <Badge variant="bad">{r.error}</Badge>
              ) : r.emailSent ? (
                <Badge variant="ok">
                  <CheckCircle2Icon /> Invitation sent
                </Badge>
              ) : (
                <>
                  <Badge variant="warn">Not emailed</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await navigator.clipboard.writeText(r.inviteUrl);
                      toast.success("Link copied");
                    }}
                  >
                    <CopyIcon />
                    Copy link
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <>
          {rows.length > 0 && (
            <ul className="flex flex-col gap-2">
              {rows.map((r) => (
                <li
                  key={r.email}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border bg-surface p-3.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {r.email}
                  </span>
                  <Badge variant="secondary">{roleName(r.roleId)}</Badge>
                  <Badge variant="secondary">{storeName(r.storeId)}</Badge>
                  <Badge variant="accent">Ready to send</Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${r.email}`}
                    onClick={() =>
                      setRows(rows.filter((x) => x.email !== r.email))
                    }
                  >
                    <XIcon />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <section className="flex flex-col gap-3 rounded-2xl border bg-surface p-4">
            <h2 className="text-sm font-bold">Add someone</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
                placeholder="name@yourshop.com"
                aria-label="Email"
              />
              <Select value={roleId} onValueChange={(v) => v && setRoleId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: string) => roleName(v) || "Role"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {invitable.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={storeId} onValueChange={(v) => v && setStoreId(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{(v: string) => storeName(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All stores</SelectItem>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && (
              <p role="alert" className="text-sm font-semibold text-bad">
                {error}
              </p>
            )}
            <div>
              <Button variant="outline" onClick={add}>
                <PlusIcon />
                Add to list
              </Button>
            </div>
          </section>

          <p className="flex items-start gap-2 rounded-[10px] bg-info-soft p-3 text-[13px] font-medium text-info">
            <InfoIcon className="mt-0.5 size-4 shrink-0" />
            Each person gets an email with a link that works once. It opens your
            workspace, where they create their account.
          </p>
        </>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-bold">What each role can do</h2>
        <ul className="grid gap-2 text-[13px]">
          {roles.map((r) => (
            <li key={r.id} className="flex gap-2">
              <span className="w-28 shrink-0 font-bold">{r.name}</span>
              <span className="text-muted-foreground">{r.description}</span>
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-muted-foreground">
          Roles can be changed per person later, and a manager can be limited to
          one store.
        </p>
      </section>

      <StepFooter
        index={3}
        onBack={onBack}
        primary={() => (results ? finishNow() : finish(true))}
        primaryLabel={
          results
            ? "Finish setup"
            : rows.length > 0
              ? `Send ${rows.length} invite${rows.length === 1 ? "" : "s"} and finish`
              : "Finish setup"
        }
        busy={busy}
      />
    </>
  );
}

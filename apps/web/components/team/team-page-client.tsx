"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2Icon,
  ClockIcon,
  CopyIcon,
  MailIcon,
  PlusIcon,
  SendIcon,
  XCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DialogWrapper } from "@/components/shared/dialog-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReusableTable, type Column } from "@/components/ui/reusable-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccess } from "@/hooks/use-access";
import { PERMISSIONS } from "@/lib/access/permissions";
import { handleActionResponse } from "@/lib/action-client";
import {
  createInvitations,
  resendInvitation,
  revokeInvitation,
} from "@/lib/actions/team";
import {
  invitationsQueryOptions,
  rolesQueryOptions,
} from "@/lib/query-options/team";
import type {
  Invitation,
  InvitationResult,
  InvitationStatus,
} from "@/lib/types/api";
import { useDialogStore } from "@/stores";

const INVITE_DIALOG = "invite-people";
const ALL = "__all__";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS: Record<
  InvitationStatus,
  {
    label: string;
    variant: "accent" | "ok" | "bad" | "warn";
    icon: React.ReactNode;
  }
> = {
  pending: { label: "Pending", variant: "accent", icon: <ClockIcon /> },
  accepted: { label: "Accepted", variant: "ok", icon: <CheckCircle2Icon /> },
  revoked: { label: "Revoked", variant: "bad", icon: <XCircleIcon /> },
  expired: { label: "Expired", variant: "warn", icon: <ClockIcon /> },
};

const date = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

function InviteForm({ onSent }: { onSent: () => void }) {
  const queryClient = useQueryClient();
  const { branches } = useAccess();
  const { data: roles = [] } = useQuery(rolesQueryOptions);
  const invitable = roles.filter((r) => r.key !== "owner");
  const stores = branches.filter((b) => b.isActive);

  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [storeId, setStoreId] = useState(ALL);
  const [rows, setRows] = useState<
    { email: string; roleId: string; storeId: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<InvitationResult[] | null>(null);

  const effectiveRole =
    roleId ||
    (invitable.find((r) => r.key === "member") ?? invitable[0])?.id ||
    "";
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? "";
  const storeName = (id: string) =>
    id === ALL ? "All stores" : (stores.find((s) => s.id === id)?.name ?? "");

  const send = useMutation({
    mutationFn: async () => {
      const response = handleActionResponse(
        await createInvitations({
          invitations: rows.map((r) => ({
            email: r.email,
            roleId: r.roleId,
            branchIds: r.storeId === ALL ? undefined : [r.storeId],
          })),
        }),
      );
      if (!response.success) throw new Error(response.error.message);
      return response.data.results;
    },
    onSuccess: async (data) => {
      setResults(data);
      await queryClient.invalidateQueries({
        queryKey: ["team", "invitations"],
      });
      if (data.every((r) => r.ok && r.emailSent)) {
        toast.success(
          `${data.length} invitation${data.length === 1 ? "" : "s"} sent`,
        );
        onSent();
      }
    },
    onError: (e) => toast.error(e.message),
  });

  function add() {
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value)) return setError("Enter a valid email address.");
    if (rows.some((r) => r.email === value))
      return setError("Already on the list.");
    if (!effectiveRole) return setError("Pick a role.");
    setError(null);
    setRows([...rows, { email: value, roleId: effectiveRole, storeId }]);
    setEmail("");
  }

  if (results) {
    return (
      <ul className="flex flex-col gap-2 py-1">
        {results.map((r) => (
          <li
            key={r.email}
            className="flex flex-wrap items-center gap-2 rounded-xl border p-3"
          >
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {r.email}
            </span>
            {!r.ok ? (
              <Badge variant="bad">{r.error}</Badge>
            ) : r.emailSent ? (
              <Badge variant="ok">
                <CheckCircle2Icon /> Sent
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
        <Button className="mt-2" onClick={onSent}>
          Done
        </Button>
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-1">
      <div className="grid gap-3 sm:grid-cols-[1fr_150px_150px]">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="name@yourshop.com"
          aria-label="Email"
        />
        <Select value={effectiveRole} onValueChange={(v) => v && setRoleId(v)}>
          <SelectTrigger className="w-full">
            <SelectValue>{(v: string) => roleName(v) || "Role"}</SelectValue>
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

      {rows.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li
              key={r.email}
              className="flex flex-wrap items-center gap-2 rounded-xl border p-3"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {r.email}
              </span>
              <Badge variant="secondary">{roleName(r.roleId)}</Badge>
              <Badge variant="secondary">{storeName(r.storeId)}</Badge>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${r.email}`}
                onClick={() => setRows(rows.filter((x) => x.email !== r.email))}
              >
                <XCircleIcon />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button
        disabled={rows.length === 0 || send.isPending}
        onClick={() => send.mutate()}
      >
        <SendIcon />
        {send.isPending
          ? "Sending…"
          : `Send ${rows.length || ""} invitation${rows.length === 1 ? "" : "s"}`}
      </Button>
    </div>
  );
}

export function TeamPageClient() {
  const { can, branches } = useAccess();
  const queryClient = useQueryClient();
  const setOpen = useDialogStore((s) => s.setOpen);
  const canManage = can(PERMISSIONS.MEMBER_MANAGE);

  const invitations = useQuery(invitationsQueryOptions);

  const storeNames = (ids: string[]) =>
    ids.length === 0
      ? "All stores"
      : ids
          .map((id) => branches.find((b) => b.id === id)?.name ?? "…")
          .join(", ");

  const resend = useMutation({
    mutationFn: async (id: string) => {
      const response = handleActionResponse(await resendInvitation({ id }));
      if (!response.success) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: ["team", "invitations"],
      });
      if (data.emailSent)
        toast.success("Invitation sent again. The old link no longer works.");
      else {
        await navigator.clipboard
          .writeText(data.inviteUrl)
          .catch(() => undefined);
        toast.warning(
          "Email is not configured. The new link was copied to your clipboard.",
        );
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const response = handleActionResponse(await revokeInvitation({ id }));
      if (!response.success) throw new Error(response.error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["team", "invitations"],
      });
      toast.success("Invitation revoked. Its link no longer works.");
    },
    onError: (e) => toast.error(e.message),
  });

  const invitationColumns: Column<Invitation>[] = [
    {
      header: "Email",
      accessorKey: "email",
      cell: (i) => (
        <span className="flex items-center gap-2 font-semibold">
          <MailIcon className="size-4 text-muted-foreground" />
          {i.email}
        </span>
      ),
    },
    {
      header: "Role",
      accessorKey: "roleName",
      cell: (i) => <Badge variant="secondary">{i.roleName}</Badge>,
    },
    {
      header: "Stores",
      accessorKey: "branchIds",
      cell: (i) => storeNames(i.branchIds),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: (i) => (
        <Badge variant={STATUS[i.status].variant}>
          {STATUS[i.status].icon}
          {STATUS[i.status].label}
        </Badge>
      ),
    },
    {
      header: "Sent",
      accessorKey: "lastSentAt",
      cell: (i) => (
        <span className="text-muted-foreground">
          {date(i.lastSentAt ?? i.createdAt)}
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            header: "",
            accessorKey: "id",
            className: "text-right",
            cell: (i: Invitation) =>
              i.status === "pending" || i.status === "expired" ? (
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resend.isPending}
                    onClick={() => resend.mutate(i.id)}
                  >
                    Resend
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={revoke.isPending}
                    onClick={() => revoke.mutate(i.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ) : null,
          } satisfies Column<Invitation>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Invitations</h1>
          <p className="text-sm text-muted-foreground">
            Invite co-workers into this organisation. A link works once and
            expires after 7 days.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setOpen(INVITE_DIALOG, true)}>
            <PlusIcon />
            Invite people
          </Button>
        )}
      </div>

      <section className="flex flex-col gap-2">
        <ReusableTable
          columns={invitationColumns}
          data={invitations.data ?? []}
          isLoading={invitations.isLoading}
          getRowId={(i) => i.id}
          emptyMessage="No invitations yet."
        />
      </section>

      <DialogWrapper
        dialogKey={INVITE_DIALOG}
        title="Invite people"
        description="Each person gets an email with a link to this workspace. You can only invite into roles you hold yourself."
        widthClass="sm:max-w-2xl"
      >
        <InviteForm onSent={() => setOpen(INVITE_DIALOG, false)} />
      </DialogWrapper>
    </div>
  );
}

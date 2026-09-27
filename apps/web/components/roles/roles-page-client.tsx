"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  Loader2Icon,
  LockIcon,
  PlusIcon,
  ShieldAlertIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { DialogWrapper } from "@/components/shared/dialog-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ReusableTable, type Column } from "@/components/ui/reusable-table";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/hooks/use-access";
import { handleActionResponse } from "@/lib/action-client";
import { PERMISSIONS } from "@/lib/access/permissions";
import {
  approveRoleRequest,
  createRole,
  deleteRole,
  rejectRoleRequest,
  setPermissionProtected,
  updateRole,
} from "@/lib/actions/team";
import {
  pendingRoleRequestsQueryOptions,
  permissionCatalogQueryOptions,
  rolesQueryOptions,
} from "@/lib/query-options/team";
import type { PermissionCatalogEntry, Role } from "@/lib/types/api";
import { useDialogStore } from "@/stores";

const ROLE_DIALOG = "role-form";

function unwrapOrThrow<T>(
  result: Parameters<typeof handleActionResponse<T>>[0],
) {
  const response = handleActionResponse(result);
  if (!response.success) throw new Error(response.error.message);
  return response.data;
}

function PermissionPicker({
  catalog,
  selected,
  onToggle,
  currentlyGranted,
  canManageProtective,
}: {
  catalog: PermissionCatalogEntry[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  /** Permissions the role already had (edit mode) — re-checking these never queues a request. */
  currentlyGranted: Set<string>;
  canManageProtective: boolean;
}) {
  const unprotected = catalog.filter((p) => !p.protected);
  const protectedPerms = catalog.filter((p) => p.protected);

  const row = (p: PermissionCatalogEntry) => {
    const checked = selected.has(p.key);
    const willRequest =
      p.protected &&
      checked &&
      !canManageProtective &&
      !currentlyGranted.has(p.key);
    return (
      <label
        key={p.key}
        className="flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 hover:bg-muted/50"
      >
        <Checkbox
          checked={checked}
          onCheckedChange={() => onToggle(p.key)}
          className="mt-0.5"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            {p.label}
            {p.protected && <LockIcon className="size-3 text-muted-foreground" />}
          </span>
          <span className="text-xs text-muted-foreground">
            {p.description}
          </span>
          {willRequest && (
            <Badge variant="warn" className="mt-1 w-fit">
              Will be requested
            </Badge>
          )}
        </div>
      </label>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-bold">Permissions</h4>
        <div className="grid gap-2 sm:grid-cols-2">
          {unprotected.map(row)}
        </div>
      </div>
      {protectedPerms.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="flex items-center gap-1.5 text-sm font-bold">
            <LockIcon className="size-3.5" /> Protected permissions
          </h4>
          {!canManageProtective && (
            <p className="text-xs text-muted-foreground">
              You can select these, but they only take effect once someone
              with &quot;Manage Protected Permissions&quot; approves the
              request.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {protectedPerms.map(row)}
          </div>
        </div>
      )}
    </div>
  );
}

export interface RoleFormHandle {
  submit: () => void;
}

interface RoleFormState {
  canSubmit: boolean;
  isPending: boolean;
}

const RoleForm = forwardRef<
  RoleFormHandle,
  {
    role: Role | null;
    catalog: PermissionCatalogEntry[];
    canManageProtective: boolean;
    onSaved: () => void;
    onStateChange: (state: RoleFormState) => void;
  }
>(function RoleForm(
  { role, catalog, canManageProtective, onSaved, onStateChange },
  ref,
) {
  const queryClient = useQueryClient();
  const catalogByKey = useMemo(
    () => new Map(catalog.map((p) => [p.key, p])),
    [catalog],
  );
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(role?.permissions ?? []),
  );
  const currentlyGranted = useMemo(
    () => new Set(role?.permissions ?? []),
    [role],
  );

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const save = useMutation({
    mutationFn: async () => {
      const permissions = [...selected];
      if (role) {
        return unwrapOrThrow(
          await updateRole({ roleId: role.id, name, description, permissions }),
        );
      }
      return unwrapOrThrow(await createRole({ name, description, permissions }));
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["team", "roles"] });
      if (data.pendingRequest) {
        await queryClient.invalidateQueries({
          queryKey: ["team", "role-permission-requests"],
        });
        toast.success(
          `Role saved. ${data.pendingRequest.requestedPermissionIds.length} protected permission(s) are pending approval.`,
        );
      } else {
        toast.success(role ? "Role updated" : "Role created");
      }
      onSaved();
    },
    onError: (e) => toast.error(e.message),
  });

  useImperativeHandle(ref, () => ({ submit: () => save.mutate() }), [save]);

  useEffect(() => {
    onStateChange({
      canSubmit: !role?.isSystem && name.trim().length > 0,
      isPending: save.isPending,
    });
  }, [role, name, save.isPending, onStateChange]);

  return (
    <div className="flex flex-col gap-4 py-1">
      <Field label="Name">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={role?.isSystem}
          placeholder="e.g. Cashier"
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          disabled={role?.isSystem}
          placeholder="What this role is for"
        />
      </Field>
      {role?.isSystem ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Built-in roles cannot be modified.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {role.permissions.map((key) => {
              const entry = catalogByKey.get(key);
              return (
                <Badge
                  key={key}
                  variant={entry?.protected ? "warn" : "secondary"}
                >
                  {entry?.protected && <LockIcon />}
                  {entry?.label ?? key}
                </Badge>
              );
            })}
          </div>
        </div>
      ) : (
        <PermissionPicker
          catalog={catalog}
          selected={selected}
          onToggle={toggle}
          currentlyGranted={currentlyGranted}
          canManageProtective={canManageProtective}
        />
      )}
    </div>
  );
});

function RolesTab() {
  const { can } = useAccess();
  const queryClient = useQueryClient();
  const setOpen = useDialogStore((s) => s.setOpen);
  const canManage = can(PERMISSIONS.ROLE_MANAGE);
  const canManageProtective = can(PERMISSIONS.MANAGE_PROTECTIVE_PERMISSIONS);

  const roles = useQuery(rolesQueryOptions);
  const catalog = useQuery(permissionCatalogQueryOptions);
  const [editing, setEditing] = useState<Role | null | undefined>(undefined);
  const formRef = useRef<RoleFormHandle>(null);
  const [formState, setFormState] = useState<RoleFormState>({
    canSubmit: false,
    isPending: false,
  });

  const remove = useMutation({
    mutationFn: async (roleId: string) =>
      unwrapOrThrow(await deleteRole({ roleId })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team", "roles"] });
      toast.success("Role deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const openFor = (role: Role | null) => {
    setEditing(role);
    setOpen(ROLE_DIALOG, true);
  };

  const columns: Column<Role>[] = [
    {
      header: "Role",
      accessorKey: "name",
      cell: (r) => (
        <span className="flex items-center gap-2 font-semibold">
          {r.name}
          {r.isSystem && <Badge variant="secondary">Built-in</Badge>}
        </span>
      ),
    },
    {
      header: "Permissions",
      accessorKey: "permissions",
      cell: (r) => (
        <span className="text-muted-foreground">
          {r.permissions.length} granted
        </span>
      ),
    },
    {
      header: "",
      accessorKey: "id",
      className: "text-right",
      cell: (r) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openFor(r)}>
            {r.isSystem || !canManage ? "View" : "Edit"}
          </Button>
          {canManage && !r.isSystem && (
            <Button
              size="sm"
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => remove.mutate(r.id)}
            >
              {remove.isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <Trash2Icon />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {canManage && (
          <Button onClick={() => openFor(null)}>
            <PlusIcon />
            Create role
          </Button>
        )}
      </div>
      <ReusableTable
        columns={columns}
        data={roles.data ?? []}
        isLoading={roles.isLoading}
        getRowId={(r) => r.id}
        emptyMessage="No roles yet."
      />
      <DialogWrapper
        dialogKey={ROLE_DIALOG}
        title={editing ? editing.name : "Create role"}
        description={
          editing?.isSystem
            ? "Built-in roles are read-only."
            : "Pick what this role can do. You can only grant permissions you hold yourself."
        }
        widthClass="sm:max-w-2xl"
        successButtonElement={
          editing !== undefined && !editing?.isSystem ? (
            <Button
              disabled={!formState.canSubmit || formState.isPending}
              onClick={() => formRef.current?.submit()}
            >
              {formState.isPending && <Loader2Icon className="animate-spin" />}
              {formState.isPending
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Create role"}
            </Button>
          ) : undefined
        }
      >
        {editing !== undefined && (
          <RoleForm
            ref={formRef}
            role={editing}
            catalog={catalog.data ?? []}
            canManageProtective={canManageProtective}
            onSaved={() => setOpen(ROLE_DIALOG, false)}
            onStateChange={setFormState}
          />
        )}
      </DialogWrapper>
    </div>
  );
}

function PendingRequestsTab() {
  const queryClient = useQueryClient();
  const requests = useQuery(pendingRoleRequestsQueryOptions);
  const catalog = useQuery(permissionCatalogQueryOptions);
  const byId = new Map((catalog.data ?? []).map((p) => [p.id, p]));

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["team", "role-permission-requests"],
      }),
      queryClient.invalidateQueries({ queryKey: ["team", "roles"] }),
    ]);

  const approve = useMutation({
    mutationFn: async (id: string) =>
      unwrapOrThrow(await approveRoleRequest({ id })),
    onSuccess: async () => {
      await invalidate();
      toast.success("Request approved");
    },
    onError: (e) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async (id: string) =>
      unwrapOrThrow(await rejectRoleRequest({ id })),
    onSuccess: async () => {
      await invalidate();
      toast.success("Request rejected");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!requests.isLoading && (requests.data ?? []).length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No pending requests.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {(requests.data ?? []).map((r) => (
        <li key={r.id} className="flex flex-col gap-2 rounded-xl border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-semibold">
              <ShieldAlertIcon className="size-4 text-warn" />
              {r.roleName}
            </span>
            <span className="text-xs text-muted-foreground">
              requested by {r.requestedByName}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {r.requestedPermissionIds.map((id) => (
              <Badge key={id} variant="warn">
                <LockIcon />
                {byId.get(id)?.label ?? id}
              </Badge>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={reject.isPending}
              onClick={() => reject.mutate(r.id)}
            >
              {reject.isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <XIcon />
              )}
              Reject
            </Button>
            <Button
              size="sm"
              disabled={approve.isPending}
              onClick={() => approve.mutate(r.id)}
            >
              {approve.isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <CheckIcon />
              )}
              Approve
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PermissionCatalogTab() {
  const queryClient = useQueryClient();
  const catalog = useQuery(permissionCatalogQueryOptions);

  const toggle = useMutation({
    mutationFn: async (vars: { permissionId: string; protected: boolean }) =>
      unwrapOrThrow(await setPermissionProtected(vars)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["team", "permission-catalog"],
      });
    },
    onError: (e) => toast.error(e.message),
  });

  const columns: Column<PermissionCatalogEntry>[] = [
    {
      header: "Permission",
      accessorKey: "label",
      cell: (p) => (
        <div className="flex flex-col">
          <span className="font-semibold">{p.label}</span>
          <span className="text-xs text-muted-foreground">
            {p.description}
          </span>
        </div>
      ),
    },
    {
      header: "Protected",
      accessorKey: "protected",
      className: "text-right",
      cell: (p) => (
        <div className="flex justify-end">
          <Switch
            checked={p.protected}
            disabled={toggle.isPending}
            onCheckedChange={(checked) =>
              toggle.mutate({ permissionId: p.id, protected: checked })
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        A protected permission can only be added to a role directly by
        someone holding &quot;Manage Protected Permissions&quot; — anyone
        else&apos;s attempt becomes a pending request.
      </p>
      <ReusableTable
        columns={columns}
        data={catalog.data ?? []}
        isLoading={catalog.isLoading}
        getRowId={(p) => p.id}
      />
    </div>
  );
}

export function RolesPageClient() {
  const { can } = useAccess();
  const canManageProtective = can(PERMISSIONS.MANAGE_PROTECTIVE_PERMISSIONS);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Roles</h1>
        <p className="text-sm text-muted-foreground">
          Built-in and custom roles, and what each one can do.
        </p>
      </div>

      {canManageProtective ? (
        <Tabs defaultValue="roles">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="requests">Pending requests</TabsTrigger>
            <TabsTrigger value="catalog">Permission catalog</TabsTrigger>
          </TabsList>
          <TabsContent value="roles">
            <RolesTab />
          </TabsContent>
          <TabsContent value="requests">
            <PendingRequestsTab />
          </TabsContent>
          <TabsContent value="catalog">
            <PermissionCatalogTab />
          </TabsContent>
        </Tabs>
      ) : (
        <RolesTab />
      )}
    </div>
  );
}

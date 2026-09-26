"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReusableTable, type Column } from "@/components/ui/reusable-table";
import { DialogWrapper } from "@/components/shared/dialog-wrapper";
import { useAccess } from "@/hooks/use-access";
import { PERMISSIONS } from "@/lib/access/permissions";
import { handleActionResponse } from "@/lib/action-client";
import { createBranch, updateBranch } from "@/lib/actions/branches";
import { ACCESS_QUERY_KEY } from "@/lib/query-options/access";
import { branchesQueryOptions } from "@/lib/query-options/branches";
import type { Branch } from "@/lib/types/api";
import { useDialogStore } from "@/stores";

const ADD_DIALOG = "add-branch";

function AddBranchForm({ onDone }: { onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const response = handleActionResponse(
        await createBranch({ name, code, address: address || undefined }),
      );
      if (!response.success) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Branch added");
      await queryClient.invalidateQueries({ queryKey: ["branches"] });
      await queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY });
      setName("");
      setCode("");
      setAddress("");
      onDone();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      className="grid gap-4 py-1"
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="branch-name">Name</Label>
        <Input
          id="branch-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Kottawa"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="branch-code">Code</Label>
        <Input
          id="branch-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="KOTTAWA"
          required
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="branch-address">Address (optional)</Label>
        <Input
          id="branch-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? "Adding…" : "Add branch"}
      </Button>
    </form>
  );
}

export function BranchesPageClient() {
  const { can } = useAccess();
  const queryClient = useQueryClient();
  const setOpen = useDialogStore((s) => s.setOpen);
  const { data, isLoading } = useQuery(branchesQueryOptions);
  const canManage = can(PERMISSIONS.BRANCH_MANAGE);

  const update = useMutation({
    mutationFn: async (input: Parameters<typeof updateBranch>[0]) => {
      const response = handleActionResponse(await updateBranch(input));
      if (!response.success) throw new Error(response.error.message);
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Branch updated");
      await queryClient.invalidateQueries({ queryKey: ["branches"] });
      await queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY });
    },
    onError: (error) => toast.error(error.message),
  });

  const columns: Column<Branch>[] = [
    {
      header: "Branch",
      accessorKey: "name",
      cell: (b) => (
        <div>
          <p className="font-medium">{b.name}</p>
          <p className="text-xs text-muted-foreground">{b.code}</p>
        </div>
      ),
    },
    {
      header: "Address",
      accessorKey: "address",
      cell: (b) => (
        <span className="text-muted-foreground">{b.address ?? "—"}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (b) => (
        <div className="flex gap-1.5">
          {b.isDefault && <Badge>Default</Badge>}
          <Badge variant={b.isActive ? "secondary" : "outline"}>
            {b.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
    },
    ...(canManage
      ? [
          {
            header: "",
            accessorKey: "id",
            className: "text-right",
            cell: (b: Branch) => (
              <div className="flex justify-end gap-2">
                {!b.isDefault && b.isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: b.id, isDefault: true })}
                  >
                    Make default
                  </Button>
                )}
                {!b.isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={update.isPending}
                    onClick={() =>
                      update.mutate({ id: b.id, isActive: !b.isActive })
                    }
                  >
                    {b.isActive ? "Deactivate" : "Activate"}
                  </Button>
                )}
              </div>
            ),
          } satisfies Column<Branch>,
        ]
      : []),
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Branches</h1>
          <p className="text-sm text-muted-foreground">
            Stock and sales belong to a branch; products are shared. Closed
            branches are deactivated, never deleted, so their history stays.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setOpen(ADD_DIALOG, true)}>
            <PlusIcon />
            Add branch
          </Button>
        )}
      </div>

      <ReusableTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        getRowId={(b) => b.id}
        emptyMessage="No branches yet."
      />

      <DialogWrapper
        dialogKey={ADD_DIALOG}
        title="Add branch"
        description="A new location of this business."
        widthClass="sm:max-w-md"
      >
        <AddBranchForm onDone={() => setOpen(ADD_DIALOG, false)} />
      </DialogWrapper>
    </div>
  );
}

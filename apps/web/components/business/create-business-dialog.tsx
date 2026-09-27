"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { DialogWrapper } from "@/components/shared/dialog-wrapper";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TYPES } from "@/components/onboarding/step-business";
import { handleActionResponse } from "@/lib/action-client";
import { createBusiness, saveBusiness } from "@/lib/actions/onboarding";
import { orgUrl } from "@/lib/tenancy/host";
import { useDialogStore } from "@/stores";

const CREATE_BUSINESS_DIALOG = "create-business";

function unwrap<T>(result: Parameters<typeof handleActionResponse<T>>[0]) {
  const response = handleActionResponse(result);
  if (!response.success) throw new Error(response.error.message);
  return response.data;
}

/**
 * Goes inside the workspace-switcher dropdown. Only closes the menu and
 * schedules the dialog for the next tick — opening it in the same click that
 * closes the menu fights the menu's own focus-return-to-trigger behaviour,
 * which then steals focus (and keystrokes) back out of the dialog's input.
 */
export function CreateBusinessMenuItem() {
  const setOpen = useDialogStore((s) => s.setOpen);
  return (
    <DropdownMenuItem
      onClick={() => setTimeout(() => setOpen(CREATE_BUSINESS_DIALOG, true), 0)}
    >
      <PlusIcon className="size-4" />
      Create another business
    </DropdownMenuItem>
  );
}

/** Renders outside the dropdown's tree entirely — see `CreateBusinessMenuItem`. */
export function CreateBusinessDialog() {
  const setOpen = useDialogStore((s) => s.setOpen);
  const open = useDialogStore((s) => s.openDialogs.has(CREATE_BUSINESS_DIALOG));
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("retail");

  const create = useMutation({
    mutationFn: async () => {
      const business = unwrap(
        await createBusiness({
          name: name.trim(),
          businessType: businessType as "retail",
        }),
      );
      await saveBusiness({ orgId: business.orgId, onboardingCompleted: true });
      return business;
    },
    onSuccess: (business) => {
      setOpen(CREATE_BUSINESS_DIALOG, false);
      window.location.assign(orgUrl(business.slug));
    },
    onError: (e) => toast.error(e.message),
  });

  // Fresh form each time the dialog opens.
  if (!open && (name || businessType !== "retail")) {
    setName("");
    setBusinessType("retail");
  }

  return (
    <DialogWrapper
      dialogKey={CREATE_BUSINESS_DIALOG}
      title="Create a business"
      description="Just a name to start — everything else can be filled in later."
      widthClass="sm:max-w-md"
      successButtonElement={
        <Button
          disabled={name.trim().length < 3 || create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending && <Loader2Icon className="animate-spin" />}
          {create.isPending ? "Creating…" : "Create business"}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-1">
        <Field
          label="Business name"
          htmlFor="new-business-name"
          hint="You can add the rest of the profile, logo and stores from Settings"
        >
          <Input
            id="new-business-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Aperture Retail"
            autoComplete="off"
          />
        </Field>
        <Field label="What do you sell">
          <Select
            value={businessType}
            onValueChange={(v) => v && setBusinessType(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(v: string) => TYPES.find((t) => t.value === v)?.label ?? v}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
    </DialogWrapper>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { handleActionResponse } from "@/lib/action-client";
import { acceptInvitation } from "@/lib/actions/team";
import { orgUrl } from "@/lib/tenancy/host";

/** Joins the organisation, then goes to its workspace address. */
export function AcceptInvitation({
  token,
  organisation,
}: {
  token: string;
  organisation: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    const response = handleActionResponse(await acceptInvitation({ token }));
    if (!response.success) {
      setError(response.error.message);
      setBusy(false);
      return;
    }
    toast.success(`Welcome to ${response.data.organizationName}`);
    window.location.assign(orgUrl(response.data.slug));
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" onClick={accept} disabled={busy} className="w-full">
        {busy ? "Joining…" : `Join ${organisation}`}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-semibold text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Loader2Icon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { handleActionResponse } from "@/lib/action-client";
import {
  presignLogoUpload,
  updateBusinessProfile,
} from "@/lib/actions/settings";
import { ACCESS_QUERY_KEY } from "@/lib/query-options/access";

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;

function unwrap<T>(result: Parameters<typeof handleActionResponse<T>>[0]) {
  const response = handleActionResponse(result);
  if (!response.success) throw new Error(response.error.message);
  return response.data;
}

export function LogoUpload({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl: string | null;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(imageUrl);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, publicUrl } = unwrap(
        await presignLogoUpload({ contentType: file.type as (typeof ACCEPTED)[number] }),
      );
      const put = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!put.ok) throw new Error("Upload to storage failed");
      unwrap(await updateBusinessProfile({ imageUrl: publicUrl }));
      return publicUrl;
    },
    onSuccess: async (publicUrl) => {
      setPreview(publicUrl);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["settings", "business-profile"],
        }),
        queryClient.invalidateQueries({ queryKey: ACCESS_QUERY_KEY }),
      ]);
      toast.success("Logo updated");
    },
    onError: (e) => toast.error(e.message),
  });

  function pick(file: File | undefined) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type as (typeof ACCEPTED)[number])) {
      toast.error("Use a PNG, JPEG or WebP image");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 5 MB or smaller");
      return;
    }
    upload.mutate(file);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={name} className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-6 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {upload.isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <UploadIcon />
          )}
          {upload.isPending ? "Uploading…" : "Upload logo"}
        </Button>
        <p className="text-xs text-muted-foreground">
          PNG, JPEG or WebP, up to 5 MB.
        </p>
      </div>
    </div>
  );
}

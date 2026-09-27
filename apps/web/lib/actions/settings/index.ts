"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import { backendApiClient } from "@/lib/backend-api-client";
import type { BusinessProfile } from "@/lib/types/api";

const optional = (max: number) => z.string().trim().max(max).optional();

/** Everything on the Settings page's business form (mirrors onboarding step 1 + 2). */
export const getBusinessProfile = actionClient.action(async () =>
  backendApiClient.get("auth/business").json<BusinessProfile>(),
);

export const updateBusinessProfile = actionClient
  .inputSchema(
    z.object({
      name: z.string().trim().min(3).max(100).optional(),
      slug: z.string().trim().toLowerCase().optional(),
      businessType: z.enum(["retail", "service", "manufacturing"]).optional(),
      registeredName: optional(150),
      registrationNumber: optional(60),
      phone: optional(30),
      country: z.string().trim().length(2).optional(),
      addressLine: optional(200),
      city: optional(80),
      postalCode: optional(20),
      vatRegistered: z.boolean().optional(),
      vatNumber: optional(40),
      vatRate: z.string().trim().optional(),
      currency: z.string().trim().length(3).optional(),
      rounding: z.enum(["none", "nearest_1", "nearest_5"]).optional(),
      imageUrl: z.url().nullish(),
    }),
  )
  .action(async ({ parsedInput }) =>
    backendApiClient
      .put("auth/business", { json: parsedInput })
      .json<BusinessProfile>(),
  );

/** A one-time S3 URL the browser uploads the logo to directly. */
export const presignLogoUpload = actionClient
  .inputSchema(
    z.object({
      contentType: z.enum(["image/png", "image/jpeg", "image/webp"]),
    }),
  )
  .action(async ({ parsedInput }) =>
    backendApiClient
      .post("auth/business/logo/presign", { json: parsedInput })
      .json<{ uploadUrl: string; publicUrl: string }>(),
  );

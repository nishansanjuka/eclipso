"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import { backendApiClient } from "@/lib/backend-api-client";
import type { Branch } from "@/lib/types/api";

const name = z.string().trim().min(2).max(100);
const code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{2,16}$/, "2-16 letters, digits, _ or -");

export const listBranches = actionClient.action(async () =>
  backendApiClient.get("branches").json<Branch[]>(),
);

export const createBranch = actionClient
  .inputSchema(
    z.object({
      name,
      code,
      address: z.string().trim().max(255).optional(),
    }),
  )
  .action(async ({ parsedInput }) =>
    backendApiClient.post("branches", { json: parsedInput }).json<Branch>(),
  );

export const updateBranch = actionClient
  .inputSchema(
    z.object({
      id: z.string().uuid(),
      name: name.optional(),
      code: code.optional(),
      address: z.string().trim().max(255).nullable().optional(),
      isActive: z.boolean().optional(),
      isDefault: z.literal(true).optional(),
    }),
  )
  .action(async ({ parsedInput: { id, ...patch } }) =>
    backendApiClient.put(`branches/${id}`, { json: patch }).json<Branch>(),
  );

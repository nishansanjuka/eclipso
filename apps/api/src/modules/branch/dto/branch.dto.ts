import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import z from 'zod';

const name = z
  .string({ error: 'Name is required' })
  .trim()
  .min(2, 'Name must be at least 2 characters long')
  .max(100, 'Name must be at most 100 characters long');

const code = z
  .string({ error: 'Code is required' })
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{2,16}$/, 'Code must be 2-16 letters, digits, "_" or "-"');

const address = z.string().trim().max(255).nullish();
const kind = z.enum(['store', 'warehouse']);
const registerCount = z.number().int().min(0).max(50);

export const createBranchSchema = z.object({
  name,
  code,
  address,
  kind: kind.default('store'),
  /** Tills running at once; a warehouse has none. */
  registerCount: registerCount.optional(),
});

export const updateBranchSchema = z.object({
  name: name.optional(),
  code: code.optional(),
  address,
  registerCount: registerCount.optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

export class CreateBranchDto {
  @ApiProperty({ example: 'Kottawa' })
  name: string;
  @ApiProperty({
    example: 'KOTTAWA',
    description: 'Unique within the business',
  })
  code: string;
  @ApiPropertyOptional()
  address?: string | null;
  @ApiPropertyOptional({ enum: ['store', 'warehouse'] })
  kind?: 'store' | 'warehouse';
  @ApiPropertyOptional({ description: 'Registers (tills) running at once' })
  registerCount?: number;
}

export class UpdateBranchDto {
  @ApiPropertyOptional()
  name?: string;
  @ApiPropertyOptional()
  code?: string;
  @ApiPropertyOptional()
  address?: string | null;
  @ApiPropertyOptional()
  registerCount?: number;
  @ApiPropertyOptional({
    description:
      'Deactivate a closed branch. Its history is kept; the default branch cannot be deactivated.',
  })
  isActive?: boolean;
  @ApiPropertyOptional({
    description:
      'Make this the default branch (the previous default is unset). Only `true` is accepted.',
  })
  isDefault?: boolean;
}

export class SetMemberBranchesDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description:
      'Branches the member may work in. Empty = every branch of the business.',
  })
  branchIds: string[];
}

export const setMemberBranchesSchema = z.object({
  branchIds: z
    .array(z.string().uuid('branchIds must be UUIDs'))
    .max(200)
    .transform((ids) => [...new Set(ids)]),
});

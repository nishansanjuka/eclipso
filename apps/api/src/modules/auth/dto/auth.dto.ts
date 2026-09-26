import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import z from 'zod';
import { BusinessType } from '../enums/business-type.enum';
import { PermissionType } from '../enums/auth-permissions.enum';

// ── request schemas (validated with zod, see `parseBody`) ───────────────────

const name = z
  .string({ error: 'Name is required' })
  .trim()
  .min(3, 'Name must be at least 3 characters long')
  .max(100, 'Name must be at most 100 characters long');

const permissionList = z
  .array(
    z.enum(PermissionType, {
      error: `Permission must be one of: ${Object.values(PermissionType).join(', ')}`,
    }),
  )
  .transform((list) => [...new Set(list)]);

export const createBusinessSchema = z.object({
  name,
  businessType: z.enum(BusinessType, {
    error: `Business type must be one of: ${Object.values(BusinessType).join(', ')}`,
  }),
});

export const updateBusinessSchema = z.object({
  name: name.optional(),
  businessType: z.enum(BusinessType).optional(),
});

export const createRoleSchema = z.object({
  name,
  description: z.string().trim().max(255).nullish(),
  permissions: permissionList,
});

export const updateRoleSchema = z.object({
  name: name.optional(),
  description: z.string().trim().max(255).nullish(),
  permissions: permissionList.optional(),
});

export const assignRoleSchema = z.object({
  roleId: z.string().uuid('roleId must be a valid UUID'),
});

/** Parses untrusted input, turning zod failures into a 400. */
export function parseBody<S extends z.ZodType>(
  schema: S,
  body: unknown,
): z.infer<S> {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException(
      result.error.issues.map((issue) => issue.message).join(', '),
    );
  }
  return result.data;
}

// ── swagger DTOs ────────────────────────────────────────────────────────────

export class CreateBusinessDto {
  @ApiProperty()
  name: string;
  @ApiProperty({ enum: BusinessType })
  businessType: BusinessType;
}

export class UpdateBusinessDto {
  @ApiPropertyOptional()
  name?: string;
  @ApiPropertyOptional({ enum: BusinessType })
  businessType?: BusinessType;
}

export class CreateRoleDto {
  @ApiProperty()
  name: string;
  @ApiPropertyOptional({ nullable: true })
  description?: string | null;
  @ApiProperty({ enum: PermissionType, isArray: true })
  permissions: PermissionType[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional()
  name?: string;
  @ApiPropertyOptional({ nullable: true })
  description?: string | null;
  @ApiPropertyOptional({ enum: PermissionType, isArray: true })
  permissions?: PermissionType[];
}

export class AssignRoleDto {
  @ApiProperty({ format: 'uuid' })
  roleId: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BadRequestException } from '@nestjs/common';
import z from 'zod';
import { BusinessType } from '../enums/business-type.enum';
import { PermissionType } from '../enums/auth-permissions.enum';
import { isValidSlug } from '../../../shared/utils/slug';

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

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .refine(
    isValidSlug,
    'Address must be 3-40 letters, digits or single hyphens, and not a reserved word',
  );

const optionalText = (max: number) => z.string().trim().max(max).nullish();

/** Business profile shown on receipts and reports (onboarding step 1). */
const profileShape = {
  registeredName: optionalText(150),
  registrationNumber: optionalText(60),
  phone: optionalText(30),
  country: z.string().trim().toUpperCase().length(2).optional(),
  addressLine: optionalText(200),
  city: optionalText(80),
  postalCode: optionalText(20),
};

/** Tax and money settings (onboarding step 2). */
const taxShape = {
  vatRegistered: z.boolean().optional(),
  vatNumber: optionalText(40),
  /** Standard VAT rate in percent, e.g. "18" or "12.5". */
  vatRate: z
    .string()
    .trim()
    .regex(
      /^\d{1,3}(\.\d{1,2})?$/,
      'VAT rate must be a percentage like 18 or 12.5',
    )
    .optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter code')
    .optional(),
  rounding: z.enum(['none', 'nearest_1', 'nearest_5']).optional(),
};

export const createBusinessSchema = z.object({
  name,
  /** Workspace address (`<slug>.<domain>`); generated from the name if omitted. */
  slug: slug.optional(),
  businessType: z.enum(BusinessType, {
    error: `Business type must be one of: ${Object.values(BusinessType).join(', ')}`,
  }),
  ...profileShape,
});

export const updateBusinessSchema = z.object({
  name: name.optional(),
  slug: slug.optional(),
  businessType: z.enum(BusinessType).optional(),
  ...profileShape,
  ...taxShape,
  /** Set after a successful presigned S3 upload. */
  imageUrl: z.url().nullish(),
  /** Marks onboarding as finished. */
  onboardingCompleted: z.literal(true).optional(),
});

export const presignLogoUploadSchema = z.object({
  contentType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
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

export const banMemberSchema = z.object({
  reason: z.string().trim().max(255).nullish(),
});

export const setPermissionProtectedSchema = z.object({
  protected: z.boolean(),
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
  @ApiPropertyOptional({
    description: 'Workspace address, e.g. "keels" for keels.example.com',
  })
  slug?: string;
  @ApiProperty({ enum: BusinessType })
  businessType: BusinessType;
  @ApiPropertyOptional()
  registeredName?: string | null;
  @ApiPropertyOptional()
  registrationNumber?: string | null;
  @ApiPropertyOptional()
  phone?: string | null;
  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2, e.g. LK' })
  country?: string;
  @ApiPropertyOptional()
  addressLine?: string | null;
  @ApiPropertyOptional()
  city?: string | null;
  @ApiPropertyOptional()
  postalCode?: string | null;
}

export class UpdateBusinessDto extends CreateBusinessDto {
  @ApiPropertyOptional()
  declare name: string;
  @ApiPropertyOptional({ enum: BusinessType })
  declare businessType: BusinessType;
  @ApiPropertyOptional()
  vatRegistered?: boolean;
  @ApiPropertyOptional()
  vatNumber?: string | null;
  @ApiPropertyOptional({ description: 'Standard VAT rate in percent' })
  vatRate?: string;
  @ApiPropertyOptional({ description: 'ISO 4217, e.g. LKR' })
  currency?: string;
  @ApiPropertyOptional({ enum: ['none', 'nearest_1', 'nearest_5'] })
  rounding?: string;
  @ApiPropertyOptional({ nullable: true })
  imageUrl?: string | null;
  @ApiPropertyOptional({ description: 'Set true when onboarding is finished' })
  onboardingCompleted?: true;
}

export class PresignLogoUploadDto {
  @ApiProperty({ enum: ['image/png', 'image/jpeg', 'image/webp'] })
  contentType: 'image/png' | 'image/jpeg' | 'image/webp';
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

export class BanMemberDto {
  @ApiPropertyOptional({ nullable: true })
  reason?: string | null;
}

export class SetPermissionProtectedDto {
  @ApiProperty()
  protected: boolean;
}
